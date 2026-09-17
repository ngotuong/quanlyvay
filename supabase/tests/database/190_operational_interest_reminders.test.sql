begin;

create extension if not exists pgtap with schema extensions;
select plan(22);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values (
  '20000000-0000-0000-0000-000000000190', 'operational_reminder_owner@auth.local', now(),
  '{"provisioned_by_app":"true","username":"operational_reminder_owner","display_name":"Operational Reminder Owner","app_role":"OWNER"}'::jsonb
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000190', true);
set local role authenticated;
select public.create_counterparty('Đối tác C43', null);
select public.create_loan_v3(
  (select id from public.counterparties where name = 'Đối tác C43'),
  'C43 khoản 700', 'LENDING'::public.loan_direction, 700000000::bigint,
  '2026-08-19'::date, null::integer, 30::smallint, 3::numeric, 1::smallint,
  'c43-700', null
);
select public.create_loan_v3(
  (select id from public.counterparties where name = 'Đối tác C43'),
  'C43 khoản 400', 'LENDING'::public.loan_direction, 400000000::bigint,
  '2026-08-20'::date, null::integer, 30::smallint, 3::numeric, 2::smallint,
  'c43-400', null
);

reset role;
select is((select private.next_interest_due_date(disbursement_date, maturity_date, interest_cycle_days, '2026-09-16') from public.loans where name = 'C43 khoản 700'), '2026-09-17'::date, '700 loan contractual period ends 17 September');
select is((select private.next_interest_due_date(disbursement_date, maturity_date, interest_cycle_days, '2026-09-16') from public.loans where name = 'C43 khoản 400'), '2026-09-18'::date, '400 loan contractual period ends 18 September');
select is((select private.next_interest_reminder_date(disbursement_date, maturity_date, interest_cycle_days, interest_reminder_offset_days, '2026-09-16') from public.loans where name = 'C43 khoản 700'), '2026-09-16'::date, '700 loan operational collection date is 16 September');
select is((select private.next_interest_reminder_date(disbursement_date, maturity_date, interest_cycle_days, interest_reminder_offset_days, '2026-09-16') from public.loans where name = 'C43 khoản 400'), '2026-09-16'::date, '400 loan operational collection date is 16 September');

reset role;
set local role service_role;
select is(public.generate_due_notifications('2026-09-15'), 0, 'neither early collection date has arrived on 15 September');
select is(public.generate_due_notifications('2026-09-16'), 2, 'both loans create a reminder on their operational collection day');
select is((select count(*) from public.notifications n join public.loans l on l.id=n.loan_id where l.name like 'C43 khoản %' and n.superseded_at is null), 2::bigint, 'each obligation has one active card');
select is((select count(*) from public.notifications n join public.loans l on l.id=n.loan_id where l.name like 'C43 khoản %' and n.body like '%Quá hạn%'), 0::bigint, 'collection day has no overdue line');
select is(public.generate_due_notifications('2026-09-17'), 2, 'both loans refresh the next day, including the not-yet-contractually-mature 400 loan');
select is(public.generate_due_notifications('2026-09-17'), 0, 'same-day retry does not duplicate a reminder');
select is((select count(*) from public.notifications n join public.loans l on l.id=n.loan_id where l.name like 'C43 khoản %' and n.notification_date='2026-09-17' and n.revision=2 and n.body like E'%\nQuá hạn : 1 ngày'), 2::bigint, 'both active cards show one overdue day and revision two');
select is((select obligation_date from public.notifications n join public.loans l on l.id=n.loan_id where l.name='C43 khoản 700' and n.superseded_at is null), '2026-09-17'::date, '700 card identity retains contractual period end');
select is((select obligation_date from public.notifications n join public.loans l on l.id=n.loan_id where l.name='C43 khoản 400' and n.superseded_at is null), '2026-09-18'::date, '400 card identity retains contractual period end');
select is((select count(distinct thread_key) from public.notifications n join public.loans l on l.id=n.loan_id where l.name like 'C43 khoản %' and n.superseded_at is null), 2::bigint, 'refreshed cards preserve two distinct obligation threads');
select is((select count(*) from public.notifications n join public.loans l on l.id=n.loan_id where l.name like 'C43 khoản %' and n.superseded_at is null), 2::bigint, 'refresh does not create a third active card');
select is((select n.body like '%' || replace(to_char((public.calculate_loan(l.id, n.obligation_date)->>'interestBalanceVnd')::bigint, 'FM999,999,999,999,990'), ',', '.') || '%' from public.notifications n join public.loans l on l.id=n.loan_id where l.name='C43 khoản 400' and n.superseded_at is null), true, '400 reminder amount remains authoritative at contractual period end');
select is(public.generate_due_notifications('2026-09-18'), 2, 'both unpaid obligations continue to refresh on the following day');
select is((select count(*) from public.notifications n join public.loans l on l.id=n.loan_id where l.name like 'C43 khoản %' and n.notification_date='2026-09-18' and n.body like E'%\nQuá hạn : 2 ngày'), 2::bigint, 'both reminders count overdue days from operational date, not contractual end');

reset role;
set local role authenticated;
select lives_ok(
  $$select public.record_financial_transaction(
    (select id from public.loans where name='C43 khoản 400'),
    'INTEREST_PAYMENT', '2026-09-18',
    (public.calculate_loan((select id from public.loans where name='C43 khoản 400'), '2026-09-18')->>'interestBalanceVnd')::bigint,
    'c43-400-interest-paid', null, '2026-09-19'
  )$$,
  'full contractual interest can be recorded without changing the loan schedule'
);
reset role;
set local role service_role;
select is(public.generate_due_notifications('2026-09-19'), 1, 'paid 400 loan stops refreshing while unpaid 700 loan continues');
select is((select revision from public.notifications n join public.loans l on l.id=n.loan_id where l.name='C43 khoản 400' and n.superseded_at is null), 3, 'paid 400 card retains its previous revision');
select is((select n.body like E'%\nQuá hạn : 3 ngày' from public.notifications n join public.loans l on l.id=n.loan_id where l.name='C43 khoản 700' and n.superseded_at is null), true, 'unpaid 700 card continues from operational due date');

select * from finish();
rollback;
