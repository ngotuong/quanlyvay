begin;

alter table public.loans
  add column interest_reminder_offset_days smallint not null default 0,
  add constraint loans_interest_reminder_offset_valid
    check (interest_reminder_offset_days >= 0 and interest_reminder_offset_days < interest_cycle_days);

comment on column public.loans.interest_reminder_offset_days is
  'Operational reminder lead time. Interest still accrues for the full configured cycle.';

create table public.legacy_loan_onboardings (
  id uuid primary key default extensions.gen_random_uuid(),
  loan_id uuid not null unique references public.loans (id) on delete restrict,
  as_of_date date not null,
  principal_outstanding_vnd bigint not null,
  interest_collected_vnd bigint not null default 0,
  bad_debt_since date,
  note text,
  idempotency_key text not null unique,
  created_by uuid references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint legacy_onboarding_principal_nonnegative check (principal_outstanding_vnd >= 0),
  constraint legacy_onboarding_interest_nonnegative check (interest_collected_vnd >= 0),
  constraint legacy_onboarding_bad_debt_before_cutover check (bad_debt_since is null or bad_debt_since <= as_of_date),
  constraint legacy_onboarding_key_required check (btrim(idempotency_key) <> '')
);

alter table public.legacy_loan_onboardings enable row level security;

create policy legacy_loan_onboardings_select
on public.legacy_loan_onboardings for select to authenticated
using ((select private.is_active_user()));

create trigger legacy_loan_onboardings_immutable
before update or delete on public.legacy_loan_onboardings
for each row execute function private.prevent_immutable_change();

create trigger legacy_loan_onboardings_audit
after insert on public.legacy_loan_onboardings
for each row execute function private.write_audit_log('id');

grant select on public.legacy_loan_onboardings to authenticated, service_role;

create table private.legacy_onboarding_transactions (
  onboarding_id uuid not null references public.legacy_loan_onboardings (id) on delete restrict,
  transaction_id uuid not null unique references public.transactions (id) on delete restrict,
  component text not null check (component in ('PRINCIPAL', 'INTEREST')),
  primary key (onboarding_id, component)
);

revoke all on private.legacy_onboarding_transactions from public, anon, authenticated;

create or replace function private.reject_legacy_onboarding_component_reversal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.type = 'REVERSAL' and exists (
    select 1 from private.legacy_onboarding_transactions component
    where component.transaction_id = new.reversal_of_id
  ) then
    raise exception 'Legacy opening components require a controlled onboarding correction workflow'
      using errcode = '23514';
  end if;
  return new;
end
$$;

create trigger transactions_reject_legacy_onboarding_reversal
before insert on public.transactions
for each row execute function private.reject_legacy_onboarding_component_reversal();

create or replace function private.next_interest_reminder_date(
  p_disbursement_date date,
  p_maturity_date date,
  p_cycle_days integer,
  p_reminder_offset_days integer,
  p_as_of_date date
)
returns date
language plpgsql
immutable
set search_path = ''
as $$
declare
  period_end date;
  period_start date;
  reminder_date date;
begin
  if p_cycle_days <= 0 or p_reminder_offset_days < 0 or p_reminder_offset_days >= p_cycle_days then
    raise exception 'invalid interest reminder configuration' using errcode = '22023';
  end if;

  period_end := private.next_interest_due_date(
    p_disbursement_date, p_maturity_date, p_cycle_days, p_as_of_date
  );
  period_start := greatest(p_disbursement_date, period_end - p_cycle_days + 1);
  reminder_date := greatest(period_start, period_end - p_reminder_offset_days);

  if reminder_date < p_as_of_date then
    if p_maturity_date is not null and period_end >= p_maturity_date then
      return null;
    end if;
    period_start := period_end + 1;
    period_end := least(coalesce(p_maturity_date, 'infinity'::date), period_end + p_cycle_days);
    reminder_date := greatest(period_start, period_end - p_reminder_offset_days);
  end if;

  return reminder_date;
end
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
  reminder_date date;
  period_end date;
