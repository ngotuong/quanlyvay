begin;

create extension if not exists pgtap with schema extensions;
select plan(23);

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000011', 'owner@example.test'),
  ('10000000-0000-0000-0000-000000000012', 'editor@example.test'),
  ('10000000-0000-0000-0000-000000000013', 'viewer@example.test'),
  ('10000000-0000-0000-0000-000000000014', 'inactive@example.test');

insert into public.profiles (user_id, username, display_name, role, is_active)
values
  ('10000000-0000-0000-0000-000000000011', 'owner_test', 'Owner Test', 'OWNER', true),
  ('10000000-0000-0000-0000-000000000012', 'editor_test', 'Editor Test', 'EDITOR', true),
  ('10000000-0000-0000-0000-000000000013', 'viewer_test', 'Viewer Test', 'VIEWER', true),
  ('10000000-0000-0000-0000-000000000014', 'inactive_test', 'Inactive Test', 'VIEWER', false);

insert into public.counterparties (id, name)
values ('20000000-0000-0000-0000-000000000011', 'Đối tác RLS');

insert into public.loans (
  id,
  counterparty_id,
  name,
  direction,
  original_principal_vnd,
  disbursement_date,
  term_days,
  interest_cycle_days,
  initial_daily_rate_percent
) values (
  '30000000-0000-0000-0000-000000000011',
  '20000000-0000-0000-0000-000000000011',
  'Khoản vay RLS',
  'BORROWING',
  5000000,
  date '2026-02-01',
  30,
  30,
  0.05
);

insert into public.notifications (user_id, loan_id, type, notification_date, title, body, idempotency_key)
values
  ('10000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000011', 'INTEREST_DUE', date '2026-03-01', 'Của viewer', 'Nội dung', 'rls-viewer-notification'),
  ('10000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000011', 'INTEREST_DUE', date '2026-03-01', 'Của owner', 'Nội dung', 'rls-owner-notification');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000011', true);
set local role authenticated;

select is((select count(*) from public.profiles), 4::bigint, 'owner can read all profiles');
select lives_ok(
  $$select public.create_counterparty('Owner tạo', null)$$,
  'owner can create counterparties through the authoritative RPC'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000012', true);
set local role authenticated;

select cmp_ok((select count(*) from public.counterparties), '>=', 2::bigint, 'editor can read shared counterparties');
select throws_ok(
  $$insert into public.counterparties (name, created_by) values ('Editor tạo', auth.uid())$$,
  '42501',
  null,
  'editor cannot bypass the counterparty RPC'
);
select throws_ok(
  $$update public.profiles set role = 'OWNER' where user_id = '10000000-0000-0000-0000-000000000011'$$,
  '42501',
  null,
  'editor has no direct profile mutation privilege'
);
select is(
  (select role::text from public.profiles where user_id = auth.uid()),
  'EDITOR',
  'editor remains restricted to their unchanged own profile'
);
select lives_ok(
  $$select public.record_financial_transaction('30000000-0000-0000-0000-000000000011', 'INTEREST_PAYMENT', date '2026-02-15', 75000, 'rls-editor-tx', null, date '2026-02-15')$$,
  'editor can append financial transactions through the authoritative RPC'
);
select throws_ok(
  $$insert into public.transactions (loan_id, type, transaction_date, amount_vnd, idempotency_key, created_by) values ('30000000-0000-0000-0000-000000000011', 'INTEREST_PAYMENT', date '2026-02-15', 1, 'rls-editor-direct', auth.uid())$$,
  '42501',
  null,
  'authenticated clients cannot bypass the financial RPC'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000013', true);
set local role authenticated;

select cmp_ok((select count(*) from public.counterparties), '>=', 2::bigint, 'viewer can read shared counterparties');
select throws_ok(
  $$insert into public.counterparties (name) values ('Viewer không được tạo')$$,
  '42501',
  null,
  'viewer cannot create counterparties'
);
select throws_ok(
  $$update public.counterparties set name = 'Viewer sửa' where id = '20000000-0000-0000-0000-000000000011'$$,
  '42501',
  null,
  'viewer has no direct counterparty mutation privilege'
);
select is(
  (select name from public.counterparties where id = '20000000-0000-0000-0000-000000000011'),
  'Đối tác RLS',
  'viewer cannot update counterparties'
);
select is((select count(*) from public.profiles), 1::bigint, 'viewer can only read their own profile');
select is((select count(*) from public.audit_logs), 0::bigint, 'viewer cannot read audit history');
select is((select count(*) from public.notifications), 1::bigint, 'viewer only sees their own notifications');
select lives_ok(
  $$select public.register_push_subscription('https://push.example.test/viewer', 'key', 'secret')$$,
  'viewer can register their own push subscription through the RPC'
);
select throws_ok(
  $$insert into public.push_subscriptions (user_id, endpoint, p256dh, auth_secret) values ('10000000-0000-0000-0000-000000000011', 'https://push.example.test/other', 'key', 'secret')$$,
  '42501',
  null,
  'viewer cannot register a subscription for another user'
);
select throws_ok(
  $$select public.record_financial_transaction('30000000-0000-0000-0000-000000000011', 'INTEREST_PAYMENT', date '2026-02-15', 1, 'rls-viewer-tx', null, date '2026-02-15')$$,
  '42501',
  null,
  'viewer cannot append financial transactions'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000014', true);
set local role authenticated;

select is((select count(*) from public.counterparties), 0::bigint, 'inactive user cannot read shared data');
select throws_ok(
  $$insert into public.counterparties (name) values ('Inactive không được tạo')$$,
  '42501',
  null,
  'inactive user cannot create data'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000011', true);
set local role authenticated;

select cmp_ok((select count(*) from public.audit_logs), '>', 0::bigint, 'owner can read audit history');
select is(
  (select role::text from public.profiles where user_id = '10000000-0000-0000-0000-000000000011'),
  'OWNER',
  'editor could not alter the owner profile'
);

reset role;
set local role anon;

select throws_ok(
  $$select count(*) from public.loans$$,
  '42501',
  null,
  'anonymous clients have no table access'
);

select * from finish();
rollback;
