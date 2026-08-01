begin;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.app_role as enum ('OWNER', 'EDITOR', 'VIEWER');
create type public.loan_direction as enum ('LENDING', 'BORROWING');
create type public.loan_status as enum ('ACTIVE', 'OVERDUE', 'BAD_DEBT', 'SETTLED');
create type public.transaction_type as enum (
  'DISBURSEMENT',
  'INTEREST_PAYMENT',
  'PRINCIPAL_PAYMENT',
  'EXPENSE',
  'REVERSAL'
);
create type public.lifecycle_event_type as enum (
  'RATE_CHANGE',
  'BAD_DEBT_START',
  'INTEREST_RESUME',
  'SETTLEMENT'
);
create type public.interest_period_kind as enum ('SCHEDULED', 'SETTLEMENT', 'OVERDUE');
create type public.notification_type as enum ('INTEREST_DUE', 'LOAN_OVERDUE');

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete restrict,
  username extensions.citext not null unique,
  display_name text not null,
  role public.app_role not null default 'VIEWER',
  must_change_password boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username::text ~ '^[a-zA-Z0-9._-]{3,32}$'),
  constraint profiles_display_name_not_blank check (btrim(display_name) <> '')
);

create table public.counterparties (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  notes text,
  created_by uuid references auth.users (id) on delete restrict,
  updated_by uuid references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint counterparties_name_not_blank check (btrim(name) <> '')
);

create table public.loans (
  id uuid primary key default extensions.gen_random_uuid(),
  counterparty_id uuid not null references public.counterparties (id) on delete restrict,
  name text not null,
  direction public.loan_direction not null,
  status public.loan_status not null default 'ACTIVE',
  original_principal_vnd bigint not null,
  disbursement_date date not null,
  term_days integer not null,
  maturity_date date generated always as (disbursement_date + term_days - 1) stored,
  interest_cycle_days smallint not null,
  initial_daily_rate_percent numeric(18, 10) not null,
  settled_on date,
  notes text,
  created_by uuid references auth.users (id) on delete restrict,
  updated_by uuid references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loans_name_not_blank check (btrim(name) <> ''),
  constraint loans_principal_positive check (original_principal_vnd > 0),
  constraint loans_term_days_positive check (term_days > 0),
  constraint loans_interest_cycle_supported check (interest_cycle_days in (15, 30)),
  constraint loans_daily_rate_nonnegative check (initial_daily_rate_percent >= 0),
  constraint loans_settlement_consistent check (
    (status = 'SETTLED' and settled_on is not null and settled_on >= disbursement_date)
    or (status <> 'SETTLED' and settled_on is null)
  )
);

create table public.loan_lifecycle_events (
  id uuid primary key default extensions.gen_random_uuid(),
  loan_id uuid not null references public.loans (id) on delete restrict,
  event_type public.lifecycle_event_type not null,
  effective_date date not null,
  daily_rate_percent numeric(18, 10),
  note text,
  created_by uuid references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint lifecycle_rate_payload check (
    (event_type in ('RATE_CHANGE', 'INTEREST_RESUME') and daily_rate_percent is not null and daily_rate_percent >= 0)
    or (event_type in ('BAD_DEBT_START', 'SETTLEMENT') and daily_rate_percent is null)
  ),
  constraint lifecycle_unique_kind_per_day unique (loan_id, event_type, effective_date)
);

create unique index lifecycle_one_state_event_per_day
  on public.loan_lifecycle_events (loan_id, effective_date)
  where event_type in ('BAD_DEBT_START', 'INTEREST_RESUME', 'SETTLEMENT');

