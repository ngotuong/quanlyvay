begin;

create extension if not exists pgtap with schema extensions;
select plan(31);

select has_table('public', 'loan_settlement_reversals', 'settlement reversal ledger exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.loan_settlement_reversals'::regclass),
  'settlement reversal ledger has RLS'
);
select is(has_table_privilege('authenticated', 'public.profiles', 'INSERT'), false, 'authenticated cannot insert profiles directly');
select is(has_table_privilege('authenticated', 'public.counterparties', 'INSERT'), false, 'authenticated cannot insert counterparties directly');
select is(has_table_privilege('authenticated', 'public.loans', 'UPDATE'), false, 'authenticated cannot update loans directly');
select is(has_table_privilege('authenticated', 'public.push_subscriptions', 'INSERT'), false, 'authenticated cannot insert push subscriptions directly');
select is(has_table_privilege('service_role', 'public.loan_term_corrections', 'SELECT'), true, 'Google Sync service role can export loan corrections');
select is(has_table_privilege('service_role', 'public.loan_settlement_reversals', 'SELECT'), true, 'Google Sync service role can export settlement reversals');
select is(
  has_function_privilege('authenticated', 'public.create_loan(uuid,text,public.loan_direction,bigint,date,integer,smallint,numeric,text,text)', 'EXECUTE'),
  false,
  'authenticated cannot execute the legacy create-loan RPC'
);
select is(
  has_function_privilege('authenticated', 'public.record_lifecycle_event(uuid,public.lifecycle_event_type,date,text,numeric,text,date)', 'EXECUTE'),
  false,
  'authenticated cannot execute the legacy lifecycle RPC'
);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values (
  '20000000-0000-0000-0000-000000000100',
  'c16_owner@auth.local',
  now(),
  '{"provisioned_by_app":"true","username":"c16_owner","display_name":"C16 Owner","app_role":"OWNER"}'::jsonb
);

insert into public.counterparties (id, name)
values ('21000000-0000-0000-0000-000000000100', 'Đối tác C16 constraints');

