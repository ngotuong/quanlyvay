begin;

create extension if not exists pgtap with schema extensions;
select plan(41);

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
  'Khoản đi vay đến hạn', 'BORROWING'::public.loan_direction, 6000000::bigint, '2026-07-20'::date, 30, 15::smallint, 1.5::numeric,
  'notify-borrowing-due-loan', null
);
select public.create_loan_v2(
  (select id from public.counterparties where name = 'Đối tác thông báo'),
  'Khoản quá hạn', 'BORROWING'::public.loan_direction, 4000000::bigint, '2026-07-01'::date, 20, 15::smallint, 0.75::numeric,
  'notify-overdue-loan', null
);

reset role;
set local role service_role;
select is(public.generate_due_notifications('2026-08-03'), 6, 'due day creates lending, borrowing and overdue notifications for both active users');
select is(public.generate_due_notifications('2026-08-03'), 0, 'same-day retry creates no duplicate notifications');
select is(public.generate_due_notifications('2026-08-04'), 6, 'unpaid obligations update their existing cards on the following day');
select is((select count(*) from public.notifications where superseded_at is null), 6::bigint, 'one active notification card remains per user loan obligation');
select is((select count(*) from public.notifications where type = 'INTEREST_DUE' and superseded_at is null), 4::bigint, 'interest reminders update instead of duplicating cards');
select is((select count(*) from public.notifications where type = 'LOAN_OVERDUE' and superseded_at is null), 2::bigint, 'overdue principal reminders update instead of duplicating cards');
select is((select min(revision) from public.notifications where superseded_at is null), 2, 'following-day refresh increments every active card revision');
select is((select count(distinct thread_key) from public.notifications where superseded_at is null), 6::bigint, 'every active obligation has a distinct stable thread key');
select is((select notification.title from public.notifications as notification join public.loans as loan on loan.id = notification.loan_id where notification.type = 'INTEREST_DUE' and loan.direction = 'LENDING' limit 1), 'Đến ngày thu lãi', 'lending reminder uses collection title');
select is((select notification.title from public.notifications as notification join public.loans as loan on loan.id = notification.loan_id where notification.type = 'INTEREST_DUE' and loan.direction = 'BORROWING' limit 1), 'Đến ngày đóng lãi', 'borrowing reminder uses payment title');
select is((select notification.body from public.notifications as notification join public.loans as loan on loan.id = notification.loan_id where notification.type = 'INTEREST_DUE' and loan.direction = 'LENDING' limit 1), E'Đối tác thông báo • 10.000.000\nGiải ngân : 20/07/2026\nSố lãi phải thu : 150.000\nQuá hạn : 1 ngày', 'lending card updates with the authoritative amount and overdue day');
select is((select notification.body from public.notifications as notification join public.loans as loan on loan.id = notification.loan_id where notification.type = 'INTEREST_DUE' and loan.direction = 'BORROWING' limit 1), E'Đối tác thông báo • 6.000.000\nGiải ngân : 20/07/2026\nSố lãi phải trả : 90.000\nQuá hạn : 1 ngày', 'borrowing card updates with the authoritative amount and overdue day');
select is((select notification.body from public.notifications as notification join public.loans as loan on loan.id = notification.loan_id where notification.type = 'LOAN_OVERDUE' and notification.notification_date = '2026-08-04' and loan.name = 'Khoản quá hạn' limit 1), E'Đối tác thông báo • 4.000.000\nGiải ngân : 01/07/2026\nDư gốc quá hạn : 4.000.000\nQuá hạn : 15 ngày', 'overdue body updates the accurate overdue-day line on the same card');
select is((select notification.body from public.notifications as notification join public.loans as loan on loan.id = notification.loan_id where notification.type = 'INTEREST_DUE' and notification.notification_date = '2026-08-04' and loan.direction = 'LENDING' limit 1), E'Đối tác thông báo • 10.000.000\nGiải ngân : 20/07/2026\nSố lãi phải thu : 150.000\nQuá hạn : 1 ngày', 'repeated interest reminder adds the accurate overdue-day line');

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
select is((select notification_delivery_hour from public.profiles where user_id = '20000000-0000-0000-0000-000000000080'), 7::smallint, 'notification delivery hour defaults to 07:00 Vietnam time');
select is(public.update_notification_delivery_hour(9::smallint), 9::smallint, 'active user can choose a delivery hour');
select is((select notification_delivery_hour from public.profiles where user_id = '20000000-0000-0000-0000-000000000080'), 9::smallint, 'chosen delivery hour is persisted');
select lives_ok(
  $$select public.record_financial_transaction((select id from public.loans where name = 'Khoản đến hạn'), 'INTEREST_PAYMENT', '2026-08-04', 150000, 'notify-interest-paid', null, '2026-08-05')$$,
  'paying the matured lending interest succeeds'
);
select lives_ok(
  $$select public.record_lifecycle_event_v2((select id from public.loans where name = 'Khoản đi vay đến hạn'), 'BAD_DEBT_START', '2026-08-04', 'notify-borrowing-bad-debt', null, null, '2026-08-05')$$,
  'marking the borrowing loan as bad debt succeeds'
);