create table public.transactions (
  id uuid primary key default extensions.gen_random_uuid(),
  loan_id uuid references public.loans (id) on delete restrict,
  type public.transaction_type not null,
  transaction_date date not null,
  amount_vnd bigint not null,
  note text,
  reversal_of_id uuid references public.transactions (id) on delete restrict,
  idempotency_key text not null unique,
  created_by uuid references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint transactions_amount_positive check (amount_vnd > 0),
  constraint transactions_idempotency_not_blank check (btrim(idempotency_key) <> ''),
  constraint transactions_loan_presence check (
    (type = 'EXPENSE')
    or (type <> 'EXPENSE' and loan_id is not null)
  ),
  constraint transactions_reversal_shape check (
    (type = 'REVERSAL' and reversal_of_id is not null and btrim(coalesce(note, '')) <> '')
    or (type <> 'REVERSAL' and reversal_of_id is null)
  ),
  constraint transactions_not_self_reversal check (id <> reversal_of_id)
);

create unique index transactions_one_reversal_per_original
  on public.transactions (reversal_of_id)
  where reversal_of_id is not null;

create index transactions_loan_date_idx
  on public.transactions (loan_id, transaction_date, created_at);

create table public.expenses (
  transaction_id uuid primary key references public.transactions (id) on delete restrict,
  category text not null,
  constraint expenses_category_not_blank check (btrim(category) <> '')
);

create table public.interest_periods (
  id uuid primary key default extensions.gen_random_uuid(),
  loan_id uuid not null references public.loans (id) on delete cascade,
  kind public.interest_period_kind not null,
  start_date date not null,
  end_date date not null,
  day_count integer not null,
  opening_principal_vnd bigint not null,
  closing_principal_vnd bigint not null,
  opening_interest_balance_vnd bigint not null,
  accrued_interest_vnd bigint not null,
  interest_payments_vnd bigint not null,
  closing_interest_balance_vnd bigint not null,
  segments jsonb not null default '[]'::jsonb,
  calculation_version integer not null default 1,
  calculated_at timestamptz not null default now(),
  constraint interest_period_date_order check (end_date >= start_date),
  constraint interest_period_day_count check (day_count = end_date - start_date + 1 and day_count > 0),
  constraint interest_period_principal_nonnegative check (
    opening_principal_vnd >= 0 and closing_principal_vnd >= 0
  ),
  constraint interest_period_amounts_nonnegative check (
    accrued_interest_vnd >= 0 and interest_payments_vnd >= 0
  ),
  constraint interest_period_segments_array check (jsonb_typeof(segments) = 'array'),
  constraint interest_period_calculation_version_positive check (calculation_version > 0),
  constraint interest_period_unique_range unique (loan_id, kind, start_date, end_date)
);

create index interest_periods_loan_dates_idx
  on public.interest_periods (loan_id, start_date, end_date);

create table public.notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  loan_id uuid references public.loans (id) on delete cascade,
  type public.notification_type not null,
  notification_date date not null,
  title text not null,
  body text not null,
  read_at timestamptz,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  constraint notifications_title_not_blank check (btrim(title) <> ''),
  constraint notifications_body_not_blank check (btrim(body) <> ''),
  constraint notifications_idempotency_not_blank check (btrim(idempotency_key) <> '')
);

create index notifications_user_unread_idx
  on public.notifications (user_id, notification_date desc)
  where read_at is null;

create table public.push_subscriptions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_secret text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_endpoint_not_blank check (btrim(endpoint) <> ''),
  constraint push_p256dh_not_blank check (btrim(p256dh) <> ''),
  constraint push_auth_not_blank check (btrim(auth_secret) <> '')
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users (id) on delete set null,
  table_name text not null,
  record_id uuid not null,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  changed_at timestamptz not null default now(),
  request_id text,
  constraint audit_action_supported check (action in ('INSERT', 'UPDATE', 'DELETE')),
  constraint audit_payload_present check (old_data is not null or new_data is not null)
);

create index audit_logs_record_idx
  on public.audit_logs (table_name, record_id, changed_at desc);

create or replace function private.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles as p
  where p.user_id = (select auth.uid())
    and p.is_active
$$;

create or replace function private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_app_role() is not null
$$;

create or replace function private.can_write()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_app_role() in ('OWNER', 'EDITOR')
$$;

