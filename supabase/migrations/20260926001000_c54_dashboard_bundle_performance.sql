begin;

create or replace function private.get_management_flow_comparison(
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
  accrued_through_end bigint;
  accrued_before_period bigint;
  accrued_in_period bigint;
  lending_accrued bigint := 0;
  borrowing_accrued bigint := 0;
  interest_collected bigint := 0;
  interest_paid bigint := 0;
  expenses_paid bigint := 0;
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
    select loan.*
    from public.loans as loan
    where not loan.is_test_data
      and loan.disbursement_date <= p_period_end
    order by loan.id
  loop
    calculation := private.calculate_loan_json(loan_row.id, p_period_end);
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
      lending_accrued := lending_accrued + accrued_in_period;
    else
      borrowing_accrued := borrowing_accrued + accrued_in_period;
    end if;
  end loop;

  with effective as (
    select transaction.*, loan.direction
    from public.transactions as transaction
    left join public.loans as loan on loan.id = transaction.loan_id
    where (loan.id is null or not loan.is_test_data)
      and transaction.type <> 'REVERSAL'
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

  return jsonb_build_object(
    'periodStartDate', p_period_start::text,
    'periodEndDate', p_period_end::text,
    'interestCollectedVnd', interest_collected::text,
    'interestPaidVnd', interest_paid::text,
    'expensesPaidVnd', expenses_paid::text,
    'cashProfitVnd', (interest_collected - interest_paid - expenses_paid)::text,
    'lendingAccruedVnd', lending_accrued::text,
    'borrowingAccruedVnd', borrowing_accrued::text,
    'accrualProfitVnd', (lending_accrued - borrowing_accrued - expenses_paid)::text
  );
end;
$$;

create or replace function private.get_management_balance_comparison(
  p_as_of_date date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  active_lending_outstanding bigint := 0;
  bad_debt_lending_outstanding bigint := 0;
  total_lending_exposure bigint := 0;
  active_borrowing_outstanding bigint := 0;
  bad_debt_borrowing_outstanding bigint := 0;
  total_borrowing_exposure bigint := 0;
begin
  perform private.require_active_user();

  if p_as_of_date is null then
    raise exception 'as-of date is required' using errcode = '22023';
  end if;

  select
    coalesce(sum(fact.principal_outstanding_vnd) filter (
      where loan.direction = 'LENDING' and fact.calculated_status <> 'BAD_DEBT'
    ), 0)::bigint,
    coalesce(sum(fact.principal_outstanding_vnd) filter (
      where loan.direction = 'LENDING' and fact.calculated_status = 'BAD_DEBT'
    ), 0)::bigint,
    coalesce(sum(fact.principal_outstanding_vnd) filter (
      where loan.direction = 'LENDING'
    ), 0)::bigint,
    coalesce(sum(fact.principal_outstanding_vnd) filter (
      where loan.direction = 'BORROWING' and fact.calculated_status <> 'BAD_DEBT'
    ), 0)::bigint,
    coalesce(sum(fact.principal_outstanding_vnd) filter (
      where loan.direction = 'BORROWING' and fact.calculated_status = 'BAD_DEBT'
    ), 0)::bigint,
    coalesce(sum(fact.principal_outstanding_vnd) filter (
      where loan.direction = 'BORROWING'
    ), 0)::bigint
  into
    active_lending_outstanding,
    bad_debt_lending_outstanding,
    total_lending_exposure,
    active_borrowing_outstanding,
    bad_debt_borrowing_outstanding,
    total_borrowing_exposure
  from private.loan_listing_facts(p_as_of_date, null, null, null) as fact
  join public.loans as loan on loan.id = fact.loan_id
  where not loan.is_test_data
    and loan.disbursement_date <= p_as_of_date;

  return jsonb_build_object(
    'periodStartDate', p_as_of_date::text,
    'periodEndDate', p_as_of_date::text,
    'activeLendingOutstandingVnd', active_lending_outstanding::text,
    'badDebtLendingOutstandingVnd', bad_debt_lending_outstanding::text,
    'totalLendingExposureVnd', total_lending_exposure::text,
    'activeBorrowingOutstandingVnd', active_borrowing_outstanding::text,
    'badDebtBorrowingOutstandingVnd', bad_debt_borrowing_outstanding::text,
    'totalBorrowingExposureVnd', total_borrowing_exposure::text
  );
end;
$$;

create or replace function public.get_management_dashboard_bundle_v3(
  p_period_start date,
  p_period_end date,
  p_previous_start date,
  p_previous_end date,
  p_balance_start date,
  p_balance_end date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  dashboard jsonb;
  previous_dashboard jsonb;
  previous_balance_dashboard jsonb;
begin
  if p_balance_start is null or p_balance_end is null then
    raise exception 'balance start and end are required' using errcode = '22023';
  end if;
  if p_balance_start > p_balance_end then
    raise exception 'balance start cannot be after balance end' using errcode = '22007';
  end if;

  dashboard := public.get_management_dashboard(p_period_start, p_period_end);
  previous_dashboard := private.get_management_flow_comparison(p_previous_start, p_previous_end);
  previous_balance_dashboard := private.get_management_balance_comparison(p_balance_end);

  return jsonb_build_object(
    'dashboard', dashboard,
    'analytics', jsonb_build_object(
      'lendingAccruedVnd', dashboard ->> 'lendingAccruedVnd',
      'borrowingAccruedVnd', dashboard ->> 'borrowingAccruedVnd',
      'counterpartyExposure', dashboard -> 'counterpartyExposure'
    ),
    'previousDashboard', previous_dashboard,
    'previousBalanceDashboard', previous_balance_dashboard
  );
end;
$$;

revoke all on function private.get_management_flow_comparison(date,date) from public, anon, authenticated;
revoke all on function private.get_management_balance_comparison(date) from public, anon, authenticated;
grant execute on function private.get_management_flow_comparison(date,date) to service_role;
grant execute on function private.get_management_balance_comparison(date) to service_role;

revoke all on function public.get_management_dashboard_bundle_v3(date,date,date,date,date,date) from public, anon;
grant execute on function public.get_management_dashboard_bundle_v3(date,date,date,date,date,date) to authenticated, service_role;

comment on function private.get_management_flow_comparison(date,date) is
  'Exact cash and accrued-profit projection for a dashboard comparison period without unrelated schedule work.';
comment on function private.get_management_balance_comparison(date) is
  'Exact end-of-day exposure projection for dashboard balance comparison using hardened listing facts.';
comment on function public.get_management_dashboard_bundle_v3(date,date,date,date,date,date) is
  'Returns the full current dashboard plus exact flow and opening-balance comparison projections.';

commit;
