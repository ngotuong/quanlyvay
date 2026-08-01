begin;

create extension if not exists pgtap with schema extensions;
select plan(40);

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000041', 'rpc-owner@example.test'),
  ('10000000-0000-0000-0000-000000000042', 'rpc-viewer@example.test');

insert into public.profiles (user_id, username, display_name, role, is_active)
values
  ('10000000-0000-0000-0000-000000000041', 'rpc_owner', 'RPC Owner', 'OWNER', true),
  ('10000000-0000-0000-0000-000000000042', 'rpc_viewer', 'RPC Viewer', 'VIEWER', true);

insert into public.counterparties (id, name)
values ('20000000-0000-0000-0000-000000000041', 'Đối tác RPC');

insert into public.loans (
  id, counterparty_id, name, direction, original_principal_vnd,
  disbursement_date, term_days, interest_cycle_days, initial_daily_rate_percent
) values
  (
    '30000000-0000-0000-0000-000000000041',
    '20000000-0000-0000-0000-000000000041',
    'Khoản vay RPC',
    'LENDING',
    100000000,
    date '2026-08-01',
    30,
    15,
    0.1
  ),
  (
    '30000000-0000-0000-0000-000000000042',
    '20000000-0000-0000-0000-000000000041',
    'Khoản vay tất toán RPC',
    'LENDING',
    80000000,
    date '2026-08-01',
    60,
    15,
    0.075
  );

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000041', true);
set local role authenticated;

select lives_ok(
  $$select public.record_financial_transaction('30000000-0000-0000-0000-000000000041', 'PRINCIPAL_PAYMENT', date '2026-08-10', 40000000, 'rpc-principal', 'Trả gốc', date '2026-08-30')$$,
  'owner can record a principal payment through RPC'
);
select is(
  public.calculate_loan('30000000-0000-0000-0000-000000000041', date '2026-08-30') ->> 'principalOutstandingVnd',
  '60000000',
  'principal RPC updates outstanding principal from the next day'
);
select is(
  public.calculate_loan('30000000-0000-0000-0000-000000000041', date '2026-08-30') ->> 'interestBalanceVnd',
  '2200000',
  'principal RPC recalculates accrued interest'
);
select is(
  (select count(*) from public.interest_periods where loan_id = '30000000-0000-0000-0000-000000000041'),
  2::bigint,
  'recalculation persists derived interest periods'
);
select is(
  (select max(calculation_version) from public.interest_periods where loan_id = '30000000-0000-0000-0000-000000000041'),
  1,
  'first mutation persists calculation version one'
);

select lives_ok(
  $$select public.record_financial_transaction('30000000-0000-0000-0000-000000000041', 'PRINCIPAL_PAYMENT', date '2026-08-10', 40000000, 'rpc-principal', 'Trả gốc', date '2026-08-30')$$,
  'retrying the same transaction input is idempotent'
);
select is(
  (select count(*) from public.transactions where idempotency_key = 'rpc-principal'),
  1::bigint,
  'transaction retry does not create a duplicate'
);
select throws_ok(
  $$select public.record_financial_transaction('30000000-0000-0000-0000-000000000041', 'PRINCIPAL_PAYMENT', date '2026-08-10', 1, 'rpc-principal', 'Khác dữ liệu', date '2026-08-30')$$,
  '23505',
  null,
  'same idempotency key rejects different transaction input'
);
select throws_ok(
  $$select public.record_financial_transaction('30000000-0000-0000-0000-000000000041', 'PRINCIPAL_PAYMENT', date '2026-08-11', 70000000, 'rpc-overpay', null, date '2026-08-30')$$,
  '23514',
  null,
  'principal payment cannot exceed outstanding principal'
);

select lives_ok(
  $$select public.record_lifecycle_event('30000000-0000-0000-0000-000000000041', 'RATE_CHANGE', date '2026-08-20', 'rpc-rate', 0.2, 'Đổi lãi suất', date '2026-08-30')$$,
  'owner can record an effective-date rate change'
);
select is(
  public.calculate_loan('30000000-0000-0000-0000-000000000041', date '2026-08-30') ->> 'interestBalanceVnd',
  '2860000',
  'rate change and principal segments are recalculated together'
);
select lives_ok(
  $$select public.record_lifecycle_event('30000000-0000-0000-0000-000000000041', 'RATE_CHANGE', date '2026-08-20', 'rpc-rate', 0.2, 'Đổi lãi suất', date '2026-08-30')$$,
  'retrying the same lifecycle event is idempotent'
);
select is(
  (select count(*) from public.loan_lifecycle_events where idempotency_key = 'rpc-rate'),
  1::bigint,
  'lifecycle retry does not create a duplicate'
);
select throws_ok(
  $$select public.record_lifecycle_event('30000000-0000-0000-0000-000000000041', 'RATE_CHANGE', date '2026-08-20', 'rpc-rate', 0.3, 'Khác dữ liệu', date '2026-08-30')$$,
  '23505',
  null,
  'same idempotency key rejects different lifecycle input'
);

