begin;

alter table public.loans
  add constraint loans_term_days_max
    check (term_days <= 36500),
  add constraint loans_initial_period_rate_supported
    check (initial_daily_rate_percent * interest_cycle_days <= 100);

create table public.loan_settlement_reversals (
  id uuid primary key default extensions.gen_random_uuid(),
  loan_id uuid not null references public.loans (id) on delete restrict,
  settlement_event_id uuid not null unique references public.loan_lifecycle_events (id) on delete restrict,
  reversal_date date not null,
  reason text not null,
  idempotency_key text not null unique,
  created_by uuid references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint loan_settlement_reversals_reason_required check (btrim(reason) <> ''),
  constraint loan_settlement_reversals_key_required check (btrim(idempotency_key) <> '')
);

alter table public.loan_settlement_reversals enable row level security;

create policy loan_settlement_reversals_select
on public.loan_settlement_reversals
for select
to authenticated
using ((select private.is_active_user()));

create trigger loan_settlement_reversals_immutable
before update or delete on public.loan_settlement_reversals
for each row execute function private.prevent_immutable_change();

create trigger loan_settlement_reversals_audit
after insert on public.loan_settlement_reversals
for each row execute function private.write_audit_log('id');

grant select on public.loan_settlement_reversals to authenticated, service_role;
grant select on public.loan_term_corrections to service_role;

create or replace function private.lock_loan_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.loan_id is not null then
    perform 1
    from public.loans
    where id = new.loan_id
    for update;

    if not found then
      raise exception 'Loan does not exist' using errcode = '23503';
    end if;
  end if;

  return new;
end;
$$;

create trigger a_transactions_lock_loan
before insert on public.transactions
for each row execute function private.lock_loan_mutation();

create trigger a_lifecycle_events_lock_loan
before insert on public.loan_lifecycle_events
for each row execute function private.lock_loan_mutation();

create or replace function private.validate_settlement_reversal()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  settlement public.loan_lifecycle_events%rowtype;
begin
  select * into strict settlement
  from public.loan_lifecycle_events
  where id = new.settlement_event_id;

  if settlement.loan_id is distinct from new.loan_id
     or settlement.event_type <> 'SETTLEMENT' then
    raise exception 'Settlement reversal must reference a settlement event on the same loan'
      using errcode = '23514';
  end if;

  if new.reversal_date < settlement.effective_date then
    raise exception 'Settlement reversal cannot precede the settlement date'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger b_settlement_reversals_validate
before insert on public.loan_settlement_reversals
for each row execute function private.validate_settlement_reversal();

do $migration$
declare
  definition text;
  patched text;
  old_fragment constant text := $old$
  select min(effective_date) into settlement_date
  from public.loan_lifecycle_events
  where loan_id = p_loan_id
    and event_type = 'SETTLEMENT'
    and effective_date <= p_as_of_date;$old$;
  new_fragment constant text := $new$
  select min(settlement.effective_date) into settlement_date
  from public.loan_lifecycle_events as settlement
  where settlement.loan_id = p_loan_id
    and settlement.event_type = 'SETTLEMENT'
    and settlement.effective_date <= p_as_of_date
    and not exists (
      select 1
      from public.loan_settlement_reversals as settlement_reversal
      where settlement_reversal.settlement_event_id = settlement.id
    );$new$;
begin
  select pg_get_functiondef('private.calculate_loan_json(uuid,date)'::regprocedure)
  into definition;
  patched := replace(definition, old_fragment, new_fragment);

  if patched = definition then
    raise exception 'C16 could not patch calculate_loan_json settlement lookup';
  end if;

  execute patched;
end;
$migration$;

do $migration$
declare
  definition text;
  patched text;
  old_fragment constant text := $old$
  select min(effective_date) into result_settled_on
  from public.loan_lifecycle_events
  where loan_id = p_loan_id
    and event_type = 'SETTLEMENT';$old$;
  new_fragment constant text := $new$
  select min(settlement.effective_date) into result_settled_on
  from public.loan_lifecycle_events as settlement
  where settlement.loan_id = p_loan_id
    and settlement.event_type = 'SETTLEMENT'
    and not exists (
      select 1
      from public.loan_settlement_reversals as settlement_reversal
      where settlement_reversal.settlement_event_id = settlement.id
    );$new$;
begin
  select pg_get_functiondef('private.rebuild_loan_interest_periods(uuid,date)'::regprocedure)
  into definition;
  patched := replace(definition, old_fragment, new_fragment);

  if patched = definition then
    raise exception 'C16 could not patch rebuild_loan_interest_periods settlement lookup';
  end if;

  execute patched;