reset role;
update public.notifications set created_at = now() - interval '2 seconds', updated_at = now() - interval '2 seconds';
update public.push_subscriptions set created_at = now() - interval '1 second';
set local role service_role;
select is((select count(*) from public.claim_push_deliveries(100)), 0::bigint, 'new subscription does not receive historical notifications');
select is(public.generate_due_notifications('2026-08-05'), 2, 'a new overdue reminder is generated after subscription registration');
select is((select count(*) from public.notifications where type = 'INTEREST_DUE' and notification_date = '2026-08-05'), 0::bigint, 'interest repeat stops after full payment or bad-debt pause');
select is((select count(*) from public.claim_push_deliveries(100, 7::smallint)), 0::bigint, 'worker does not claim a notification before the recipient selected hour');
create temporary table claimed_delivery as select * from public.claim_push_deliveries(1, 9::smallint);
select is((select count(*) from claimed_delivery), 1::bigint, 'delivery worker claims one queued target');
select is((select idempotency_key is not null from claimed_delivery), true, 'delivery includes a stable notification idempotency key');
select is((select unread_count from claimed_delivery), (select count(*)::integer from public.notifications where user_id = '20000000-0000-0000-0000-000000000080' and read_at is null), 'delivery includes the exact unread count for app badging');
select public.complete_push_delivery((select delivery_id from claimed_delivery), true, null);
select is((select status::text from public.push_deliveries where id = (select delivery_id from claimed_delivery)), 'SENT', 'successful delivery is marked sent');
select is((select sent_at is not null from public.push_deliveries where id = (select delivery_id from claimed_delivery)), true, 'successful delivery records sent time');
select is((select count(*) from public.claim_push_deliveries(100, 9::smallint) where delivery_id = (select delivery_id from claimed_delivery)), 0::bigint, 'sent delivery is never claimed again on retry');
select is(public.generate_due_notifications('2026-08-06'), 2, 'next-day overdue refresh updates two existing recipient cards');
create temporary table claimed_second_revision as select * from public.claim_push_deliveries(10, 9::smallint);
select is((select count(*) from claimed_second_revision), 1::bigint, 'a newer card revision creates one new Push occurrence for the subscribed owner');
select is((select notification_id from claimed_second_revision), (select notification_id from claimed_delivery), 'repeated Push keeps the same Notification Center card identity');
select isnt((select delivery_id from claimed_second_revision), (select delivery_id from claimed_delivery), 'repeated Push preserves a distinct delivery history row');
select is((select notification_type::text from claimed_second_revision), 'LOAN_OVERDUE', 'claimed occurrence exposes its notification type for deep linking');

reset role;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000080', true);
set local role authenticated;
select is(public.remove_push_subscription('https://push.example.test/owner'), 1, 'user can remove their own subscription');

select * from finish();
rollback;
