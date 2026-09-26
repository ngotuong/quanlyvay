begin;

-- C51: prevent direct authenticated callers from clearing first-login enforcement.
revoke execute on function public.complete_password_change() from public, anon, authenticated;
grant execute on function public.complete_password_change() to service_role;

-- Include already-recorded activity on the effective day in an authoritative preview.
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
  principal_paid_on_effective_date bigint;
  interest_paid_on_effective_date bigint;
  daily_rate numeric;
  new_period_end date;
  new_period_days integer;
  new_period_interest bigint;
  today_vietnam date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
begin
  perform private.require_active_user();
  if p_effective_date is null then raise exception 'effective_date is required' using errcode = '22004'; end if;
  if p_principal_payment_vnd is null or p_principal_payment_vnd <= 0 then raise exception 'principal_payment_vnd must be positive' using errcode = '22023'; end if;
  select * into strict loan_row from public.loans where id = p_loan_id;
  if p_effective_date <= loan_row.disbursement_date then raise exception 'Restructure date must be after disbursement' using errcode = '22007'; end if;
  if p_effective_date > today_vietnam then raise exception 'Restructure date cannot be in the future' using errcode = '22007'; end if;
  if loan_row.maturity_date is not null and p_effective_date > loan_row.maturity_date then raise exception 'Restructure date cannot be after maturity' using errcode = '22007'; end if;

  closing_calculation := private.calculate_loan_json(p_loan_id, p_effective_date - 1);
  if closing_calculation ->> 'status' <> 'ACTIVE' then raise exception 'Only active loans can reset principal and interest cycle' using errcode = '23514'; end if;
  principal_before := (closing_calculation ->> 'principalOutstandingVnd')::bigint;
  interest_balance := (closing_calculation ->> 'interestBalanceVnd')::bigint;

  select coalesce(sum(t.amount_vnd), 0) into principal_paid_on_effective_date
  from public.transactions t
  where t.loan_id = p_loan_id and t.type = 'PRINCIPAL_PAYMENT' and t.transaction_date = p_effective_date
    and not exists (select 1 from public.transactions r where r.type = 'REVERSAL' and r.reversal_of_id = t.id);
  select coalesce(sum(t.amount_vnd), 0) into interest_paid_on_effective_date
  from public.transactions t
  where t.loan_id = p_loan_id and t.type = 'INTEREST_PAYMENT' and t.transaction_date = p_effective_date
    and not exists (select 1 from public.transactions r where r.type = 'REVERSAL' and r.reversal_of_id = t.id);

  principal_before := principal_before - principal_paid_on_effective_date;
  interest_balance := interest_balance - interest_paid_on_effective_date;
  principal_after := principal_before - p_principal_payment_vnd;
  if principal_before <= 0 or principal_after <= 0 then raise exception 'Use settlement when paying all remaining principal' using errcode = '23514'; end if;
  interest_to_settle := greatest(interest_balance, 0);

  select coalesce((select event.daily_rate_percent from public.loan_lifecycle_events event
    where event.loan_id = p_loan_id and event.event_type in ('RATE_CHANGE', 'INTEREST_RESUME') and event.effective_date <= p_effective_date
    order by event.effective_date desc, event.created_at desc, event.id desc limit 1), loan_row.initial_daily_rate_percent) into daily_rate;
  new_period_end := least(coalesce(loan_row.maturity_date, 'infinity'::date), p_effective_date + loan_row.interest_cycle_days - 1);
  new_period_days := new_period_end - p_effective_date + 1;
  new_period_interest := round(principal_after::numeric * daily_rate / 100 * new_period_days)::bigint;
  return jsonb_build_object(
    'loanId', p_loan_id::text, 'effectiveDate', p_effective_date::text, 'interestThroughDate', (p_effective_date - 1)::text,
    'principalBeforeVnd', principal_before::text, 'principalPaymentVnd', p_principal_payment_vnd::text, 'principalAfterVnd', principal_after::text,
    'interestBalanceBeforeVnd', interest_balance::text, 'interestToSettleVnd', interest_to_settle::text,
    'newPeriodStartDate', p_effective_date::text, 'newPeriodEndDate', new_period_end::text, 'newPeriodDayCount', new_period_days,
    'newPeriodInterestVnd', new_period_interest::text, 'dailyRatePercent', private.decimal_text(daily_rate)
  );
end;
$$;