begin
  perform private.require_active_user();
  select * into strict loan_row from public.loans where id = p_loan_id;
  calculation := private.calculate_loan_json(p_loan_id, p_as_of_date);

  if calculation ->> 'status' <> 'SETTLED' then
    reminder_date := private.next_interest_reminder_date(
      loan_row.disbursement_date,
      loan_row.maturity_date,
      loan_row.interest_cycle_days,
      loan_row.interest_reminder_offset_days,
      p_as_of_date
    );
    if reminder_date is not null then
      period_end := private.next_interest_due_date(
        loan_row.disbursement_date,
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
end
$$;

create or replace function public.create_loan_v3(
  p_counterparty_id uuid,
  p_name text,
  p_direction public.loan_direction,
  p_original_principal_vnd bigint,
  p_disbursement_date date,
  p_term_days integer,
  p_interest_cycle_days smallint,
  p_initial_period_rate_percent numeric,
  p_interest_reminder_offset_days smallint,
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
  loan_id uuid;
begin
  if p_interest_reminder_offset_days is null
     or p_interest_reminder_offset_days < 0
     or p_interest_reminder_offset_days >= p_interest_cycle_days then
    raise exception 'reminder offset must be from 0 to cycle days minus 1' using errcode = '22023';
  end if;

  loan_id := public.create_loan_v2(
    p_counterparty_id, p_name, p_direction, p_original_principal_vnd,
    p_disbursement_date, p_term_days, p_interest_cycle_days,
    p_initial_period_rate_percent, p_idempotency_key, p_notes
  );
  update public.loans
  set interest_reminder_offset_days = p_interest_reminder_offset_days,
      updated_by = auth.uid()
  where id = loan_id;
  return loan_id;
end
$$;

create or replace function public.update_loan_details_v2(
  p_loan_id uuid,
  p_counterparty_id uuid,
  p_name text,
  p_notes text,
  p_interest_reminder_offset_days smallint
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  cycle_days smallint;
begin
  perform private.require_writer();
  select interest_cycle_days into strict cycle_days from public.loans where id = p_loan_id for update;
  if p_interest_reminder_offset_days is null
     or p_interest_reminder_offset_days < 0
     or p_interest_reminder_offset_days >= cycle_days then
    raise exception 'reminder offset must be from 0 to cycle days minus 1' using errcode = '22023';
  end if;
  perform public.update_loan_details(p_loan_id, p_counterparty_id, p_name, p_notes);
  update public.loans
  set interest_reminder_offset_days = p_interest_reminder_offset_days,
      updated_by = auth.uid()
  where id = p_loan_id;
end
$$;

create or replace function public.onboard_legacy_loan(
  p_loan_id uuid,
  p_as_of_date date,
  p_principal_outstanding_vnd bigint,
  p_interest_collected_vnd bigint,
  p_bad_debt_since date,
  p_note text,
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
  existing public.legacy_loan_onboardings%rowtype;
  onboarding_id uuid;
  principal_paid bigint;
  principal_transaction_id uuid;
  interest_transaction_id uuid;
  common_note text := 'Số dư mở đầu khoản vay cũ';
begin
  perform private.require_writer();
  if btrim(coalesce(p_idempotency_key, '')) = '' then
    raise exception 'idempotency_key is required' using errcode = '22023';
  end if;

  select * into existing from public.legacy_loan_onboardings where idempotency_key = p_idempotency_key;
  if found then
    if existing.loan_id is distinct from p_loan_id
       or existing.as_of_date is distinct from p_as_of_date
       or existing.principal_outstanding_vnd is distinct from p_principal_outstanding_vnd
       or existing.interest_collected_vnd is distinct from p_interest_collected_vnd
       or existing.bad_debt_since is distinct from p_bad_debt_since
       or existing.note is distinct from nullif(btrim(coalesce(p_note, '')), '') then
      raise exception 'Idempotency key is already used with different input' using errcode = '23505';
    end if;
    return existing.id;
  end if;

  select * into strict loan_row from public.loans where id = p_loan_id for update;
  if loan_row.status = 'SETTLED' then
    raise exception 'settled loan cannot be onboarded' using errcode = '23514';
  end if;
  if p_as_of_date < loan_row.disbursement_date
     or p_as_of_date > (now() at time zone 'Asia/Ho_Chi_Minh')::date then
    raise exception 'invalid onboarding date' using errcode = '22007';
  end if;
  if p_principal_outstanding_vnd < 0 or p_principal_outstanding_vnd > loan_row.original_principal_vnd then
    raise exception 'invalid opening principal' using errcode = '22023';
  end if;
  if p_interest_collected_vnd < 0 then
    raise exception 'invalid collected interest' using errcode = '22023';
  end if;
  if p_bad_debt_since is not null
     and (p_bad_debt_since < loan_row.disbursement_date or p_bad_debt_since > p_as_of_date) then
    raise exception 'invalid bad debt date' using errcode = '22007';
  end if;
  if exists (
    select 1 from public.transactions t
    where t.loan_id = p_loan_id and t.type not in ('DISBURSEMENT', 'REVERSAL')
  ) or exists (select 1 from public.loan_lifecycle_events e where e.loan_id = p_loan_id) then
    raise exception 'legacy onboarding requires a loan without recorded activity' using errcode = '23514';
  end if;

  insert into public.legacy_loan_onboardings (
    loan_id, as_of_date, principal_outstanding_vnd, interest_collected_vnd,
    bad_debt_since, note, idempotency_key, created_by
  ) values (
    p_loan_id, p_as_of_date, p_principal_outstanding_vnd, p_interest_collected_vnd,
    p_bad_debt_since, nullif(btrim(coalesce(p_note, '')), ''), p_idempotency_key, auth.uid()
  ) returning id into onboarding_id;

  principal_paid := loan_row.original_principal_vnd - p_principal_outstanding_vnd;
  if principal_paid > 0 then
    principal_transaction_id := public.record_financial_transaction(
      p_loan_id, 'PRINCIPAL_PAYMENT', p_as_of_date, principal_paid,
      p_idempotency_key || ':principal', common_note, p_as_of_date
    );
    insert into private.legacy_onboarding_transactions (onboarding_id, transaction_id, component)
    values (onboarding_id, principal_transaction_id, 'PRINCIPAL');
  end if;
  if p_interest_collected_vnd > 0 then
    interest_transaction_id := public.record_financial_transaction(
      p_loan_id, 'INTEREST_PAYMENT', p_as_of_date, p_interest_collected_vnd,
      p_idempotency_key || ':interest', common_note, p_as_of_date
    );
    insert into private.legacy_onboarding_transactions (onboarding_id, transaction_id, component)
    values (onboarding_id, interest_transaction_id, 'INTEREST');
  end if;
  if p_bad_debt_since is not null then
    perform public.record_lifecycle_event(
      p_loan_id, 'BAD_DEBT_START', p_bad_debt_since,
      p_idempotency_key || ':bad-debt', null, common_note, p_as_of_date
    );
  end if;
  perform private.rebuild_loan_interest_periods(p_loan_id, p_as_of_date);
  return onboarding_id;
end
$$;

do $$
declare
  definition text;
begin
  select pg_get_functiondef('public.generate_due_notifications(date)'::regprocedure) into definition;
  definition := replace(definition,
    E'private.next_interest_due_date(\n        loan_row.disbursement_date,\n        loan_row.maturity_date,\n        loan_row.interest_cycle_days,\n        p_notification_date\n      )',
    E'private.next_interest_reminder_date(\n        loan_row.disbursement_date,\n        loan_row.maturity_date,\n        loan_row.interest_cycle_days,\n        loan_row.interest_reminder_offset_days,\n        p_notification_date\n      )');
  execute definition;
end
$$;

do $$
declare
  definition text;
  old_block text;
  new_block text;
begin
  select pg_get_functiondef('public.get_dashboard(date,integer)'::regprocedure) into definition;
  old_block := E'select transaction.*, loan.direction\n    from public.transactions as transaction\n    left join public.loans as loan on loan.id = transaction.loan_id\n    where transaction.type <> ''REVERSAL''';
  new_block := E'select transaction.*, loan.direction\n    from public.transactions as transaction\n    left join public.loans as loan on loan.id = transaction.loan_id\n    where transaction.type <> ''REVERSAL''\n      and not exists (\n        select 1 from private.legacy_onboarding_transactions opening\n        where opening.transaction_id = transaction.id\n      )';
  if position(old_block in definition) = 0 then
    raise exception 'C16 could not patch dashboard opening cash-flow exclusion';
  end if;
  definition := replace(definition, old_block, new_block);
  execute definition;
end
$$;

do $$
declare
  definition text;
  old_block text;
  new_block text;
begin
  select pg_get_functiondef('public.get_dashboard(date,integer)'::regprocedure) into definition;
  definition := replace(definition, '  due_date date;', E'  due_date date;\n  period_end date;');
  old_block := E'due_date := private.next_interest_due_date(\n        loan_row.disbursement_date,\n        loan_row.maturity_date,\n        loan_row.interest_cycle_days,\n        p_as_of_date\n      );\n      due_calculation := private.calculate_loan_json(loan_row.id, due_date);';
  new_block := E'due_date := private.next_interest_reminder_date(\n        loan_row.disbursement_date,\n        loan_row.maturity_date,\n        loan_row.interest_cycle_days,\n        loan_row.interest_reminder_offset_days,\n        p_as_of_date\n      );\n      period_end := case when due_date is null then null else private.next_interest_due_date(\n        loan_row.disbursement_date, loan_row.maturity_date, loan_row.interest_cycle_days, due_date\n      ) end;\n      due_calculation := private.calculate_loan_json(loan_row.id, coalesce(period_end, p_as_of_date));';
  definition := replace(definition, old_block, new_block);
  execute definition;
end
$$;

revoke all on function public.create_loan_v3(uuid,text,public.loan_direction,bigint,date,integer,smallint,numeric,smallint,text,text) from public, anon;
revoke all on function public.update_loan_details_v2(uuid,uuid,text,text,smallint) from public, anon;
revoke all on function public.onboard_legacy_loan(uuid,date,bigint,bigint,date,text,text) from public, anon;
grant execute on function public.create_loan_v3(uuid,text,public.loan_direction,bigint,date,integer,smallint,numeric,smallint,text,text) to authenticated, service_role;
grant execute on function public.update_loan_details_v2(uuid,uuid,text,text,smallint) to authenticated, service_role;
grant execute on function public.onboard_legacy_loan(uuid,date,bigint,bigint,date,text,text) to authenticated, service_role;

commit;
