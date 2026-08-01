begin;

create extension if not exists pgtap with schema extensions;
select plan(22);

insert into auth.users (id, email)
values ('10000000-0000-0000-0000-000000000001', 'constraint-owner@example.test');

insert into public.profiles (user_id, username, display_name, role, must_change_password)
values (
  '10000000-0000-0000-0000-000000000001',
  'constraint_owner',
  'Constraint Owner',
  'OWNER',
  false
);

insert into public.counterparties (id, name, created_by, updated_by)
values (
  '20000000-0000-0000-0000-000000000001',
  'Đối tác kiểm thử',
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001'
);

insert into public.loans (
  id,
  counterparty_id,
  name,
  direction,
  original_principal_vnd,
  disbursement_date,
  term_days,
  interest_cycle_days,
  initial_daily_rate_percent,
  created_by,
  updated_by
) values (
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Khoản vay kiểm thử',
  'LENDING',
  10000000,
  date '2026-01-01',
  30,
  15,
  0.1,
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001'
);

select is(
  (select maturity_date from public.loans where id = '30000000-0000-0000-0000-000000000001'),
  date '2026-01-30',
  'maturity date includes the disbursement day'
);

select throws_ok(
  $$insert into public.loans (counterparty_id, name, direction, original_principal_vnd, disbursement_date, term_days, interest_cycle_days, initial_daily_rate_percent) values ('20000000-0000-0000-0000-000000000001', 'Bad cycle', 'LENDING', 1, date '2026-01-01', 1, 20, 0.1)$$,
  '23514',
  null,
  'interest cycle must be 15 or 30 days'
);

select throws_ok(
  $$insert into public.loans (counterparty_id, name, direction, original_principal_vnd, disbursement_date, term_days, interest_cycle_days, initial_daily_rate_percent) values ('20000000-0000-0000-0000-000000000001', 'Bad principal', 'LENDING', 0, date '2026-01-01', 1, 15, 0.1)$$,
  '23514',
  null,
  'loan principal must be positive'
);

select throws_ok(
  $$insert into public.loans (counterparty_id, name, direction, original_principal_vnd, disbursement_date, term_days, interest_cycle_days, initial_daily_rate_percent) values ('20000000-0000-0000-0000-000000000001', 'Bad rate', 'LENDING', 1, date '2026-01-01', 1, 15, -0.1)$$,
  '23514',
  null,
  'daily rate cannot be negative'
);

select throws_ok(
  $$insert into public.loan_lifecycle_events (loan_id, event_type, effective_date, daily_rate_percent) values ('30000000-0000-0000-0000-000000000001', 'RATE_CHANGE', date '2025-12-31', 0.2)$$,
  '23514',
  null,
  'lifecycle event cannot precede disbursement'
);

select throws_ok(
  $$insert into public.loan_lifecycle_events (loan_id, event_type, effective_date) values ('30000000-0000-0000-0000-000000000001', 'RATE_CHANGE', date '2026-01-02')$$,
  '23514',
  null,
  'rate change requires a nonnegative rate'
);

select lives_ok(
  $$insert into public.loan_lifecycle_events (loan_id, event_type, effective_date, created_by) values ('30000000-0000-0000-0000-000000000001', 'BAD_DEBT_START', date '2026-01-10', '10000000-0000-0000-0000-000000000001')$$,
  'valid bad-debt event is accepted'
);

select throws_ok(
  $$insert into public.loan_lifecycle_events (loan_id, event_type, effective_date, daily_rate_percent) values ('30000000-0000-0000-0000-000000000001', 'INTEREST_RESUME', date '2026-01-10', 0.1)$$,
  '23505',
  null,
  'conflicting state events cannot share a date'
);

select throws_ok(
  $$insert into public.transactions (loan_id, type, transaction_date, amount_vnd, idempotency_key) values ('30000000-0000-0000-0000-000000000001', 'PRINCIPAL_PAYMENT', date '2025-12-31', 1000, 'tx-before-loan')$$,
  '23514',
  null,
  'transaction cannot precede disbursement'
);

select lives_ok(
  $$insert into public.transactions (id, loan_id, type, transaction_date, amount_vnd, idempotency_key, created_by) values ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'PRINCIPAL_PAYMENT', date '2026-01-01', 1000000, 'tx-original', '10000000-0000-0000-0000-000000000001')$$,
  'valid financial transaction is accepted'
);

