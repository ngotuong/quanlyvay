begin;

create type public.push_delivery_status as enum ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

create table public.push_deliveries (
  id uuid primary key default extensions.gen_random_uuid(),
  notification_id uuid not null references public.notifications (id) on delete cascade,
  subscription_id uuid not null references public.push_subscriptions (id) on delete cascade,
  status public.push_delivery_status not null default 'PENDING',
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  lease_until timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  constraint push_deliveries_unique_target unique (notification_id, subscription_id),
  constraint push_deliveries_attempt_nonnegative check (attempt_count >= 0)
);

alter table public.push_deliveries enable row level security;
revoke all on public.push_deliveries from public, anon, authenticated;
grant select on public.push_deliveries to service_role;

create or replace function public.generate_due_notifications(p_notification_date date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  loan_row public.loans%rowtype;
  calculation jsonb;
  calculated_status text;
  next_due date;
  notification_type public.notification_type;
  notification_title text;
  notification_body text;
  inserted_count integer := 0;
  affected integer;
begin
  if p_notification_date is null then
    raise exception 'notification_date is required' using errcode = '22023';
  end if;

  for loan_row in
    select * from public.loans
    where disbursement_date <= p_notification_date
      and status <> 'SETTLED'
    order by id
  loop
    calculation := private.calculate_loan_json(loan_row.id, p_notification_date);
    calculated_status := calculation ->> 'status';
    notification_type := null;

    if calculated_status = 'OVERDUE' then
      notification_type := 'LOAN_OVERDUE';
      notification_title := 'Khoản vay đã quá hạn';
      notification_body := loan_row.name || ' đã quá hạn. Hãy kiểm tra tình trạng thanh toán.';
    elsif calculated_status = 'ACTIVE' then
      next_due := private.next_interest_due_date(
        loan_row.disbursement_date,
        loan_row.maturity_date,
        loan_row.interest_cycle_days,
        p_notification_date
      );
      if next_due = p_notification_date then
        notification_type := 'INTEREST_DUE';
        notification_title := 'Đến ngày đóng lãi';
        notification_body := loan_row.name || ' đến ngày đóng lãi hôm nay.';
      end if;
    end if;

    if notification_type is not null then
      insert into public.notifications (
        user_id, loan_id, type, notification_date, title, body, idempotency_key
      )
      select
        profile.user_id,
        loan_row.id,
        notification_type,
        p_notification_date,
        notification_title,
        notification_body,
        notification_type::text || ':' || loan_row.id::text || ':' || p_notification_date::text || ':' || profile.user_id::text
      from public.profiles as profile
      where profile.is_active
      on conflict (idempotency_key) do nothing;

      get diagnostics affected = row_count;
      inserted_count := inserted_count + affected;
    end if;
  end loop;

  return inserted_count;
end;
$$;

create or replace function public.mark_notifications_read(p_notification_ids uuid[] default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  perform private.require_active_user();
  update public.notifications
  set read_at = now()
  where user_id = (select auth.uid())
    and read_at is null
    and (p_notification_ids is null or id = any(p_notification_ids));
  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function public.register_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth_secret text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  subscription_id uuid;
begin
  perform private.require_active_user();
  if btrim(coalesce(p_endpoint, '')) = '' or btrim(coalesce(p_p256dh, '')) = '' or btrim(coalesce(p_auth_secret, '')) = '' then
    raise exception 'invalid push subscription' using errcode = '22023';
  end if;

  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth_secret)
  values ((select auth.uid()), p_endpoint, p_p256dh, p_auth_secret)
  on conflict (endpoint) do update
  set p256dh = excluded.p256dh,
      auth_secret = excluded.auth_secret,
      updated_at = now()
  where public.push_subscriptions.user_id = (select auth.uid())
  returning id into subscription_id;

  if subscription_id is null then
    raise exception 'subscription endpoint belongs to another user' using errcode = '42501';
  end if;
  return subscription_id;
end;
$$;

create or replace function public.remove_push_subscription(p_endpoint text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  perform private.require_active_user();
  delete from public.push_subscriptions
  where user_id = (select auth.uid()) and endpoint = p_endpoint;
  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function public.claim_push_deliveries(p_limit integer default 100)
returns table (
  delivery_id uuid,
  notification_id uuid,
  subscription_id uuid,
  endpoint text,
  p256dh text,
  auth_secret text,
  title text,
  body text,
  loan_id uuid,
  idempotency_key text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_limit < 1 or p_limit > 500 then
    raise exception 'limit must be between 1 and 500' using errcode = '22023';
  end if;

  insert into public.push_deliveries (notification_id, subscription_id)
  select notification.id, subscription.id
  from public.notifications as notification
  join public.push_subscriptions as subscription on subscription.user_id = notification.user_id
  join public.profiles as profile on profile.user_id = notification.user_id and profile.is_active
  on conflict on constraint push_deliveries_unique_target do nothing;

  return query
  with candidates as (
    select delivery.id
    from public.push_deliveries as delivery
    where (
      delivery.status in ('PENDING', 'FAILED')
      or (delivery.status = 'PROCESSING' and delivery.lease_until < now())
    )
      and delivery.attempt_count < 5
    order by delivery.created_at, delivery.id
    for update skip locked
    limit p_limit
  ), claimed as (
    update public.push_deliveries as delivery
    set status = 'PROCESSING',
        attempt_count = delivery.attempt_count + 1,
        last_attempt_at = now(),
        lease_until = now() + interval '5 minutes',
        last_error = null
    from candidates
    where delivery.id = candidates.id
    returning delivery.*
  )
  select
    claimed.id,
    notification.id,
    subscription.id,
    subscription.endpoint,
    subscription.p256dh,
    subscription.auth_secret,
    notification.title,
    notification.body,
    notification.loan_id,
    notification.idempotency_key
  from claimed
  join public.notifications as notification on notification.id = claimed.notification_id
  join public.push_subscriptions as subscription on subscription.id = claimed.subscription_id;
end;
$$;

create or replace function public.complete_push_delivery(
  p_delivery_id uuid,
  p_succeeded boolean,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.push_deliveries
  set status = case when p_succeeded then 'SENT'::public.push_delivery_status else 'FAILED'::public.push_delivery_status end,
      sent_at = case when p_succeeded then now() else null end,
      lease_until = null,
      last_error = case when p_succeeded then null else left(coalesce(p_error, 'Unknown push error'), 1000) end
  where id = p_delivery_id and status = 'PROCESSING';
end;
$$;

revoke all on function public.generate_due_notifications(date) from public, anon, authenticated;
grant execute on function public.generate_due_notifications(date) to service_role;
revoke all on function public.claim_push_deliveries(integer) from public, anon, authenticated;
grant execute on function public.claim_push_deliveries(integer) to service_role;
revoke all on function public.complete_push_delivery(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.complete_push_delivery(uuid, boolean, text) to service_role;

revoke all on function public.mark_notifications_read(uuid[]) from public, anon;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated, service_role;
revoke all on function public.register_push_subscription(text, text, text) from public, anon;
grant execute on function public.register_push_subscription(text, text, text) to authenticated, service_role;
revoke all on function public.remove_push_subscription(text) from public, anon;
grant execute on function public.remove_push_subscription(text) to authenticated, service_role;

comment on function public.generate_due_notifications(date) is 'Creates one due/overdue notification per active user and loan/day using idempotency keys.';
comment on table public.push_deliveries is 'Idempotent Web Push delivery queue. Credentials remain readable only by service_role.';

commit;
