begin;

create or replace function public.create_counterparty(
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
  counterparty_id uuid;
begin
  perform private.require_writer();

  if btrim(coalesce(p_name, '')) = '' then
    raise exception 'Counterparty name is required' using errcode = '22023';
  end if;

  insert into public.counterparties (name, notes, created_by, updated_by)
  values (btrim(p_name), nullif(btrim(coalesce(p_notes, '')), ''), auth.uid(), auth.uid())
  returning id into counterparty_id;

  return counterparty_id;
end;
$$;

create or replace function public.update_counterparty(
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
begin
  perform private.require_writer();

  if btrim(coalesce(p_name, '')) = '' then
    raise exception 'Counterparty name is required' using errcode = '22023';
  end if;

  update public.counterparties
  set name = btrim(p_name),
      notes = nullif(btrim(coalesce(p_notes, '')), ''),
      updated_by = auth.uid()
  where id = p_counterparty_id;

  if not found then
    raise exception 'Counterparty not found' using errcode = 'P0002';
  end if;

  return p_counterparty_id;
end;
$$;

create or replace function public.delete_counterparty(p_counterparty_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform private.require_active_user();

  if not private.is_owner() then
    raise exception 'OWNER role is required' using errcode = '42501';
  end if;

  if exists (select 1 from public.loans where counterparty_id = p_counterparty_id) then
    raise exception 'Counterparty with loan history cannot be deleted' using errcode = '23503';
  end if;

  delete from public.counterparties where id = p_counterparty_id;

  if not found then
    raise exception 'Counterparty not found' using errcode = 'P0002';
  end if;
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
begin
  perform private.require_writer();

  if btrim(coalesce(p_idempotency_key, '')) = '' then
    raise exception 'idempotency_key is required' using errcode = '22023';
  end if;

  select loan.* into existing_loan
  from public.transactions as transaction
  join public.loans as loan on loan.id = transaction.loan_id
  where transaction.idempotency_key = p_idempotency_key || ':disbursement';

  if found then
    if existing_loan.counterparty_id is distinct from p_counterparty_id
       or existing_loan.name is distinct from btrim(p_name)
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

  if btrim(coalesce(p_name, '')) = '' then
    raise exception 'Loan name is required' using errcode = '22023';
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
    btrim(p_name),
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
begin
  perform private.require_writer();

  if btrim(coalesce(p_name, '')) = '' then
    raise exception 'Loan name is required' using errcode = '22023';
  end if;

  update public.loans
  set counterparty_id = p_counterparty_id,
      name = btrim(p_name),
      notes = nullif(btrim(coalesce(p_notes, '')), ''),
      updated_by = auth.uid()
  where id = p_loan_id;

  if not found then
    raise exception 'Loan not found' using errcode = 'P0002';
  end if;

  return p_loan_id;
end;
$$;

create or replace function public.record_expense(
  p_loan_id uuid,
  p_transaction_date date,
  p_amount_vnd bigint,
  p_category text,
  p_idempotency_key text,
  p_note text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  existing public.transactions%rowtype;
  transaction_id uuid;
begin
  perform private.require_writer();

  if p_amount_vnd is null or p_amount_vnd <= 0 then
    raise exception 'amount_vnd must be positive' using errcode = '22023';
  end if;

  if btrim(coalesce(p_category, '')) = '' then
    raise exception 'Expense category is required' using errcode = '22023';
  end if;

  if btrim(coalesce(p_idempotency_key, '')) = '' then
    raise exception 'idempotency_key is required' using errcode = '22023';
  end if;

  select * into existing from public.transactions
  where idempotency_key = p_idempotency_key;

  if found then
    if existing.type <> 'EXPENSE'
       or existing.loan_id is distinct from p_loan_id
       or existing.transaction_date is distinct from p_transaction_date
       or existing.amount_vnd is distinct from p_amount_vnd
       or existing.note is distinct from p_note then
      raise exception 'Idempotency key is already used with different input'
        using errcode = '23505';
    end if;
    return existing.id;
  end if;

  insert into public.transactions (
    loan_id, type, transaction_date, amount_vnd, note, idempotency_key, created_by
  ) values (
    p_loan_id, 'EXPENSE', p_transaction_date, p_amount_vnd,
    nullif(btrim(coalesce(p_note, '')), ''), p_idempotency_key, auth.uid()
  ) returning id into transaction_id;

  insert into public.expenses (transaction_id, category)
  values (transaction_id, btrim(p_category));

  return transaction_id;
end;
$$;

revoke all on function public.create_counterparty(text, text) from public, anon;
revoke all on function public.update_counterparty(uuid, text, text) from public, anon;
revoke all on function public.delete_counterparty(uuid) from public, anon;
revoke all on function public.create_loan(uuid, text, public.loan_direction, bigint, date, integer, smallint, numeric, text, text) from public, anon;
revoke all on function public.update_loan_details(uuid, uuid, text, text) from public, anon;
revoke all on function public.record_expense(uuid, date, bigint, text, text, text) from public, anon;

grant execute on function public.create_counterparty(text, text) to authenticated, service_role;
grant execute on function public.update_counterparty(uuid, text, text) to authenticated, service_role;
grant execute on function public.delete_counterparty(uuid) to authenticated, service_role;
grant execute on function public.create_loan(uuid, text, public.loan_direction, bigint, date, integer, smallint, numeric, text, text) to authenticated, service_role;
grant execute on function public.update_loan_details(uuid, uuid, text, text) to authenticated, service_role;
grant execute on function public.record_expense(uuid, date, bigint, text, text, text) to authenticated, service_role;

commit;
