begin;

-- A schedule change is an append-only business event, never a cash transaction.
create table public.loan_interest_cycle_resets (
  id uuid primary key default extensions.gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete restrict,
  lifecycle_event_id uuid not null references public.loan_lifecycle_events(id) on delete restrict,
  effective_date date not null,
  idempotency_key text not null unique check (btrim(idempotency_key) <> ''),
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (loan_id, effective_date)
);
alter table public.loan_interest_cycle_resets enable row level security;
create policy loan_interest_cycle_resets_select on public.loan_interest_cycle_resets
  for select to authenticated using ((select private.is_active_user()));
create trigger loan_interest_cycle_resets_immutable before update or delete
  on public.loan_interest_cycle_resets for each row execute function private.prevent_immutable_change();
create trigger loan_interest_cycle_resets_audit after insert
  on public.loan_interest_cycle_resets for each row execute function private.write_audit_log('id');
revoke all on public.loan_interest_cycle_resets from public, anon, authenticated;
grant select on public.loan_interest_cycle_resets to authenticated, service_role;

create or replace function private.interest_schedule_anchor_date(
  p_loan_id uuid, p_disbursement_date date, p_as_of_date date
) returns date language sql stable security definer set search_path = '' as $$
  select coalesce(max(boundary), p_disbursement_date) from (
    select r.effective_date as boundary from public.loan_principal_restructures r
    where r.loan_id = p_loan_id and r.effective_date <= p_as_of_date
      and not exists (select 1 from public.loan_principal_restructure_reversals v where v.restructure_id = r.id)
    union all
    select r.effective_date from public.loan_interest_cycle_resets r
    where r.loan_id = p_loan_id and r.effective_date <= p_as_of_date
  ) boundaries
$$;

-- Preserve the existing financial engine and add only the new period boundary.
do $migration$
declare definition text; patched text;
begin
  select pg_get_functiondef('private.calculate_loan_json(uuid,date)'::regprocedure) into definition;
  patched := replace(definition,
    '    if next_restructure_date is not null then',
    E'    select least(next_restructure_date, min(reset.effective_date))\n    into next_restructure_date\n    from public.loan_interest_cycle_resets reset\n    where reset.loan_id = p_loan_id\n      and reset.effective_date > period_start\n      and reset.effective_date <= period_end;\n\n    if next_restructure_date is not null then');
  if patched = definition then raise exception 'C119: scheduled period boundary not found'; end if;
  execute patched;
end;
$migration$;

create function public.record_lifecycle_event_v3(
  p_loan_id uuid,
  p_event_type public.lifecycle_event_type,
  p_effective_date date,
  p_idempotency_key text,
  p_period_rate_percent numeric default null,
  p_note text default null,
  p_reset_cycle boolean default false
) returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare
  loan public.loans%rowtype;
  existing public.loan_lifecycle_events%rowtype;
  prior public.loan_interest_cycle_resets%rowtype;
  event_id uuid;
