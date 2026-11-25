begin;

alter table public.push_subscriptions add column app_origin text
  check (app_origin is null or app_origin ~ '^https://[a-zA-Z0-9.-]+(:[0-9]+)?$'
    or app_origin ~ '^http://(localhost|127[.]0[.]0[.]1):[0-9]+$');

-- Diagnostic metadata only. No notification text, device endpoint or financial data.
create table public.push_receipts (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid references public.push_deliveries(id) on delete cascade,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  notification_revision integer,
  attempt integer not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  provider_result text not null default 'PENDING' check (provider_result in ('PENDING','ACCEPTED','FAILED')),
  received_at timestamptz,
  completed_at timestamptz,
  notification_result text check (notification_result in ('SUCCEEDED','FAILED','DEFERRED')),
  badge_result text check (badge_result in ('SUCCEEDED','FAILED','UNSUPPORTED','SKIPPED')),
  unique (delivery_id, attempt)
);
alter table public.push_receipts enable row level security;
revoke all on public.push_receipts from public, anon, authenticated;
grant select on public.push_receipts to service_role;

create function public.set_push_subscription_origin(p_subscription_id uuid, p_origin text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare affected integer;
begin
  perform private.require_active_user();
  if p_origin is null or (p_origin !~ '^https://[a-zA-Z0-9.-]+(:[0-9]+)?$'
    and p_origin !~ '^http://(localhost|127[.]0[.]0[.]1):[0-9]+$') then
    raise exception 'invalid origin' using errcode = '22023';
  end if;
  update public.push_subscriptions set app_origin=p_origin
    where id=p_subscription_id and user_id=(select auth.uid());
  get diagnostics affected = row_count;
  return affected=1;
end;
$$;

create function public.complete_push_receipt_provider(p_receipt_id uuid,p_result text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_result is null or p_result not in ('ACCEPTED','FAILED') then
    raise exception 'invalid result' using errcode = '22023';
  end if;
  update public.push_receipts set provider_result=p_result where id=p_receipt_id and provider_result='PENDING';
end;
$$;

create function public.prepare_push_receipt(p_delivery_id uuid, p_subscription_id uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  target record;
  receipt_id uuid;
  token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  -- Bounded retention, also invoked by the hourly worker even when no Push is due.
  perform public.prune_push_receipts();
  if p_delivery_id is not null then
    select d.subscription_id, d.notification_revision, d.attempt_count into target
    from public.push_deliveries d
    join public.notifications n on n.id = d.notification_id and n.revision = d.notification_revision
    join public.push_subscriptions s on s.id=d.subscription_id and s.user_id=n.user_id
    join public.profiles p on p.user_id = n.user_id and p.is_active
    where d.id = p_delivery_id and d.status = 'PROCESSING' and n.superseded_at is null;
    if not found then raise exception 'active delivery required' using errcode = '22023'; end if;
  else
    -- Probes are explicitly labelled, target one authenticated caller's subscription (checked
    -- by the Server Action), and never create notifications or financial transactions.
    perform pg_advisory_xact_lock(hashtextextended(p_subscription_id::text,122));
    select s.id as subscription_id, null::integer as notification_revision, 1 as attempt_count into target
    from public.push_subscriptions s join public.profiles p on p.user_id=s.user_id and p.is_active
    where s.id = p_subscription_id;
    if not found then raise exception 'active subscription required' using errcode = '22023'; end if;
    if exists (select 1 from public.push_receipts r where r.subscription_id=p_subscription_id
      and r.delivery_id is null and r.created_at > now()-interval '1 minute') then
      raise exception 'probe rate limited' using errcode = '22023';
    end if;
  end if;
  insert into public.push_receipts (delivery_id,subscription_id,notification_revision,attempt,token_hash,expires_at)
  values (p_delivery_id,target.subscription_id,target.notification_revision,target.attempt_count,
    encode(extensions.digest(token,'sha256'),'hex'),now()+interval '48 hours')
  on conflict (delivery_id,attempt) do update set token_hash=excluded.token_hash,expires_at=excluded.expires_at
  returning id into receipt_id;
  return jsonb_build_object('id',receipt_id,'token',token,'origin',
    (select app_origin from public.push_subscriptions where id=target.subscription_id));
end;
$$;

create function public.prune_push_receipts()
returns integer language plpgsql security definer set search_path = '' as $$
declare affected integer;
begin
  delete from public.push_receipts where id in (
    select id from public.push_receipts where created_at < now()-interval '30 days' order by created_at limit 1000
  );
  get diagnostics affected = row_count;
  return affected;
end;
$$;

create function public.record_push_receipt(p_token text, p_stage text,
  p_notification_result text default null, p_badge_result text default null)
returns boolean language plpgsql security definer set search_path = '' as $$
declare target public.push_receipts; affected integer;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' or p_stage is null
    or p_stage not in ('RECEIVED','COMPLETED') then return false; end if;
  if p_stage='RECEIVED' and (p_notification_result is not null or p_badge_result is not null) then return false; end if;
  if p_stage='COMPLETED' and (p_notification_result is null or p_badge_result is null
    or p_notification_result not in ('SUCCEEDED','FAILED','DEFERRED')
    or p_badge_result not in ('SUCCEEDED','FAILED','UNSUPPORTED','SKIPPED')) then return false; end if;
  select r.* into target from public.push_receipts r
  join public.push_subscriptions s on s.id=r.subscription_id
  join public.profiles p on p.user_id=s.user_id and p.is_active
  where r.token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and r.expires_at>now()
    and (r.delivery_id is null or exists (
      select 1 from public.push_deliveries d join public.notifications n on n.id=d.notification_id
      where d.id=r.delivery_id and d.subscription_id=r.subscription_id
        and n.user_id=s.user_id
        and d.notification_revision=r.notification_revision and n.revision=r.notification_revision
        and n.superseded_at is null
    )) for update of r;
  if not found then return false; end if;
  -- First result wins: retries/replays cannot overwrite diagnostic evidence or read state.
  if p_stage='RECEIVED' then
    update public.push_receipts set received_at=now() where id=target.id and received_at is null;
  else
    update public.push_receipts set received_at=coalesce(received_at,now()),completed_at=now(),
      notification_result=p_notification_result,badge_result=p_badge_result
    where id=target.id and completed_at is null;
  end if;
  get diagnostics affected = row_count;
  return affected=1;
end;
$$;

revoke all on function public.prepare_push_receipt(uuid,uuid), public.prune_push_receipts(),
  public.record_push_receipt(text,text,text,text), public.complete_push_receipt_provider(uuid,text)
  from public,anon,authenticated;
grant execute on function public.prepare_push_receipt(uuid,uuid), public.prune_push_receipts(),
  public.record_push_receipt(text,text,text,text), public.complete_push_receipt_provider(uuid,text) to service_role;
revoke all on function public.set_push_subscription_origin(uuid,text) from public,anon;
grant execute on function public.set_push_subscription_origin(uuid,text) to authenticated;
commit;
