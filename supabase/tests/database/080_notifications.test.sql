begin;

create extension if not exists pgtap with schema extensions;
select plan(20);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values
  ('20000000-0000-0000-0000-000000000080', 'notify_owner@auth.local', now(), '{"provisioned_by_app":"true","username":"notify_owner","display_name":"Notify Owner","app_role":"OWNER"}'::jsonb),
  ('20000000-0000-0000-0000-000000000081', 'notify_viewer@auth.local', now(), '{"provisioned_by_app":"true","username":"notify_viewer","display_name":"Notify Viewer","app_role":"VIEWER"}'::jsonb);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000080', true);
set local role authenticated;
select public.create_counterparty('Đối tác thông báo', null);
select public.create_loan_v2(
  (select id from public.counterparties where name = 'Đối tác thông báo'),
  'Khoản đến hạn', 'LENDING'::public.loan_direction, 10000000::bigint, '2026-07-20'::date, 30, 15::smallint, 1.5::numeric,
  'notify-due-loan', null
);
select public.create_loan_v2(
  (select id from public.counterparties where name = 'Đối tác thông báo'),
  'Khoản quá hạn', 'BORROWING'::public.loan_direction, 4000000::bigint, '2026-07-01'::date, 20, 15::smallint, 0.75::numeric,
  'notify-overdue-loan', null
);

reset role;
set local role service_role;
select is(public.generate_due_notifications('2026-08-03'), 4, 'due day creates due and overdue notifications for both active users');
select is(public.generate_due_notifications('2026-08-03'), 0, 'same-day retry creates no duplicate notifications');
select is(public.generate_due_notifications('2026-08-04'), 2, 'overdue reminder repeats on the following day');
select is((select count(*) from public.notifications), 6::bigint, 'notification rows remain unique by user loan type and day');
select is((select count(*) from public.notifications where type = 'INTEREST_DUE'), 2::bigint, 'interest due reminder is generated only on the due date');
select is((select count(*) from public.notifications where type = 'LOAN_OVERDUE'), 4::bigint, 'overdue reminder is generated daily');

reset role;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000080', true);
set local role authenticated;
select lives_ok(
  $$select public.register_push_subscription('https://push.example.test/owner', 'owner-key', 'owner-secret')$$,
  'active user can register a push subscription'
);
select lives_ok(
  $$select public.register_push_subscription('https://push.example.test/owner', 'rotated-key', 'rotated-secret')$$,
  'subscription registration is idempotent and refreshes keys'
);
select is((select count(*) from public.push_subscriptions), 1::bigint, 'subscription retry does not duplicate endpoint');
select is((select p256dh from public.push_subscriptions), 'rotated-key', 'subscription retry updates browser key');
select is(public.mark_notifications_read(array[(select id from public.notifications order by created_at limit 1)]), 1, 'user can mark one own notification read');
select is((select count(*) from public.notifications where read_at is not null), 1::bigint, 'read state is persisted');

reset role;
update public.notifications set created_at = now() - interval '2 seconds';
update public.push_subscriptions set created_at = now() - interval '1 second';
set local role service_role;
select is((select count(*) from public.claim_push_deliveries(100)), 0::bigint, 'new subscription does not receive historical notifications');
select is(public.generate_due_notifications('2026-08-05'), 2, 'a new overdue reminder is generated after subscription registration');
create temporary table claimed_delivery as select * from public.claim_push_deliveries(1);
select is((select count(*) from claimed_delivery), 1::bigint, 'delivery worker claims one queued target');
select is((select idempotency_key is not null from claimed_delivery), true, 'delivery includes a stable notification idempotency key');
select public.complete_push_delivery((select delivery_id from claimed_delivery), true, null);
select is((select status::text from public.push_deliveries where id = (select delivery_id from claimed_delivery)), 'SENT', 'successful delivery is marked sent');
select is((select sent_at is not null from public.push_deliveries where id = (select delivery_id from claimed_delivery)), true, 'successful delivery records sent time');
select is((select count(*) from public.claim_push_deliveries(100) where delivery_id = (select delivery_id from claimed_delivery)), 0::bigint, 'sent delivery is never claimed again on retry');

reset role;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000080', true);
set local role authenticated;
select is(public.remove_push_subscription('https://push.example.test/owner'), 1, 'user can remove their own subscription');

select * from finish();
rollback;
