begin;

create extension if not exists pgtap with schema extensions;
select plan(15);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values (
  '20000000-0000-0000-0000-000000000110',
  'optional_maturity_owner@auth.local',
  now(),
  '{"provisioned_by_app":"true","username":"optional_maturity_owner","display_name":"Optional Maturity Owner","app_role":"OWNER"}'::jsonb
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000110', true);
set local role authenticated;

select public.create_counterparty('Đối tác không kỳ hạn', null);

select lives_ok(
  $$select public.create_loan_v2(
    (select id from public.counterparties where name = 'Đối tác không kỳ hạn'),
    'Khoản không kỳ hạn', 'LENDING'::public.loan_direction, 1000000::bigint,
    '2026-01-01'::date, null::integer, 30::smallint, 3::numeric,
    'optional-maturity-create', null
  )$$,
  'writer can create an open-ended loan'
);

select is(
  (select term_days from public.loans where name = 'Khoản không kỳ hạn'),
  null::integer,
  'open-ended loan stores no artificial term'
);
select is(
  (select maturity_date from public.loans where name = 'Khoản không kỳ hạn'),
  null::date,
  'open-ended loan has no generated maturity date'
);
select is(
  public.calculate_loan(
    (select id from public.loans where name = 'Khoản không kỳ hạn'), '2026-04-01'
  ) ->> 'status',
  'ACTIVE',
  'open-ended loan does not become overdue over time'
);
select is(
  public.get_loan_schedule_summary(
    (select id from public.loans where name = 'Khoản không kỳ hạn'),
    '2026-04-01'
  ) ->> 'nextInterestDueDate',
  '2026-04-30',
  'next interest due date keeps rolling by the selected cycle'
);
select is(
  jsonb_array_length(public.calculate_loan(
    (select id from public.loans where name = 'Khoản không kỳ hạn'),
    '2026-04-01'
  ) -> 'periods'),
  4,
  'financial engine continues creating scheduled periods without maturity'
);
select is(
  public.calculate_loan(
    (select id from public.loans where name = 'Khoản không kỳ hạn'),
    '2026-04-01'
  ) -> 'periods' -> 3 ->> 'kind',
  'SCHEDULED',
  'continued period is scheduled rather than overdue'
);

select lives_ok(
  $$select public.record_financial_transaction(
    (select id from public.loans where name = 'Khoản không kỳ hạn'),
    'INTEREST_PAYMENT', '2026-01-30', 30000, 'optional-maturity-first-interest',
    'Đóng đủ kỳ đầu', '2026-04-01'
  )$$,
  'first interest cycle can be closed normally'
);
select is(
  (select closing_interest_balance_vnd from public.interest_periods
   where loan_id = (select id from public.loans where name = 'Khoản không kỳ hạn')
     and start_date = '2026-01-01'),
  0::bigint,
  'paid historical period remains balanced'
);

select lives_ok(
  $$select public.record_lifecycle_event_v2(
    (select id from public.loans where name = 'Khoản không kỳ hạn'),
    'RATE_CHANGE', '2026-01-31', 'optional-maturity-rate-change', 1.5,
    'Giảm lãi từ kỳ tiếp theo', '2026-04-01'
  )$$,
  'rate can change from the first day of the next cycle'
);
select is(
  (select accrued_interest_vnd from public.interest_periods
   where loan_id = (select id from public.loans where name = 'Khoản không kỳ hạn')
     and start_date = '2026-01-01'),
  30000::bigint,
  'rate change does not alter the accrued interest of the earlier cycle'
);
select is(
  (select accrued_interest_vnd from public.interest_periods
   where loan_id = (select id from public.loans where name = 'Khoản không kỳ hạn')
     and start_date = '2026-01-31'),
  15000::bigint,
  'new rate applies to the following full cycle'
);

create temporary table optional_dashboard as
select public.get_dashboard('2026-04-01', 3) as value;

select is(
  (select jsonb_array_length(value -> 'overdue') from optional_dashboard),
  0,
  'dashboard does not list open-ended loans as overdue'
);
select is(
  (select value -> 'upcoming' -> 0 ->> 'dueDate' from optional_dashboard),
  '2026-04-30',
  'dashboard shows the next rolling interest due date'
);

select lives_ok(
  $$select public.correct_loan_terms(
    (select id from public.loans where name = 'Khoản không kỳ hạn')::uuid,
    'LENDING'::public.loan_direction, 1000000::bigint, '2026-01-01'::date,
    null::integer, 30::smallint, 3::numeric,
    'Xác nhận khoản vay không có ngày đáo hạn'::text, 'optional-maturity-correction'::text
  )$$,
  'controlled correction accepts an explicit no-maturity term'
);

select * from finish();
rollback;
