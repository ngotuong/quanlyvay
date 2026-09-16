begin;

-- Keep the append-only settlement reversal ledger fail-closed on fresh and upgraded instances.
revoke all on public.loan_settlement_reversals from authenticated;
grant select on public.loan_settlement_reversals to authenticated, service_role;

alter table public.notifications
  add column thread_key text,
  add column obligation_date date,
  add column revision integer not null default 1,
  add column superseded_at timestamptz,
  add column updated_at timestamptz not null default now(),
  add constraint notifications_revision_positive check (revision > 0),
  add constraint notifications_thread_key_not_blank check (thread_key is null or btrim(thread_key) <> '');

with derived as (
  select
    notification.id,
    notification.user_id,
    notification.loan_id,
    notification.type,
    coalesce(
      case
        when notification.loan_id is null then notification.notification_date
        when notification.type = 'LOAN_OVERDUE' then loan.maturity_date
        when notification.notification_date = private.next_interest_reminder_date(
          loan.disbursement_date,
          loan.maturity_date,
          loan.interest_cycle_days,
          loan.interest_reminder_offset_days,
          notification.notification_date
        ) then private.next_interest_due_date(
          loan.disbursement_date,
          loan.maturity_date,
          loan.interest_cycle_days,
          notification.notification_date
        )
        else private.most_recent_interest_due_date(
          loan.disbursement_date,
          loan.maturity_date,
          loan.interest_cycle_days,
          notification.notification_date
        )
      end,
      notification.notification_date
    ) as obligation_date
  from public.notifications as notification
  left join public.loans as loan on loan.id = notification.loan_id
), threaded as (
  select
    derived.*,
    case
      when derived.loan_id is null then 'LEGACY:' || derived.id::text
      else derived.type::text || ':' || derived.loan_id::text || ':' || derived.obligation_date::text || ':' || derived.user_id::text
    end as thread_key
  from derived
), ranked as (
  select
    threaded.*,
    row_number() over (
      partition by threaded.thread_key
      order by notification.notification_date desc, notification.created_at desc, notification.id desc
    ) as thread_rank
  from threaded
  join public.notifications as notification on notification.id = threaded.id
)
update public.notifications as notification
set thread_key = ranked.thread_key,
    obligation_date = ranked.obligation_date,
    superseded_at = case when ranked.thread_rank = 1 then null else coalesce(notification.superseded_at, now()) end,
    updated_at = notification.created_at
from ranked
where notification.id = ranked.id;

create unique index notifications_active_thread_unique
  on public.notifications (thread_key)
  where superseded_at is null and thread_key is not null;

create index notifications_user_current_idx
  on public.notifications (user_id, notification_date desc, created_at desc)
  where superseded_at is null;

alter table public.push_deliveries
  add column notification_revision integer not null default 1,
  add constraint push_deliveries_notification_revision_positive check (notification_revision > 0);

alter table public.push_deliveries
  drop constraint push_deliveries_unique_target,
  add constraint push_deliveries_unique_target_revision
    unique (notification_id, subscription_id, notification_revision);

