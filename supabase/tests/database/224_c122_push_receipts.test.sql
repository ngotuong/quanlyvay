begin;
create extension if not exists pgtap with schema extensions;
select plan(28);
insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data) values
('20000000-0000-0000-0000-000000000122','push_receipt@auth.local',now(),
 '{"provisioned_by_app":"true","username":"push_receipt","display_name":"Push Receipt","app_role":"OWNER"}');
insert into public.push_subscriptions (id,user_id,endpoint,p256dh,auth_secret) values
('30000000-0000-0000-0000-000000000122','20000000-0000-0000-0000-000000000122','https://push.example.test/receipt','fake-key','fake-auth');
insert into public.notifications (id,user_id,type,notification_date,title,body,idempotency_key)
values ('40000000-0000-0000-0000-000000000122','20000000-0000-0000-0000-000000000122','INTEREST_DUE',current_date,'Synthetic','Synthetic','c122-fixture');
insert into public.push_deliveries (id,notification_id,subscription_id,status,attempt_count,notification_revision)
values ('50000000-0000-0000-0000-000000000122','40000000-0000-0000-0000-000000000122','30000000-0000-0000-0000-000000000122','PROCESSING',1,1);

select ok(not has_table_privilege('anon','public.push_receipts','SELECT'),'anon cannot read receipt capabilities');
select ok(not has_table_privilege('authenticated','public.push_receipts','INSERT'),'users cannot forge diagnostics directly');
select ok(not has_function_privilege('anon','public.record_push_receipt(text,text,text,text)','EXECUTE'),'anonymous Data API cannot use privileged RPC');
select ok(not has_function_privilege('authenticated','public.prepare_push_receipt(uuid,uuid)','EXECUTE'),'users cannot mint receipt tokens');
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000122',true);
set local role authenticated;
select is(public.set_push_subscription_origin('30000000-0000-0000-0000-000000000122','https://tindung-preview.vercel.app'),true,'own origin can be recorded');
select is(public.set_push_subscription_origin('30000000-0000-0000-0000-000000000123','https://tindung-preview.vercel.app'),false,'cannot update another subscription');
select throws_ok($$select public.set_push_subscription_origin('30000000-0000-0000-0000-000000000122','javascript:bad')$$,'22023','invalid origin','invalid scheme rejected');
reset role;
set local role service_role;
create temporary table receipt as select public.prepare_push_receipt('50000000-0000-0000-0000-000000000122') as value;
select is(length((select value->>'token' from receipt)),64,'receipt has 256-bit random capability');
select is((select value->>'origin' from receipt),'https://tindung-preview.vercel.app','verified app origin is returned');
select isnt((select token_hash from public.push_receipts limit 1),(select value->>'token' from receipt),'only hash stored');
select is(public.record_push_receipt(repeat('0',64),'RECEIVED'),false,'wrong token rejected');
select is(public.record_push_receipt((select value->>'token' from receipt),'COMPLETED','BAD','FAILED'),false,'invalid results rejected');
select is(public.record_push_receipt((select value->>'token' from receipt),'RECEIVED'),true,'handler receipt accepted');
select is(public.record_push_receipt((select value->>'token' from receipt),'RECEIVED'),false,'received replay is a no-op');
select is(public.record_push_receipt((select value->>'token' from receipt),'COMPLETED','SUCCEEDED','FAILED'),true,'display and badge independently recorded');
select is(public.record_push_receipt((select value->>'token' from receipt),'COMPLETED','FAILED','SUCCEEDED'),false,'completion replay cannot overwrite');
select is((select notification_result||':'||badge_result from public.push_receipts limit 1),'SUCCEEDED:FAILED','first result preserved');
select is((select read_at is null from public.notifications where id='40000000-0000-0000-0000-000000000122'),true,'receipt does not mark notification read');
select public.complete_push_receipt_provider((select (value->>'id')::uuid from receipt),'ACCEPTED');
select is((select provider_result from public.push_receipts limit 1),'ACCEPTED','provider acceptance separate from receipt');
reset role;
update public.push_receipts set expires_at=now()-interval '1 second';
set local role service_role;
select is(public.record_push_receipt((select value->>'token' from receipt),'RECEIVED'),false,'expired capability rejected');
reset role;
update public.push_receipts set expires_at=now()+interval '1 hour';
update public.notifications set revision=2 where id='40000000-0000-0000-0000-000000000122';
set local role service_role;
select is(public.record_push_receipt((select value->>'token' from receipt),'RECEIVED'),false,'changed revision invalidates old target');
select throws_ok($$select public.prepare_push_receipt('50000000-0000-0000-0000-000000000122')$$,'22023','active delivery required','cannot prepare stale delivery');
create temporary table probe as select public.prepare_push_receipt(null,'30000000-0000-0000-0000-000000000122') as value;
select ok((select value->>'token' from probe) is not null,'labelled probe uses separate receipt without notification');
select throws_ok($$select public.prepare_push_receipt(null,'30000000-0000-0000-0000-000000000122')$$,'22023','probe rate limited','probe rate limited per subscription');
select is(public.record_push_receipt((select value->>'token' from probe),'COMPLETED','FAILED','UNSUPPORTED'),true,'completion can arrive before start receipt');
select is((select count(*) from public.notifications where idempotency_key='c122-fixture'),1::bigint,'probe adds no Notification Center card');
reset role;
update public.push_receipts set created_at=now()-interval '31 days';
set local role service_role;
select is(public.prune_push_receipts(),2,'30-day retention removes diagnostic metadata');
select is((select count(*) from public.push_deliveries where id='50000000-0000-0000-0000-000000000122'),1::bigint,'retention preserves delivery history');
reset role;
select * from finish();
rollback;
