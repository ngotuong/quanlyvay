begin;

create table public.loan_principal_restructures (
  id uuid primary key default extensions.gen_random_uuid(),
  loan_id uuid not null references public.loans (id) on delete restrict,
  effective_date date not null,
  principal_before_vnd bigint not null,
  principal_payment_vnd bigint not null,
  principal_after_vnd bigint not null,
  interest_settled_vnd bigint not null,
  principal_transaction_id uuid not null unique references public.transactions (id) on delete restrict,
  interest_transaction_id uuid unique references public.transactions (id) on delete restrict,
  note text,
  idempotency_key text not null unique,
  created_by uuid references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint loan_principal_restructures_amounts_valid check (
    principal_before_vnd > 0
    and principal_payment_vnd > 0
    and principal_after_vnd > 0
    and principal_before_vnd = principal_payment_vnd + principal_after_vnd
    and interest_settled_vnd >= 0
  ),
  constraint loan_principal_restructures_interest_component_valid check (
    (interest_settled_vnd = 0 and interest_transaction_id is null)
    or (interest_settled_vnd > 0 and interest_transaction_id is not null)
  ),
  constraint loan_principal_restructures_key_required check (btrim(idempotency_key) <> ''),
  constraint loan_principal_restructures_one_per_day unique (loan_id, effective_date)
);

create table public.loan_principal_restructure_reversals (
  id uuid primary key default extensions.gen_random_uuid(),
  restructure_id uuid not null unique references public.loan_principal_restructures (id) on delete restrict,
  loan_id uuid not null references public.loans (id) on delete restrict,
  reversal_date date not null,
  reason text not null,
  idempotency_key text not null unique,
  created_by uuid references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint loan_principal_restructure_reversals_reason_required check (btrim(reason) <> ''),
  constraint loan_principal_restructure_reversals_key_required check (btrim(idempotency_key) <> '')
);

create index loan_principal_restructures_active_schedule_idx
  on public.loan_principal_restructures (loan_id, effective_date desc, id desc);

alter table public.loan_principal_restructures enable row level security;
alter table public.loan_principal_restructure_reversals enable row level security;

create policy loan_principal_restructures_select
on public.loan_principal_restructures for select to authenticated
using ((select private.is_active_user()));

create policy loan_principal_restructure_reversals_select
on public.loan_principal_restructure_reversals for select to authenticated
using ((select private.is_active_user()));

create trigger loan_principal_restructures_immutable
before update or delete on public.loan_principal_restructures
for each row execute function private.prevent_immutable_change();

create trigger loan_principal_restructure_reversals_immutable
before update or delete on public.loan_principal_restructure_reversals
for each row execute function private.prevent_immutable_change();

create trigger loan_principal_restructures_audit
after insert on public.loan_principal_restructures
for each row execute function private.write_audit_log('id');

create trigger loan_principal_restructure_reversals_audit
after insert on public.loan_principal_restructure_reversals
for each row execute function private.write_audit_log('id');

revoke all on public.loan_principal_restructures from public, anon, authenticated;
revoke all on public.loan_principal_restructure_reversals from public, anon, authenticated;
grant select on public.loan_principal_restructures to authenticated, service_role;
grant select on public.loan_principal_restructure_reversals to authenticated, service_role;

create or replace function private.principal_payment_effective_date(
  p_transaction_id uuid,
  p_transaction_date date
)
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select restructure.effective_date
    from public.loan_principal_restructures as restructure
    where restructure.principal_transaction_id = p_transaction_id
      and not exists (
        select 1
        from public.loan_principal_restructure_reversals as reversal
        where reversal.restructure_id = restructure.id
      )
  ), p_transaction_date + 1)
$$;

create or replace function private.interest_payment_allocation_date(
  p_transaction_id uuid,
  p_transaction_date date
)
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select restructure.effective_date - 1
    from public.loan_principal_restructures as restructure
    where restructure.interest_transaction_id = p_transaction_id
      and not exists (
        select 1
        from public.loan_principal_restructure_reversals as reversal
        where reversal.restructure_id = restructure.id
      )
  ), p_transaction_date)
