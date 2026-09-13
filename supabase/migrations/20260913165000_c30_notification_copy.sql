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
  overdue_days integer;
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

        if due_interest > 0 then
          notification_type := 'INTEREST_DUE';
          notification_title := case loan_row.direction
            when 'LENDING' then 'Đến ngày thu lãi'
            else 'Đến ngày đóng lãi'
          end;
          notification_body := loan_row.counterparty_name || ' • '
            || replace(to_char(loan_row.original_principal_vnd, 'FM999,999,999,999,990'), ',', '.')
            || E'\nGiải ngân : ' || to_char(loan_row.disbursement_date, 'DD/MM/YYYY')
            || E'\n'
            || case loan_row.direction when 'LENDING' then 'Số lãi phải thu : ' else 'Số lãi phải trả : ' end
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
    case notification.type
      when 'INTEREST_DUE' then
        counterparty.name || ' • '
          || replace(to_char(loan.original_principal_vnd, 'FM999,999,999,999,990'), ',', '.')
          || E'\nGiải ngân : ' || to_char(loan.disbursement_date, 'DD/MM/YYYY')
          || E'\n'
          || case loan.direction when 'LENDING' then 'Số lãi phải thu : ' else 'Số lãi phải trả : ' end
          || replace(to_char(greatest((calculation.value ->> 'interestBalanceVnd')::bigint, 0), 'FM999,999,999,999,990'), ',', '.')
      when 'LOAN_OVERDUE' then
        counterparty.name || ' • '
          || replace(to_char(loan.original_principal_vnd, 'FM999,999,999,999,990'), ',', '.')
          || E'\nGiải ngân : ' || to_char(loan.disbursement_date, 'DD/MM/YYYY')
          || E'\nDư gốc quá hạn : '
          || replace(to_char((calculation.value ->> 'principalOutstandingVnd')::bigint, 'FM999,999,999,999,990'), ',', '.')
          || E'\nQuá hạn : '
          || greatest(notification.notification_date - coalesce(loan.maturity_date, notification.notification_date), 1)::text
          || ' ngày'
    end as body
  from public.notifications as notification
  join public.loans as loan on loan.id = notification.loan_id
  join public.counterparties as counterparty on counterparty.id = loan.counterparty_id
  cross join lateral (
    select private.calculate_loan_json(
      loan.id,
      case notification.type
        when 'INTEREST_DUE' then private.next_interest_due_date(
          loan.disbursement_date,
          loan.maturity_date,
          loan.interest_cycle_days,
          notification.notification_date
        )
        else notification.notification_date
      end
    ) as value
  ) as calculation
  where notification.read_at is null
    and notification.type in ('INTEREST_DUE', 'LOAN_OVERDUE')
)
update public.notifications as notification
set body = refreshed.body
from refreshed
where refreshed.id = notification.id;

revoke all on function public.generate_due_notifications(date) from public, anon, authenticated;
grant execute on function public.generate_due_notifications(date) to service_role;

comment on function public.generate_due_notifications(date) is
  'Creates concise multiline due and overdue reminders with authoritative amounts, overdue days and stable per-user idempotency.';

commit;