end;
$migration$;

do $migration$
declare
  definition text;
  patched text;
  old_fragment constant text := $old$begin
  perform private.require_writer();

  if p_type not in ('INTEREST_PAYMENT', 'PRINCIPAL_PAYMENT') then$old$;
  new_fragment constant text := $new$begin
  perform private.require_writer();

  perform 1 from public.loans where id = p_loan_id for update;
  if not found then
    raise exception 'Loan does not exist' using errcode = 'P0002';
  end if;

  if p_type not in ('INTEREST_PAYMENT', 'PRINCIPAL_PAYMENT') then$new$;
begin
  select pg_get_functiondef(
    'public.record_financial_transaction(uuid,public.transaction_type,date,bigint,text,text,date)'::regprocedure
  ) into definition;
  patched := replace(definition, old_fragment, new_fragment);

  if patched = definition then
    raise exception 'C16 could not add the loan lock to record_financial_transaction';
  end if;

  execute patched;
end;
$migration$;

do $migration$
declare
  definition text;
  patched text;
  old_fragment constant text := $old$begin
  perform private.require_writer();

  if p_event_type not in ('RATE_CHANGE', 'BAD_DEBT_START', 'INTEREST_RESUME') then$old$;
  new_fragment constant text := $new$begin
  perform private.require_writer();

  perform 1 from public.loans where id = p_loan_id for update;
  if not found then
    raise exception 'Loan does not exist' using errcode = 'P0002';
  end if;

  if p_event_type not in ('RATE_CHANGE', 'BAD_DEBT_START', 'INTEREST_RESUME') then$new$;
begin
  select pg_get_functiondef(
    'public.record_lifecycle_event(uuid,public.lifecycle_event_type,date,text,numeric,text,date)'::regprocedure
  ) into definition;
  patched := replace(definition, old_fragment, new_fragment);

  if patched = definition then
    raise exception 'C16 could not add the loan lock to record_lifecycle_event';
  end if;

  execute patched;
end;
$migration$;

do $migration$
declare
  definition text;
  patched text;
  old_fragment constant text := $old$begin
  if p_period_rate_percent is not null$old$;
  new_fragment constant text := $new$begin
  perform private.require_writer();

  perform 1 from public.loans where id = p_loan_id for update;
  if not found then
    raise exception 'Loan does not exist' using errcode = 'P0002';
  end if;

  if p_period_rate_percent is not null$new$;
begin
  select pg_get_functiondef(
    'public.record_lifecycle_event_v2(uuid,public.lifecycle_event_type,date,text,numeric,text,date)'::regprocedure
  ) into definition;
  patched := replace(definition, old_fragment, new_fragment);

  if patched = definition then
    raise exception 'C16 could not add the loan lock to record_lifecycle_event_v2';
  end if;

  execute patched;
end;
$migration$;

