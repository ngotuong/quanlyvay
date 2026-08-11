begin;

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

    if calculated_status = 'OVERDUE' then
      notification_type := 'LOAN_OVERDUE';
      notification_title := 'Khoản vay đã quá hạn';
      notification_body := loan_row.counterparty_name || ' • '
        || replace(to_char(loan_row.original_principal_vnd, 'FM999,999,999,999,990'), ',', '.') || ' • '
        || to_char(loan_row.disbursement_date, 'DD/MM/YYYY')
        || E'\nDư gốc quá hạn: '
        || replace(to_char((calculation ->> 'principalOutstandingVnd')::bigint, 'FM999,999,999,999,990'), ',', '.');
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

        if due_interest > 0 then
          notification_type := 'INTEREST_DUE';
          notification_title := case loan_row.direction
            when 'LENDING' then 'Đến ngày thu lãi'
            else 'Đến ngày đóng lãi'
          end;
          notification_body := loan_row.counterparty_name || ' • '
            || replace(to_char(loan_row.original_principal_vnd, 'FM999,999,999,999,990'), ',', '.') || ' • '
            || to_char(loan_row.disbursement_date, 'DD/MM/YYYY')
            || E'\n'
            || case loan_row.direction when 'LENDING' then 'Số tiền phải thu : ' else 'Số tiền phải trả : ' end
            || replace(to_char(due_interest, 'FM999,999,999,999,990'), ',', '.');
        end if;
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

with refreshed as (
  select
    notification.id,
    case loan.direction
      when 'LENDING' then 'Đến ngày thu lãi'
      else 'Đến ngày đóng lãi'
    end as title,
    counterparty.name || ' • '
      || replace(to_char(loan.original_principal_vnd, 'FM999,999,999,999,990'), ',', '.') || ' • '
      || to_char(loan.disbursement_date, 'DD/MM/YYYY')
      || E'\n'
      || case loan.direction when 'LENDING' then 'Số tiền phải thu : ' else 'Số tiền phải trả : ' end
      || replace(to_char(greatest((due_calculation.value ->> 'interestBalanceVnd')::bigint, 0), 'FM999,999,999,999,990'), ',', '.') as body
  from public.notifications as notification
  join public.loans as loan on loan.id = notification.loan_id
  join public.counterparties as counterparty on counterparty.id = loan.counterparty_id
  cross join lateral (
    select private.calculate_loan_json(
      loan.id,
      private.next_interest_due_date(
        loan.disbursement_date,
        loan.maturity_date,
        loan.interest_cycle_days,
        notification.notification_date
      )
    ) as value
  ) as due_calculation
  where notification.type = 'INTEREST_DUE'
    and notification.read_at is null
)
update public.notifications as notification
set title = refreshed.title,
    body = refreshed.body
from refreshed
where refreshed.id = notification.id;

drop function public.claim_push_deliveries(integer);

create function public.claim_push_deliveries(p_limit integer default 100)
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

revoke all on function public.claim_push_deliveries(integer) from public, anon, authenticated;
grant execute on function public.claim_push_deliveries(integer) to service_role;

comment on function public.generate_due_notifications(date) is
  'Creates direction-aware Vietnamese interest reminders with authoritative due amounts and stable per-user idempotency.';
comment on function public.claim_push_deliveries(integer) is
  'Claims unread post-subscription Push deliveries and returns the recipient unread count for app-icon badging.';

commit;
