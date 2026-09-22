begin;

create extension if not exists pgtap with schema extensions;
select plan(27);

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000047', 'c47-owner@example.test'),
  ('10000000-0000-0000-0000-000000000048', 'c47-viewer@example.test');

insert into public.profiles (user_id, username, display_name, role, is_active)
values
  ('10000000-0000-0000-0000-000000000047', 'c47_owner', 'C47 Owner', 'OWNER', true),
  ('10000000-0000-0000-0000-000000000048', 'c47_viewer', 'C47 Viewer', 'VIEWER', true);

insert into public.counterparties (id, name)
values ('20000000-0000-0000-0000-000000000047', 'Ngân C47');

insert into public.loans (
  id, counterparty_id, name, direction, original_principal_vnd,
  disbursement_date, term_days, interest_cycle_days,
  interest_reminder_offset_days, initial_daily_rate_percent
) values (
  '30000000-0000-0000-0000-000000000047',
  '20000000-0000-0000-0000-000000000047',
  'Ngân 400 triệu', 'BORROWING', 400000000,
  date '2026-08-13', null, 30, 0, 0.07
);

insert into public.transactions (
  loan_id, type, transaction_date, amount_vnd, note, idempotency_key
) values
  ('30000000-0000-0000-0000-000000000047', 'DISBURSEMENT', date '2026-08-13', 400000000, 'Giải ngân', 'c47-disbursement'),
  ('30000000-0000-0000-0000-000000000047', 'INTEREST_PAYMENT', date '2026-09-11', 8400000, 'Đóng kỳ đầu', 'c47-first-interest');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000047', true);
set local role authenticated;

select is(
  public.preview_principal_restructure(
    '30000000-0000-0000-0000-000000000047', date '2026-09-22', 300000000
  ) ->> 'interestThroughDate',
  '2026-09-21',
  'preview closes old interest on the day before the new cycle'
);

select is(
  public.preview_principal_restructure(
    '30000000-0000-0000-0000-000000000047', date '2026-09-22', 300000000
  ) ->> 'interestToSettleVnd',
  '2800000',
  'preview calculates ten days of interest on 400 million'
);

select is(
  public.preview_principal_restructure(
    '30000000-0000-0000-0000-000000000047', date '2026-09-22', 300000000
  ) ->> 'principalAfterVnd',
  '100000000',
  'preview reports the new 100 million principal'
);

select is(
  public.preview_principal_restructure(
    '30000000-0000-0000-0000-000000000047', date '2026-09-22', 300000000
  ) ->> 'newPeriodEndDate',
  '2026-10-21',
  'preview resets the 30-day cycle on the effective date'
);

select is(
  public.preview_principal_restructure(
    '30000000-0000-0000-0000-000000000047', date '2026-09-22', 300000000
  ) ->> 'newPeriodInterestVnd',
  '2100000',
  'preview projects one full new cycle on the reduced principal'
);

select lives_ok(
  $$select public.restructure_loan_principal(
    '30000000-0000-0000-0000-000000000047', date '2026-09-22', 300000000,
    400000000, 2800000, 'c47-restructure', 'Giảm gốc và mở kỳ mới', date '2026-10-21'
  )$$,
  'owner can atomically reduce principal and reset the cycle'
);

select is(
  public.calculate_loan('30000000-0000-0000-0000-000000000047', date '2026-09-22') ->> 'principalOutstandingVnd',
  '100000000',
  'new principal applies on the effective date'
);

select is(
  public.calculate_loan('30000000-0000-0000-0000-000000000047', date '2026-09-22') ->> 'interestBalanceVnd',
  '70000',
  'effective date accrues only one day of interest on the reduced principal'
);

select is(
  public.calculate_loan('30000000-0000-0000-0000-000000000047', date '2026-10-21') ->> 'interestBalanceVnd',
  '2100000',
  'new cycle accrues exactly 2.1 million without overlap'
);

select is(
  (select count(*) from jsonb_array_elements(
    public.calculate_loan('30000000-0000-0000-0000-000000000047', date '2026-10-21') -> 'periods'
  ) as period where period ->> 'startDate' = '2026-09-12' and period ->> 'endDate' = '2026-09-21'),
  1::bigint,
  'old cycle is cut off on the day before the restructure'
);

select is(
  (select period ->> 'closingInterestBalanceVnd'
   from jsonb_array_elements(
     public.calculate_loan('30000000-0000-0000-0000-000000000047', date '2026-10-21') -> 'periods'
   ) as period
   where period ->> 'startDate' = '2026-09-12'),
  '0',
  'automated interest payment closes the old partial cycle exactly'
);

