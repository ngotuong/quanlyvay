begin;

alter table public.profiles
  add column notification_delivery_hour smallint not null default 7,
  add constraint profiles_notification_delivery_hour_valid
    check (notification_delivery_hour between 0 and 23);

comment on column public.profiles.notification_delivery_hour is
  'Preferred Web Push delivery hour in Asia/Ho_Chi_Minh. An hourly scheduler invokes the worker.';

create or replace function public.update_notification_delivery_hour(p_hour smallint)
returns smallint
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_active_user()) then
    raise exception 'active user required' using errcode = '42501';
  end if;

  if p_hour is null or p_hour < 0 or p_hour > 23 then
    raise exception 'delivery hour must be between 0 and 23' using errcode = '22023';
  end if;

  update public.profiles
  set notification_delivery_hour = p_hour
  where user_id = (select auth.uid());

  return p_hour;
end;
$$;

drop function public.claim_push_deliveries(integer);

create function public.claim_push_deliveries(
  p_limit integer default 500,
  p_delivery_hour smallint default 7
)
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
  idempotency_key text,
  unread_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_limit < 1 or p_limit > 500 then
    raise exception 'limit must be between 1 and 500' using errcode = '22023';
  end if;
  if p_delivery_hour is null or p_delivery_hour < 0 or p_delivery_hour > 23 then
    raise exception 'delivery hour must be between 0 and 23' using errcode = '22023';
  end if;

  insert into public.push_deliveries (notification_id, subscription_id)
  select notification.id, subscription.id
  from public.notifications as notification
  join public.push_subscriptions as subscription
    on subscription.user_id = notification.user_id
   and notification.created_at >= subscription.created_at
  join public.profiles as profile on profile.user_id = notification.user_id and profile.is_active
  where notification.read_at is null
  on conflict on constraint push_deliveries_unique_target do nothing;

  return query
  with candidates as (
    select delivery.id
    from public.push_deliveries as delivery
    join public.notifications as notification on notification.id = delivery.notification_id
    join public.profiles as profile
      on profile.user_id = notification.user_id
     and profile.is_active
     and profile.notification_delivery_hour = p_delivery_hour
    where (
      delivery.status in ('PENDING', 'FAILED')
      or (delivery.status = 'PROCESSING' and delivery.lease_until < now())
    )
      and delivery.attempt_count < 5
    order by delivery.created_at, delivery.id
    for update of delivery skip locked
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
    notification.idempotency_key,
    (
      select count(*)::integer
      from public.notifications as unread
      where unread.user_id = notification.user_id
        and unread.read_at is null
    )
  from claimed
  join public.notifications as notification on notification.id = claimed.notification_id
  join public.push_subscriptions as subscription on subscription.id = claimed.subscription_id;
end;
$$;

revoke all on function public.update_notification_delivery_hour(smallint) from public, anon;
grant execute on function public.update_notification_delivery_hour(smallint) to authenticated;
revoke all on function public.claim_push_deliveries(integer, smallint) from public, anon, authenticated;
grant execute on function public.claim_push_deliveries(integer, smallint) to service_role;

comment on function public.update_notification_delivery_hour(smallint) is
  'Updates the current active user preferred Web Push delivery hour in Asia/Ho_Chi_Minh.';
comment on function public.claim_push_deliveries(integer, smallint) is
  'Claims every queued Push target whose active recipient selected the supplied Vietnam delivery hour.';

commit;
