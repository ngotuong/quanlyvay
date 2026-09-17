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
  period_end date;
  operational_due_date date;
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
      -- The operational collection date is authoritative for reminder timing,
      -- while the contractual period end remains authoritative for interest and thread identity.
      period_end := private.next_interest_due_date(
        loan_row.disbursement_date,
        loan_row.maturity_date,
        loan_row.interest_cycle_days,
        p_notification_date
      );
      operational_due_date := greatest(
        loan_row.disbursement_date,
        period_end - loan_row.interest_cycle_days + 1,
        period_end - loan_row.interest_reminder_offset_days
      );

      if operational_due_date <= p_notification_date then
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
          operational_due_date := greatest(
            loan_row.disbursement_date,
            period_end - loan_row.interest_cycle_days + 1,
            period_end - loan_row.interest_reminder_offset_days
          );
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
        end if;
      end if;

      if period_end is not null then
        overdue_days := greatest(p_notification_date - operational_due_date, 0);
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

revoke all on function public.generate_due_notifications(date) from public, anon, authenticated;
grant execute on function public.generate_due_notifications(date) to service_role;

comment on function public.generate_due_notifications(date) is
  'Refreshes one interest reminder card daily from its operational collection date, retaining contractual period-end interest and thread identity.';

commit;
