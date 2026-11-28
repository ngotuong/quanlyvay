begin;
create extension if not exists pgtap with schema extensions;
create extension if not exists dblink with schema extensions;

-- Commit synthetic fixtures so the independent dblink sessions can observe them.
insert into auth.users (id,email) values
  ('10000000-0000-0000-0000-000000000123','c123-owner@example.test')
on conflict do nothing;
insert into public.profiles (user_id,username,display_name,role,is_active) values
  ('10000000-0000-0000-0000-000000000123','c123_owner','C123 Owner','OWNER',true)
on conflict do nothing;
insert into public.counterparties (id,name) values
  ('20000000-0000-0000-0000-000000000123','C123 Counterparty')
on conflict do nothing;
insert into public.loans (
  id,counterparty_id,name,direction,original_principal_vnd,disbursement_date,
  term_days,interest_cycle_days,initial_daily_rate_percent,created_by,updated_by
) values
  ('30000000-0000-0000-0000-000000000123','20000000-0000-0000-0000-000000000123',
   'C123 correction','LENDING',100000000,date '2026-11-01',90,15,0.1,
   '10000000-0000-0000-0000-000000000123','10000000-0000-0000-0000-000000000123'),
  ('30000000-0000-0000-0000-000000000124','20000000-0000-0000-0000-000000000123',
   'C123 onboarding','LENDING',120000000,date '2026-10-01',120,15,0.1,
   '10000000-0000-0000-0000-000000000123','10000000-0000-0000-0000-000000000123')
on conflict do nothing;
insert into public.transactions (
  id,loan_id,type,transaction_date,amount_vnd,note,idempotency_key,created_by
)
select fixture.*
from (values
  ('40000000-0000-0000-0000-000000000123'::uuid,'30000000-0000-0000-0000-000000000123'::uuid,
   'DISBURSEMENT'::public.transaction_type,date '2026-11-01',100000000::bigint,'C123 fixture','c123-correction-original',
   '10000000-0000-0000-0000-000000000123'::uuid),
  ('40000000-0000-0000-0000-000000000124'::uuid,'30000000-0000-0000-0000-000000000124'::uuid,
   'DISBURSEMENT'::public.transaction_type,date '2026-10-01',120000000::bigint,'C123 fixture','c123-onboarding-original',
   '10000000-0000-0000-0000-000000000123'::uuid)
) as fixture(id,loan_id,type,transaction_date,amount_vnd,note,idempotency_key,created_by)
where not exists (
  select 1 from public.transactions existing where existing.id = fixture.id
);
commit;

begin;
select plan(34);

select is(
  (select count(*) from information_schema.role_table_grants
   where table_schema='public' and grantee='anon'
     and privilege_type in ('TRUNCATE','TRIGGER','REFERENCES','MAINTAIN')),
  0::bigint,
  'anon has no non-DML capability on public tables'
);
select is(
  (select count(*) from information_schema.role_table_grants
   where table_schema='public' and grantee='authenticated'
     and privilege_type in ('TRUNCATE','TRIGGER','REFERENCES','MAINTAIN')),
  0::bigint,
  'authenticated has no non-DML capability on public tables'
);
select ok(has_table_privilege('authenticated','public.loan_term_corrections','SELECT'),'corrections remain readable');
select ok(has_table_privilege('authenticated','public.loan_settlement_reversals','SELECT'),'settlement reversals remain readable');
select ok(has_table_privilege('authenticated','public.legacy_loan_onboardings','SELECT'),'legacy onboardings remain readable');
select ok(not has_table_privilege('anon','public.loan_term_corrections','TRUNCATE'),'anon cannot truncate corrections');
select ok(not has_table_privilege('authenticated','public.loan_term_corrections','TRUNCATE'),'users cannot truncate corrections');
select ok(not has_table_privilege('anon','public.loan_settlement_reversals','TRUNCATE'),'anon cannot truncate settlement reversals');
select ok(not has_table_privilege('authenticated','public.legacy_loan_onboardings','TRUNCATE'),'users cannot truncate onboardings');
select ok(not has_function_privilege('authenticated','private.lock_idempotency_key(text,text)','EXECUTE'),'lock helper is not a public RPC');