create or replace function public.restructure_loan_principal(
  p_loan_id uuid, p_effective_date date, p_principal_payment_vnd bigint,
  p_expected_principal_before_vnd bigint, p_expected_interest_vnd bigint,
  p_idempotency_key text, p_note text default null, p_recalculate_through date default null
)
returns uuid language plpgsql volatile security definer set search_path = '' as $$
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
  if btrim(coalesce(p_idempotency_key, '')) = '' then raise exception 'idempotency_key is required' using errcode = '22023'; end if;
  perform 1 from public.loans where id = p_loan_id for update;
  if not found then raise exception 'Loan does not exist' using errcode = 'P0002'; end if;
  select * into existing from public.loan_principal_restructures where idempotency_key = p_idempotency_key;
  if found then
    if existing.loan_id is distinct from p_loan_id or existing.effective_date is distinct from p_effective_date
       or existing.principal_payment_vnd is distinct from p_principal_payment_vnd
       or existing.principal_before_vnd is distinct from p_expected_principal_before_vnd
       or existing.interest_settled_vnd is distinct from p_expected_interest_vnd or existing.note is distinct from p_note
    then raise exception 'Idempotency key is already used with different input' using errcode = '23505'; end if;
    return existing.id;
  end if;
  if exists (select 1 from public.transactions t where t.loan_id = p_loan_id and t.transaction_date > p_effective_date
      and t.type <> 'REVERSAL' and not exists (select 1 from public.transactions r where r.type = 'REVERSAL' and r.reversal_of_id = t.id))
     or exists (select 1 from public.loan_lifecycle_events e where e.loan_id = p_loan_id and e.effective_date >= p_effective_date
      and not exists (select 1 from public.loan_settlement_reversals sr where sr.settlement_event_id = e.id))
  then raise exception 'Later loan activity must be reversed before backdating this operation' using errcode = '23514'; end if;

  preview := public.preview_principal_restructure(p_loan_id, p_effective_date, p_principal_payment_vnd);
  principal_before := (preview ->> 'principalBeforeVnd')::bigint;
  principal_after := (preview ->> 'principalAfterVnd')::bigint;
  interest_to_settle := (preview ->> 'interestToSettleVnd')::bigint;
  if principal_before is distinct from p_expected_principal_before_vnd or interest_to_settle is distinct from p_expected_interest_vnd then
    raise exception 'Loan values changed after preview; reload before confirming' using errcode = '40001';
  end if;

  insert into public.transactions (loan_id, type, transaction_date, amount_vnd, note, idempotency_key, created_by)
    values (p_loan_id, 'PRINCIPAL_PAYMENT', p_effective_date, p_principal_payment_vnd, p_note, p_idempotency_key || ':principal', auth.uid()) returning id into principal_transaction_id;
  if interest_to_settle > 0 then
    insert into public.transactions (loan_id, type, transaction_date, amount_vnd, note, idempotency_key, created_by)
      values (p_loan_id, 'INTEREST_PAYMENT', p_effective_date, interest_to_settle, p_note, p_idempotency_key || ':interest', auth.uid()) returning id into interest_transaction_id;
  end if;
  insert into public.loan_principal_restructures (loan_id, effective_date, principal_before_vnd, principal_payment_vnd, principal_after_vnd, interest_settled_vnd, principal_transaction_id, interest_transaction_id, note, idempotency_key, created_by)
    values (p_loan_id, p_effective_date, principal_before, p_principal_payment_vnd, principal_after, interest_to_settle, principal_transaction_id, interest_transaction_id, p_note, p_idempotency_key, auth.uid()) returning id into restructure_id;
  calculation_date := greatest(p_effective_date, coalesce(p_recalculate_through, (now() at time zone 'Asia/Ho_Chi_Minh')::date));
  perform private.rebuild_loan_interest_periods(p_loan_id, calculation_date);
  return restructure_id;
end;
$$;

create or replace function public.reverse_principal_restructure(
  p_restructure_id uuid, p_reversal_date date, p_reason text, p_idempotency_key text, p_recalculate_through date default null
)
returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare
  restructure public.loan_principal_restructures%rowtype;
  existing public.loan_principal_restructure_reversals%rowtype;
  component public.transactions%rowtype;
  ledger_id uuid;
  calculation_date date;