select lives_ok(
  $$select public.reverse_transaction((select id from public.transactions where idempotency_key = 'rpc-principal'), date '2026-08-12', 'Nhập nhầm trả gốc', 'rpc-reversal', date '2026-08-30')$$,
  'owner can reverse an immutable financial transaction'
);
select is(
  public.calculate_loan('30000000-0000-0000-0000-000000000041', date '2026-08-30') ->> 'principalOutstandingVnd',
  '100000000',
  'reversal restores principal history from the original effective date'
);
select is(
  public.calculate_loan('30000000-0000-0000-0000-000000000041', date '2026-08-30') ->> 'interestBalanceVnd',
  '4100000',
  'reversal recalculates all subsequent interest segments'
);
select throws_ok(
  $$select public.reverse_transaction((select id from public.transactions where idempotency_key = 'rpc-principal'), date '2026-08-13', 'Đảo lần hai', 'rpc-reversal-2', date '2026-08-30')$$,
  '23505',
  null,
  'one original transaction cannot be reversed twice'
);
select lives_ok(
  $$select public.recalculate_loan('30000000-0000-0000-0000-000000000041', date '2026-08-30')$$,
  'explicit recalculation rebuilds persisted history'
);
select is(
  (select max(calculation_version) from public.interest_periods where loan_id = '30000000-0000-0000-0000-000000000041'),
  4,
  'each successful history rebuild advances calculation version'
);

select throws_ok(
  $$select public.record_lifecycle_event('30000000-0000-0000-0000-000000000041', 'INTEREST_RESUME', date '2026-08-24', 'rpc-invalid-resume', null, null, date '2026-08-30')$$,
  '23514',
  null,
  'interest cannot resume before a bad-debt pause'
);
select lives_ok(
  $$select public.record_lifecycle_event('30000000-0000-0000-0000-000000000041', 'BAD_DEBT_START', date '2026-08-25', 'rpc-bad-debt', null, 'Tạm dừng lãi', date '2026-08-30')$$,
  'bad debt can pause interest accrual manually'
);
select lives_ok(
  $$select public.record_lifecycle_event('30000000-0000-0000-0000-000000000041', 'INTEREST_RESUME', date '2026-08-28', 'rpc-resume-old-rate', null, 'Dùng lại lãi suất cũ', date '2026-08-30')$$,
  'resume can omit a new rate and reuse the latest rate'
);
select is(
  (select daily_rate_percent from public.loan_lifecycle_events where idempotency_key = 'rpc-resume-old-rate'),
  0.2::numeric,
  'resume without a custom rate persists the latest effective rate'
);
select is(
  public.calculate_loan('30000000-0000-0000-0000-000000000041', date '2026-08-30') ->> 'status',
  'ACTIVE',
  'resumed interest returns the loan to its date-derived active status'
);

select lives_ok(
  $$select public.record_financial_transaction('30000000-0000-0000-0000-000000000042', 'INTEREST_PAYMENT', date '2026-08-15', 900000, 'rpc-settlement-prior-interest', null, date '2026-08-15')$$,
  'interest already paid before settlement is recorded separately'
);
select lives_ok(
  $$select public.settle_loan('30000000-0000-0000-0000-000000000042', date '2026-08-22', 'rpc-settlement', 'Tất toán sớm')$$,
  'settlement RPC atomically records principal and remaining interest'
);
select is(
  public.calculate_loan('30000000-0000-0000-0000-000000000042', date '2026-08-22') ->> 'status',
  'SETTLED',
  'settlement changes calculated status to SETTLED'
);
select is(
  public.calculate_loan('30000000-0000-0000-0000-000000000042', date '2026-08-22') ->> 'principalOutstandingVnd',
  '0',
  'settlement pays all outstanding principal'
);
select is(
  public.calculate_loan('30000000-0000-0000-0000-000000000042', date '2026-08-22') ->> 'interestBalanceVnd',
  '0',
  'settlement pays accrued interest through the settlement date'
);
select is(
  (select count(*) from public.transactions where loan_id = '30000000-0000-0000-0000-000000000042'),
  3::bigint,
  'settlement loan has prior interest, principal, and final interest transactions'
);
select is(
  (select count(*) from public.loan_lifecycle_events where loan_id = '30000000-0000-0000-0000-000000000042' and event_type = 'SETTLEMENT'),
  1::bigint,
  'settlement lifecycle marker is written once'
);
select is(
  (select array_agg(kind::text order by start_date) from public.interest_periods where loan_id = '30000000-0000-0000-0000-000000000042'),
  array['SCHEDULED', 'SETTLEMENT']::text[],
  'persisted final period is classified as SETTLEMENT'
);
select lives_ok(
  $$select public.settle_loan('30000000-0000-0000-0000-000000000042', date '2026-08-22', 'rpc-settlement', 'Tất toán sớm')$$,
  'settlement retry is idempotent'
);
select is(
  (select count(*) from public.transactions where loan_id = '30000000-0000-0000-0000-000000000042'),
  3::bigint,
  'settlement retry creates no duplicate transactions'
);
select throws_ok(
  $$select public.reverse_transaction((select id from public.transactions where idempotency_key = 'rpc-settlement:principal'), date '2026-08-23', 'Không đảo riêng settlement', 'rpc-settlement-reversal', date '2026-08-23')$$,
  '23514',
  null,
  'settlement components cannot be reversed independently'
);
select is(
  (select status::text from public.loans where id = '30000000-0000-0000-0000-000000000042'),
  'SETTLED',
  'persisted loan status follows authoritative settlement result'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000042', true);
set local role authenticated;

select lives_ok(
  $$select public.calculate_loan('30000000-0000-0000-0000-000000000041', date '2026-08-30')$$,
  'active viewer can read authoritative calculations'
);
select throws_ok(
  $$select public.record_financial_transaction('30000000-0000-0000-0000-000000000041', 'INTEREST_PAYMENT', date '2026-08-30', 1, 'rpc-viewer-write', null, date '2026-08-30')$$,
  '42501',
  null,
  'viewer cannot record a financial transaction through RPC'
);
select throws_ok(
  $$select public.recalculate_loan('30000000-0000-0000-0000-000000000041', date '2026-08-30')$$,
  '42501',
  null,
  'viewer cannot persist a recalculation'
);

select * from finish();
rollback;