create or replace function public.generate_due_notifications(p_notification_date date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  loan_row record;
  calculation jsonb;
  due_calculation jsonb;
  calculated_status text;
  reminder_date date;
  period_end date;
  due_interest bigint;
  payments_after_due bigint;
  overdue_days integer;
  notification_type public.notification_type;
  notification_title text;
  notification_body text;
  notification_thread_key text;
  notification_obligation_date date;
  inserted_count integer := 0;
  affected integer;
begin
  if p_notification_date is null then
    raise exception 'notification_date is required' using errcode = '22023';
  end if;

  for loan_row in
    select loan.*, counterparty.name as counterparty_name
    from public.loans as loan
    join public.counterparties as counterparty on counterparty.id = loan.counterparty_id
    where loan.disbursement_date <= p_notification_date
      and loan.status <> 'SETTLED'
    order by loan.id
  loop
    calculation := private.calculate_loan_json(loan_row.id, p_notification_date);
    calculated_status := calculation ->> 'status';
    notification_type := null;
    notification_obligation_date := null;
    due_interest := 0;
    overdue_days := 0;

    if calculated_status = 'OVERDUE' then
      notification_type := 'LOAN_OVERDUE';
      notification_obligation_date := loan_row.maturity_date;
      notification_title := 'Khoản vay đã quá hạn';
      overdue_days := greatest(p_notification_date - loan_row.maturity_date, 1);
      notification_body := loan_row.counterparty_name || ' • '
        || replace(to_char(loan_row.original_principal_vnd, 'FM999,999,999,999,990'), ',', '.')
        || E'\nGiải ngân : ' || to_char(loan_row.disbursement_date, 'DD/MM/YYYY')
        || E'\nDư gốc quá hạn : '
        || replace(to_char((calculation ->> 'principalOutstandingVnd')::bigint, 'FM999,999,999,999,990'), ',', '.')
        || E'\nQuá hạn : ' || overdue_days::text || ' ngày';
    elsif calculated_status = 'ACTIVE' then
      reminder_date := private.next_interest_reminder_date(
        loan_row.disbursement_date,
        loan_row.maturity_date,
        loan_row.interest_cycle_days,
        loan_row.interest_reminder_offset_days,
        p_notification_date
      );

      if reminder_date = p_notification_date then
        period_end := private.next_interest_due_date(
          loan_row.disbursement_date,
          loan_row.maturity_date,
          loan_row.interest_cycle_days,
          p_notification_date
        );
        due_calculation := private.calculate_loan_json(loan_row.id, period_end);
        due_interest := greatest((due_calculation ->> 'interestBalanceVnd')::bigint, 0);
      else
        period_end := private.most_recent_interest_due_date(
          loan_row.disbursement_date,
          loan_row.maturity_date,
          loan_row.interest_cycle_days,
          p_notification_date
        );

        if period_end is not null then
          due_calculation := private.calculate_loan_json(loan_row.id, period_end);

          select coalesce(sum(transaction.amount_vnd), 0)
          into payments_after_due
          from public.transactions as transaction
          where transaction.loan_id = loan_row.id
            and transaction.type = 'INTEREST_PAYMENT'
            and transaction.transaction_date > period_end
            and transaction.transaction_date <= p_notification_date
            and not exists (
              select 1
              from public.transactions as reversal
              where reversal.type = 'REVERSAL'
                and reversal.reversal_of_id = transaction.id
                and reversal.transaction_date <= p_notification_date
            );

          due_interest := greatest(
            (due_calculation ->> 'interestBalanceVnd')::bigint - payments_after_due,
            0
          );
          overdue_days := greatest(p_notification_date - period_end, 0);
        end if;
      end if;

      if due_interest > 0 then
        notification_type := 'INTEREST_DUE';
        notification_obligation_date := period_end;
        notification_title := case loan_row.direction
          when 'LENDING' then 'Đến ngày thu lãi'
          else 'Đến ngày đóng lãi'
        end;
        notification_body := loan_row.counterparty_name || ' • '
          || replace(to_char(loan_row.original_principal_vnd, 'FM999,999,999,999,990'), ',', '.')
          || E'\nGiải ngân : ' || to_char(loan_row.disbursement_date, 'DD/MM/YYYY')
          || E'\n'
          || case loan_row.direction when 'LENDING' then 'Số lãi phải thu : ' else 'Số lãi phải trả : ' end
          || replace(to_char(due_interest, 'FM999,999,999,999,990'), ',', '.')
          || case when overdue_days > 0 then E'\nQuá hạn : ' || overdue_days::text || ' ngày' else '' end;
      end if;
    end if;

    if notification_type is not null and notification_obligation_date is not null then
      for notification_thread_key in
        select notification_type::text || ':' || loan_row.id::text || ':'
          || notification_obligation_date::text || ':' || profile.user_id::text
        from public.profiles as profile
        where profile.is_active
      loop
        insert into public.notifications (
          user_id, loan_id, type, notification_date, title, body, idempotency_key,
          thread_key, obligation_date, revision, superseded_at, updated_at
        )
        values (
          split_part(notification_thread_key, ':', 4)::uuid,
          loan_row.id,
          notification_type,
          p_notification_date,
          notification_title,
          notification_body,
          notification_thread_key || ':created:' || p_notification_date::text,
          notification_thread_key,
          notification_obligation_date,
          1,
          null,
          now()
        )
        on conflict (thread_key) where superseded_at is null and thread_key is not null
        do update
        set notification_date = excluded.notification_date,
            title = excluded.title,
            body = excluded.body,
            read_at = null,
            revision = public.notifications.revision + 1,
            updated_at = now()
        where public.notifications.notification_date is distinct from excluded.notification_date
           or public.notifications.title is distinct from excluded.title
           or public.notifications.body is distinct from excluded.body;

        get diagnostics affected = row_count;
        inserted_count := inserted_count + affected;
      end loop;
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
    and superseded_at is null
    and read_at is null
    and (p_notification_ids is null or id = any(p_notification_ids));
  get diagnostics affected = row_count;
  return affected;
end;
$$;

drop function public.claim_push_deliveries(integer, smallint);

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
  notification_type public.notification_type,
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

  insert into public.push_deliveries (notification_id, subscription_id, notification_revision)
  select notification.id, subscription.id, notification.revision
  from public.notifications as notification
  join public.push_subscriptions as subscription
    on subscription.user_id = notification.user_id
   and notification.updated_at >= subscription.created_at
  join public.profiles as profile on profile.user_id = notification.user_id and profile.is_active
  where notification.read_at is null
    and notification.superseded_at is null
  on conflict on constraint push_deliveries_unique_target_revision do nothing;

  return query
  with candidates as (
    select delivery.id
    from public.push_deliveries as delivery
    join public.notifications as notification
      on notification.id = delivery.notification_id
     and notification.revision = delivery.notification_revision
     and notification.superseded_at is null
     and notification.read_at is null
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
    coalesce(notification.thread_key, notification.idempotency_key) || ':' || claimed.notification_revision::text,
    notification.type,
    (
      select count(*)::integer
      from public.notifications as unread
      where unread.user_id = notification.user_id
        and unread.superseded_at is null
        and unread.read_at is null
    )
  from claimed
  join public.notifications as notification on notification.id = claimed.notification_id
  join public.push_subscriptions as subscription on subscription.id = claimed.subscription_id;
end;
$$;

revoke all on function public.generate_due_notifications(date) from public, anon, authenticated;
grant execute on function public.generate_due_notifications(date) to service_role;
revoke all on function public.mark_notifications_read(uuid[]) from public, anon;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated, service_role;
revoke all on function public.claim_push_deliveries(integer, smallint) from public, anon, authenticated;
grant execute on function public.claim_push_deliveries(integer, smallint) to service_role;

comment on column public.notifications.thread_key is
  'Stable user/loan/type/obligation identity for the one active Notification Center card.';
comment on column public.notifications.revision is
  'Monotonic content revision used to enqueue one Push occurrence without duplicating the card.';
comment on column public.notifications.superseded_at is
  'Soft-history marker for older duplicate cards retained for audit and delivery traceability.';
comment on column public.push_deliveries.notification_revision is
  'Notification content revision delivered to this subscription.';
comment on function public.generate_due_notifications(date) is
  'Creates one active card per obligation and updates it for repeated unpaid reminders.';
comment on function public.claim_push_deliveries(integer, smallint) is
  'Claims one idempotent Push target per active notification revision and selected Vietnam delivery hour.';

commit;
