begin;

create or replace function private.most_recent_interest_due_date(
  p_disbursement_date date,
  p_maturity_date date,
  p_cycle_days integer,
  p_as_of_date date
)
returns date
language sql
immutable
set search_path = ''
as $$
  select case
    when p_disbursement_date is null or p_cycle_days is null or p_cycle_days <= 0
      or p_as_of_date is null or p_as_of_date < p_disbursement_date then null
    when p_maturity_date is not null and p_as_of_date >= p_maturity_date then p_maturity_date
    when p_as_of_date - p_disbursement_date + 1 < p_cycle_days then null
    else p_disbursement_date
      + ((((p_as_of_date - p_disbursement_date + 1) / p_cycle_days) * p_cycle_days) - 1)
  end
$$;

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
    due_interest := 0;
    overdue_days := 0;

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

revoke all on function public.generate_due_notifications(date) from public, anon, authenticated;
grant execute on function public.generate_due_notifications(date) to service_role;

comment on function private.most_recent_interest_due_date(date, date, integer, date) is
  'Returns the latest completed contractual interest due date on or before the business date.';

comment on function public.generate_due_notifications(date) is
  'Creates idempotent due reminders and repeats unpaid interest or overdue-principal reminders daily.';

commit;
