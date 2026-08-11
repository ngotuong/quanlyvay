begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values (
  '20000000-0000-0000-0000-000000000140',
  'audit_followup_owner@auth.local',
  now(),
  '{"provisioned_by_app":"true","username":"audit_followup_owner","display_name":"Audit Follow-up Owner","app_role":"OWNER"}'::jsonb
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000140', true);
set local role authenticated;

select lives_ok(
  $$select public.get_management_dashboard_bundle_v2('2026-08-01', '2026-08-31', '2026-07-01', '2026-07-31')$$,
  'consolidated dashboard bundle remains callable by an active user'
);

select ok(
  public.get_management_dashboard('2026-08-01', '2026-08-31') ? 'counterpartyExposure',
  'management dashboard exposes the shared counterparty analytics'
);

select is(
  public.get_management_analytics('2026-08-01', '2026-08-31') -> 'counterpartyExposure',
  public.get_management_dashboard('2026-08-01', '2026-08-31') -> 'counterpartyExposure',
  'legacy analytics RPC projects the consolidated snapshot'
);

select is(
  public.get_management_dashboard_bundle_v2('2026-08-01', '2026-08-31', '2026-07-01', '2026-07-31') -> 'analytics' ->> 'lendingAccruedVnd',
  public.get_management_dashboard('2026-08-01', '2026-08-31') ->> 'lendingAccruedVnd',
  'bundle analytics and dashboard reuse the same accrued value'
);

select ok(
  position('get_management_analytics' in pg_get_functiondef(
    'public.get_management_dashboard_bundle_v2(date,date,date,date)'::regprocedure
  )) = 0,
  'bundle no longer invokes the duplicate analytics calculation path'
);

select ok(
  position('counterparty_exposure_map' in pg_get_functiondef(
    'public.get_management_dashboard(date,date)'::regprocedure
  )) > 0,
  'dashboard accumulates counterparty exposure during its existing loan pass'
);

select * from finish();
rollback;
