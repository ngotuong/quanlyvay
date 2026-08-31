begin;

create extension if not exists pgtap with schema extensions;
select plan(21);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values (
  '20000000-0000-0000-0000-000000000090',
  'c15_owner@auth.local',
  now(),
  '{"provisioned_by_app":"true","username":"c15_owner","display_name":"C15 Owner","app_role":"OWNER"}'::jsonb
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000090', true);
set local role authenticated;

select public.create_counterparty('Đối tác C15', null);

select lives_ok(
  $$select public.create_loan_v2(
    (select id from public.counterparties where name = 'Đối tác C15'),
    null::text, 'LENDING'::public.loan_direction, 10000000::bigint, '2026-01-01'::date,
    30, 30::smallint, 3::numeric, 'c15-create', null::text
  )$$,
  'loan can be created without a manually entered name and with a period rate'
);
select is(
  (select name from public.loans where name like 'Đối tác C15%'),
  'Đối tác C15 · Cho vay · 10.000.000 ₫ · 01/01/2026',
  'blank loan name is replaced with a descriptive generated label'
);
select is(
  (select initial_daily_rate_percent from public.loans where name like 'Đối tác C15%'),
  0.1::numeric,
  'three percent per thirty-day period is stored as 0.1 percent per day'
);
select is(
  (public.get_loan_term_summary((select id from public.loans where name like 'Đối tác C15%')) ->> 'periodRatePercent'),
  '3',
  'term summary returns the period rate'
);
select is(
  (public.get_loan_term_summary((select id from public.loans where name like 'Đối tác C15%')) ->> 'fullPeriodInterestVnd'),
  '300000',
  'term summary returns authoritative full-period interest'
);

select public.record_financial_transaction(
  (select id from public.loans where name like 'Đối tác C15%'),
  'PRINCIPAL_PAYMENT', '2026-01-10', 1000000, 'c15-principal-payment', 'Trả một phần gốc', '2026-01-10'
);

select lives_ok(
  $$select public.correct_loan_terms(
    (select id from public.loans where name like 'Đối tác C15%'),
    'BORROWING'::public.loan_direction, 12000000::bigint, '2026-01-01'::date,
    60, 15::smallint, 1.5::numeric, 'Nhập nhầm dữ liệu ban đầu', 'c15-correction'
  )$$,
  'writer can correct initial terms through the controlled workflow'
);
select is(
  (select direction::text from public.loans where name like 'Đối tác C15%'),
  'BORROWING',
  'correction updates the loan direction'
);
select is(
  (select original_principal_vnd from public.loans where name like 'Đối tác C15%'),
  12000000::bigint,
  'correction updates original principal'
);
select is(
  (select term_days from public.loans where name like 'Đối tác C15%'),
  60,
  'correction updates the term'
);
select is(
  (select name from public.loans where name like 'Đối tác C15%'),
  'Đối tác C15 · Đi vay · 12.000.000 ₫ · 01/01/2026',
  'generated label follows corrected identifying terms'
);
select is(
  (select count(*) from public.transactions as disbursement
   where disbursement.loan_id = (select id from public.loans where name like 'Đối tác C15%')
     and disbursement.type = 'DISBURSEMENT'
     and not exists (
       select 1 from public.transactions as reversal
       where reversal.type = 'REVERSAL' and reversal.reversal_of_id = disbursement.id
     )),
  1::bigint,
  'correction leaves exactly one active disbursement'
);
select is(
  (select count(*) from public.transactions
   where loan_id = (select id from public.loans where name like 'Đối tác C15%')
     and type = 'REVERSAL'
     and note like 'Điều chỉnh dữ liệu ban đầu:%'),
  1::bigint,
  'correction preserves the old disbursement through a reasoned reversal'
);
select is(
  (select count(*) from public.get_audit_logs_sanitized()
   where table_name = 'loans'
     and record_id = (select id from public.loans where name like 'Đối tác C15%')
     and action = 'UPDATE'
     and old_data ->> 'original_principal_vnd' = '10000000'
     and new_data ->> 'original_principal_vnd' = '12000000'),
  1::bigint,
  'correction writes one loan update audit entry'
);
select is(
  (public.get_loan_term_summary((select id from public.loans where name like 'Đối tác C15%')) ->> 'fullPeriodInterestVnd'),
  '180000',
  'corrected full-period interest is calculated in PostgreSQL'
);
select lives_ok(
  $$select public.correct_loan_terms(
    (select id from public.loans where name like 'Đối tác C15%'),
    'BORROWING'::public.loan_direction, 12000000::bigint, '2026-01-01'::date,
    60, 15::smallint, 1.5::numeric, 'Nhập nhầm dữ liệu ban đầu', 'c15-correction'
  )$$,
  'correction retry is idempotent'
);
select is(
  (select count(*) from public.transactions where idempotency_key like 'c15-correction:%'),
  2::bigint,
  'idempotent retry does not append more correction transactions'
);
select throws_ok(
  $$select public.correct_loan_terms(
    (select id from public.loans where name like 'Đối tác C15%'),
    'BORROWING'::public.loan_direction, 12000000::bigint, '2026-01-01'::date,
    61, 15::smallint, 1.5::numeric, 'Nhập nhầm dữ liệu ban đầu', 'c15-correction'
  )$$,
  '23505',
  null,
  'correction idempotency rejects different input'
);
select throws_ok(
  $$select public.correct_loan_terms(
    (select id from public.loans where name like 'Đối tác C15%'),
    'BORROWING'::public.loan_direction, 500000::bigint, '2026-01-01'::date,
    60, 15::smallint, 1.5::numeric, 'Gốc quá thấp', 'c15-invalid-principal'
  )$$,
  '23514',
  null,
  'new principal cannot be below principal already paid'
);
select throws_ok(
  $$select public.correct_loan_terms(
    (select id from public.loans where name like 'Đối tác C15%'),
    'BORROWING'::public.loan_direction, 12000000::bigint, '2026-01-11'::date,
    60, 15::smallint, 1.5::numeric, 'Ngày quá muộn', 'c15-invalid-date'
  )$$,
  '23514',
  null,
  'new disbursement date cannot follow existing activity'
);

select public.create_loan_v2(
  (select id from public.counterparties where name = 'Đối tác C15'),
  'C15 settled'::text, 'LENDING'::public.loan_direction, 1000000::bigint,
  '2026-02-01'::date, 30, 30::smallint, 3::numeric, 'c15-settled-create', null::text
);
select public.settle_loan(
  (select id from public.loans where name = 'C15 settled'),
  '2026-02-05'::date, 'c15-settled', 'Tất toán trước khi thử sửa'
);
select throws_ok(
  $$select public.correct_loan_terms(
    (select id from public.loans where name = 'C15 settled'),
    'LENDING'::public.loan_direction, 2000000::bigint, '2026-02-01'::date,
    30, 30::smallint, 3::numeric, 'Không được sửa sau tất toán', 'c15-settled-correction'
  )$$,
  '23514',
  null,
  'settled loan cannot have its initial terms corrected'
);

reset role;
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values (
  '20000000-0000-0000-0000-000000000091',
  'c15_viewer@auth.local',
  now(),
  '{"provisioned_by_app":"true","username":"c15_viewer","display_name":"C15 Viewer","app_role":"VIEWER"}'::jsonb
);
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000091', true);
set local role authenticated;

select throws_ok(
  $$select public.correct_loan_terms(
    (select id from public.loans where name like 'Đối tác C15%'),
    'BORROWING'::public.loan_direction, 12000000::bigint, '2026-01-01'::date,
    60, 15::smallint, 1.5::numeric, 'Viewer không được sửa', 'c15-viewer-correction'
  )$$,
  '42501',
  null,
  'viewer cannot correct loan terms'
);

select * from finish();
rollback;