$$;

create or replace function private.interest_schedule_anchor_date(
  p_loan_id uuid,
  p_disbursement_date date,
  p_as_of_date date
)
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select max(restructure.effective_date)
    from public.loan_principal_restructures as restructure
    where restructure.loan_id = p_loan_id
      and restructure.effective_date <= p_as_of_date
      and not exists (
        select 1
        from public.loan_principal_restructure_reversals as reversal
        where reversal.restructure_id = restructure.id
      )
  ), p_disbursement_date)
$$;

revoke all on function private.principal_payment_effective_date(uuid, date) from public, anon, authenticated;
revoke all on function private.interest_payment_allocation_date(uuid, date) from public, anon, authenticated;
revoke all on function private.interest_schedule_anchor_date(uuid, date, date) from public, anon, authenticated;
grant execute on function private.principal_payment_effective_date(uuid, date) to service_role;
grant execute on function private.interest_payment_allocation_date(uuid, date) to service_role;
grant execute on function private.interest_schedule_anchor_date(uuid, date, date) to service_role;

do $migration$
declare
  definition text;
  patched text;
  old_period_end constant text := $old$
    period_end := least(
      period_start + loan_row.interest_cycle_days - 1,
      scheduled_limit
    );$old$;
  new_period_end constant text := $new$
    period_end := least(
      period_start + loan_row.interest_cycle_days - 1,
      scheduled_limit
    );

    select min(restructure.effective_date)
    into next_restructure_date
    from public.loan_principal_restructures as restructure
    where restructure.loan_id = p_loan_id
      and restructure.effective_date > period_start
      and restructure.effective_date <= period_end
      and not exists (
        select 1
        from public.loan_principal_restructure_reversals as reversal
        where reversal.restructure_id = restructure.id
      );

    if next_restructure_date is not null then
      period_end := next_restructure_date - 1;
    end if;$new$;
begin
  select pg_get_functiondef('private.calculate_loan_json(uuid,date)'::regprocedure)
  into definition;

  patched := replace(
    definition,
    '  latest_state public.lifecycle_event_type;',
    E'  latest_state public.lifecycle_event_type;\n  next_restructure_date date;'
  );
  if patched = definition then
    raise exception 'C47 could not add the restructure declaration to calculate_loan_json';
  end if;
  definition := patched;

  patched := replace(definition, old_period_end, new_period_end);
  if patched = definition then
    raise exception 'C47 could not split scheduled periods at restructure dates';
  end if;
  definition := patched;

  patched := replace(
    definition,
    't.transaction_date < generated.day::date',
    'private.principal_payment_effective_date(t.id, t.transaction_date) <= generated.day::date'
  );
  if patched = definition then
    raise exception 'C47 could not apply same-day restructured principal';
  end if;
  definition := patched;

  patched := replace(
    definition,
    't.transaction_date between period_start and period_end',
    E'private.interest_payment_allocation_date(t.id, t.transaction_date) between period_start and period_end\n      and t.transaction_date <= calculation_end'
  );
  if patched = definition then
    raise exception 'C47 could not allocate restructure interest to the closing period';
  end if;
  definition := patched;

  patched := replace(
    definition,
    't.transaction_date < period_start',
    'private.principal_payment_effective_date(t.id, t.transaction_date) <= period_start'
  );
  if patched = definition then
    raise exception 'C47 could not update opening principal calculation';
  end if;

  execute patched;
end;
$migration$;

