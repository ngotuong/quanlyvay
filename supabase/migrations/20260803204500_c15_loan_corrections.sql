begin;

create or replace function private.resolve_loan_name(
  p_counterparty_id uuid,
  p_direction public.loan_direction,
  p_original_principal_vnd bigint,
  p_disbursement_date date,
  p_requested_name text default null
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  counterparty_name text;
begin
  if btrim(coalesce(p_requested_name, '')) <> '' then
    return btrim(p_requested_name);
  end if;

  select name into strict counterparty_name
  from public.counterparties
  where id = p_counterparty_id;

  return format(
    '%s · %s · %s ₫ · %s',
    counterparty_name,
    case p_direction when 'LENDING' then 'Cho vay' else 'Đi vay' end,
    replace(to_char(p_original_principal_vnd, 'FM999,999,999,999,999,999,999'), ',', '.'),
    to_char(p_disbursement_date, 'DD/MM/YYYY')
  );
end;
$$;

create or replace function public.create_loan(
  p_counterparty_id uuid,
  p_name text,
  p_direction public.loan_direction,
  p_original_principal_vnd bigint,
  p_disbursement_date date,
  p_term_days integer,
  p_interest_cycle_days smallint,
  p_initial_daily_rate_percent numeric,
  p_idempotency_key text,
  p_notes text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  existing_loan public.loans%rowtype;
  loan_id uuid;
  as_of_date date;
  resolved_name text;
begin
  perform private.require_writer();

  if btrim(coalesce(p_idempotency_key, '')) = '' then
    raise exception 'idempotency_key is required' using errcode = '22023';
  end if;

  resolved_name := private.resolve_loan_name(
    p_counterparty_id,
    p_direction,
    p_original_principal_vnd,
    p_disbursement_date,
    p_name
  );

  select loan.* into existing_loan
  from public.transactions as transaction
  join public.loans as loan on loan.id = transaction.loan_id
  where transaction.idempotency_key = p_idempotency_key || ':disbursement';

  if found then
    if existing_loan.counterparty_id is distinct from p_counterparty_id
       or existing_loan.name is distinct from resolved_name
       or existing_loan.direction is distinct from p_direction
       or existing_loan.original_principal_vnd is distinct from p_original_principal_vnd
       or existing_loan.disbursement_date is distinct from p_disbursement_date
       or existing_loan.term_days is distinct from p_term_days
       or existing_loan.interest_cycle_days is distinct from p_interest_cycle_days
       or existing_loan.initial_daily_rate_percent is distinct from p_initial_daily_rate_percent
       or existing_loan.notes is distinct from nullif(btrim(coalesce(p_notes, '')), '') then
      raise exception 'Idempotency key is already used with different input'
        using errcode = '23505';
    end if;
    return existing_loan.id;
  end if;

  insert into public.loans (
    counterparty_id,
    name,
    direction,
    original_principal_vnd,
    disbursement_date,
    term_days,
    interest_cycle_days,
    initial_daily_rate_percent,
    notes,
    created_by,
    updated_by
  ) values (
    p_counterparty_id,
    resolved_name,
    p_direction,
    p_original_principal_vnd,
    p_disbursement_date,
    p_term_days,
    p_interest_cycle_days,
    p_initial_daily_rate_percent,
    nullif(btrim(coalesce(p_notes, '')), ''),
    auth.uid(),
    auth.uid()
  ) returning id into loan_id;

  insert into public.transactions (
    loan_id,
    type,
    transaction_date,
    amount_vnd,
    note,
    idempotency_key,
    created_by
  ) values (
    loan_id,
    'DISBURSEMENT',
    p_disbursement_date,
    p_original_principal_vnd,
    'Giải ngân ban đầu',
    p_idempotency_key || ':disbursement',
    auth.uid()
  );

  as_of_date := greatest(p_disbursement_date, (now() at time zone 'Asia/Ho_Chi_Minh')::date);
  perform private.rebuild_loan_interest_periods(loan_id, as_of_date);

  return loan_id;
end;
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

create or replace function public.update_loan_details(
  p_loan_id uuid,
  p_counterparty_id uuid,
  p_name text,
  p_notes text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  loan_row public.loans%rowtype;
begin
  perform private.require_writer();

  select * into strict loan_row
  from public.loans
  where id = p_loan_id;

  update public.loans
  set counterparty_id = p_counterparty_id,
      name = private.resolve_loan_name(
        p_counterparty_id,
        loan_row.direction,
        loan_row.original_principal_vnd,
        loan_row.disbursement_date,
        p_name
      ),
      notes = nullif(btrim(coalesce(p_notes, '')), ''),
      updated_by = auth.uid()
  where id = p_loan_id;

  return p_loan_id;
end;
$$;

create or replace function private.validate_transaction()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  loan_row public.loans%rowtype;
  original_row public.transactions%rowtype;
  principal_paid bigint;
  is_controlled_correction boolean :=
    coalesce(current_setting('app.controlled_loan_correction', true), '') = 'on';
begin
  if new.type = 'REVERSAL' then
    select * into strict original_row
    from public.transactions
    where id = new.reversal_of_id;

    if original_row.type = 'REVERSAL' then
      raise exception 'A reversal cannot reverse another reversal'
        using errcode = '23514';
    end if;

    if original_row.type = 'DISBURSEMENT' and not is_controlled_correction then
      raise exception 'A disbursement cannot be reversed; correct the loan through a controlled workflow'
        using errcode = '23514';
    end if;

    if new.loan_id is distinct from original_row.loan_id then
      raise exception 'Reversal must belong to the same loan as the original transaction'
        using errcode = '23514';
    end if;

    if new.amount_vnd <> original_row.amount_vnd then
      raise exception 'Reversal amount must equal the original transaction amount'
        using errcode = '23514';
    end if;
  end if;

  if new.loan_id is not null then
    select * into strict loan_row
    from public.loans
    where id = new.loan_id;

    if new.transaction_date < loan_row.disbursement_date then
      raise exception 'Transaction cannot precede loan disbursement'
        using errcode = '23514';
    end if;

    if loan_row.status = 'SETTLED' and new.type <> 'REVERSAL' then
      raise exception 'Only reversals are allowed after settlement'
        using errcode = '23514';
    end if;

    if new.type = 'DISBURSEMENT' then
      if new.amount_vnd <> loan_row.original_principal_vnd then
        raise exception 'Disbursement amount must equal original principal'
          using errcode = '23514';
      end if;

      if exists (
        select 1
        from public.transactions as disbursement
        where disbursement.loan_id = new.loan_id
          and disbursement.type = 'DISBURSEMENT'
          and not exists (
            select 1
            from public.transactions as reversal
            where reversal.type = 'REVERSAL'
              and reversal.reversal_of_id = disbursement.id
          )
      ) then
        raise exception 'A loan can only have one active disbursement transaction'
          using errcode = '23505';
      end if;
    end if;

    if new.type = 'PRINCIPAL_PAYMENT' then
      select coalesce(sum(t.amount_vnd), 0)
      into principal_paid
      from public.transactions as t
      where t.loan_id = new.loan_id
        and t.type = 'PRINCIPAL_PAYMENT'
        and not exists (
          select 1
          from public.transactions as reversal
          where reversal.type = 'REVERSAL'
            and reversal.reversal_of_id = t.id
        );

      if principal_paid + new.amount_vnd > loan_row.original_principal_vnd then
        raise exception 'Principal payment exceeds outstanding principal'
          using errcode = '23514';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create table public.loan_term_corrections (
  id uuid primary key default extensions.gen_random_uuid(),
  loan_id uuid not null references public.loans (id) on delete restrict,
  direction public.loan_direction not null,
  original_principal_vnd bigint not null,
  disbursement_date date not null,
  term_days integer not null,
  interest_cycle_days smallint not null,
  initial_period_rate_percent numeric(18, 10) not null,
  reason text not null,
  idempotency_key text not null unique,
  created_by uuid references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint loan_term_corrections_principal_positive check (original_principal_vnd > 0),
  constraint loan_term_corrections_term_positive check (term_days > 0),
  constraint loan_term_corrections_cycle_supported check (interest_cycle_days in (15, 30)),
  constraint loan_term_corrections_rate_supported check (
    initial_period_rate_percent between 0 and 100
  ),
  constraint loan_term_corrections_reason_required check (btrim(reason) <> ''),
  constraint loan_term_corrections_key_required check (btrim(idempotency_key) <> '')
);

alter table public.loan_term_corrections enable row level security;

create policy loan_term_corrections_select
on public.loan_term_corrections
for select
to authenticated
using ((select private.is_active_user()));

create trigger loan_term_corrections_immutable
before update or delete on public.loan_term_corrections
for each row execute function private.prevent_immutable_change();

create trigger loan_term_corrections_audit
after insert on public.loan_term_corrections
for each row execute function private.write_audit_log('id');

grant select on public.loan_term_corrections to authenticated;

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
  if p_term_days is null or p_term_days <= 0 then
    raise exception 'term_days must be positive' using errcode = '22023';
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

create or replace function public.record_lifecycle_event_v2(
  p_loan_id uuid,
  p_event_type public.lifecycle_event_type,
  p_effective_date date,
  p_idempotency_key text,
  p_period_rate_percent numeric default null,
  p_note text default null,
  p_recalculate_through date default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  cycle_days smallint;
begin
  if p_period_rate_percent is not null
     and (p_period_rate_percent < 0 or p_period_rate_percent > 100) then
    raise exception 'period_rate_percent must be between 0 and 100'
      using errcode = '22023';
  end if;

  select interest_cycle_days into strict cycle_days
  from public.loans
  where id = p_loan_id;

  return public.record_lifecycle_event(
    p_loan_id,
    p_event_type,
    p_effective_date,
    p_idempotency_key,
    case when p_period_rate_percent is null then null else p_period_rate_percent / cycle_days end,
    p_note,
    p_recalculate_through
  );
end;
$$;

create or replace function public.get_loan_term_summary(p_loan_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  loan_row public.loans%rowtype;
begin
  perform private.require_active_user();

  select * into strict loan_row
  from public.loans
  where id = p_loan_id;

  return jsonb_build_object(
    'cycleDays', loan_row.interest_cycle_days,
    'periodRatePercent', private.decimal_text(
      round(loan_row.initial_daily_rate_percent * loan_row.interest_cycle_days, 6)
    ),
    'fullPeriodInterestVnd', round(
      loan_row.original_principal_vnd
      * loan_row.initial_daily_rate_percent
      * loan_row.interest_cycle_days
      / 100
    )::bigint::text
  );
end;
$$;

revoke all on function private.resolve_loan_name(uuid, public.loan_direction, bigint, date, text) from public, anon, authenticated;
revoke all on function public.create_loan_v2(uuid, text, public.loan_direction, bigint, date, integer, smallint, numeric, text, text) from public, anon;
revoke all on function public.correct_loan_terms(uuid, public.loan_direction, bigint, date, integer, smallint, numeric, text, text) from public, anon;
revoke all on function public.record_lifecycle_event_v2(uuid, public.lifecycle_event_type, date, text, numeric, text, date) from public, anon;
revoke all on function public.get_loan_term_summary(uuid) from public, anon;

grant execute on function public.create_loan_v2(uuid, text, public.loan_direction, bigint, date, integer, smallint, numeric, text, text) to authenticated, service_role;
grant execute on function public.correct_loan_terms(uuid, public.loan_direction, bigint, date, integer, smallint, numeric, text, text) to authenticated, service_role;
grant execute on function public.record_lifecycle_event_v2(uuid, public.lifecycle_event_type, date, text, numeric, text, date) to authenticated, service_role;
grant execute on function public.get_loan_term_summary(uuid) to authenticated, service_role;

comment on function public.correct_loan_terms(uuid, public.loan_direction, bigint, date, integer, smallint, numeric, text, text) is
  'Corrects initial loan terms without deleting history: reverses the active disbursement, appends a replacement, audits the loan update, and rebuilds interest periods.';

commit;