select extensions.dblink_connect('c123a','host=db port=5432 dbname=' || current_database() || ' user=postgres password=postgres');
select extensions.dblink_connect('c123b','host=db port=5432 dbname=' || current_database() || ' user=postgres password=postgres');
-- create_loan is a legacy service-role RPC; the web paths use the authenticated
-- correction/onboarding RPCs below. Exercise each function with its real grantee.
select extensions.dblink_exec('c123a','set role service_role');
select extensions.dblink_exec('c123b','set role service_role');
select extensions.dblink_exec('c123a',format('set request.jwt.claim.sub = %L','10000000-0000-0000-0000-000000000123'));
select extensions.dblink_exec('c123b',format('set request.jwt.claim.sub = %L','10000000-0000-0000-0000-000000000123'));

create temporary table c123_results(operation text, connection text, result uuid);

select pg_advisory_lock(hashtextextended('create_loan:c123-create',123));
select is(extensions.dblink_send_query('c123a',$q$select public.create_loan(
  '20000000-0000-0000-0000-000000000123'::uuid,null::text,'LENDING'::public.loan_direction,
  90000000::bigint,date '2026-11-10',60::integer,15::smallint,0.1::numeric,
  'c123-create'::text,'Concurrent create'::text)$q$),1,'first create request started');
select is(extensions.dblink_send_query('c123b',$q$select public.create_loan(
  '20000000-0000-0000-0000-000000000123'::uuid,null::text,'LENDING'::public.loan_direction,
  90000000::bigint,date '2026-11-10',60::integer,15::smallint,0.1::numeric,
  'c123-create'::text,'Concurrent create'::text)$q$),1,'second create request started');
select pg_advisory_unlock(hashtextextended('create_loan:c123-create',123));
insert into c123_results select 'create','a',id from extensions.dblink_get_result('c123a') as result(id uuid);
insert into c123_results select 'create','b',id from extensions.dblink_get_result('c123b') as result(id uuid);
select count(*) from extensions.dblink_get_result('c123a') as result(id uuid);
select count(*) from extensions.dblink_get_result('c123b') as result(id uuid);
select is((select count(distinct result) from c123_results where operation='create'),1::bigint,'concurrent creates replay one loan id');
select is((select count(*) from public.transactions where idempotency_key='c123-create:disbursement'),1::bigint,'concurrent creates write one disbursement');

select extensions.dblink_exec('c123a','set role authenticated');
select extensions.dblink_exec('c123b','set role authenticated');

select pg_advisory_lock(hashtextextended('correct_loan_terms:c123-correct',123));
select is(extensions.dblink_send_query('c123a',$q$select public.correct_loan_terms(
  '30000000-0000-0000-0000-000000000123'::uuid,'LENDING'::public.loan_direction,
  100000000::bigint,date '2026-11-01',90::integer,15::smallint,1.5::numeric,
  'Concurrent correction'::text,'c123-correct'::text)$q$),1,'first correction request started');
select is(extensions.dblink_send_query('c123b',$q$select public.correct_loan_terms(
  '30000000-0000-0000-0000-000000000123'::uuid,'LENDING'::public.loan_direction,
  100000000::bigint,date '2026-11-01',90::integer,15::smallint,1.5::numeric,
  'Concurrent correction'::text,'c123-correct'::text)$q$),1,'second correction request started');
select pg_advisory_unlock(hashtextextended('correct_loan_terms:c123-correct',123));
insert into c123_results select 'correct','a',id from extensions.dblink_get_result('c123a') as result(id uuid);
insert into c123_results select 'correct','b',id from extensions.dblink_get_result('c123b') as result(id uuid);
select count(*) from extensions.dblink_get_result('c123a') as result(id uuid);
select count(*) from extensions.dblink_get_result('c123b') as result(id uuid);
select is((select count(distinct result) from c123_results where operation='correct'),1::bigint,'concurrent corrections replay one loan id');
select is((select count(*) from public.loan_term_corrections where idempotency_key='c123-correct'),1::bigint,'concurrent corrections write one ledger row');

select pg_advisory_lock(hashtextextended('onboard_legacy_loan:c123-onboard',123));
select is(extensions.dblink_send_query('c123a',$q$select public.onboard_legacy_loan(
  '30000000-0000-0000-0000-000000000124'::uuid,date '2026-11-15',100000000::bigint,
  2000000::bigint,null::date,'Concurrent onboarding'::text,'c123-onboard'::text)$q$),1,'first onboarding request started');
select is(extensions.dblink_send_query('c123b',$q$select public.onboard_legacy_loan(
  '30000000-0000-0000-0000-000000000124'::uuid,date '2026-11-15',100000000::bigint,
  2000000::bigint,null::date,'Concurrent onboarding'::text,'c123-onboard'::text)$q$),1,'second onboarding request started');