begin
  perform private.require_writer();
  select * into strict loan from public.loans where id = p_loan_id for update;
  if not coalesce(p_reset_cycle, false) then
    return public.record_lifecycle_event_v2(p_loan_id, p_event_type, p_effective_date,
      p_idempotency_key, p_period_rate_percent, p_note);
  end if;
  if p_event_type is null or p_event_type not in ('RATE_CHANGE', 'INTEREST_RESUME')
    or p_effective_date is null or p_effective_date <= loan.disbursement_date
    or p_effective_date > (now() at time zone 'Asia/Ho_Chi_Minh')::date
    or (loan.maturity_date is not null and p_effective_date > loan.maturity_date)
    or p_period_rate_percent is null or p_period_rate_percent <= 0 or p_period_rate_percent > 100
    or btrim(coalesce(p_idempotency_key, '')) = '' then
    raise exception 'Invalid interest cycle reset input' using errcode = '22023';
  end if;
  select * into prior from public.loan_interest_cycle_resets where idempotency_key = p_idempotency_key;
  if found then
    select * into strict existing from public.loan_lifecycle_events where id = prior.lifecycle_event_id;
    if prior.loan_id <> p_loan_id or prior.effective_date <> p_effective_date
      or existing.event_type <> p_event_type
      or existing.daily_rate_percent <> p_period_rate_percent / loan.interest_cycle_days then
      raise exception 'Idempotency key input mismatch' using errcode = '23505';
    end if;
    return existing.id;
  end if;
  if exists(select 1 from public.loan_interest_cycle_resets where loan_id = p_loan_id and effective_date >= p_effective_date)
    or exists(select 1 from public.loan_lifecycle_events where loan_id = p_loan_id and effective_date > p_effective_date)
    or exists(select 1 from public.loan_lifecycle_events where loan_id = p_loan_id and event_type = 'SETTLEMENT')
    or exists(select 1 from public.loan_principal_restructures r where r.loan_id = p_loan_id
      and r.effective_date >= p_effective_date and not exists (
        select 1 from public.loan_principal_restructure_reversals v where v.restructure_id = r.id)) then
    raise exception 'Conflicting later history or schedule boundary' using errcode = '23514';
  end if;
  if p_event_type = 'RATE_CHANGE' and private.calculate_loan_json(p_loan_id, p_effective_date)->>'status' = 'BAD_DEBT' then
    raise exception 'Use interest resume while interest is paused' using errcode = '23514';
  end if;
  select * into existing from public.loan_lifecycle_events
    where loan_id = p_loan_id and effective_date = p_effective_date and event_type = p_event_type;
  if found then
    if existing.daily_rate_percent <> p_period_rate_percent / loan.interest_cycle_days then
      raise exception 'Existing rate differs from requested rate' using errcode = '23514';
    end if;
    event_id := existing.id;
  else
    event_id := public.record_lifecycle_event_v2(p_loan_id, p_event_type, p_effective_date,
      p_idempotency_key, p_period_rate_percent, p_note);
  end if;
  insert into public.loan_interest_cycle_resets(loan_id, lifecycle_event_id, effective_date, idempotency_key, created_by)
    values(p_loan_id, event_id, p_effective_date, p_idempotency_key, auth.uid());
  perform private.rebuild_loan_interest_periods(p_loan_id, (now() at time zone 'Asia/Ho_Chi_Minh')::date);
  return event_id;
end;
$$;
revoke all on function public.record_lifecycle_event_v3(uuid,public.lifecycle_event_type,date,text,numeric,text,boolean) from public, anon;
grant execute on function public.record_lifecycle_event_v3(uuid,public.lifecycle_event_type,date,text,numeric,text,boolean) to authenticated, service_role;

-- A reminder predicted from an earlier anchor must be recomputed if a reset falls before it.
do $migration$
declare definition text; patched text;
begin
  select pg_get_functiondef('public.get_management_dashboard_bundle_v5(date,date,date,date,date,date,date,date,date)'::regprocedure) into definition;
  patched := replace(definition,
    '      exit when reminder_date is null or reminder_date > p_reminder_end;',
    E'      exit when reminder_date is null;\n      if private.interest_schedule_anchor_date(loan_row.id, loan_row.disbursement_date, least(reminder_date, p_reminder_end))\n        > private.interest_schedule_anchor_date(loan_row.id, loan_row.disbursement_date, reminder_cursor) then\n        reminder_cursor := private.interest_schedule_anchor_date(loan_row.id, loan_row.disbursement_date, least(reminder_date, p_reminder_end));\n        continue;\n      end if;\n      exit when reminder_date > p_reminder_end;');
  if patched = definition then raise exception 'C119: dashboard reminder boundary not found'; end if;
  execute patched;
end;
$migration$;

-- Keep the export complete without changing any existing reconciliation dataset.
do $migration$
declare definition text; patched text;
begin
  select pg_get_functiondef('public.get_google_sync_snapshot()'::regprocedure) into definition;
  patched := replace(definition, '''lifecycleEvents'',', $fragment$
    'interestCycleResets', (select coalesce(jsonb_agg(to_jsonb(row) order by row.id), '[]'::jsonb)
      from (select r.id, r.loan_id, r.lifecycle_event_id, r.effective_date, r.idempotency_key, r.created_at
        from public.loan_interest_cycle_resets r join public.loans l on l.id = r.loan_id
        where not l.is_test_data) row),
    'lifecycleEvents',$fragment$);
  if patched = definition then raise exception 'C119: export dataset boundary not found'; end if;
  execute patched;
end;
$migration$;

commit;