create or replace function public.preview_principal_restructure(
  p_loan_id uuid,
  p_effective_date date,
  p_principal_payment_vnd bigint
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  loan_row public.loans%rowtype;
  closing_calculation jsonb;
  principal_before bigint;
  principal_after bigint;
  interest_balance bigint;
  interest_to_settle bigint;
  daily_rate numeric;
  new_period_end date;
  new_period_days integer;
  new_period_interest bigint;
  today_vietnam date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  perform private.require_active_user();

  if p_effective_date is null then
    raise exception 'effective_date is required' using errcode = '22004';
  end if;
  if p_principal_payment_vnd is null or p_principal_payment_vnd <= 0 then
    raise exception 'principal_payment_vnd must be positive' using errcode = '22023';
  end if;

  select * into strict loan_row
  from public.loans
  where id = p_loan_id;

  if p_effective_date <= loan_row.disbursement_date then
    raise exception 'Restructure date must be after disbursement' using errcode = '22007';
  end if;
  if p_effective_date > today_vietnam then
    raise exception 'Restructure date cannot be in the future' using errcode = '22007';
  end if;
  if loan_row.maturity_date is not null and p_effective_date > loan_row.maturity_date then
    raise exception 'Restructure date cannot be after maturity' using errcode = '22007';
  end if;

  closing_calculation := private.calculate_loan_json(p_loan_id, p_effective_date - 1);
  if closing_calculation ->> 'status' <> 'ACTIVE' then
    raise exception 'Only active loans can reset principal and interest cycle' using errcode = '23514';
  end if;

  principal_before := (closing_calculation ->> 'principalOutstandingVnd')::bigint;
  interest_balance := (closing_calculation ->> 'interestBalanceVnd')::bigint;
  principal_after := principal_before - p_principal_payment_vnd;

  if principal_after <= 0 then
    raise exception 'Use settlement when paying all remaining principal' using errcode = '23514';
  end if;

  select coalesce((
    select event.daily_rate_percent
    from public.loan_lifecycle_events as event
    where event.loan_id = p_loan_id
      and event.event_type in ('RATE_CHANGE', 'INTEREST_RESUME')
      and event.effective_date <= p_effective_date
    order by event.effective_date desc, event.created_at desc, event.id desc
    limit 1
  ), loan_row.initial_daily_rate_percent)
  into daily_rate;

  interest_to_settle := greatest(interest_balance, 0);
  new_period_end := least(
    coalesce(loan_row.maturity_date, 'infinity'::date),
    p_effective_date + loan_row.interest_cycle_days - 1
  );
  new_period_days := new_period_end - p_effective_date + 1;
  new_period_interest := round(
    principal_after::numeric * daily_rate / 100 * new_period_days
  )::bigint;

  return jsonb_build_object(
    'loanId', p_loan_id::text,
    'effectiveDate', p_effective_date::text,
    'interestThroughDate', (p_effective_date - 1)::text,
    'principalBeforeVnd', principal_before::text,
    'principalPaymentVnd', p_principal_payment_vnd::text,
    'principalAfterVnd', principal_after::text,
    'interestBalanceBeforeVnd', interest_balance::text,
    'interestToSettleVnd', interest_to_settle::text,
    'newPeriodStartDate', p_effective_date::text,
    'newPeriodEndDate', new_period_end::text,
    'newPeriodDayCount', new_period_days,
    'newPeriodInterestVnd', new_period_interest::text,
    'dailyRatePercent', private.decimal_text(daily_rate)
  );
end;
$$;

create or replace function public.restructure_loan_principal(
  p_loan_id uuid,
  p_effective_date date,
  p_principal_payment_vnd bigint,
  p_expected_principal_before_vnd bigint,
  p_expected_interest_vnd bigint,
  p_idempotency_key text,
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
  existing public.loan_principal_restructures%rowtype;
  preview jsonb;
  restructure_id uuid;
  principal_transaction_id uuid;
  interest_transaction_id uuid;
  principal_before bigint;
  principal_after bigint;
  interest_to_settle bigint;
  calculation_date date;
begin
  perform private.require_writer();

  if btrim(coalesce(p_idempotency_key, '')) = '' then
    raise exception 'idempotency_key is required' using errcode = '22023';
  end if;

  perform 1 from public.loans where id = p_loan_id for update;
  if not found then
    raise exception 'Loan does not exist' using errcode = 'P0002';
  end if;

  select * into existing
  from public.loan_principal_restructures
  where idempotency_key = p_idempotency_key;

  if found then
    if existing.loan_id is distinct from p_loan_id
       or existing.effective_date is distinct from p_effective_date
       or existing.principal_payment_vnd is distinct from p_principal_payment_vnd
       or existing.principal_before_vnd is distinct from p_expected_principal_before_vnd
       or existing.interest_settled_vnd is distinct from p_expected_interest_vnd
       or existing.note is distinct from p_note then
      raise exception 'Idempotency key is already used with different input'
        using errcode = '23505';
    end if;
    return existing.id;
  end if;

  if exists (
    select 1 from public.transactions as transaction
    where transaction.loan_id = p_loan_id
      and transaction.transaction_date > p_effective_date
      and not exists (
        select 1 from public.transactions as reversal
        where reversal.type = 'REVERSAL' and reversal.reversal_of_id = transaction.id
      )
  ) or exists (
    select 1 from public.loan_lifecycle_events as event
    where event.loan_id = p_loan_id and event.effective_date >= p_effective_date
  ) then
    raise exception 'Later loan activity must be reversed before backdating this operation'
      using errcode = '23514';
  end if;

  preview := public.preview_principal_restructure(
    p_loan_id,
    p_effective_date,
    p_principal_payment_vnd
  );
  principal_before := (preview ->> 'principalBeforeVnd')::bigint;
  principal_after := (preview ->> 'principalAfterVnd')::bigint;
  interest_to_settle := (preview ->> 'interestToSettleVnd')::bigint;

  if principal_before is distinct from p_expected_principal_before_vnd
     or interest_to_settle is distinct from p_expected_interest_vnd then
    raise exception 'Loan values changed after preview; reload before confirming'
      using errcode = '40001';
  end if;

  insert into public.transactions (
    loan_id, type, transaction_date, amount_vnd, note, idempotency_key, created_by
  ) values (
    p_loan_id, 'PRINCIPAL_PAYMENT', p_effective_date, p_principal_payment_vnd,
    p_note, p_idempotency_key || ':principal', auth.uid()
  ) returning id into principal_transaction_id;

  if interest_to_settle > 0 then
    insert into public.transactions (
      loan_id, type, transaction_date, amount_vnd, note, idempotency_key, created_by
    ) values (
      p_loan_id, 'INTEREST_PAYMENT', p_effective_date, interest_to_settle,
      p_note, p_idempotency_key || ':interest', auth.uid()
    ) returning id into interest_transaction_id;
  end if;

  insert into public.loan_principal_restructures (
    loan_id, effective_date, principal_before_vnd, principal_payment_vnd,
    principal_after_vnd, interest_settled_vnd, principal_transaction_id,
    interest_transaction_id, note, idempotency_key, created_by
  ) values (
    p_loan_id, p_effective_date, principal_before, p_principal_payment_vnd,
    principal_after, interest_to_settle, principal_transaction_id,
    interest_transaction_id, p_note, p_idempotency_key, auth.uid()
  ) returning id into restructure_id;

  calculation_date := greatest(
    p_effective_date,
    coalesce(p_recalculate_through, (now() at time zone 'Asia/Ho_Chi_Minh')::date)
  );
  perform private.rebuild_loan_interest_periods(p_loan_id, calculation_date);

  return restructure_id;
end;
$$;

create or replace function public.reverse_principal_restructure(
  p_restructure_id uuid,
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
  restructure public.loan_principal_restructures%rowtype;
  existing public.loan_principal_restructure_reversals%rowtype;
  component public.transactions%rowtype;
  ledger_id uuid;
  calculation_date date;
begin
  perform private.require_writer();

  if p_reversal_date is null then
    raise exception 'reversal_date is required' using errcode = '22004';
  end if;
  if btrim(coalesce(p_reason, '')) = '' then
    raise exception 'A restructure reversal reason is required' using errcode = '22023';
  end if;
  if btrim(coalesce(p_idempotency_key, '')) = '' then
    raise exception 'idempotency_key is required' using errcode = '22023';
  end if;

  select * into strict restructure
  from public.loan_principal_restructures
  where id = p_restructure_id;

  perform 1 from public.loans where id = restructure.loan_id for update;

  select * into existing
  from public.loan_principal_restructure_reversals
  where idempotency_key = p_idempotency_key;
  if found then
    if existing.restructure_id is distinct from p_restructure_id
       or existing.reversal_date is distinct from p_reversal_date
       or existing.reason is distinct from p_reason then
      raise exception 'Idempotency key is already used with different input'
        using errcode = '23505';
    end if;
    return existing.id;
  end if;

  if exists (
    select 1 from public.loan_principal_restructure_reversals
    where restructure_id = p_restructure_id
  ) then
    raise exception 'This principal restructure was already reversed' using errcode = '23514';
  end if;
  if p_reversal_date < restructure.effective_date then
    raise exception 'Reversal cannot precede the restructure date' using errcode = '23514';
  end if;

  insert into public.loan_principal_restructure_reversals (
    restructure_id, loan_id, reversal_date, reason, idempotency_key, created_by
  ) values (
    restructure.id, restructure.loan_id, p_reversal_date, p_reason, p_idempotency_key, auth.uid()
  ) returning id into ledger_id;

  for component in
    select transaction.*
    from public.transactions as transaction
    where transaction.id in (
      restructure.principal_transaction_id,
      restructure.interest_transaction_id
    )
    order by transaction.type, transaction.id
  loop
    insert into public.transactions (
      loan_id, type, transaction_date, amount_vnd, note,
      reversal_of_id, idempotency_key, created_by
    ) values (
      restructure.loan_id, 'REVERSAL', p_reversal_date, component.amount_vnd, p_reason,
      component.id, p_idempotency_key || ':' || lower(component.type::text), auth.uid()
    );
  end loop;

  calculation_date := greatest(
    p_reversal_date,
    coalesce(p_recalculate_through, (now() at time zone 'Asia/Ho_Chi_Minh')::date)
  );
  perform private.rebuild_loan_interest_periods(restructure.loan_id, calculation_date);

  return ledger_id;
end;
$$;

do $migration$
declare
  definition text;
  patched text;
  old_fragment constant text := $old$
  select * into existing
  from public.transactions
  where idempotency_key = p_idempotency_key;$old$;
  new_fragment constant text := $new$
  if exists (
    select 1
    from public.loan_principal_restructures as restructure
    where original.id in (restructure.principal_transaction_id, restructure.interest_transaction_id)
  ) then
    raise exception 'Principal restructure transactions require the controlled restructure reversal workflow'
      using errcode = '23514';
  end if;

  select * into existing
  from public.transactions
  where idempotency_key = p_idempotency_key;$new$;
begin
  select pg_get_functiondef(
    'public.reverse_transaction(uuid,date,text,text,date)'::regprocedure
  ) into definition;
  patched := replace(definition, old_fragment, new_fragment);
  if patched = definition then
    raise exception 'C47 could not protect restructure transaction components';
  end if;
  execute patched;
end;
$migration$;

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
  schedule_anchor date;
  reminder_date date;
  period_end date;
begin
  perform private.require_active_user();
  select * into strict loan_row from public.loans where id = p_loan_id;
  calculation := private.calculate_loan_json(p_loan_id, p_as_of_date);
  schedule_anchor := private.interest_schedule_anchor_date(
    loan_row.id, loan_row.disbursement_date, p_as_of_date
  );

  if calculation ->> 'status' <> 'SETTLED' then
    reminder_date := private.next_interest_reminder_date(
      schedule_anchor,
      loan_row.maturity_date,
      loan_row.interest_cycle_days,
      loan_row.interest_reminder_offset_days,
      p_as_of_date
    );
    if reminder_date is not null then
      period_end := private.next_interest_due_date(
        schedule_anchor,
        loan_row.maturity_date,
        loan_row.interest_cycle_days,
        reminder_date
      );
    end if;
  end if;

  return jsonb_build_object(
    'hasMaturity', loan_row.maturity_date is not null,
    'maturityDate', loan_row.maturity_date::text,
    'interestReminderOffsetDays', loan_row.interest_reminder_offset_days,
    'nextInterestDueDate', reminder_date::text,
    'nextInterestPeriodEndDate', period_end::text
  );
end;
$$;

do $migration$
declare
  target regprocedure;
  definition text;
  patched text;
  alias_name text;
  as_of_name text;
begin
  foreach target in array array[
    'public.list_loan_summaries_page(date,text,public.loan_direction,public.loan_status,date,date,text,integer,integer)'::regprocedure,
    'public.get_management_dashboard(date,date)'::regprocedure,
    'public.generate_due_notifications(date)'::regprocedure
  ]
  loop
    select pg_get_functiondef(target) into definition;

    if target::text like 'list_loan_summaries_page%' then
      alias_name := 'loan_record';
      as_of_name := 'p_as_of_date';
    elsif target::text like 'get_management_dashboard%' then
      alias_name := 'loan_row';
      as_of_name := 'p_period_end';
    else
      alias_name := 'loan_row';
      as_of_name := 'p_notification_date';
    end if;

    patched := regexp_replace(
      definition,
      E'private\\.(next_interest_reminder_date|next_interest_due_date|most_recent_interest_due_date)\\(\\s*'
        || alias_name || E'\\.disbursement_date,',
      E'private.\\1(private.interest_schedule_anchor_date('
        || alias_name || '.id, ' || alias_name || '.disbursement_date, ' || as_of_name || '),',
      'g'
    );

    if patched = definition then
      raise exception 'C47 could not patch schedule anchor in %', target::text;
    end if;
    execute patched;
  end loop;
end;
$migration$;

-- Keep the one-way reconciliation snapshot complete after introducing two new ledgers.
create or replace function public.get_google_sync_snapshot()
returns jsonb language sql stable security definer set search_path = '' as $$
  with snapshot as (
    select jsonb_build_object(
    'counterparties', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select id, name, notes, created_at, updated_at from public.counterparties where not is_test_data) row),
    'loans', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select id, counterparty_id, name, direction, status, original_principal_vnd::text as original_principal_vnd, disbursement_date, term_days, maturity_date, interest_cycle_days, interest_reminder_offset_days, initial_daily_rate_percent::text as initial_daily_rate_percent, settled_on, notes, created_at, updated_at from public.loans where not is_test_data) row),
    'transactions', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select transaction.id, transaction.loan_id, transaction.type, transaction.transaction_date, transaction.amount_vnd::text as amount_vnd, transaction.note, transaction.reversal_of_id, transaction.idempotency_key, transaction.created_at from public.transactions as transaction left join public.loans as loan on loan.id = transaction.loan_id where loan.id is null or not loan.is_test_data) row),
    'lifecycleEvents', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select event.id, event.loan_id, event.event_type, event.effective_date, event.daily_rate_percent::text as daily_rate_percent, event.note, event.created_at from public.loan_lifecycle_events as event join public.loans as loan on loan.id = event.loan_id where not loan.is_test_data) row),
    'loanTermCorrections', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select correction.id, correction.loan_id, correction.direction, correction.original_principal_vnd::text as original_principal_vnd, correction.disbursement_date, correction.term_days, correction.interest_cycle_days, correction.initial_period_rate_percent::text as initial_period_rate_percent, correction.reason, correction.idempotency_key, correction.created_at from public.loan_term_corrections as correction join public.loans as loan on loan.id = correction.loan_id where not loan.is_test_data) row),
    'settlementReversals', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select reversal.id, reversal.loan_id, reversal.settlement_event_id, reversal.reversal_date, reversal.reason, reversal.idempotency_key, reversal.created_at from public.loan_settlement_reversals as reversal join public.loans as loan on loan.id = reversal.loan_id where not loan.is_test_data) row),
    'principalRestructures', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select restructure.id, restructure.loan_id, restructure.effective_date, restructure.principal_before_vnd::text as principal_before_vnd, restructure.principal_payment_vnd::text as principal_payment_vnd, restructure.principal_after_vnd::text as principal_after_vnd, restructure.interest_settled_vnd::text as interest_settled_vnd, restructure.principal_transaction_id, restructure.interest_transaction_id, restructure.note, restructure.idempotency_key, restructure.created_at from public.loan_principal_restructures as restructure join public.loans as loan on loan.id = restructure.loan_id where not loan.is_test_data) row),
    'principalRestructureReversals', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select reversal.id, reversal.restructure_id, reversal.loan_id, reversal.reversal_date, reversal.reason, reversal.idempotency_key, reversal.created_at from public.loan_principal_restructure_reversals as reversal join public.loans as loan on loan.id = reversal.loan_id where not loan.is_test_data) row),
    'legacyLoanOnboardings', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select onboarding.id, onboarding.loan_id, onboarding.as_of_date, onboarding.principal_outstanding_vnd::text as principal_outstanding_vnd, onboarding.interest_collected_vnd::text as interest_collected_vnd, onboarding.bad_debt_since, onboarding.note, onboarding.idempotency_key, onboarding.created_at from public.legacy_loan_onboardings as onboarding join public.loans as loan on loan.id = onboarding.loan_id where not loan.is_test_data) row),
    'interestPeriods', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select period.id, period.loan_id, period.kind, period.start_date, period.end_date, period.day_count, period.opening_principal_vnd::text as opening_principal_vnd, period.closing_principal_vnd::text as closing_principal_vnd, period.accrued_interest_vnd::text as accrued_interest_vnd, period.interest_payments_vnd::text as interest_payments_vnd, period.closing_interest_balance_vnd::text as closing_interest_balance_vnd, period.calculated_at from public.interest_periods as period join public.loans as loan on loan.id = period.loan_id where not loan.is_test_data) row),
    'expenses', (select coalesce(jsonb_agg(to_jsonb(row) order by row.transaction_id), '[]'::jsonb) from (select expense.transaction_id, expense.category from public.expenses as expense join public.transactions as transaction on transaction.id = expense.transaction_id left join public.loans as loan on loan.id = transaction.loan_id where loan.id is null or not loan.is_test_data) row),
    'notifications', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select notification.id, notification.user_id, notification.loan_id, notification.type, notification.notification_date, notification.title, notification.body, notification.read_at, notification.created_at from public.notifications as notification left join public.loans as loan on loan.id = notification.loan_id where loan.id is null or not loan.is_test_data) row),
    'auditLogs', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb) from (select id, actor_user_id, table_name, record_id, action, changed_at, request_id from public.get_audit_logs_sanitized()) row)
    ) as tables
  )
  select jsonb_build_object('schemaVersion', 3, 'sourceVersion', md5(tables::text),
    'generatedAt', statement_timestamp(), 'unchanged', false, 'tables', tables)
  from snapshot;
