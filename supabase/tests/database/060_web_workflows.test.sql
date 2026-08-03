begin;

create extension if not exists pgtap with schema extensions;
select plan(20);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values (
  '20000000-0000-0000-0000-000000000060',
  'web_owner@auth.local',
  now(),
  '{"provisioned_by_app":"true","username":"web_owner","display_name":"Web Owner","app_role":"OWNER"}'::jsonb
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000060', true);
set local role authenticated;

select lives_ok(
  $$select public.create_counterparty('Nguyễn Văn A', 'Khách thử C6')$$,
  'writer can create a counterparty through RPC'
);
select is(
  (select count(*) from public.counterparties where name = 'Nguyễn Văn A'),
  1::bigint,
  'counterparty is persisted once'
);

select lives_ok(
  $$select public.create_loan(
    (select id from public.counterparties where name = 'Nguyễn Văn A'),
    'Khoản vay C6', 'LENDING'::public.loan_direction, 1000000::bigint, '2026-01-01'::date, 30, 15::smallint, 0.1::numeric,
    'web-test-loan', 'Kiểm thử workflow'
  )$$,
  'writer can atomically create a loan and disbursement'
);
select lives_ok(
  $$select public.create_loan(
    (select id from public.counterparties where name = 'Nguyễn Văn A'),
    'Khoản vay C6', 'LENDING'::public.loan_direction, 1000000::bigint, '2026-01-01'::date, 30, 15::smallint, 0.1::numeric,
    'web-test-loan', 'Kiểm thử workflow'
  )$$,
  'create loan is idempotent'
);
select is(
  (select count(*) from public.loans where name = 'Khoản vay C6'),
  1::bigint,
  'idempotent retry does not duplicate the loan'
);
select is(
  (select count(*) from public.transactions where idempotency_key = 'web-test-loan:disbursement'),
  1::bigint,
  'loan creation writes exactly one disbursement'
);
select is(
  (select amount_vnd from public.transactions where idempotency_key = 'web-test-loan:disbursement'),
  1000000::bigint,
  'disbursement equals original principal'
);

select lives_ok(
  $$select public.update_counterparty(
    (select id from public.counterparties where name = 'Nguyễn Văn A'),
    'Nguyễn Văn A cập nhật', 'Ghi chú mới'
  )$$,
  'writer can update counterparty details'
);
select lives_ok(
  $$select public.update_loan_details(
    (select id from public.loans where name = 'Khoản vay C6'),
    (select id from public.counterparties where name = 'Nguyễn Văn A cập nhật'),
    'Khoản vay C6 cập nhật', 'Ghi chú khoản vay mới'
  )$$,
  'writer can update non-financial loan details'
);

select lives_ok(
  $$select public.record_financial_transaction(
    (select id from public.loans where name = 'Khoản vay C6 cập nhật'),
    'INTEREST_PAYMENT', '2026-01-05', 10000, 'web-test-interest', 'Thu lãi', '2026-01-05'
  )$$,
  'writer can record an interest payment from web workflow'
);
select lives_ok(
  $$select public.record_expense(
    (select id from public.loans where name = 'Khoản vay C6 cập nhật'),
    '2026-01-05', 5000, 'Đi lại', 'web-test-expense', 'Chi phí gặp khách'
  )$$,
  'writer can record a linked expense'
);
select is(
  (select category from public.expenses where transaction_id = (
    select id from public.transactions where idempotency_key = 'web-test-expense'
  )),
  'Đi lại',
  'expense category is persisted'
);
select throws_ok(
  $$select public.record_expense(
    (select id from public.loans where name = 'Khoản vay C6 cập nhật'),
    '2026-01-05', 5000, 'Danh mục khác', 'web-test-expense', 'Chi phí gặp khách'
  )$$,
  '23505',
  null,
  'expense idempotency rejects a different category'
);
select lives_ok(
  $$select public.record_expense(null, '2026-01-05', 7000, 'Vận hành', 'web-test-general-expense', 'Chi phí chung')$$,
  'writer can record an expense without a loan'
);
select lives_ok(
  $$select public.reverse_transaction(
    (select id from public.transactions where idempotency_key = 'web-test-general-expense'),
    '2026-01-06', 'Đảo chi phí chung', 'web-test-general-expense-reversal', '2026-01-06'
  )$$,
  'writer can reverse a general expense without rebuilding a loan'
);

select lives_ok(
  $$select public.record_lifecycle_event(
    (select id from public.loans where name = 'Khoản vay C6 cập nhật'),
    'BAD_DEBT_START', '2026-01-06', 'web-test-bad-debt', null, 'Tạm dừng lãi', '2026-01-06'
  )$$,
  'writer can mark bad debt'
);
select is(
  (select status::text from public.loans where name = 'Khoản vay C6 cập nhật'),
  'BAD_DEBT',
  'bad debt workflow updates loan status'
);
select lives_ok(
  $$select public.record_lifecycle_event(
    (select id from public.loans where name = 'Khoản vay C6 cập nhật'),
    'INTEREST_RESUME', '2026-01-08', 'web-test-resume', 0.12, 'Tính lãi lại', '2026-01-08'
  )$$,
  'writer can resume interest with a chosen rate'
);

reset role;
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values (
  '20000000-0000-0000-0000-000000000061',
  'web_viewer@auth.local',
  now(),
  '{"provisioned_by_app":"true","username":"web_viewer","display_name":"Web Viewer","app_role":"VIEWER"}'::jsonb
);
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000061', true);
set local role authenticated;

select throws_ok(
  $$select public.create_counterparty('Không được tạo', null)$$,
  '42501',
  null,
  'viewer cannot create counterparties'
);
select throws_ok(
  $$select public.record_expense(null, '2026-01-10', 1000, 'Khác', 'viewer-expense', null)$$,
  '42501',
  null,
  'viewer cannot record expenses'
);

select * from finish();
rollback;
