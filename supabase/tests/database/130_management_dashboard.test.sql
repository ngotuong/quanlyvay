begin;

create extension if not exists pgtap with schema extensions;
select plan(36);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values (
  '20000000-0000-0000-0000-000000000130',
  'management_dashboard_owner@auth.local',
  now(),
  '{"provisioned_by_app":"true","username":"management_dashboard_owner","display_name":"Management Dashboard Owner","app_role":"OWNER"}'::jsonb
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000130', true);
set local role authenticated;

select public.create_counterparty('Đối tác management dashboard', null);

select public.create_loan_v2(
  (select id from public.counterparties where name = 'Đối tác management dashboard'),
  'Cho vay hoạt động', 'LENDING'::public.loan_direction, 10000000::bigint, '2026-07-20'::date, null::integer, 15::smallint, 1.5::numeric,
  'management-dashboard-active-lending', null
);
select public.create_loan_v2(
  (select id from public.counterparties where name = 'Đối tác management dashboard'),
  'Cho vay nợ xấu', 'LENDING'::public.loan_direction, 5000000::bigint, '2026-07-01'::date, null::integer, 15::smallint, 1.5::numeric,
  'management-dashboard-bad-debt', null
);
select public.create_loan_v2(
  (select id from public.counterparties where name = 'Đối tác management dashboard'),
  'Đi vay hoạt động', 'BORROWING'::public.loan_direction, 4000000::bigint, '2026-07-01'::date, null::integer, 15::smallint, 0.75::numeric,
  'management-dashboard-active-borrowing', null
);

select public.record_lifecycle_event_v2(
  (select id from public.loans where name = 'Cho vay nợ xấu'),
  'BAD_DEBT_START'::public.lifecycle_event_type, '2026-07-15'::date, 'management-dashboard-mark-bad-debt', null::numeric,
  'Ngày cuối cùng còn tính lãi', '2026-08-01'::date
);

select public.record_financial_transaction(
  (select id from public.loans where name = 'Cho vay hoạt động'),
  'INTEREST_PAYMENT'::public.transaction_type, '2026-07-31'::date, 50000::bigint, 'management-dashboard-july-interest', null, '2026-08-01'::date
);
select public.record_financial_transaction(
  (select id from public.loans where name = 'Cho vay hoạt động'),
  'INTEREST_PAYMENT'::public.transaction_type, '2026-08-01'::date, 100000::bigint, 'management-dashboard-august-interest', null, '2026-08-01'::date
);
select public.record_financial_transaction(
  (select id from public.loans where name = 'Đi vay hoạt động'),
  'INTEREST_PAYMENT'::public.transaction_type, '2026-08-01'::date, 20000::bigint, 'management-dashboard-august-paid-interest', null, '2026-08-01'::date
);
select public.record_expense(
  null, '2026-08-01'::date, 10000::bigint, 'Vận hành', 'management-dashboard-august-expense', null
);

create temporary table management_dashboard_result as
select public.get_management_dashboard('2026-08-01', '2026-08-01') as value;

select is((select value ->> 'periodStartDate' from management_dashboard_result), '2026-08-01', 'period start is returned');
select is((select value ->> 'periodEndDate' from management_dashboard_result), '2026-08-01', 'period end is returned');
select is((select value ->> 'activeLendingOutstandingVnd' from management_dashboard_result), '10000000', 'active lending excludes bad debt');
select is((select value ->> 'badDebtLendingOutstandingVnd' from management_dashboard_result), '5000000', 'bad debt lending is separate');
select is((select value ->> 'totalLendingExposureVnd' from management_dashboard_result), '15000000', 'total lending exposure retains bad debt');
select is((select value ->> 'activeBorrowingOutstandingVnd' from management_dashboard_result), '4000000', 'active borrowing is returned');
select is((select value ->> 'badDebtBorrowingOutstandingVnd' from management_dashboard_result), '0', 'bad debt borrowing is separate');
select is((select value ->> 'totalBorrowingExposureVnd' from management_dashboard_result), '4000000', 'total borrowing exposure is returned');
select is((select value ->> 'interestCollectedVnd' from management_dashboard_result), '100000', 'interest collected is limited to the selected period');
select is((select value ->> 'interestPaidVnd' from management_dashboard_result), '20000', 'interest paid is limited to the selected period');
select is((select value ->> 'expensesPaidVnd' from management_dashboard_result), '10000', 'expense is limited to the selected period');
select is((select value ->> 'cashProfitVnd' from management_dashboard_result), '70000', 'cash profit is limited to the selected period');
select is((select value ->> 'accrualProfitVnd' from management_dashboard_result), '-2000', 'accrual profit uses only interest and expense in the selected period');
select is((select jsonb_array_length(value -> 'cashFlow') from management_dashboard_result), 1, 'one selected month produces one cash-flow bucket');
select is((select value -> 'cashFlow' -> 0 ->> 'month' from management_dashboard_result), '2026-08', 'cash-flow bucket uses the selected month');
select is((select value -> 'cashFlow' -> 0 ->> 'netVnd' from management_dashboard_result), '70000', 'cash flow excludes transactions outside the selected period');

create temporary table management_analytics_result as
select public.get_management_analytics('2026-08-01', '2026-08-01') as value;

select is((select value ->> 'lendingAccruedVnd' from management_analytics_result), '10000', 'analytics returns lending interest accrued in period');
select is((select value ->> 'borrowingAccruedVnd' from management_analytics_result), '2000', 'analytics returns borrowing interest accrued in period');
select is((select jsonb_array_length(value -> 'counterpartyExposure') from management_analytics_result), 1, 'analytics groups exposure by counterparty');
select is((select value -> 'counterpartyExposure' -> 0 ->> 'lendingVnd' from management_analytics_result), '10000000', 'counterparty active lending excludes bad debt');
select is((select value -> 'counterpartyExposure' -> 0 ->> 'badDebtVnd' from management_analytics_result), '5000000', 'counterparty bad debt remains visible');
select is((select value -> 'counterpartyExposure' -> 0 ->> 'borrowingVnd' from management_analytics_result), '4000000', 'counterparty borrowing remains visible');

create temporary table loan_management_summary_result as
select public.get_loan_management_summary(
  (select id from public.loans where name = 'Cho vay hoạt động'),
  '2026-08-01'
) as value;

select is((select value ->> 'totalAccruedInterestVnd' from loan_management_summary_result), '130000', 'loan summary returns authoritative accrued interest');
select is((select value ->> 'interestRecordedVnd' from loan_management_summary_result), '150000', 'loan summary returns all effective interest payments through as-of date');
select is((select value ->> 'principalRepaidVnd' from loan_management_summary_result), '0', 'loan summary returns effective principal payments');

create temporary table loan_list_result as
select public.list_loan_summaries('2026-08-01', null, null, null, null, null, 'newest') as value;

select is((select jsonb_array_length(value -> 'items') from loan_list_result), 3, 'loan list returns all matching cards in one response');
select is((select (value -> 'counts' ->> 'all')::integer from loan_list_result), 3, 'loan list returns total facet count');
select is((select (value -> 'counts' ->> 'lending')::integer from loan_list_result), 2, 'loan list counts lending loans');
select is((select (value -> 'counts' ->> 'borrowing')::integer from loan_list_result), 1, 'loan list counts borrowing loans');
select is((select value -> 'items' -> 0 ->> 'name' from loan_list_result), 'Cho vay hoạt động', 'newest sorting uses disbursement date');
select ok((select value -> 'items' -> 0 ? 'calculation' from loan_list_result), 'loan card contains authoritative calculation');
select is((select value -> 'items' -> 0 ->> 'interestRecordedVnd' from loan_list_result), '150000', 'loan card includes all effective interest recorded through as-of date');
select is(
  jsonb_array_length(public.list_loan_summaries('2026-08-01', null, 'BORROWING', null, null, null, 'newest') -> 'items'),
  1,
  'loan list applies direction filter inside RPC'
);

select ok(
  public.get_management_dashboard_bundle('2026-08-01', '2026-08-01') ?& array['dashboard', 'analytics'],
  'dashboard bundle returns KPIs and analytics in one response'
);

select ok(
  public.get_management_dashboard_bundle_v2('2026-08-01', '2026-08-01', '2026-07-31', '2026-07-31')
    ?& array['dashboard', 'analytics', 'previousDashboard'],
  'dashboard phase-three bundle includes the previous comparison period'
);

select is(
  public.get_management_dashboard_bundle_v2('2026-08-01', '2026-08-01', '2026-07-31', '2026-07-31')
    -> 'previousDashboard' ->> 'interestCollectedVnd',
  '50000',
  'previous dashboard uses the requested preceding period'
);

select * from finish();
rollback;
