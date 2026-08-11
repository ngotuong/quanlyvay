begin;

alter table public.loans
  alter column term_days drop not null;

alter table public.loans
  drop constraint loans_term_days_positive,
  drop constraint loans_term_days_max,
  add constraint loans_term_days_optional_valid
    check (term_days is null or term_days between 1 and 36500);

alter table public.loan_term_corrections
  alter column term_days drop not null;

alter table public.loan_term_corrections
  drop constraint loan_term_corrections_term_positive,
  add constraint loan_term_corrections_term_optional_valid
    check (term_days is null or term_days between 1 and 36500);

create or replace function private.next_interest_due_date(
  p_disbursement_date date,
  p_maturity_date date,
  p_cycle_days integer,
  p_as_of_date date
)
returns date
language sql
immutable
set search_path = ''
as $$
  select least(
    coalesce(p_maturity_date, 'infinity'::date),
    p_disbursement_date
      + ((((greatest(p_as_of_date, p_disbursement_date) - p_disbursement_date) / p_cycle_days) + 1) * p_cycle_days)
      - 1
  )
$$;

create or replace function public.get_loan_schedule_summary(
  p_loan_id uuid,
  p_as_of_date date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  loan_row public.loans%rowtype;
  calculation jsonb;
begin
  perform private.require_active_user();
  select * into strict loan_row from public.loans where id = p_loan_id;
  calculation := private.calculate_loan_json(p_loan_id, p_as_of_date);

  return jsonb_build_object(
    'hasMaturity', loan_row.maturity_date is not null,
    'maturityDate', loan_row.maturity_date::text,
    'nextInterestDueDate', case
      when calculation ->> 'status' = 'SETTLED' then null
      else private.next_interest_due_date(
        loan_row.disbursement_date,
        loan_row.maturity_date,
        loan_row.interest_cycle_days,
        p_as_of_date
      )::text
    end
  );
end
$$;

create or replace function public.create_loan_v2(
  p_counterparty_id uuid,
  p_name text,
  p_direction public.loan_direction,
  p_original_principal_vnd bigint,
  p_disbursement_date date,
  p_term_days integer,
  p_interest_cycle_days smallint,
  p_initial_period_rate_percent numeric,
  p_idempotency_key text,
  p_notes text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_term_days is not null and (p_term_days < 1 or p_term_days > 36500) then
    raise exception 'term_days must be null or between 1 and 36500'
      using errcode = '22023';
  end if;

  if p_initial_period_rate_percent is null
     or p_initial_period_rate_percent < 0
     or p_initial_period_rate_percent > 100 then
    raise exception 'period_rate_percent must be between 0 and 100'
      using errcode = '22023';
  end if;

  return public.create_loan(
    p_counterparty_id,
    p_name,
    p_direction,
    p_original_principal_vnd,
    p_disbursement_date,
    p_term_days,
    p_interest_cycle_days,
    p_initial_period_rate_percent / p_interest_cycle_days,
    p_idempotency_key,
    p_notes
  );
end;
$$;

create or replace function public.correct_loan_terms(
  p_loan_id uuid,
  p_direction public.loan_direction,
  p_original_principal_vnd bigint,
  p_disbursement_date date,
  p_term_days integer,
  p_interest_cycle_days smallint,
  p_initial_period_rate_percent numeric,
  p_reason text,
  p_idempotency_key text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  loan_row public.loans%rowtype;
  active_disbursement public.transactions%rowtype;
  existing_correction public.loan_term_corrections%rowtype;
  correction_date date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  active_principal_payments bigint;
  old_generated_name text;
  resolved_name text;
begin
  perform private.require_writer();

  if btrim(coalesce(p_idempotency_key, '')) = '' then
    raise exception 'idempotency_key is required' using errcode = '22023';
  end if;
  if btrim(coalesce(p_reason, '')) = '' then
    raise exception 'correction reason is required' using errcode = '22023';
  end if;
  if p_original_principal_vnd is null or p_original_principal_vnd <= 0 then
    raise exception 'original_principal_vnd must be positive' using errcode = '22023';
  end if;
  if p_term_days is not null and (p_term_days < 1 or p_term_days > 36500) then
    raise exception 'term_days must be null or between 1 and 36500' using errcode = '22023';
  end if;
  if p_interest_cycle_days not in (15, 30) then
    raise exception 'interest_cycle_days must be 15 or 30' using errcode = '22023';
  end if;
  if p_initial_period_rate_percent is null
     or p_initial_period_rate_percent < 0
     or p_initial_period_rate_percent > 100 then
    raise exception 'period_rate_percent must be between 0 and 100'
      using errcode = '22023';
  end if;
  if p_disbursement_date > correction_date then
    raise exception 'disbursement_date cannot be in the future' using errcode = '22007';
  end if;

  select * into existing_correction
  from public.loan_term_corrections
  where idempotency_key = p_idempotency_key;

  if found then
    if existing_correction.loan_id is distinct from p_loan_id
       or existing_correction.direction is distinct from p_direction
       or existing_correction.original_principal_vnd is distinct from p_original_principal_vnd
       or existing_correction.disbursement_date is distinct from p_disbursement_date
       or existing_correction.term_days is distinct from p_term_days
       or existing_correction.interest_cycle_days is distinct from p_interest_cycle_days
       or existing_correction.initial_period_rate_percent is distinct from p_initial_period_rate_percent
       or existing_correction.reason is distinct from btrim(p_reason) then
      raise exception 'Idempotency key is already used with different input'
        using errcode = '23505';
    end if;
    return p_loan_id;
  end if;

  select * into strict loan_row
  from public.loans
  where id = p_loan_id
  for update;

  if loan_row.status = 'SETTLED' then
    raise exception 'A settled loan cannot have its initial terms corrected'
      using errcode = '23514';
  end if;

  if exists (
    select 1 from public.transactions
    where loan_id = p_loan_id
      and type not in ('DISBURSEMENT', 'REVERSAL')
      and transaction_date < p_disbursement_date
  ) or exists (
    select 1 from public.loan_lifecycle_events
    where loan_id = p_loan_id
      and effective_date < p_disbursement_date
  ) then
    raise exception 'New disbursement date cannot follow existing loan activity'
      using errcode = '23514';
  end if;

  select coalesce(sum(payment.amount_vnd), 0)
  into active_principal_payments
  from public.transactions as payment
  where payment.loan_id = p_loan_id
    and payment.type = 'PRINCIPAL_PAYMENT'
    and not exists (
      select 1 from public.transactions as reversal
      where reversal.type = 'REVERSAL'
        and reversal.reversal_of_id = payment.id
    );

  if active_principal_payments > p_original_principal_vnd then
    raise exception 'New principal cannot be lower than principal already paid'
      using errcode = '23514';
  end if;

  select * into strict active_disbursement
  from public.transactions as disbursement
  where disbursement.loan_id = p_loan_id
    and disbursement.type = 'DISBURSEMENT'
    and not exists (
      select 1 from public.transactions as reversal
      where reversal.type = 'REVERSAL'
        and reversal.reversal_of_id = disbursement.id
    )
  for update;

  old_generated_name := private.resolve_loan_name(
    loan_row.counterparty_id,
    loan_row.direction,
    loan_row.original_principal_vnd,
    loan_row.disbursement_date,
    null
  );
  resolved_name := case
    when loan_row.name = old_generated_name then private.resolve_loan_name(
      loan_row.counterparty_id,
      p_direction,
      p_original_principal_vnd,
      p_disbursement_date,
      null
    )
    else loan_row.name
  end;

  insert into public.loan_term_corrections (
    loan_id, direction, original_principal_vnd, disbursement_date, term_days,
    interest_cycle_days, initial_period_rate_percent, reason, idempotency_key, created_by
  ) values (
    p_loan_id, p_direction, p_original_principal_vnd, p_disbursement_date, p_term_days,
    p_interest_cycle_days, p_initial_period_rate_percent, btrim(p_reason), p_idempotency_key,
    auth.uid()
  );

  update public.loans
  set direction = p_direction,
      name = resolved_name,
      original_principal_vnd = p_original_principal_vnd,
      disbursement_date = p_disbursement_date,
      term_days = p_term_days,
      interest_cycle_days = p_interest_cycle_days,
      initial_daily_rate_percent = p_initial_period_rate_percent / p_interest_cycle_days,
      updated_by = auth.uid()
  where id = p_loan_id;

  perform set_config('app.controlled_loan_correction', 'on', true);

  insert into public.transactions (
    loan_id, type, transaction_date, amount_vnd, note,
    reversal_of_id, idempotency_key, created_by
  ) values (
    p_loan_id, 'REVERSAL', correction_date, active_disbursement.amount_vnd,
    'Điều chỉnh dữ liệu ban đầu: ' || btrim(p_reason),
    active_disbursement.id, p_idempotency_key || ':reversal', auth.uid()
  );

  insert into public.transactions (
    loan_id, type, transaction_date, amount_vnd, note,
    idempotency_key, created_by
  ) values (
    p_loan_id, 'DISBURSEMENT', p_disbursement_date, p_original_principal_vnd,
    'Giải ngân thay thế sau điều chỉnh: ' || btrim(p_reason),
    p_idempotency_key || ':disbursement', auth.uid()
  );

  perform set_config('app.controlled_loan_correction', 'off', true);
  perform private.rebuild_loan_interest_periods(p_loan_id, correction_date);

  return p_loan_id;
end;
$$;

comment on column public.loans.term_days is
  'Optional contractual term in days. NULL means the loan has no maturity date and interest cycles continue until settlement.';
comment on column public.loans.maturity_date is
  'Generated contractual maturity date. NULL for open-ended loans.';

revoke all on function public.get_loan_schedule_summary(uuid, date) from public, anon;
grant execute on function public.get_loan_schedule_summary(uuid, date) to authenticated, service_role;

commit;
