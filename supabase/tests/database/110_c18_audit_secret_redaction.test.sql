begin;

create extension if not exists pgtap with schema extensions;
select plan(20);

select has_function('private', 'sanitize_audit_payload', array['text', 'jsonb'], 'audit sanitizer exists');
select has_function('public', 'get_audit_logs_sanitized', array[]::text[], 'sanitized audit RPC exists');
select is(
  has_table_privilege('authenticated', 'public.audit_logs', 'SELECT'),
  false,
  'authenticated cannot select the raw audit table'
);
select is(
  has_sequence_privilege('authenticated', 'public.audit_logs_id_seq', 'USAGE'),
  false,
  'authenticated cannot use the raw audit sequence'
);
select is(
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'audit_logs' and policyname = 'audit_logs_owner_select'),
  0::bigint,
  'the compatibility OWNER raw-table policy is removed'
);
select is(
  has_table_privilege('service_role', 'public.audit_logs', 'SELECT'),
  true,
  'service role retains raw audit access for controlled operations'
);

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000061', 'c18-owner@example.test'),
  ('10000000-0000-0000-0000-000000000062', 'c18-viewer@example.test');

insert into public.profiles (user_id, username, display_name, role, is_active)
values
  ('10000000-0000-0000-0000-000000000061', 'c18_owner', 'C18 Owner', 'OWNER', true),
  ('10000000-0000-0000-0000-000000000062', 'c18_viewer', 'C18 Viewer', 'VIEWER', true);

insert into public.audit_logs (
  actor_user_id,
  table_name,
  record_id,
  action,
  new_data,
  request_id
) values (
  '10000000-0000-0000-0000-000000000061',
  'push_subscriptions',
  '60000000-0000-0000-0000-000000000061',
  'INSERT',
  '{"id":"60000000-0000-0000-0000-000000000061","endpoint":"https://push.example.test/historical","p256dh":"historical-p256dh","auth_secret":"historical-auth-secret"}',
  'c18-historical-raw'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000061', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select is(
  (select count(*) from public.get_audit_logs_sanitized() where request_id = 'c18-historical-raw'),
  1::bigint,
  'OWNER can read historical audit through sanitized RPC'
);
select ok(
  not ((select new_data from public.get_audit_logs_sanitized() where request_id = 'c18-historical-raw') ?| array['endpoint', 'p256dh', 'auth_secret']),
  'historical projection removes endpoint and Web Push keys'
);
select matches(
  (select new_data ->> 'endpoint_fingerprint' from public.get_audit_logs_sanitized() where request_id = 'c18-historical-raw'),
  '^sha256:[0-9a-f]{64}$',
  'historical projection retains only a deterministic endpoint fingerprint'
);

select lives_ok(
  $$select public.register_push_subscription('https://push.example.test/new', 'new-p256dh', 'new-auth-secret')$$,
  'new Web Push subscription is still registered through its authoritative RPC'
);
select throws_ok(
  $$select count(*) from public.audit_logs$$,
  '42501',
  null,
  'OWNER cannot bypass the sanitized RPC to read raw audit history'
);

reset role;

select ok(
  not ((select new_data from public.audit_logs where table_name = 'push_subscriptions' order by id desc limit 1) ?| array['endpoint', 'p256dh', 'auth_secret']),
  'new raw audit row is sanitized before insertion'
);
select matches(
  (select new_data ->> 'endpoint_fingerprint' from public.audit_logs where table_name = 'push_subscriptions' order by id desc limit 1),
  '^sha256:[0-9a-f]{64}$',
  'new raw audit row retains an endpoint fingerprint'
);
select is(
  (select new_data ->> 'p256dh' from public.audit_logs where table_name = 'push_subscriptions' order by id desc limit 1),
  null,
  'new raw audit row never stores p256dh'
);
select is(
  (select new_data ->> 'auth_secret' from public.audit_logs where table_name = 'push_subscriptions' order by id desc limit 1),
  null,
  'new raw audit row never stores auth secret'
);
select is(
  (select new_data ->> 'auth_secret' from public.audit_logs where request_id = 'c18-historical-raw'),
  'historical-auth-secret',
  'historical raw audit remains append-only and unchanged'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000062', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select throws_ok(
  $$select count(*) from public.get_audit_logs_sanitized()$$,
  '42501',
  null,
  'VIEWER cannot read sanitized audit history'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
set local role anon;

select throws_ok(
  $$select count(*) from public.get_audit_logs_sanitized()$$,
  '42501',
  null,
  'anonymous callers cannot execute the sanitized audit RPC'
);

reset role;
select set_config('request.jwt.claim.role', 'service_role', true);
set local role service_role;

select lives_ok(
  $$select count(*) from public.get_audit_logs_sanitized()$$,
  'service role can export sanitized audit history'
);
select ok(
  not ((select new_data from public.get_audit_logs_sanitized() where request_id = 'c18-historical-raw') ?| array['endpoint', 'p256dh', 'auth_secret']),
  'service-role export receives sanitized historical payloads'
);

select * from finish();
rollback;