select throws_ok(
  $$insert into public.expenses (transaction_id, category) values ('40000000-0000-0000-0000-000000000001', 'Sai loại')$$,
  '23514',
  null,
  'expense detail requires an expense transaction'
);

select throws_ok(
  $$insert into public.transactions (loan_id, type, transaction_date, amount_vnd, note, reversal_of_id, idempotency_key) values ('30000000-0000-0000-0000-000000000001', 'REVERSAL', date '2026-01-02', 1, 'Sai số tiền', '40000000-0000-0000-0000-000000000001', 'tx-bad-reversal')$$,
  '23514',
  null,
  'reversal amount must equal original amount'
);

select lives_ok(
  $$insert into public.transactions (id, loan_id, type, transaction_date, amount_vnd, note, reversal_of_id, idempotency_key, created_by) values ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'REVERSAL', date '2026-01-02', 1000000, 'Đảo giao dịch sai', '40000000-0000-0000-0000-000000000001', 'tx-reversal', '10000000-0000-0000-0000-000000000001')$$,
  'valid reversal is accepted'
);

select throws_ok(
  $$insert into public.transactions (loan_id, type, transaction_date, amount_vnd, note, reversal_of_id, idempotency_key) values ('30000000-0000-0000-0000-000000000001', 'REVERSAL', date '2026-01-03', 1000000, 'Không đảo reversal', '40000000-0000-0000-0000-000000000002', 'tx-reverse-reversal')$$,
  '23514',
  null,
  'a reversal cannot reverse another reversal'
);

select throws_ok(
  $$insert into public.transactions (loan_id, type, transaction_date, amount_vnd, note, reversal_of_id, idempotency_key) values ('30000000-0000-0000-0000-000000000001', 'REVERSAL', date '2026-01-03', 1000000, 'Đảo lần hai', '40000000-0000-0000-0000-000000000001', 'tx-second-reversal')$$,
  '23505',
  null,
  'an original transaction can only be reversed once'
);

select throws_ok(
  $$update public.transactions set amount_vnd = 2 where id = '40000000-0000-0000-0000-000000000001'$$,
  '55000',
  null,
  'financial transactions cannot be edited'
);

select throws_ok(
  $$delete from public.transactions where id = '40000000-0000-0000-0000-000000000001'$$,
  '55000',
  null,
  'financial transactions cannot be deleted'
);

select lives_ok(
  $$with tx as (insert into public.transactions (id, type, transaction_date, amount_vnd, idempotency_key) values ('40000000-0000-0000-0000-000000000003', 'EXPENSE', date '2026-01-05', 50000, 'tx-expense') returning id) insert into public.expenses (transaction_id, category) select id, 'Phí chuyển khoản' from tx$$,
  'expense transaction and detail are accepted atomically'
);

select throws_ok(
  $$update public.expenses set category = 'Sửa sai' where transaction_id = '40000000-0000-0000-0000-000000000003'$$,
  '55000',
  null,
  'expense detail is immutable'
);

select throws_ok(
  $$insert into public.interest_periods (loan_id, kind, start_date, end_date, day_count, opening_principal_vnd, closing_principal_vnd, opening_interest_balance_vnd, accrued_interest_vnd, interest_payments_vnd, closing_interest_balance_vnd) values ('30000000-0000-0000-0000-000000000001', 'SCHEDULED', date '2026-01-01', date '2026-01-15', 14, 10000000, 10000000, 0, 150000, 0, 150000)$$,
  '23514',
  null,
  'interest period day count must match inclusive dates'
);

select throws_ok(
  $$insert into public.notifications (user_id, type, notification_date, title, body, idempotency_key) values ('10000000-0000-0000-0000-000000000001', 'INTEREST_DUE', date '2026-01-15', 'Đến hạn', 'Nội dung', 'notify-same'), ('10000000-0000-0000-0000-000000000001', 'INTEREST_DUE', date '2026-01-15', 'Đến hạn', 'Nội dung', 'notify-same')$$,
  '23505',
  null,
  'notification idempotency keys prevent duplicates'
);

select cmp_ok(
  (select count(*) from public.audit_logs),
  '>',
  0::bigint,
  'mutations create append-only audit records'
);

select * from finish();
rollback;
