begin;

create extension if not exists pgtap with schema extensions;
select plan(15);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values (
  '20000000-0000-0000-0000-000000000070',
  'dashboard_owner@auth.local',
  now(),
  '{"provisioned_by_app":"true","username":"dashboard_owner","display_name":"Dashboard Owner","app_role":"OWNER"}'::jsonb
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000070', true);
set local role authenticated;

select public.create_counterparty('Đối tác dashboard', 'Dữ liệu kiểm thử C7');

select public.create_loan_v2(
  (select id from public.counterparties where name = 'Đối tác dashboard'),
  'Cho vay sắp đến hạn', 'LENDING'::public.loan_direction, 10000000::bigint,
  '2026-07-20'::date, 30, 15::smallint, 1.5::numeric,
  'dashboard-lending', null
);

select public.create_loan_v2(
  (select id from public.counterparties where name = 'Đối tác dashboard'),
  'Đi vay quá hạn', 'BORROWING'::public.loan_direction, 4000000::bigint,
  '2026-07-01'::date, 20, 15::smallint, 0.75::numeric,
  'dashboard-borrowing', null
);

select public.record_financial_transaction(
  (select id from public.loans where name = 'Cho vay sắp đến hạn'),
  'INTEREST_PAYMENT', '2026-07-31', 100000, 'dashboard-interest-collected', 'Thu lãi', '2026-07-31'
);
select public.record_financial_transaction(
  (select id from public.loans where name = 'Đi vay quá hạn'),
  'INTEREST_PAYMENT', '2026-07-15', 20000, 'dashboard-interest-paid', 'Trả lãi', '2026-07-15'
);
select public.record_expense(
  null, '2026-07-25', 10000, 'Khác', 'dashboard-expense', 'Chi phí chung'
);

create temporary table dashboard_result as
select public.get_dashboard('2026-08-01'::date, 3) as value;

select is((select value ->> 'asOfDate' from dashboard_result), '2026-08-01', 'dashboard uses the requested business date');
select is((select value ->> 'lendingOutstandingVnd' from dashboard_result), '10000000', 'lending outstanding is aggregated');
select is((select value ->> 'borrowingOutstandingVnd' from dashboard_result), '4000000', 'borrowing outstanding is aggregated');
select is((select value ->> 'interestCollectedVnd' from dashboard_result), '100000', 'collected lending interest is aggregated');
select is((select value ->> 'interestPaidVnd' from dashboard_result), '20000', 'paid borrowing interest is aggregated');
select is((select value ->> 'expensesPaidVnd' from dashboard_result), '10000', 'expenses are aggregated');
select is((select value ->> 'cashProfitVnd' from dashboard_result), '70000', 'cash profit deducts paid interest and expenses');
select is((select jsonb_array_length(value -> 'upcoming') from dashboard_result), 1, 'one active loan is due within 30 days');
select is((select value -> 'upcoming' -> 0 ->> 'dueDate' from dashboard_result), '2026-08-03', 'next interest due date respects the 15-day cycle');
select is((select jsonb_array_length(value -> 'overdue') from dashboard_result), 1, 'one loan is overdue');
select is((select value -> 'overdue' -> 0 ->> 'name' from dashboard_result), 'Đi vay quá hạn', 'overdue list identifies the loan');
select is((select jsonb_array_length(value -> 'cashFlow') from dashboard_result), 3, 'cash flow includes the requested number of months');
select is((select value -> 'cashFlow' -> 1 ->> 'month' from dashboard_result), '2026-07', 'cash flow month ordering is chronological');
select is((select value -> 'cashFlow' -> 1 ->> 'netVnd' from dashboard_result), '-5930000', 'monthly net cash flow applies lending and borrowing directions');

reset role;
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values (
  '20000000-0000-0000-0000-000000000071',
  'dashboard_viewer@auth.local',
  now(),
  '{"provisioned_by_app":"true","username":"dashboard_viewer","display_name":"Dashboard Viewer","app_role":"VIEWER"}'::jsonb
);
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000071', true);
set local role authenticated;

select lives_ok(
  $$select public.get_dashboard('2026-08-01'::date, 6)$$,
  'viewer can read dashboard aggregates'
);

select * from finish();
rollback;