create or replace function private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_app_role() = 'OWNER'
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_id uuid;
begin
  row_id := case
    when tg_op = 'DELETE' then (to_jsonb(old) ->> tg_argv[0])::uuid
    else (to_jsonb(new) ->> tg_argv[0])::uuid
  end;

  insert into public.audit_logs (
    actor_user_id,
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    request_id
  ) values (
    (select auth.uid()),
    tg_table_name,
    row_id,
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end,
    nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-request-id'
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function private.prevent_immutable_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% rows are immutable; append a reversal or a new history event instead', tg_table_name
    using errcode = '55000';
end;
$$;

create or replace function private.validate_lifecycle_event()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  loan_row public.loans%rowtype;
begin
  select * into strict loan_row
  from public.loans
  where id = new.loan_id;

  if new.effective_date < loan_row.disbursement_date then
    raise exception 'Lifecycle event cannot precede loan disbursement'
      using errcode = '23514';
  end if;

  if loan_row.settled_on is not null
     and new.effective_date > loan_row.settled_on
     and new.event_type <> 'SETTLEMENT' then
    raise exception 'Lifecycle event cannot follow settlement'
      using errcode = '23514';
  end if;

  return new;
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
begin
  if new.type = 'REVERSAL' then
    select * into strict original_row
    from public.transactions
    where id = new.reversal_of_id;

    if original_row.type = 'REVERSAL' then
      raise exception 'A reversal cannot reverse another reversal'
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
  end if;

  return new;
end;
$$;

create or replace function private.validate_expense()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_type public.transaction_type;
begin
  select type into strict parent_type
  from public.transactions
  where id = new.transaction_id;

  if parent_type <> 'EXPENSE' then
    raise exception 'Expense details require an EXPENSE transaction'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger counterparties_set_updated_at
before update on public.counterparties
for each row execute function private.set_updated_at();

create trigger loans_set_updated_at
before update on public.loans
for each row execute function private.set_updated_at();

create trigger push_subscriptions_set_updated_at
before update on public.push_subscriptions
for each row execute function private.set_updated_at();

create trigger lifecycle_validate
before insert on public.loan_lifecycle_events
for each row execute function private.validate_lifecycle_event();

create trigger transactions_validate
before insert on public.transactions
for each row execute function private.validate_transaction();

create trigger expenses_validate
before insert on public.expenses
for each row execute function private.validate_expense();

create trigger loan_lifecycle_events_immutable
before update or delete on public.loan_lifecycle_events
for each row execute function private.prevent_immutable_change();

create trigger transactions_immutable
before update or delete on public.transactions
for each row execute function private.prevent_immutable_change();

create trigger expenses_immutable
before update or delete on public.expenses
for each row execute function private.prevent_immutable_change();

create trigger audit_logs_immutable
before update or delete on public.audit_logs
for each row execute function private.prevent_immutable_change();

create trigger profiles_audit
after insert or update or delete on public.profiles
for each row execute function private.write_audit_log('user_id');

create trigger counterparties_audit
after insert or update or delete on public.counterparties
for each row execute function private.write_audit_log('id');

create trigger loans_audit
after insert or update or delete on public.loans
for each row execute function private.write_audit_log('id');

create trigger lifecycle_audit
after insert on public.loan_lifecycle_events
for each row execute function private.write_audit_log('id');

create trigger transactions_audit
after insert on public.transactions
for each row execute function private.write_audit_log('id');

create trigger expenses_audit
after insert on public.expenses
for each row execute function private.write_audit_log('transaction_id');

create trigger push_subscriptions_audit
after insert or update or delete on public.push_subscriptions
for each row execute function private.write_audit_log('id');

alter table public.profiles enable row level security;
alter table public.counterparties enable row level security;
alter table public.loans enable row level security;
alter table public.loan_lifecycle_events enable row level security;
alter table public.transactions enable row level security;
alter table public.expenses enable row level security;
alter table public.interest_periods enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select
on public.profiles for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_owner()));

create policy profiles_owner_insert
on public.profiles for insert to authenticated
with check ((select private.is_owner()));