create or replace function public.reverse_transaction(
  p_transaction_id uuid,
  p_reversal_date date,
  p_note text,
  p_idempotency_key text,
  p_recalculate_through date default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  original public.transactions%rowtype;
  existing public.transactions%rowtype;
  reversal_id uuid;
  calculation_date date;
begin
  perform private.require_writer();

  if btrim(coalesce(p_note, '')) = '' then
    raise exception 'A reversal note is required' using errcode = '22023';
  end if;

  if btrim(coalesce(p_idempotency_key, '')) = '' then
    raise exception 'idempotency_key is required' using errcode = '22023';
  end if;

  select * into strict original
  from public.transactions
  where id = p_transaction_id;

  if original.loan_id is not null then
    perform 1 from public.loans where id = original.loan_id for update;
  end if;

  if exists (
    select 1
    from public.loan_lifecycle_events as settlement
    where settlement.loan_id = original.loan_id
      and settlement.event_type = 'SETTLEMENT'
      and original.idempotency_key in (
        regexp_replace(settlement.idempotency_key, ':event$', '') || ':principal',
        regexp_replace(settlement.idempotency_key, ':event$', '') || ':interest'
      )
  ) then
    raise exception 'Settlement transactions require the controlled settlement reversal workflow'
      using errcode = '23514';
  end if;

  select * into existing
  from public.transactions
  where idempotency_key = p_idempotency_key;

  if found then
    if existing.type <> 'REVERSAL'
       or existing.reversal_of_id is distinct from p_transaction_id
       or existing.transaction_date is distinct from p_reversal_date
       or existing.note is distinct from p_note then
      raise exception 'Idempotency key is already used with different input'
        using errcode = '23505';
    end if;
    return existing.id;
  end if;

  insert into public.transactions (
    loan_id, type, transaction_date, amount_vnd, note,
    reversal_of_id, idempotency_key, created_by
  ) values (
    original.loan_id, 'REVERSAL', p_reversal_date, original.amount_vnd, p_note,
    original.id, p_idempotency_key, auth.uid()
  ) returning id into reversal_id;

  if original.loan_id is not null then
    calculation_date := greatest(
      p_reversal_date,
      coalesce(p_recalculate_through, (now() at time zone 'Asia/Ho_Chi_Minh')::date)
    );
    perform private.rebuild_loan_interest_periods(original.loan_id, calculation_date);
  end if;

  return reversal_id;
end;
$$;

create or replace function public.settle_loan(
  p_loan_id uuid,
  p_settlement_date date,
  p_idempotency_key text,
  p_note text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  preview jsonb;
  final_result jsonb;
  principal_due bigint;
  interest_due bigint;
  existing_event public.loan_lifecycle_events%rowtype;
begin
  perform private.require_writer();

  if btrim(coalesce(p_idempotency_key, '')) = '' then
    raise exception 'idempotency_key is required' using errcode = '22023';
  end if;

  perform 1 from public.loans where id = p_loan_id for update;
  if not found then
    raise exception 'Loan does not exist' using errcode = 'P0002';
  end if;

  select * into existing_event
  from public.loan_lifecycle_events
  where idempotency_key = p_idempotency_key || ':event';

  if found then
    if existing_event.loan_id is distinct from p_loan_id
       or existing_event.event_type <> 'SETTLEMENT'
       or existing_event.effective_date is distinct from p_settlement_date
       or existing_event.note is distinct from p_note then
      raise exception 'Idempotency key is already used with different input'
        using errcode = '23505';
    end if;

    if exists (
      select 1 from public.loan_settlement_reversals
      where settlement_event_id = existing_event.id
    ) then
      raise exception 'This settlement was already reversed'
        using errcode = '23514';
    end if;

    return private.rebuild_loan_interest_periods(p_loan_id, p_settlement_date);
  end if;

  if exists (
    select 1
    from public.loan_lifecycle_events as settlement
    where settlement.loan_id = p_loan_id
      and settlement.event_type = 'SETTLEMENT'
      and not exists (
        select 1 from public.loan_settlement_reversals as reversal
        where reversal.settlement_event_id = settlement.id
      )
  ) then
    raise exception 'Loan already has an active settlement'
      using errcode = '23514';
  end if;

  preview := private.calculate_loan_json(p_loan_id, p_settlement_date);
  principal_due := (preview ->> 'principalOutstandingVnd')::bigint;
  interest_due := (preview ->> 'interestBalanceVnd')::bigint;

  if principal_due < 0 then
    raise exception 'Loan principal cannot be negative at settlement'
      using errcode = '23514';
  end if;

  if interest_due < 0 then
    raise exception 'Prepaid interest credit must be resolved before settlement'
      using errcode = '23514';
  end if;

  insert into public.loan_lifecycle_events (
    loan_id, event_type, effective_date, note, idempotency_key, created_by
  ) values (
    p_loan_id, 'SETTLEMENT', p_settlement_date, p_note,
    p_idempotency_key || ':event', auth.uid()
  );

  if principal_due > 0 then
    insert into public.transactions (
      loan_id, type, transaction_date, amount_vnd, note, idempotency_key, created_by
    ) values (
      p_loan_id, 'PRINCIPAL_PAYMENT', p_settlement_date, principal_due, p_note,
      p_idempotency_key || ':principal', auth.uid()
    );
  end if;

  if interest_due > 0 then
    insert into public.transactions (
      loan_id, type, transaction_date, amount_vnd, note, idempotency_key, created_by
    ) values (
      p_loan_id, 'INTEREST_PAYMENT', p_settlement_date, interest_due, p_note,
      p_idempotency_key || ':interest', auth.uid()
    );
  end if;

  final_result := private.rebuild_loan_interest_periods(p_loan_id, p_settlement_date);
  return final_result || jsonb_build_object(
    'settledPrincipalVnd', principal_due::text,
    'settledInterestVnd', interest_due::text
  );
end;
$$;

create or replace function public.reverse_settlement(
  p_loan_id uuid,
  p_reversal_date date,
  p_reason text,
  p_idempotency_key text,
  p_recalculate_through date default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  settlement public.loan_lifecycle_events%rowtype;
  existing public.loan_settlement_reversals%rowtype;
  component public.transactions%rowtype;
  reversal_id uuid;
  base_key text;
  calculation_date date;
begin
  perform private.require_writer();

  if p_reversal_date is null then
    raise exception 'reversal_date is required' using errcode = '22004';
  end if;

  if btrim(coalesce(p_reason, '')) = '' then
    raise exception 'A settlement reversal reason is required' using errcode = '22023';
  end if;

  if btrim(coalesce(p_idempotency_key, '')) = '' then
    raise exception 'idempotency_key is required' using errcode = '22023';
  end if;

  perform 1 from public.loans where id = p_loan_id for update;
  if not found then
    raise exception 'Loan does not exist' using errcode = 'P0002';
  end if;

  select * into existing
  from public.loan_settlement_reversals
  where idempotency_key = p_idempotency_key;

  if found then
    if existing.loan_id is distinct from p_loan_id
       or existing.reversal_date is distinct from p_reversal_date
       or existing.reason is distinct from p_reason then
      raise exception 'Idempotency key is already used with different input'
        using errcode = '23505';
    end if;
    return existing.id;
  end if;

  select settlement_event.* into settlement
  from public.loan_lifecycle_events as settlement_event
  where settlement_event.loan_id = p_loan_id
    and settlement_event.event_type = 'SETTLEMENT'
    and not exists (
      select 1
      from public.loan_settlement_reversals as prior_reversal
      where prior_reversal.settlement_event_id = settlement_event.id
    )
  order by settlement_event.effective_date, settlement_event.created_at, settlement_event.id
  limit 1;

  if not found then
    raise exception 'Loan has no active settlement to reverse'
      using errcode = '23514';
  end if;

  if p_reversal_date < settlement.effective_date then
    raise exception 'Settlement reversal cannot precede the settlement date'
      using errcode = '23514';
  end if;

  insert into public.loan_settlement_reversals (
    loan_id, settlement_event_id, reversal_date, reason, idempotency_key, created_by
  ) values (
    p_loan_id, settlement.id, p_reversal_date, p_reason, p_idempotency_key, auth.uid()
  ) returning id into reversal_id;

  base_key := regexp_replace(settlement.idempotency_key, ':event$', '');

  for component in
    select transaction.*
    from public.transactions as transaction
    where transaction.loan_id = p_loan_id
      and transaction.idempotency_key in (base_key || ':principal', base_key || ':interest')
      and transaction.type in ('PRINCIPAL_PAYMENT', 'INTEREST_PAYMENT')
    order by transaction.type, transaction.id
  loop
    if not exists (
      select 1 from public.transactions as prior_reversal
      where prior_reversal.type = 'REVERSAL'
        and prior_reversal.reversal_of_id = component.id
    ) then
      insert into public.transactions (
        loan_id, type, transaction_date, amount_vnd, note,
        reversal_of_id, idempotency_key, created_by
      ) values (
        p_loan_id, 'REVERSAL', p_reversal_date, component.amount_vnd, p_reason,
        component.id, p_idempotency_key || ':' || lower(component.type::text), auth.uid()
      );
    end if;
  end loop;

  calculation_date := greatest(
    p_reversal_date,
    coalesce(p_recalculate_through, (now() at time zone 'Asia/Ho_Chi_Minh')::date)
  );
  perform private.rebuild_loan_interest_periods(p_loan_id, calculation_date);

  return reversal_id;
end;
$$;

revoke insert, update, delete on public.profiles from authenticated;
revoke insert, update, delete on public.counterparties from authenticated;
revoke insert, update, delete on public.loans from authenticated;
revoke insert, update, delete on public.push_subscriptions from authenticated;

revoke execute on function public.create_loan(uuid, text, public.loan_direction, bigint, date, integer, smallint, numeric, text, text) from authenticated;
revoke execute on function public.record_lifecycle_event(uuid, public.lifecycle_event_type, date, text, numeric, text, date) from authenticated;

revoke all on function public.reverse_settlement(uuid, date, text, text, date) from public, anon;
grant execute on function public.reverse_settlement(uuid, date, text, text, date) to authenticated, service_role;

comment on table public.loan_settlement_reversals is
  'Append-only record that deactivates one settlement event without deleting financial history.';
comment on function public.reverse_settlement(uuid, date, text, text, date) is
  'Atomically reverses the exact settlement payment components, deactivates its lifecycle event, and rebuilds the loan.';

commit;
