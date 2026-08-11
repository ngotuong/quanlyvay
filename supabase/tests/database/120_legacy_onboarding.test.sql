begin;

create extension if not exists pgtap with schema extensions;
select plan(25);

select has_table('public', 'legacy_loan_onboardings', 'legacy onboarding ledger exists');
select ok((select relrowsecurity from pg_class where oid = 'public.legacy_loan_onboardings'::regclass), 'legacy onboarding ledger has RLS');
select is(has_table_privilege('service_role', 'public.legacy_loan_onboardings', 'SELECT'), true, 'Google Sync service role can export onboarding snapshots');

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values (
  '20000000-0000-0000-0000-000000000120',
  'legacy_owner@auth.local', now(),
  '{"provisioned_by_app":"true","username":"legacy_owner","display_name":"Legacy Owner","app_role":"OWNER"}'::jsonb
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000120', true);
set local role authenticated;

select public.create_counterparty('Đối tác sổ cũ', null);

select lives_ok(
  $$select public.create_loan_v3(
    (select id from public.counterparties where name = 'Đối tác sổ cũ'),
    'Khoản nhắc sớm'::text, 'LENDING'::public.loan_direction, 700000000::bigint,
    '2025-03-27'::date, null::integer, 30::smallint, 3::numeric, 1::smallint,
    'legacy-reminder-create'::text, null::text
  )$$,
  'writer creates a full 30-day loan with an earlier reminder'
);

select is(
  public.get_loan_schedule_summary(
    (select id from public.loans where name = 'Khoản nhắc sớm'), '2026-08-04'
  ) ->> 'nextInterestDueDate',
  '2026-08-17',
  'legacy reminder is one day before the normal period end'
);
select is(
  public.get_loan_schedule_summary(
    (select id from public.loans where name = 'Khoản nhắc sớm'), '2026-08-04'
  ) ->> 'nextInterestPeriodEndDate',
  '2026-08-18',
  'financial period still ends on the thirtieth day'
);
select is(
  public.calculate_loan(
    (select id from public.loans where name = 'Khoản nhắc sớm'), '2025-04-25'
  ) -> 'periods' -> 0 ->> 'accruedInterestVnd',
  '21000000',
  'earlier reminder does not reduce full-cycle interest'
);

reset role;
select lives_ok(
  $$select public.generate_due_notifications('2026-08-17')$$,
  'notification generation accepts the operational reminder date'
);
set local role authenticated;
select is(
  (select count(*) from public.notifications
   where loan_id = (select id from public.loans where name = 'Khoản nhắc sớm')
     and type = 'INTEREST_DUE' and notification_date = '2026-08-17'),
  1::bigint,
  'interest reminder is generated one day early'
);
select is(
  public.get_dashboard('2026-08-04', 3) -> 'upcoming' -> 0 ->> 'dueDate',
  '2026-08-17',
  'dashboard uses the operational reminder date'
);
select is(
  public.get_dashboard('2026-08-04', 3) -> 'upcoming' -> 0 ->> 'interestVnd',
  public.calculate_loan(
    (select id from public.loans where name = 'Khoản nhắc sớm'), '2026-08-18'
  ) ->> 'interestBalanceVnd',
  'dashboard projects interest through the full period end rather than the early reminder'
);

select lives_ok(
  $$select public.update_loan_details_v2(
    (select id from public.loans where name = 'Khoản nhắc sớm'),
    (select id from public.counterparties where name = 'Đối tác sổ cũ'),
    'Khoản nhắc sớm'::text, null::text, 0::smallint
  )$$,
  'reminder lead time can be returned to the standard schedule'
);
select is(
  public.get_loan_schedule_summary(
    (select id from public.loans where name = 'Khoản nhắc sớm'), '2026-08-04'
  ) ->> 'nextInterestDueDate',
  '2026-08-18',
  'zero lead time uses the normal period end'
);

select public.create_loan_v3(
    (select id from public.counterparties where name = 'Đối tác sổ cũ'),
  'Khoản nợ xấu cũ'::text, 'LENDING'::public.loan_direction, 100000000::bigint,
  '2026-01-01'::date, null::integer, 30::smallint, 3::numeric, 0::smallint,
  'legacy-bad-debt-create'::text, null::text
);

select lives_ok(
  $$select public.onboard_legacy_loan(
    (select id from public.loans where name = 'Khoản nợ xấu cũ'),
    '2026-01-30', 80000000, 2000000, '2026-01-20',
    'Đối chiếu sổ cũ', 'legacy-bad-debt-onboard'
  )$$,
  'old bad debt is onboarded atomically from aggregate balances'
);
select is(
  (select principal_outstanding_vnd from public.legacy_loan_onboardings
   where loan_id = (select id from public.loans where name = 'Khoản nợ xấu cũ')),
  80000000::bigint,
  'opening principal is stored in the immutable ledger'
);
select is(
  (select interest_collected_vnd from public.legacy_loan_onboardings
   where loan_id = (select id from public.loans where name = 'Khoản nợ xấu cũ')),
  2000000::bigint,
  'aggregate historical interest collected remains visible'
);
select is(
  public.calculate_loan(
    (select id from public.loans where name = 'Khoản nợ xấu cũ'), '2026-01-30'
  ) ->> 'principalOutstandingVnd',
  '80000000',
  'opening principal creates one controlled aggregate principal payment'
);
select is(
  public.calculate_loan(
    (select id from public.loans where name = 'Khoản nợ xấu cũ'), '2026-01-30'
  ) ->> 'status',
  'BAD_DEBT',
  'historical bad-debt date pauses accrual and restores status'
);
select is(
  public.get_dashboard('2026-01-30', 1) ->> 'interestCollectedVnd',
  '2000000',
  'lifetime collected-interest metric includes the declared historical total'
);
select is(
  public.get_dashboard('2026-01-30', 1) -> 'cashFlow' -> 0 ->> 'inflowVnd',
  '0',
  'aggregate opening interest does not distort the cutover month cash-flow chart'
);
select is(
  (select count(*) from public.transactions
   where loan_id = (select id from public.loans where name = 'Khoản nợ xấu cũ')
     and type in ('PRINCIPAL_PAYMENT', 'INTEREST_PAYMENT')),
  2::bigint,
  'onboarding uses aggregate controlled transactions rather than one row per old cycle'
);
select throws_ok(
  $$select public.reverse_transaction(
    (select id from public.transactions where idempotency_key = 'legacy-bad-debt-onboard:interest'),
    '2026-01-31', 'Không đảo lẻ số dư mở đầu', 'legacy-onboarding-reversal', '2026-01-31'
  )$$,
  '23514', null,
  'aggregate opening components cannot be reversed independently'
);
reset role;
select throws_ok(
  $$update public.legacy_loan_onboardings set note = 'Không được sửa' where idempotency_key = 'legacy-bad-debt-onboard'$$,
  '55000', null,
  'legacy onboarding record is immutable'
);
set local role authenticated;
select throws_ok(
  $$select public.onboard_legacy_loan(
    (select id from public.loans where name = 'Khoản nợ xấu cũ'),
    '2026-01-30', 80000000, 2000000, '2026-01-20', null, 'legacy-active-reject'
  )$$,
  '23514', null,
  'legacy onboarding rejects a loan that already has generated business activity'
);
select is(
  has_function_privilege('authenticated', 'public.onboard_legacy_loan(uuid,date,bigint,bigint,date,text,text)', 'EXECUTE'),
  true,
  'authenticated writers can execute the controlled onboarding RPC'
);

select * from finish();
rollback;