select is(
  (select period ->> 'openingPrincipalVnd'
   from jsonb_array_elements(
     public.calculate_loan('30000000-0000-0000-0000-000000000047', date '2026-10-21') -> 'periods'
   ) as period
   where period ->> 'startDate' = '2026-09-22'),
  '100000000',
  'new cycle opens on the reduced principal'
);

select is(
  public.get_loan_schedule_summary(
    '30000000-0000-0000-0000-000000000047', date '2026-09-22'
  ) ->> 'nextInterestPeriodEndDate',
  '2026-10-21',
  'loan schedule summary uses the reset anchor'
);

select is(
  (public.list_loan_summaries_page(
    date '2026-09-22', 'Ngân 400', null, null, null, null, 'newest', 1, 25
  ) #>> '{items,0,schedule,nextInterestPeriodEndDate}'),
  '2026-10-21',
  'loan card schedule uses the reset anchor'
);

select is(
  (select count(*) from public.transactions
   where loan_id = '30000000-0000-0000-0000-000000000047'
     and transaction_date = date '2026-09-22'
     and type = 'DISBURSEMENT'),
  0::bigint,
  'restructure creates no synthetic disbursement cash flow'
);

select is(
  (select sum(amount_vnd) from public.transactions
   where loan_id = '30000000-0000-0000-0000-000000000047'
     and transaction_date = date '2026-09-22'
     and type in ('PRINCIPAL_PAYMENT', 'INTEREST_PAYMENT')),
  302800000::numeric,
  'restructure records only the actual principal and interest cash flow'
);

select lives_ok(
  $$select public.restructure_loan_principal(
    '30000000-0000-0000-0000-000000000047', date '2026-09-22', 300000000,
    400000000, 2800000, 'c47-restructure', 'Giảm gốc và mở kỳ mới', date '2026-10-21'
  )$$,
  'same restructure input is idempotent'
);

select is(
  (select count(*) from public.loan_principal_restructures where idempotency_key = 'c47-restructure'),
  1::bigint,
  'idempotent retry creates one restructure ledger row'
);

select throws_ok(
  $$select public.restructure_loan_principal(
    '30000000-0000-0000-0000-000000000047', date '2026-09-22', 10000000,
    100000000, 1, 'c47-stale', 'Dữ liệu cũ', date '2026-09-23'
  )$$,
  '40001',
  null,
  'stale preview values are rejected'
);

select throws_ok(
  $$select public.reverse_transaction(
    (select principal_transaction_id from public.loan_principal_restructures where idempotency_key = 'c47-restructure'),
    date '2026-09-23', 'Không được đảo lẻ', 'c47-illegal-component-reversal', date '2026-09-23'
  )$$,
  '23514',
  null,
  'restructure components cannot be reversed independently'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000048', true);

select lives_ok(
  $$select public.preview_principal_restructure(
    '30000000-0000-0000-0000-000000000047', date '2026-09-22', 10000000
  )$$,
  'viewer can read a restructure preview'
);

select throws_ok(
  $$select public.restructure_loan_principal(
    '30000000-0000-0000-0000-000000000047', date '2026-09-22', 10000000,
    100000000, 70000, 'c47-viewer-write', null, date '2026-09-23'
  )$$,
  '42501',
  null,
  'viewer cannot execute a principal restructure'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000047', true);

select lives_ok(
  $$select public.reverse_principal_restructure(
    (select id from public.loan_principal_restructures where idempotency_key = 'c47-restructure'),
    date '2026-09-23', 'Hoàn tác kiểm thử', 'c47-restructure-reversal', date '2026-09-23'
  )$$,
  'controlled workflow reverses the full restructure'
);

select is(
  public.calculate_loan('30000000-0000-0000-0000-000000000047', date '2026-09-23') ->> 'principalOutstandingVnd',
  '400000000',
  'controlled reversal restores the original principal'
);

select is(
  public.calculate_loan('30000000-0000-0000-0000-000000000047', date '2026-09-23') ->> 'interestBalanceVnd',
  '3360000',
  'controlled reversal restores uninterrupted interest history'
);

select is(
  (select count(*) from public.loan_principal_restructure_reversals where idempotency_key = 'c47-restructure-reversal'),
  1::bigint,
  'controlled reversal writes one append-only ledger row'
);

reset role;

select ok(
  exists (
    select 1 from public.audit_logs
    where table_name = 'loan_principal_restructures'
      and record_id = (select id from public.loan_principal_restructures where idempotency_key = 'c47-restructure')
  ),
  'principal restructure is recorded in the audit log'
);

select * from finish();
rollback;
