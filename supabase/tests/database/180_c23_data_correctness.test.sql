begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values (
  '20000000-0000-0000-0000-000000000180',
  'c23_owner@auth.local',
  now(),
  '{"provisioned_by_app":"true","username":"c23_owner","display_name":"C23 fake owner","app_role":"OWNER"}'::jsonb
);
insert into public.counterparties (id, name)
values
  ('30000000-0000-0000-0000-000000000180', 'C23 real counterparty'),
  ('30000000-0000-0000-0000-000000000181', 'C23 test counterparty');

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000180', true);
set local role authenticated;

select public.create_loan_v3('30000000-0000-0000-0000-000000000180', 'C23 real loan', 'LENDING', 10000000, '2026-01-01', null, 30::smallint, 0, 0::smallint, 'c23-real', null);
select public.create_loan_v3('30000000-0000-0000-0000-000000000181', 'C23 test loan', 'LENDING', 9007199254740993, '2026-01-01', null, 30::smallint, 0, 0::smallint, 'c23-test', null);

select throws_ok(
  $$update public.loans set is_test_data = true where name = 'C23 real loan'$$,
  '42501', null,
  'authenticated users cannot hide operational loans'
);

reset role;
update public.counterparties set is_test_data = true where id = '30000000-0000-0000-0000-000000000181';
update public.loans set is_test_data = true where name = 'C23 test loan';

set local role authenticated;
select is(
  public.get_management_dashboard('2026-01-01', '2026-01-31')->>'activeLendingOutstandingVnd',
  '10000000',
  'dashboard excludes classified QA principal'
);
select is(
  public.get_management_dashboard('2026-01-01', '2026-01-31')#>>'{cashFlow,0,outflowVnd}',
  '10000000',
  'cash flow excludes classified QA disbursement'
);
select is(
  public.list_loan_summaries_page('2026-01-31', 'C23 ', null, null, null, null, 'name', 1, 25)->>'totalCount',
  '1',
  'loan list excludes classified QA loan'
);
select ok(
  public.get_management_dashboard_bundle_v3('2026-01-01', '2026-01-31', '2025-01-01', '2025-01-31', '2025-12-31', '2025-12-31')
    ?& array['dashboard', 'analytics', 'previousDashboard', 'previousBalanceDashboard'],
  'bundle exposes distinct flow and balance baselines'
);

reset role;
set local role service_role;
select is(
  (select count(*) from jsonb_array_elements(public.get_google_sync_snapshot()#>'{tables,loans}') row where row->>'name' = 'C23 test loan'),
  0::bigint,
  'Google Sync excludes QA loans'
);
select is(
  (select count(*) from jsonb_array_elements(public.get_google_sync_snapshot()#>'{tables,counterparties}') row where row->>'name' = 'C23 test counterparty'),
  0::bigint,
  'Google Sync excludes QA counterparties'
);
select is(
  (select count(*) from jsonb_array_elements(public.get_google_sync_snapshot()#>'{tables,transactions}') row
    where row->>'loan_id' = (select id::text from public.loans where name = 'C23 test loan')),
  0::bigint,
  'Google Sync excludes QA financial transactions'
);
select ok(
  exists (
    select 1 from jsonb_array_elements(public.get_google_sync_snapshot()#>'{tables,auditLogs}') row
    where row->>'record_id' = (select id::text from public.loans where name = 'C23 test loan')
  ),
  'sanitized audit history for QA data remains exportable'
);

reset role;
select is((select count(*) from public.loans where name = 'C23 test loan'), 1::bigint, 'QA loan remains physically preserved');
select is((select count(*) from public.transactions where loan_id = (select id from public.loans where name = 'C23 test loan')), 1::bigint, 'QA transaction remains physically preserved');
select ok((select count(*) from public.audit_logs where record_id = (select id from public.loans where name = 'C23 test loan')) > 0, 'raw QA audit history remains physically preserved');

select * from finish();
rollback;
