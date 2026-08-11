begin;

create or replace function public.get_management_dashboard(
  p_period_start date,
  p_period_end date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  loan_row public.loans%rowtype;
  calculation jsonb;
  calculation_before_period jsonb;
  due_calculation jsonb;
  calculation_status text;
  principal_outstanding bigint;
  interest_balance bigint;
  accrued_through_end bigint;
  accrued_before_period bigint;
  accrued_in_period bigint;
  reminder_date date;
  upcoming_period_end date;
  active_lending_outstanding bigint := 0;
  bad_debt_lending_outstanding bigint := 0;
  total_lending_exposure bigint := 0;
  active_borrowing_outstanding bigint := 0;
  bad_debt_borrowing_outstanding bigint := 0;
  total_borrowing_exposure bigint := 0;
  lending_accrued bigint := 0;
  borrowing_accrued bigint := 0;
  projected_lending_interest bigint := 0;
  projected_borrowing_interest bigint := 0;
  interest_collected bigint := 0;
  interest_paid bigint := 0;
  expenses_paid bigint := 0;
  upcoming jsonb := '[]'::jsonb;
  overdue jsonb := '[]'::jsonb;
  cash_flow jsonb;
begin
  perform private.require_active_user();

  if p_period_start is null or p_period_end is null then
    raise exception 'period start and end are required' using errcode = '22023';
  end if;
  if p_period_start > p_period_end then
    raise exception 'period start cannot be after period end' using errcode = '22007';
  end if;
  if p_period_end - p_period_start > 1826 then
    raise exception 'dashboard period cannot exceed five years' using errcode = '22023';
  end if;

  for loan_row in
    select * from public.loans
    where disbursement_date <= p_period_end
    order by maturity_date nulls last, id
  loop
    calculation := private.calculate_loan_json(loan_row.id, p_period_end);
    calculation_status := calculation ->> 'status';
    principal_outstanding := (calculation ->> 'principalOutstandingVnd')::bigint;
    interest_balance := (calculation ->> 'interestBalanceVnd')::bigint;

    select coalesce(sum((period ->> 'accruedInterestVnd')::bigint), 0)
    into accrued_through_end
    from jsonb_array_elements(calculation -> 'periods') as period;

    accrued_before_period := 0;
    if p_period_start > loan_row.disbursement_date then
      calculation_before_period := private.calculate_loan_json(loan_row.id, p_period_start - 1);
      select coalesce(sum((period ->> 'accruedInterestVnd')::bigint), 0)
      into accrued_before_period
      from jsonb_array_elements(calculation_before_period -> 'periods') as period;
    end if;
    accrued_in_period := greatest(accrued_through_end - accrued_before_period, 0);

    if loan_row.direction = 'LENDING' then
      total_lending_exposure := total_lending_exposure + principal_outstanding;
      lending_accrued := lending_accrued + accrued_in_period;
      if calculation_status = 'BAD_DEBT' then
        bad_debt_lending_outstanding := bad_debt_lending_outstanding + principal_outstanding;
      else
        active_lending_outstanding := active_lending_outstanding + principal_outstanding;
      end if;
    else
      total_borrowing_exposure := total_borrowing_exposure + principal_outstanding;
      borrowing_accrued := borrowing_accrued + accrued_in_period;
      if calculation_status = 'BAD_DEBT' then
        bad_debt_borrowing_outstanding := bad_debt_borrowing_outstanding + principal_outstanding;
      else
        active_borrowing_outstanding := active_borrowing_outstanding + principal_outstanding;
      end if;
    end if;

    if calculation_status = 'OVERDUE' then
      overdue := overdue || jsonb_build_array(jsonb_build_object(
        'id', loan_row.id::text,
        'name', loan_row.name,
        'direction', loan_row.direction::text,
        'status', 'OVERDUE',
        'dueDate', loan_row.maturity_date::text,
        'principalVnd', principal_outstanding::text,
        'interestVnd', interest_balance::text
      ));
    elsif calculation_status = 'ACTIVE' then
      reminder_date := private.next_interest_reminder_date(
        loan_row.disbursement_date,
        loan_row.maturity_date,
        loan_row.interest_cycle_days,
        loan_row.interest_reminder_offset_days,
        p_period_end
      );
      upcoming_period_end := case when reminder_date is null then null else private.next_interest_due_date(
        loan_row.disbursement_date,
        loan_row.maturity_date,
        loan_row.interest_cycle_days,
        reminder_date
      ) end;
      due_calculation := private.calculate_loan_json(
        loan_row.id,
        coalesce(upcoming_period_end, p_period_end)
      );

      if loan_row.direction = 'LENDING' then
        projected_lending_interest := projected_lending_interest
          + greatest((due_calculation ->> 'interestBalanceVnd')::bigint, 0);
      else
        projected_borrowing_interest := projected_borrowing_interest
          + greatest((due_calculation ->> 'interestBalanceVnd')::bigint, 0);
      end if;

      if reminder_date between p_period_end and p_period_end + 30 then
        upcoming := upcoming || jsonb_build_array(jsonb_build_object(
          'id', loan_row.id::text,
          'name', loan_row.name,
          'direction', loan_row.direction::text,
          'status', 'ACTIVE',
          'dueDate', reminder_date::text,
          'principalVnd', principal_outstanding::text,
          'interestVnd', (due_calculation ->> 'interestBalanceVnd')
        ));
      end if;
    end if;
  end loop;

  with effective as (
    select transaction.*, loan.direction
    from public.transactions as transaction
    left join public.loans as loan on loan.id = transaction.loan_id
    where transaction.type <> 'REVERSAL'
      and transaction.transaction_date between p_period_start and p_period_end
      and not exists (
        select 1 from public.transactions as reversal
        where reversal.type = 'REVERSAL'
          and reversal.reversal_of_id = transaction.id
          and reversal.transaction_date <= p_period_end
      )
      and not exists (
        select 1 from private.legacy_onboarding_transactions opening
        where opening.transaction_id = transaction.id
      )
  )
  select
    coalesce(sum(effective.amount_vnd) filter (
      where effective.type = 'INTEREST_PAYMENT' and effective.direction = 'LENDING'
    ), 0),
    coalesce(sum(effective.amount_vnd) filter (
      where effective.type = 'INTEREST_PAYMENT' and effective.direction = 'BORROWING'
    ), 0),
    coalesce(sum(effective.amount_vnd) filter (where effective.type = 'EXPENSE'), 0)
  into interest_collected, interest_paid, expenses_paid
  from effective;

  with months as (
    select generate_series(
      date_trunc('month', p_period_start)::date,
      date_trunc('month', p_period_end)::date,
      interval '1 month'
    )::date as month_start
  ),
  effective as (
    select transaction.*, loan.direction
    from public.transactions as transaction
    left join public.loans as loan on loan.id = transaction.loan_id
    where transaction.type <> 'REVERSAL'
      and transaction.transaction_date between p_period_start and p_period_end
      and not exists (
        select 1 from public.transactions as reversal
        where reversal.type = 'REVERSAL'
          and reversal.reversal_of_id = transaction.id
          and reversal.transaction_date <= p_period_end
      )
      and not exists (
        select 1 from private.legacy_onboarding_transactions opening
        where opening.transaction_id = transaction.id
      )
  ),
  monthly as (
    select
      month.month_start,
      coalesce(sum(effective.amount_vnd) filter (where
        (effective.type = 'DISBURSEMENT' and effective.direction = 'BORROWING')
        or (effective.type in ('INTEREST_PAYMENT', 'PRINCIPAL_PAYMENT') and effective.direction = 'LENDING')
      ), 0)::bigint as inflow,
      coalesce(sum(effective.amount_vnd) filter (where
        effective.type = 'EXPENSE'
        or (effective.type = 'DISBURSEMENT' and effective.direction = 'LENDING')
        or (effective.type in ('INTEREST_PAYMENT', 'PRINCIPAL_PAYMENT') and effective.direction = 'BORROWING')
      ), 0)::bigint as outflow
    from months as month
    left join effective on date_trunc('month', effective.transaction_date)::date = month.month_start
    group by month.month_start
    order by month.month_start
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'month', to_char(month_start, 'YYYY-MM'),
    'inflowVnd', inflow::text,
    'outflowVnd', outflow::text,
    'netVnd', (inflow - outflow)::text
  ) order by month_start), '[]'::jsonb)
  into cash_flow
  from monthly;

  return jsonb_build_object(
    'periodStartDate', p_period_start::text,
    'periodEndDate', p_period_end::text,
    'activeLendingOutstandingVnd', active_lending_outstanding::text,
    'badDebtLendingOutstandingVnd', bad_debt_lending_outstanding::text,
    'totalLendingExposureVnd', total_lending_exposure::text,
    'activeBorrowingOutstandingVnd', active_borrowing_outstanding::text,
    'badDebtBorrowingOutstandingVnd', bad_debt_borrowing_outstanding::text,
    'totalBorrowingExposureVnd', total_borrowing_exposure::text,
    'interestCollectedVnd', interest_collected::text,
    'interestPaidVnd', interest_paid::text,
    'expensesPaidVnd', expenses_paid::text,
    'cashProfitVnd', (interest_collected - interest_paid - expenses_paid)::text,
    'accrualProfitVnd', (lending_accrued - borrowing_accrued - expenses_paid)::text,
    'projectedLendingInterestVnd', projected_lending_interest::text,
    'projectedBorrowingInterestVnd', projected_borrowing_interest::text,
    'upcoming', upcoming,
    'overdue', overdue,
    'cashFlow', cash_flow
  );
end;
$$;

revoke all on function public.get_management_dashboard(date, date) from public, anon;
grant execute on function public.get_management_dashboard(date, date) to authenticated, service_role;

comment on function public.get_management_dashboard(date, date) is
  'Period-aware management dashboard: end-date balances, in-period flows/accrual, separate bad debt exposure, and due schedules.';

commit;
