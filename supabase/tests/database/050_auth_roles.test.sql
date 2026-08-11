begin;

create extension if not exists pgtap with schema extensions;
select plan(23);

select throws_ok(
  $$insert into auth.users (id, email, raw_user_meta_data) values ('10000000-0000-0000-0000-000000000050', 'wrong@auth.local', '{"provisioned_by_app":"true","username":"owner_local","display_name":"Owner Local","app_role":"OWNER"}'::jsonb)$$,
  '22023',
  null,
  'provisioning rejects an Auth email that does not match username mapping'
);

select lives_ok(
  $$insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ('10000000-0000-0000-0000-000000000051', 'owner_local@auth.local', now(), '{"provisioned_by_app":"true","username":"owner_local","display_name":"Owner Local","app_role":"VIEWER"}'::jsonb)$$,
  'first provisioned Auth user creates an application profile'
);
select is(
  (select role::text from public.profiles where user_id = '10000000-0000-0000-0000-000000000051'),
  'OWNER',
  'first provisioned account is always OWNER'
);
select is(
  (select must_change_password from public.profiles where user_id = '10000000-0000-0000-0000-000000000051'),
  true,
  'new OWNER must change their temporary password'
);

select lives_ok(
  $$insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ('10000000-0000-0000-0000-000000000052', 'viewer_local@auth.local', now(), '{"provisioned_by_app":"true","username":"viewer_local","display_name":"Viewer Local","app_role":"VIEWER"}'::jsonb)$$,
  'second provisioned Auth user creates the additional account'
);
select is(
  (select role::text from public.profiles where user_id = '10000000-0000-0000-0000-000000000052'),
  'VIEWER',
  'additional account receives the requested non-owner role'
);
select lives_ok(
  $$insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ('10000000-0000-0000-0000-000000000053', 'third_local@auth.local', now(), '{"provisioned_by_app":"true","username":"third_local","display_name":"Third Local","app_role":"EDITOR"}'::jsonb)$$,
  'provisioning allows more than two application accounts'
);
select throws_ok(
  $$delete from public.profiles where user_id = '10000000-0000-0000-0000-000000000052'$$,
  '55000',
  null,
  'profiles cannot be physically deleted'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000052', true);
set local role authenticated;

select lives_ok(
  $$select public.complete_password_change()$$,
  'active user can complete their required password change'
);
select is(
  (select must_change_password from public.profiles where user_id = auth.uid()),
  false,
  'password completion clears the current user flag'
);
select throws_ok(
  $$select public.manage_profile('10000000-0000-0000-0000-000000000052', 'Viewer đổi quyền', 'EDITOR', true)$$,
  '42501',
  null,
  'viewer cannot manage application profiles'
);
select throws_ok(
  $$insert into public.profiles (user_id, username, display_name, role) values (extensions.gen_random_uuid(), 'direct_user', 'Direct User', 'VIEWER')$$,
  '42501',
  null,
  'authenticated clients cannot bypass Auth provisioning'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000051', true);
set local role authenticated;

select lives_ok(
  $$select public.manage_profile('10000000-0000-0000-0000-000000000052', 'Biên tập viên', 'EDITOR', false)$$,
  'owner can update role, display name, and active state of additional account'
);
select is(
  (select role::text from public.profiles where user_id = '10000000-0000-0000-0000-000000000052'),
  'EDITOR',
  'owner role update is persisted'
);
select is(
  (select is_active from public.profiles where user_id = '10000000-0000-0000-0000-000000000052'),
  false,
  'owner can deactivate the additional account'
);
select throws_ok(
  $$select public.manage_profile('10000000-0000-0000-0000-000000000051', 'Owner Local', 'VIEWER', true)$$,
  '23514',
  null,
  'active owner cannot be demoted'
);
select throws_ok(
  $$select public.manage_profile('10000000-0000-0000-0000-000000000051', 'Owner Local', 'OWNER', false)$$,
  '23514',
  null,
  'active owner cannot be deactivated'
);
select throws_ok(
  $$update public.profiles set username = 'renamed_owner' where user_id = '10000000-0000-0000-0000-000000000051'$$,
  '42501',
  null,
  'authenticated clients cannot mutate username identity directly'
);
select throws_ok(
  $$select public.manage_profile('10000000-0000-0000-0000-000000000052', 'Second Owner', 'OWNER', true)$$,
  '23514',
  null,
  'additional account cannot be promoted to OWNER'
);
select is(
  (select count(*) from public.profiles),
  3::bigint,
  'provisioning keeps every managed application profile'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000052', true);
set local role authenticated;

select throws_ok(
  $$select public.complete_password_change()$$,
  '42501',
  null,
  'deactivated account cannot use authenticated profile RPCs'
);
select is(
  (select count(*) from public.counterparties),
  0::bigint,
  'deactivated account cannot read shared financial data'
);
select is(
  (select count(*) from public.profiles),
  1::bigint,
  'deactivated account can only see its own profile row'
);

select * from finish();
rollback;
