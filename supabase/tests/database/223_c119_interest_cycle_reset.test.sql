begin;
create extension if not exists pgtap with schema extensions;
select plan(13);
insert into auth.users(id,email) values('10000000-0000-0000-0000-000000000119','c119@example.test');
insert into public.profiles(user_id,username,display_name,role,is_active)
values('10000000-0000-0000-0000-000000000119','c119_owner','C119 Owner','OWNER',true);
insert into public.counterparties(id,name) values('20000000-0000-0000-0000-000000000119','C119 synthetic');
insert into public.loans(id,counterparty_id,name,direction,original_principal_vnd,disbursement_date,term_days,interest_cycle_days,interest_reminder_offset_days,initial_daily_rate_percent)
values('30000000-0000-0000-0000-000000000119','20000000-0000-0000-0000-000000000119','C119 synthetic','LENDING',1000000,'2026-09-01',null,15,1,0.2);
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000119',true);
set local role authenticated;
select public.record_lifecycle_event_v2('30000000-0000-0000-0000-000000000119','RATE_CHANGE','2026-09-27','c119-zero',0);
select public.record_lifecycle_event_v2('30000000-0000-0000-0000-000000000119','RATE_CHANGE','2026-11-07','c119-rate',1.5);
select lives_ok($$select public.record_lifecycle_event_v3('30000000-0000-0000-0000-000000000119','RATE_CHANGE','2026-11-07','c119-reset',1.5,null,true)$$,'attach reset to existing rate event');
select is((select count(*) from public.loan_lifecycle_events where loan_id='30000000-0000-0000-0000-000000000119'),2::bigint,'rate event is not duplicated');
select lives_ok($$select public.record_lifecycle_event_v3('30000000-0000-0000-0000-000000000119','RATE_CHANGE','2026-11-07','c119-reset',1.5,null,true)$$,'retry is idempotent');
select throws_ok($$select public.record_lifecycle_event_v3('30000000-0000-0000-0000-000000000119','RATE_CHANGE','2026-11-07','c119-reset',2,null,true)$$,'23505',null,'reject different retry rate');
select is(public.get_loan_schedule_summary('30000000-0000-0000-0000-000000000119','2026-11-12')->>'nextInterestDueDate','2026-11-20','retain early reminder offset');
select is(public.get_loan_schedule_summary('30000000-0000-0000-0000-000000000119','2026-11-12')->>'nextInterestPeriodEndDate','2026-11-21','new cycle closes 21 November');
select is((select item->>'reminderDate' from jsonb_array_elements(public.get_management_dashboard_bundle_v5(
 '2026-11-01','2026-11-12','2026-10-01','2026-10-12','2026-11-12','2026-11-12','2026-11-01','2026-11-30','2026-11-12')->'dashboard'->'upcoming') item
 where item->>'name'='C119 synthetic'),'2026-11-20','calendar reminder recomputes across reset boundary');
select is((select item->>'accruedInterestVnd' from jsonb_array_elements(public.calculate_loan('30000000-0000-0000-0000-000000000119','2026-11-21')->'periods') item where item->>'startDate'='2026-11-07'),'15000','full new cycle accrues 1.5 percent');
select is((select item->>'endDate' from jsonb_array_elements(public.calculate_loan('30000000-0000-0000-0000-000000000119','2026-12-06')->'periods') item where item->>'startDate'='2026-11-22'),'2026-12-06','next cycle has fifteen days');
select is((select count(*) from public.transactions where loan_id='30000000-0000-0000-0000-000000000119'),0::bigint,'reset creates no cash transactions');
select throws_ok($$update public.loan_interest_cycle_resets set effective_date='2026-11-08' where loan_id='30000000-0000-0000-0000-000000000119'$$,'42501',null,'no direct write access');
reset role;
select ok(exists(select 1 from public.audit_logs where table_name='loan_interest_cycle_resets'),'reset audited');
select is((select count(*) from public.loan_interest_cycle_resets where loan_id='30000000-0000-0000-0000-000000000119'),1::bigint,'one reset only');
select * from finish();
rollback;