select pg_advisory_unlock(hashtextextended('onboard_legacy_loan:c123-onboard',123));
insert into c123_results select 'onboard','a',id from extensions.dblink_get_result('c123a') as result(id uuid);
insert into c123_results select 'onboard','b',id from extensions.dblink_get_result('c123b') as result(id uuid);
select count(*) from extensions.dblink_get_result('c123a') as result(id uuid);
select count(*) from extensions.dblink_get_result('c123b') as result(id uuid);
select is((select count(distinct result) from c123_results where operation='onboard'),1::bigint,'concurrent onboardings replay one ledger id');
select is((select count(*) from public.legacy_loan_onboardings where idempotency_key='c123-onboard'),1::bigint,'concurrent onboardings write one ledger row');
select is((select count(*) from public.transactions where idempotency_key like 'c123-onboard:%'),2::bigint,'concurrent onboarding writes one principal and one interest component');

select pg_advisory_lock(hashtextextended('record_expense:c123-expense',123));
select is(extensions.dblink_send_query('c123a',$q$select public.record_expense(
  null::uuid,date '2026-11-20',3000000::bigint,'Vận hành'::text,
  'c123-expense'::text,'Concurrent expense'::text)$q$),1,'first expense request started');
select is(extensions.dblink_send_query('c123b',$q$select public.record_expense(
  null::uuid,date '2026-11-20',3000000::bigint,'Vận hành'::text,
  'c123-expense'::text,'Concurrent expense'::text)$q$),1,'second expense request started');
select pg_advisory_unlock(hashtextextended('record_expense:c123-expense',123));
insert into c123_results select 'expense','a',id from extensions.dblink_get_result('c123a') as result(id uuid);
insert into c123_results select 'expense','b',id from extensions.dblink_get_result('c123b') as result(id uuid);
select count(*) from extensions.dblink_get_result('c123a') as result(id uuid);
select count(*) from extensions.dblink_get_result('c123b') as result(id uuid);
select is((select count(distinct result) from c123_results where operation='expense'),1::bigint,'concurrent expenses replay one transaction id');
select is((select count(*) from public.transactions where idempotency_key='c123-expense'),1::bigint,'concurrent expenses write one transaction');
select is((select count(*) from public.expenses where transaction_id=(select result from c123_results where operation='expense' limit 1)),1::bigint,'concurrent expenses write one expense detail');

select pg_advisory_lock(hashtextextended('reverse_transaction:c123-expense-reverse',123));
select is(extensions.dblink_send_query('c123a',format($q$select public.reverse_transaction(
  %L::uuid,date '2026-11-21','Concurrent reversal'::text,
  'c123-expense-reverse'::text,date '2026-11-21')$q$,
  (select result from c123_results where operation='expense' limit 1))),1,'first reversal request started');
select is(extensions.dblink_send_query('c123b',format($q$select public.reverse_transaction(
  %L::uuid,date '2026-11-21','Concurrent reversal'::text,
  'c123-expense-reverse'::text,date '2026-11-21')$q$,
  (select result from c123_results where operation='expense' limit 1))),1,'second reversal request started');
select pg_advisory_unlock(hashtextextended('reverse_transaction:c123-expense-reverse',123));
insert into c123_results select 'reverse','a',id from extensions.dblink_get_result('c123a') as result(id uuid);
insert into c123_results select 'reverse','b',id from extensions.dblink_get_result('c123b') as result(id uuid);
select count(*) from extensions.dblink_get_result('c123a') as result(id uuid);
select count(*) from extensions.dblink_get_result('c123b') as result(id uuid);
select is((select count(distinct result) from c123_results where operation='reverse'),1::bigint,'concurrent reversals replay one transaction id');
select is((select count(*) from public.transactions where idempotency_key='c123-expense-reverse' and type='REVERSAL'),1::bigint,'concurrent reversals write one reversal');

select extensions.dblink_disconnect('c123a');
select extensions.dblink_disconnect('c123b');

select is((select public.calculate_loan('30000000-0000-0000-0000-000000000124',date '2026-11-15')->>'principalOutstandingVnd'),'100000000','onboarding leaves authoritative principal exact');
select is((select count(*) from public.audit_logs where table_name in ('loan_term_corrections','legacy_loan_onboardings') and action='INSERT'),2::bigint,'append-only ledgers retain one audit insert each');

select * from finish();
rollback;