select throws_ok(
  $$insert into public.loans (counterparty_id, name, direction, original_principal_vnd, disbursement_date, term_days, interest_cycle_days, initial_daily_rate_percent) values ('21000000-0000-0000-0000-000000000100', 'Kỳ hạn quá dài', 'LENDING', 1000000, '2026-01-01', 36501, 15, 0.1)$$,
  '23514',
  null,
  'loan term is capped at one hundred years'
);
select throws_ok(
  $$insert into public.loans (counterparty_id, name, direction, original_principal_vnd, disbursement_date, term_days, interest_cycle_days, initial_daily_rate_percent) values ('21000000-0000-0000-0000-000000000100', 'Lãi kỳ quá cao', 'LENDING', 1000000, '2026-01-01', 30, 30, 4)$$,
  '23514',
  null,
  'stored daily rate cannot exceed one hundred percent per period'
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000100', true);
set local role authenticated;

select lives_ok(
  $$select public.create_loan_v2(
    '21000000-0000-0000-0000-000000000100'::uuid, 'C16 settlement'::text, 'LENDING'::public.loan_direction,
    1000000::bigint, '2026-01-01'::date, 30, 15::smallint, 1.5::numeric, 'c16-create'::text, null::text
  )$$,
  'writer creates a loan through the v2 RPC'
);
select lives_ok(
  $$select public.record_financial_transaction(
    (select id from public.loans where name = 'C16 settlement'),
    'INTEREST_PAYMENT', '2026-01-05', 1000, 'c16-ordinary-same-date', 'Thanh toán thường', '2026-01-05'
  )$$,
  'an ordinary transaction can exist on the settlement date'
);
select lives_ok(
  $$select public.settle_loan(
    (select id from public.loans where name = 'C16 settlement'),
    '2026-01-05', 'c16-settlement', 'Tất toán C16'
  )$$,
  'settlement records its exact component batch'
);
select throws_ok(
  $$select public.reverse_transaction(
    (select id from public.transactions where idempotency_key = 'c16-settlement:principal'),
    '2026-01-06', 'Không đảo lẻ tất toán', 'c16-component-reversal', '2026-01-06'
  )$$,
  '23514',
  null,
  'one settlement component cannot be reversed independently'
);
select lives_ok(
  $$select public.reverse_transaction(
    (select id from public.transactions where idempotency_key = 'c16-ordinary-same-date'),
    '2026-01-06', 'Đảo thanh toán thường', 'c16-ordinary-reversal', '2026-01-06'
  )$$,
  'an unrelated transaction on the settlement date remains reversible'
);
select lives_ok(
  $$select public.reverse_settlement(
    (select id from public.loans where name = 'C16 settlement'),
    '2026-01-06', 'Tất toán nhầm', 'c16-settlement-reversal', '2026-01-10'
  )$$,
  'the whole settlement is reversed atomically'
);
select is(
  public.calculate_loan((select id from public.loans where name = 'C16 settlement'), '2026-01-10') ->> 'status',
  'ACTIVE',
  'reversed settlement no longer closes the loan'
);
select is(
  (select count(*) from public.loan_settlement_reversals where idempotency_key = 'c16-settlement-reversal'),
  1::bigint,
  'one append-only settlement reversal record is stored'
);
select is(
  (select count(*) from public.transactions where idempotency_key like 'c16-settlement-reversal:%'),
  2::bigint,
  'the principal and interest settlement components are both reversed'
);
select lives_ok(
  $$select public.reverse_settlement(
    (select id from public.loans where name = 'C16 settlement'),
    '2026-01-06', 'Tất toán nhầm', 'c16-settlement-reversal', '2026-01-10'
  )$$,
  'settlement reversal retry is idempotent'
);
select is(
  (select count(*) from public.loan_settlement_reversals where idempotency_key = 'c16-settlement-reversal'),
  1::bigint,
  'idempotent retry does not append another reversal record'
);
select throws_ok(
  $$select public.reverse_settlement(
    (select id from public.loans where name = 'C16 settlement'),
    '2026-01-07', 'Dữ liệu khác', 'c16-settlement-reversal', '2026-01-10'
  )$$,
  '23505',
  null,
  'settlement reversal idempotency rejects different input'
);
select throws_ok(
  $$update public.loan_settlement_reversals set reason = 'Không được sửa' where idempotency_key = 'c16-settlement-reversal'$$,
  '42501',
  null,
  'authenticated has no direct settlement reversal update privilege'
);

select lives_ok(
  $$select public.create_loan_v2(
    '21000000-0000-0000-0000-000000000100'::uuid, 'C16 zero principal'::text, 'LENDING'::public.loan_direction,
    500000::bigint, '2026-02-01'::date, 30, 15::smallint, 0::numeric, 'c16-zero-create'::text, null::text
  )$$,
  'a zero-rate loan is created for the zero-principal settlement case'
);
select lives_ok(
  $$select public.record_financial_transaction(
    (select id from public.loans where name = 'C16 zero principal'),
    'PRINCIPAL_PAYMENT', '2026-02-02', 500000, 'c16-zero-principal-paid', null, '2026-02-02'
  )$$,
  'principal can be fully paid before formal settlement'
);
select lives_ok(
  $$select public.settle_loan(
    (select id from public.loans where name = 'C16 zero principal'),
    '2026-02-03', 'c16-zero-settlement', 'Chốt khoản đã hết gốc'
  )$$,
  'a loan with zero outstanding principal can still be formally settled'
);
select is(
  (select count(*) from public.transactions where idempotency_key = 'c16-zero-settlement:principal'),
  0::bigint,
  'zero-principal settlement does not create a zero-value transaction'
);
select is(
  public.calculate_loan((select id from public.loans where name = 'C16 zero principal'), '2026-02-03') ->> 'status',
  'SETTLED',
  'zero-principal settlement still closes the loan'
);
select is(
  (select count(*) from public.audit_logs where table_name = 'loan_settlement_reversals' and action = 'INSERT'),
  1::bigint,
  'settlement reversal is covered by the audit ledger'
);

select * from finish();
rollback;