create policy profiles_owner_update
on public.profiles for update to authenticated
using ((select private.is_owner()))
with check ((select private.is_owner()));

create policy profiles_owner_delete
on public.profiles for delete to authenticated
using ((select private.is_owner()));

create policy counterparties_select
on public.counterparties for select to authenticated
using ((select private.is_active_user()));

create policy counterparties_insert
on public.counterparties for insert to authenticated
with check ((select private.can_write()));

create policy counterparties_update
on public.counterparties for update to authenticated
using ((select private.can_write()))
with check ((select private.can_write()));

create policy counterparties_owner_delete
on public.counterparties for delete to authenticated
using ((select private.is_owner()));

create policy loans_select
on public.loans for select to authenticated
using ((select private.is_active_user()));

create policy loans_insert
on public.loans for insert to authenticated
with check ((select private.can_write()));

create policy loans_update
on public.loans for update to authenticated
using ((select private.can_write()))
with check ((select private.can_write()));

create policy loan_lifecycle_events_select
on public.loan_lifecycle_events for select to authenticated
using ((select private.is_active_user()));

create policy loan_lifecycle_events_insert
on public.loan_lifecycle_events for insert to authenticated
with check ((select private.can_write()));

create policy transactions_select
on public.transactions for select to authenticated
using ((select private.is_active_user()));

create policy transactions_insert
on public.transactions for insert to authenticated
with check ((select private.can_write()));

create policy expenses_select
on public.expenses for select to authenticated
using ((select private.is_active_user()));

create policy expenses_insert
on public.expenses for insert to authenticated
with check ((select private.can_write()));

create policy interest_periods_select
on public.interest_periods for select to authenticated
using ((select private.is_active_user()));

create policy notifications_select_own
on public.notifications for select to authenticated
using (user_id = (select auth.uid()) and (select private.is_active_user()));

create policy push_subscriptions_select_own
on public.push_subscriptions for select to authenticated
using (user_id = (select auth.uid()) and (select private.is_active_user()));

create policy push_subscriptions_insert_own
on public.push_subscriptions for insert to authenticated
with check (user_id = (select auth.uid()) and (select private.is_active_user()));

create policy push_subscriptions_update_own
on public.push_subscriptions for update to authenticated
using (user_id = (select auth.uid()) and (select private.is_active_user()))
with check (user_id = (select auth.uid()) and (select private.is_active_user()));

create policy push_subscriptions_delete_own
on public.push_subscriptions for delete to authenticated
using (user_id = (select auth.uid()) and (select private.is_active_user()));

create policy audit_logs_owner_select
on public.audit_logs for select to authenticated
using ((select private.is_owner()));

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.counterparties to authenticated;
grant select, insert, update on public.loans to authenticated;
grant select, insert on public.loan_lifecycle_events to authenticated;
grant select, insert on public.transactions to authenticated;
grant select, insert on public.expenses to authenticated;
grant select on public.interest_periods to authenticated;
grant select on public.notifications to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant select on public.audit_logs to authenticated;
grant usage, select on sequence public.audit_logs_id_seq to authenticated;

revoke all on function private.current_app_role() from public;
revoke all on function private.is_active_user() from public;
revoke all on function private.can_write() from public;
revoke all on function private.is_owner() from public;
grant execute on function private.current_app_role() to authenticated;
grant execute on function private.is_active_user() to authenticated;
grant execute on function private.can_write() to authenticated;
grant execute on function private.is_owner() to authenticated;

comment on table public.profiles is 'Application identity and role mapped one-to-one to Supabase Auth.';
comment on table public.loans is 'Source loan terms. Monetary values are integer VND; rates are percent per day.';
comment on table public.transactions is 'Append-only financial transactions. Corrections are represented by REVERSAL rows.';
comment on table public.interest_periods is 'Derived authoritative calculation output maintained by database functions from C4.';
comment on table public.audit_logs is 'Append-only audit history. Direct client writes are never granted.';

commit;