$$;

revoke all on function public.preview_principal_restructure(uuid, date, bigint) from public, anon;
revoke all on function public.restructure_loan_principal(uuid, date, bigint, bigint, bigint, text, text, date) from public, anon;
revoke all on function public.reverse_principal_restructure(uuid, date, text, text, date) from public, anon;
grant execute on function public.preview_principal_restructure(uuid, date, bigint) to authenticated, service_role;
grant execute on function public.restructure_loan_principal(uuid, date, bigint, bigint, bigint, text, text, date) to authenticated, service_role;
grant execute on function public.reverse_principal_restructure(uuid, date, text, text, date) to authenticated, service_role;
revoke all on function public.get_google_sync_snapshot() from public, anon, authenticated;
grant execute on function public.get_google_sync_snapshot() to service_role;

comment on table public.loan_principal_restructures is
  'Append-only principal reductions that close interest through D-1 and reset the interest schedule on D without synthetic cash flow.';
comment on function public.preview_principal_restructure(uuid, date, bigint) is
  'Authoritative read-only preview for a principal reduction and same-day interest-cycle reset.';
comment on function public.restructure_loan_principal(uuid, date, bigint, bigint, bigint, text, text, date) is
  'Atomically settles accrued interest through D-1, records actual principal cash flow, and resets the cycle on D.';
comment on function public.reverse_principal_restructure(uuid, date, text, text, date) is
  'Atomically reverses a principal restructure and its payment components without deleting history.';

commit;
