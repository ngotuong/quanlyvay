begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

select has_column('public', 'profiles', 'password_reset_generation', 'profiles expose a password reset generation');

insert into auth.users (id, email)
values ('10000000-0000-0000-0000-000000000114', 'c114-owner@example.test'),
       ('20000000-0000-0000-0000-000000000114', 'c114-viewer@example.test');
insert into public.profiles (user_id, username, display_name, role, is_active, must_change_password)
values ('10000000-0000-0000-0000-000000000114', 'c114_owner', 'C114 Owner', 'OWNER', true, false),
       ('20000000-0000-0000-0000-000000000114', 'c114_viewer', 'C114 Viewer', 'VIEWER', true, false);

select is(
  (select password_reset_generation from public.profiles where user_id = '20000000-0000-0000-0000-000000000114'),
  0::bigint,
  'new profiles start at generation zero'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000114', true);
set local role authenticated;
select lives_ok(
  $$select public.mark_password_reset_required('20000000-0000-0000-0000-000000000114')$$,
  'owner can mark a managed account for password reset'
);
select is(
  (select password_reset_generation from public.profiles where user_id = '20000000-0000-0000-0000-000000000114'),
  1::bigint,
  'first reset advances the generation'
);
select is(
  (select must_change_password from public.profiles where user_id = '20000000-0000-0000-0000-000000000114'),
  true,
  'reset keeps password enforcement enabled'
);
select lives_ok(
  $$select public.mark_password_reset_required('20000000-0000-0000-0000-000000000114')$$,
  'repeated reset remains safe'
);
select is(
  (select password_reset_generation from public.profiles where user_id = '20000000-0000-0000-0000-000000000114'),
  2::bigint,
  'repeated reset advances to a distinct generation'
);

reset role;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000114', true);
set local role authenticated;
select throws_ok(
  $$select public.mark_password_reset_required('20000000-0000-0000-0000-000000000114')$$,
  '42501',
  null,
  'managed users cannot advance their own generation'
);

reset role;
select throws_ok(
  $$update public.profiles set password_reset_generation = -1 where user_id = '20000000-0000-0000-0000-000000000114'$$,
  '23514',
  null,
  'password reset generation cannot become negative'
);

select * from finish();
rollback;
