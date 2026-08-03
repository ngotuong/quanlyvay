begin;

alter table public.transactions
  drop constraint transactions_loan_presence,
  add constraint transactions_loan_presence check (
    type = 'EXPENSE'
    or (type = 'REVERSAL' and reversal_of_id is not null)
    or loan_id is not null
  );

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
  existing_category text;
  transaction_id uuid;
  normalized_note text;
  normalized_category text;
begin
  perform private.require_writer();

  if p_amount_vnd is null or p_amount_vnd <= 0 then
    raise exception 'amount_vnd must be positive' using errcode = '22023';
  end if;

  normalized_category := btrim(coalesce(p_category, ''));
  normalized_note := nullif(btrim(coalesce(p_note, '')), '');

  if normalized_category = '' then
    raise exception 'Expense category is required' using errcode = '22023';
  end if;

  if btrim(coalesce(p_idempotency_key, '')) = '' then
    raise exception 'idempotency_key is required' using errcode = '22023';
  end if;

  select * into existing from public.transactions
  where idempotency_key = p_idempotency_key;

  if found then
    select expense.category into existing_category
    from public.expenses as expense
    where expense.transaction_id = existing.id;

    if existing.type <> 'EXPENSE'
       or existing.loan_id is distinct from p_loan_id
       or existing.transaction_date is distinct from p_transaction_date
       or existing.amount_vnd is distinct from p_amount_vnd
       or existing.note is distinct from normalized_note
       or existing_category is distinct from normalized_category then
      raise exception 'Idempotency key is already used with different input'
        using errcode = '23505';
    end if;
    return existing.id;
  end if;

  insert into public.transactions (
    loan_id, type, transaction_date, amount_vnd, note, idempotency_key, created_by
  ) values (
    p_loan_id, 'EXPENSE', p_transaction_date, p_amount_vnd,
    normalized_note, p_idempotency_key, auth.uid()
  ) returning id into transaction_id;

  insert into public.expenses (transaction_id, category)
  values (transaction_id, normalized_category);

  return transaction_id;
end;
$$;

create index if not exists notifications_push_pending_idx
  on public.notifications (user_id, created_at, id)
  where read_at is null;

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

  if exists (
    select 1
    from public.loan_lifecycle_events as settlement
    where settlement.loan_id = original.loan_id
      and settlement.event_type = 'SETTLEMENT'
      and settlement.effective_date = original.transaction_date
  ) then
    raise exception 'Settlement transactions require a controlled settlement correction workflow'
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

revoke all on function public.record_expense(uuid, date, bigint, text, text, text) from public, anon;
grant execute on function public.record_expense(uuid, date, bigint, text, text, text) to authenticated, service_role;
revoke all on function public.reverse_transaction(uuid, date, text, text, date) from public, anon;
grant execute on function public.reverse_transaction(uuid, date, text, text, date) to authenticated, service_role;
revoke all on function public.claim_push_deliveries(integer) from public, anon, authenticated;
grant execute on function public.claim_push_deliveries(integer) to service_role;

comment on function public.record_expense(uuid, date, bigint, text, text, text) is
  'Idempotent expense mutation; category, note, amount, date, and loan are all part of the retry identity.';
comment on function public.reverse_transaction(uuid, date, text, text, date) is
  'Appends an immutable reversal and recalculates linked loans; general expenses require no loan rebuild.';
comment on function public.claim_push_deliveries(integer) is
  'Claims unread notifications created after each device subscription, avoiding historical Push backfill.';

commit;
