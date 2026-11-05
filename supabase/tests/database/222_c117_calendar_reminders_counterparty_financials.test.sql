begin;

create extension if not exists pgtap with schema extensions;
select plan(22);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values (
  '20000000-0000-0000-0000-000000000117',
  'c117_owner@auth.local',
  now(),
  '{"provisioned_by_app":"true","username":"c117_owner","display_name":"C117 Owner","app_role":"OWNER"}'::jsonb
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000117', true);
set local role authenticated;

select public.create_counterparty('C117 Đối tác có giao dịch', 'Kiểm thử tổng hợp authoritative');
select public.create_counterparty('C117 Đối tác chưa giao dịch', null);

select public.create_loan_v3(
  (select id from public.counterparties where name = 'C117 Đối tác có giao dịch'),
  'C117 chu kỳ 15 ngày', 'LENDING'::public.loan_direction, 10000000::bigint,
  date '2026-10-20', null::integer, 15::smallint, 1.5::numeric, 0::smallint,
  'c117-lending-15', null
);
select public.create_loan_v3(
  (select id from public.counterparties where name = 'C117 Đối tác có giao dịch'),
  'C117 chu kỳ 30 ngày', 'BORROWING'::public.loan_direction, 4000000::bigint,
  date '2026-10-10', null::integer, 30::smallint, 0.75::numeric, 0::smallint,
  'c117-borrowing-30', null
);
select public.create_loan_v3(
  (select id from public.counterparties where name = 'C117 Đối tác có giao dịch'),
  'C117 lịch tháng sau', 'LENDING'::public.loan_direction, 2000000::bigint,
  date '2026-11-20', null::integer, 15::smallint, 1.5::numeric, 0::smallint,
  'c117-december-reminder', null
);
select public.create_loan_v3(
  (select id from public.counterparties where name = 'C117 Đối tác có giao dịch'),
  'C117 dữ liệu mở sổ', 'LENDING'::public.loan_direction, 1000000::bigint,
  date '2026-01-01', null::integer, 30::smallint, 3::numeric, 0::smallint,
  'c117-legacy', null
);

select public.onboard_legacy_loan(
  (select id from public.loans where name = 'C117 dữ liệu mở sổ'),
  date '2026-10-31', 500000, 90000, date '2026-10-01',
  'Số dư mở sổ không phải dòng tiền thật', 'c117-legacy-onboarding'
);

select public.record_financial_transaction(
  (select id from public.loans where name = 'C117 chu kỳ 15 ngày'),
  'INTEREST_PAYMENT', date '2026-11-04',
  (public.calculate_loan(
    (select id from public.loans where name = 'C117 chu kỳ 15 ngày'), date '2026-11-03'
  ) ->> 'interestBalanceVnd')::bigint,
  'c117-first-cycle-paid', null, date '2026-11-04'
);
select public.record_financial_transaction(
  (select id from public.loans where name = 'C117 chu kỳ 15 ngày'),
  'PRINCIPAL_PAYMENT', date '2026-11-04', 2000000,
  'c117-principal-paid', null, date '2026-11-04'
);
select public.record_financial_transaction(
  (select id from public.loans where name = 'C117 chu kỳ 30 ngày'),
  'INTEREST_PAYMENT', date '2026-11-01', 20000,
  'c117-borrowing-interest-paid', null, date '2026-11-04'
);
select public.record_financial_transaction(
  (select id from public.loans where name = 'C117 chu kỳ 15 ngày'),
  'INTEREST_PAYMENT', date '2026-11-02', 12345,
  'c117-interest-to-reverse', null, date '2026-11-04'
);
select public.reverse_transaction(
  (select id from public.transactions where idempotency_key = 'c117-interest-to-reverse'),
  date '2026-11-02', 'Không tính giao dịch đã đảo', 'c117-interest-reversal', date '2026-11-04'
);

create temporary table c117_dashboard as
select public.get_management_dashboard_bundle_v5(
  date '2026-08-01', date '2026-08-31',
  date '2026-07-01', date '2026-07-31',
  date '2026-07-31', date '2026-07-31',
  date '2026-11-01', date '2026-11-30', date '2026-11-04'
) as value;

select is((select value -> 'dashboard' ->> 'periodEndDate' from c117_dashboard), '2026-08-31',
  'report period stays independent from the current reminder month');
select is((select value -> 'dashboard' ->> 'reminderStartDate' from c117_dashboard), '2026-11-01',
  'dashboard returns the first day of the reminder month');
select is((select value -> 'dashboard' ->> 'reminderEndDate' from c117_dashboard), '2026-11-30',
  'dashboard returns the last day of the reminder month');
select is((select jsonb_array_length(value -> 'dashboard' -> 'upcoming') from c117_dashboard), 2,
  'only one actionable reminder per active loan is returned for the month');
select is((select item ->> 'reminderDate' from c117_dashboard,
  jsonb_array_elements(value -> 'dashboard' -> 'upcoming') as item
  where item ->> 'name' = 'C117 chu kỳ 15 ngày'), '2026-11-18',
  'a paid early-month obligation advances to the next 15-day reminder in the same month');
select is((select item ->> 'periodEndDate' from c117_dashboard,
  jsonb_array_elements(value -> 'dashboard' -> 'upcoming') as item
  where item ->> 'name' = 'C117 chu kỳ 15 ngày'), '2026-11-18',
  'the advanced reminder retains its authoritative contractual period end');
select is((select item ->> 'reminderDate' from c117_dashboard,
  jsonb_array_elements(value -> 'dashboard' -> 'upcoming') as item
  where item ->> 'name' = 'C117 chu kỳ 30 ngày'), '2026-11-08',
  'the 30-day reminder remains in the current calendar month');
select ok(not exists(
  select 1 from c117_dashboard, jsonb_array_elements(value -> 'dashboard' -> 'upcoming') as item
  where item ->> 'name' = 'C117 lịch tháng sau'
), 'a December reminder is not pulled into November');
select ok((select bool_and(
  (item ->> 'reminderDate')::date between date '2026-11-01' and date '2026-11-30'
) from c117_dashboard, jsonb_array_elements(value -> 'dashboard' -> 'upcoming') as item),
  'every returned reminder belongs to the requested calendar month');
select ok((select bool_and((item ->> 'interestVnd')::bigint > 0)
  from c117_dashboard, jsonb_array_elements(value -> 'dashboard' -> 'upcoming') as item),
  'every returned reminder remains financially actionable');

create temporary table c117_counterparties as
select public.list_counterparties_with_financials(date '2026-11-04') as value;

select is((select item ->> 'lendingOutstandingVnd' from c117_counterparties,
  jsonb_array_elements(value) as item where item ->> 'name' = 'C117 Đối tác có giao dịch'), '8500000',
  'current lending principal includes the real principal payment and legacy opening balance');
select is((select item ->> 'borrowingOutstandingVnd' from c117_counterparties,
  jsonb_array_elements(value) as item where item ->> 'name' = 'C117 Đối tác có giao dịch'), '4000000',
  'current borrowing principal is grouped by counterparty');
select is((select item ->> 'interestCollectedVnd' from c117_counterparties,
  jsonb_array_elements(value) as item where item ->> 'name' = 'C117 Đối tác có giao dịch'), '150000',
  'lifetime collected interest excludes reversed and legacy onboarding components');
select is((select item ->> 'interestPaidVnd' from c117_counterparties,
  jsonb_array_elements(value) as item where item ->> 'name' = 'C117 Đối tác có giao dịch'), '20000',
  'lifetime paid interest includes effective borrowing cash flow');
select is((select concat_ws(':', item ->> 'lendingOutstandingVnd', item ->> 'borrowingOutstandingVnd', item ->> 'interestCollectedVnd', item ->> 'interestPaidVnd')
  from c117_counterparties, jsonb_array_elements(value) as item where item ->> 'name' = 'C117 Đối tác chưa giao dịch'),
  '0:0:0:0', 'counterparties without loans remain visible with explicit zero totals');

select ok(has_function_privilege('authenticated',
  'public.get_management_dashboard_bundle_v5(date,date,date,date,date,date,date,date,date)', 'EXECUTE'),
  'authenticated can execute dashboard v5');
select ok(not has_function_privilege('anon',
  'public.get_management_dashboard_bundle_v5(date,date,date,date,date,date,date,date,date)', 'EXECUTE'),
  'anon cannot execute dashboard v5');
select ok(has_function_privilege('authenticated',
  'public.list_counterparties_with_financials(date)', 'EXECUTE'),
  'authenticated can execute counterparty financial summaries');
select ok(not has_function_privilege('anon',
  'public.list_counterparties_with_financials(date)', 'EXECUTE'),
  'anon cannot execute counterparty financial summaries');

select throws_ok(
  $$select public.get_management_dashboard_bundle_v5(
    date '2026-08-01', date '2026-08-31', date '2026-07-01', date '2026-07-31',
    date '2026-07-31', date '2026-07-31', date '2026-11-02', date '2026-12-01', date '2026-11-04'
  )$$,
  '22023', null,
  'dashboard v5 rejects a rolling 30-day reminder window'
);
select is((select provolatile::text from pg_proc where oid =
  'public.get_management_dashboard_bundle_v5(date,date,date,date,date,date,date,date,date)'::regprocedure),
  's', 'dashboard v5 is stable');
select is((select provolatile::text from pg_proc where oid =
  'public.list_counterparties_with_financials(date)'::regprocedure),
  's', 'counterparty financial summary is stable');

select * from finish();
rollback;