begin
  perform private.require_writer();
  if p_reversal_date is null or btrim(coalesce(p_reason, '')) = '' or btrim(coalesce(p_idempotency_key, '')) = '' then raise exception 'reversal_date, reason and idempotency_key are required' using errcode = '22023'; end if;
  select * into strict restructure from public.loan_principal_restructures where id = p_restructure_id;
  perform 1 from public.loans where id = restructure.loan_id for update;
  select * into existing from public.loan_principal_restructure_reversals where idempotency_key = p_idempotency_key;
  if found then
    if existing.restructure_id is distinct from p_restructure_id or existing.reversal_date is distinct from p_reversal_date or existing.reason is distinct from p_reason then raise exception 'Idempotency key is already used with different input' using errcode = '23505'; end if;
    return existing.id;
  end if;
  if exists (select 1 from public.loan_principal_restructure_reversals where restructure_id = p_restructure_id) then raise exception 'This principal restructure was already reversed' using errcode = '23514'; end if;
  if p_reversal_date < restructure.effective_date then raise exception 'Reversal cannot precede the restructure date' using errcode = '23514'; end if;
  if exists (select 1 from public.transactions t where t.loan_id = restructure.loan_id and t.transaction_date > restructure.effective_date
      and t.type <> 'REVERSAL'
      and t.id is distinct from restructure.principal_transaction_id
      and t.id is distinct from restructure.interest_transaction_id
      and not exists (select 1 from public.transactions r where r.type = 'REVERSAL' and r.reversal_of_id = t.id))
     or exists (select 1 from public.loan_lifecycle_events e where e.loan_id = restructure.loan_id and e.effective_date > restructure.effective_date
      and not exists (select 1 from public.loan_settlement_reversals sr where sr.settlement_event_id = e.id))
  then raise exception 'Later loan activity must be reversed before reversing this restructure' using errcode = '23514'; end if;

  insert into public.loan_principal_restructure_reversals (restructure_id, loan_id, reversal_date, reason, idempotency_key, created_by)
    values (restructure.id, restructure.loan_id, p_reversal_date, p_reason, p_idempotency_key, auth.uid()) returning id into ledger_id;
  for component in select t.* from public.transactions t where t.id in (restructure.principal_transaction_id, restructure.interest_transaction_id) order by t.type, t.id loop
    insert into public.transactions (loan_id, type, transaction_date, amount_vnd, note, reversal_of_id, idempotency_key, created_by)
      values (restructure.loan_id, 'REVERSAL', p_reversal_date, component.amount_vnd, p_reason, component.id, p_idempotency_key || ':' || lower(component.type::text), auth.uid());
  end loop;
  calculation_date := greatest(p_reversal_date, coalesce(p_recalculate_through, (now() at time zone 'Asia/Ho_Chi_Minh')::date));
  perform private.rebuild_loan_interest_periods(restructure.loan_id, calculation_date);
  return ledger_id;
end;
$$;

-- A completed first-login mutation is a server-only operation after Auth has changed the password.
revoke all on function public.preview_principal_restructure(uuid, date, bigint) from public, anon;
revoke all on function public.restructure_loan_principal(uuid, date, bigint, bigint, bigint, text, text, date) from public, anon;
revoke all on function public.reverse_principal_restructure(uuid, date, text, text, date) from public, anon;
grant execute on function public.preview_principal_restructure(uuid, date, bigint) to authenticated, service_role;
grant execute on function public.restructure_loan_principal(uuid, date, bigint, bigint, bigint, text, text, date) to authenticated, service_role;
grant execute on function public.reverse_principal_restructure(uuid, date, text, text, date) to authenticated, service_role;

create or replace function public.register_push_subscription(
  p_endpoint text, p_p256dh text, p_auth_secret text
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare subscription_id uuid;
begin
  perform private.require_active_user();
  if btrim(coalesce(p_endpoint, '')) !~* '^https://[^/@:]+(:443)?(/|$)'
     or btrim(p_endpoint) ~* '^https://(localhost|127\.|10\.|169\.254\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|\[::1\])'
     or btrim(coalesce(p_p256dh, '')) = '' or btrim(coalesce(p_auth_secret, '')) = '' then
    raise exception 'invalid push subscription' using errcode = '22023';
  end if;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth_secret)
    values ((select auth.uid()), btrim(p_endpoint), btrim(p_p256dh), btrim(p_auth_secret))
    on conflict (endpoint) do update set p256dh = excluded.p256dh, auth_secret = excluded.auth_secret, updated_at = now()
      where public.push_subscriptions.user_id = (select auth.uid())
    returning id into subscription_id;
  if subscription_id is null then raise exception 'subscription endpoint belongs to another user' using errcode = '42501'; end if;
  return subscription_id;
end;
$$;
revoke all on function public.register_push_subscription(text, text, text) from public, anon;
grant execute on function public.register_push_subscription(text, text, text) to authenticated, service_role;

-- A failed Push attempt must remain visible to the runner and be retried within the lease policy.
comment on function public.complete_push_delivery(uuid, boolean, text) is 'Completes a delivery; failed attempts remain retryable until the bounded attempt policy is exhausted.';

create or replace function public.close_resolved_notification_deliveries(p_notification_date date)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  notification_row record;
  calculation jsonb;
  affected integer := 0;
begin
  if p_notification_date is null then raise exception 'notification_date is required' using errcode = '22023'; end if;
  for notification_row in
    select n.id, n.loan_id
    from public.notifications n
    where n.superseded_at is null and n.type = 'INTEREST_DUE' and n.read_at is null
  loop
    calculation := private.calculate_loan_json(notification_row.loan_id, p_notification_date);
    if calculation ->> 'status' in ('SETTLED', 'BAD_DEBT') or (calculation ->> 'interestBalanceVnd')::bigint <= 0 then
      update public.notifications set superseded_at = now(), updated_at = now() where id = notification_row.id and superseded_at is null;
      update public.push_deliveries set status = 'FAILED', lease_until = null, last_error = 'Obligation resolved'
        where notification_id = notification_row.id and status in ('PENDING', 'PROCESSING');
      affected := affected + 1;
    end if;
  end loop;
  return affected;
end;
$$;
revoke all on function public.close_resolved_notification_deliveries(date) from public, anon, authenticated;
grant execute on function public.close_resolved_notification_deliveries(date) to service_role;

commit;
