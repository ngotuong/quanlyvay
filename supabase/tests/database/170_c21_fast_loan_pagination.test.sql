begin;

create extension if not exists pgtap with schema extensions;
select plan(17);

select is(
  has_function_privilege('authenticated', 'private.loan_listing_facts(date,text,date,date)', 'EXECUTE'),
  false,
  'authenticated cannot bypass the public listing RPC'
);
select has_index('public', 'loan_lifecycle_events', 'loan_lifecycle_events_listing_idx', 'listing lifecycle index exists');
select has_index('public', 'transactions', 'transactions_loan_type_date_idx', 'listing transaction index exists');

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values (
  '20000000-0000-0000-0000-000000000170',
  'c21_owner@auth.local',
  now(),
  '{"provisioned_by_app":"true","username":"c21_owner","display_name":"C21 fake owner","app_role":"OWNER"}'::jsonb
);
insert into public.counterparties (id, name)
values ('30000000-0000-0000-0000-000000000170', 'C21 fake counterparty');

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000170', true);
set local role authenticated;

select public.create_loan_v3('30000000-0000-0000-0000-000000000170', 'C21 active bigint', 'LENDING', 9007199254740993, '2026-01-01', null, 30::smallint, 0.1, 0::smallint, 'c21-active', null);
select public.create_loan_v3('30000000-0000-0000-0000-000000000170', 'C21 overdue', 'BORROWING', 2000000, '2026-01-01', 10, 30::smallint, 0.1, 0::smallint, 'c21-overdue', null);
select public.create_loan_v3('30000000-0000-0000-0000-000000000170', 'C21 bad debt', 'LENDING', 3000000, '2026-01-01', null, 30::smallint, 0.1, 0::smallint, 'c21-bad-debt', null);
select public.create_loan_v3('30000000-0000-0000-0000-000000000170', 'C21 resumed', 'LENDING', 4000000, '2026-01-01', null, 30::smallint, 0.1, 0::smallint, 'c21-resumed', null);
select public.create_loan_v3('30000000-0000-0000-0000-000000000170', 'C21 settled', 'BORROWING', 5000000, '2026-01-01', null, 30::smallint, 0, 0::smallint, 'c21-settled', null);

select public.record_financial_transaction((select id from public.loans where name = 'C21 active bigint'), 'PRINCIPAL_PAYMENT', '2026-01-05', 1, 'c21-bigint-payment', null, '2026-01-31');
select public.record_lifecycle_event_v2((select id from public.loans where name = 'C21 active bigint'), 'RATE_CHANGE', '2026-01-15', 'c21-rate-change', 6, null, '2026-01-31');
select public.record_lifecycle_event_v2((select id from public.loans where name = 'C21 bad debt'), 'BAD_DEBT_START', '2026-01-10', 'c21-bad-start', null, null, '2026-01-31');
select public.record_lifecycle_event_v2((select id from public.loans where name = 'C21 resumed'), 'BAD_DEBT_START', '2026-01-10', 'c21-resume-bad-start', null, null, '2026-01-31');
select public.record_lifecycle_event_v2((select id from public.loans where name = 'C21 resumed'), 'INTEREST_RESUME', '2026-01-20', 'c21-resume', null, null, '2026-01-31');
select public.settle_loan((select id from public.loans where name = 'C21 settled'), '2026-01-12', 'c21-settlement', null);

select throws_ok(
  $$select * from private.loan_listing_facts('2026-01-31', null, null, null)$$,
  '42501', null, 'private listing facts reject direct authenticated access'
);

reset role;
select is(
  (select count(*) from private.loan_listing_facts('2026-01-31', 'C21 ', null, null) fact
   where fact.calculated_status::text <> public.calculate_loan(fact.loan_id, '2026-01-31')->>'status'),
  0::bigint,
  'set-wise status matches the authoritative calculator for every edge fixture'
);
select is(
  (select count(*) from private.loan_listing_facts('2026-01-31', 'C21 ', null, null) fact
   where fact.principal_outstanding_vnd::text <> public.calculate_loan(fact.loan_id, '2026-01-31')->>'principalOutstandingVnd'),
  0::bigint,
  'set-wise principal matches the authoritative calculator including bigint and settlement'
);

set local role authenticated;
create temporary table c21_page as
select public.list_loan_summaries_page('2026-01-31', 'C21 ', null, null, null, null, 'name', 1, 25) value;

select is((select value->>'totalCount' from c21_page), '5', 'page reports all matching fixtures');
select is(jsonb_array_length((select value->'items' from c21_page)), 5, 'page returns all five fixtures');
select ok(
  not exists (
    select 1 from jsonb_array_elements((select value->'items' from c21_page)) item
    where item->'calculation' ? 'periods'
  ),
  'every card omits expensive periods payload'
);
select is(
  (select count(*) from jsonb_array_elements((select value->'items' from c21_page)) item
   where item#>>'{calculation,status}' = 'BAD_DEBT'),
  1::bigint,
  'bad-debt state remains exact'
);
select is(
  public.list_loan_summaries_page('2026-01-31', 'C21 ', null, 'SETTLED', null, null, 'name', 1, 25)->>'totalCount',
  '1',
  'settled status filter remains exact'
);
select is(
  public.list_loan_summaries_page('2026-01-31', 'C21 ', null, 'OVERDUE', null, null, 'name', 1, 25)->>'totalCount',
  '1',
  'overdue status filter remains exact'
);
select is(
  public.list_loan_summaries_page('2026-01-31', 'C21 ', 'BORROWING', null, null, null, 'name', 1, 25)->>'totalCount',
  '2',
  'direction filter remains exact'
);
select is(
  public.list_loan_summaries_page('2026-01-31', 'active bigint', null, null, null, null, 'name', 1, 25)#>>'{items,0,calculation,principalOutstandingVnd}',
  '9007199254740992',
  'card keeps exact bigint principal as text'
);
select is(
  public.list_loan_summaries_page('2026-01-31', 'C21 ', null, null, null, null, 'outstanding_desc', 1, 1)#>>'{items,0,name}',
  'C21 active bigint',
  'outstanding sort uses exact set-wise principal'
);
select is(
  public.list_loan_summaries_page('2026-01-31', 'C21 ', null, null, '2026-01-02', null, 'name', 1, 25)->>'totalCount',
  '0',
  'disbursement date filter remains exact'
);
select throws_ok(
  $$select public.list_loan_summaries_page('2026-01-31', null, null, null, null, null, 'name', 1, 101)$$,
  '22023', null, 'oversized page remains rejected'
);

select * from finish();
rollback;
