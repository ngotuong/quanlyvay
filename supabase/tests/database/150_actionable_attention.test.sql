begin;

create extension if not exists pgtap with schema extensions;
select plan(20);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values (
  '20000000-0000-0000-0000-000000000150',
  'actionable_attention_owner@auth.local',
  now(),
  '{"provisioned_by_app":"true","username":"actionable_attention_owner","display_name":"Actionable Attention Owner","app_role":"OWNER"}'::jsonb
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000150', true);
set local role authenticated;

select public.create_counterparty('Đối tác actionable attention', null);

select public.create_loan_v3(
  (select id from public.counterparties where name = 'Đối tác actionable attention'),
  name, direction::public.loan_direction, 1000000::bigint, disbursement_date, term_days,
  15::smallint, 1.5::numeric, reminder_offset, 'attention-create-' || slug, null::text
)
from (values
  ('Chưa đóng lãi', 'unpaid', 'LENDING', '2026-08-01'::date, null::integer, 0::smallint),
  ('Đóng một phần', 'partial', 'LENDING', '2026-08-01'::date, null::integer, 0::smallint),
  ('Đã đóng đủ', 'full', 'LENDING', '2026-08-01'::date, null::integer, 0::smallint),
  ('Đã ứng trước', 'prepaid', 'BORROWING', '2026-08-01'::date, null::integer, 0::smallint),
  ('Đảo khoản đã đóng', 'reversed', 'LENDING', '2026-08-01'::date, null::integer, 0::smallint),
  ('Phát sinh kỳ kế tiếp', 'next-cycle', 'LENDING', '2026-08-01'::date, null::integer, 0::smallint),
  ('Nhắc sớm hai ngày', 'offset', 'BORROWING', '2026-08-01'::date, null::integer, 2::smallint),
  ('Quá hạn gốc đã đóng lãi', 'overdue', 'LENDING', '2026-07-01'::date, 15, 0::smallint),
  ('Khoản nợ xấu', 'bad-debt', 'LENDING', '2026-08-01'::date, null::integer, 0::smallint),
  ('Khoản đã tất toán', 'settled', 'BORROWING', '2026-08-01'::date, null::integer, 0::smallint)
) as fixtures(name, slug, direction, disbursement_date, term_days, reminder_offset);

select public.record_financial_transaction(
  (select id from public.loans where name = 'Đóng một phần'),
  'INTEREST_PAYMENT', '2026-08-10', 5000, 'attention-partial-payment', null, '2026-08-15'
);
select public.record_financial_transaction(
  (select id from public.loans where name = 'Đã đóng đủ'),
  'INTEREST_PAYMENT', '2026-08-10',
  (public.calculate_loan((select id from public.loans where name = 'Đã đóng đủ'), '2026-08-15') ->> 'interestBalanceVnd')::bigint,
  'attention-full-payment', null, '2026-08-15'
);
select public.record_financial_transaction(
  (select id from public.loans where name = 'Đã ứng trước'),
  'INTEREST_PAYMENT', '2026-08-10',
  (public.calculate_loan((select id from public.loans where name = 'Đã ứng trước'), '2026-08-15') ->> 'interestBalanceVnd')::bigint + 1000,
  'attention-prepayment', null, '2026-08-15'
);
select public.record_financial_transaction(
  (select id from public.loans where name = 'Đảo khoản đã đóng'),
  'INTEREST_PAYMENT', '2026-08-10',
  (public.calculate_loan((select id from public.loans where name = 'Đảo khoản đã đóng'), '2026-08-15') ->> 'interestBalanceVnd')::bigint,
  'attention-reversed-payment', null, '2026-08-15'
);
select public.reverse_transaction(
  (select id from public.transactions where idempotency_key = 'attention-reversed-payment'),
  '2026-08-10', 'Đảo khoản đóng lãi để kiểm tra nhắc lại', 'attention-reversed-payment-reversal', '2026-08-15'
);
select public.record_financial_transaction(
  (select id from public.loans where name = 'Phát sinh kỳ kế tiếp'),
  'INTEREST_PAYMENT', '2026-08-15',
  (public.calculate_loan((select id from public.loans where name = 'Phát sinh kỳ kế tiếp'), '2026-08-15') ->> 'interestBalanceVnd')::bigint,
  'attention-first-cycle-paid', null, '2026-08-30'
);
select public.record_financial_transaction(
  (select id from public.loans where name = 'Quá hạn gốc đã đóng lãi'),
  'INTEREST_PAYMENT', '2026-07-15',
  (public.calculate_loan((select id from public.loans where name = 'Quá hạn gốc đã đóng lãi'), '2026-08-10') ->> 'interestBalanceVnd')::bigint,
  'attention-overdue-interest-paid', null, '2026-08-10'
);
select public.record_lifecycle_event_v2(
  (select id from public.loans where name = 'Khoản nợ xấu'),
  'BAD_DEBT_START', '2026-08-05', 'attention-bad-debt-start', null,
  'Dừng nhắc lãi thường xuyên', '2026-08-10'
);
select public.settle_loan(
  (select id from public.loans where name = 'Khoản đã tất toán'),
  '2026-08-10', 'attention-settlement', 'Tất toán trước hạn'
);

create temporary table attention_at_tenth as
select public.get_management_dashboard('2026-08-10', '2026-08-10') as value;

select is(jsonb_array_length((select value -> 'upcoming' from attention_at_tenth)), 4, 'only four actionable first-cycle interest reminders remain');
select is(jsonb_array_length((select value -> 'overdue' from attention_at_tenth)), 1, 'one overdue-principal action remains');
select ok(exists(select 1 from attention_at_tenth, jsonb_array_elements(value -> 'upcoming') item where item ->> 'name' = 'Chưa đóng lãi'), 'unpaid interest remains actionable');
select is((select item ->> 'interestVnd' from attention_at_tenth, jsonb_array_elements(value -> 'upcoming') item where item ->> 'name' = 'Đóng một phần'), '10000', 'partial payment shows only the positive remainder');
select ok(not exists(select 1 from attention_at_tenth, jsonb_array_elements(value -> 'upcoming') item where item ->> 'name' = 'Đã đóng đủ'), 'fully paid interest is excluded');
select ok(not exists(select 1 from attention_at_tenth, jsonb_array_elements(value -> 'upcoming') item where item ->> 'name' = 'Đã ứng trước'), 'prepaid interest is excluded');
select ok(exists(select 1 from attention_at_tenth, jsonb_array_elements(value -> 'upcoming') item where item ->> 'name' = 'Đảo khoản đã đóng'), 'reversing a payment restores the action');
select ok(not exists(select 1 from attention_at_tenth, jsonb_array_elements(value -> 'upcoming') item where item ->> 'name' = 'Khoản nợ xấu'), 'bad debt is excluded from regular interest reminders');
select ok(not exists(select 1 from attention_at_tenth, jsonb_array_elements(value -> 'upcoming') item where item ->> 'name' = 'Khoản đã tất toán'), 'settled loan is excluded from regular interest reminders');
select is((select item ->> 'attentionType' from attention_at_tenth, jsonb_array_elements(value -> 'overdue') item limit 1), 'PRINCIPAL_OVERDUE', 'overdue principal has an explicit action type');
select is((select item ->> 'interestVnd' from attention_at_tenth, jsonb_array_elements(value -> 'overdue') item limit 1), '0', 'overdue principal stays visible after interest was paid in full');
select is((select item ->> 'attentionType' from attention_at_tenth, jsonb_array_elements(value -> 'upcoming') item limit 1), 'INTEREST_DUE', 'interest reminder has an explicit action type');
select is((select item ->> 'name' from attention_at_tenth, jsonb_array_elements(value -> 'upcoming') item limit 1), 'Nhắc sớm hai ngày', 'interest actions are ordered by reminder date');
select is((select item ->> 'reminderDate' from attention_at_tenth, jsonb_array_elements(value -> 'upcoming') item where item ->> 'name' = 'Nhắc sớm hai ngày'), '2026-08-13', 'early reminder date is returned separately');
select is((select item ->> 'periodEndDate' from attention_at_tenth, jsonb_array_elements(value -> 'upcoming') item where item ->> 'name' = 'Nhắc sớm hai ngày'), '2026-08-15', 'interest period end is returned separately');
select is((select item -> 'reminderDate' from attention_at_tenth, jsonb_array_elements(value -> 'overdue') item limit 1), 'null'::jsonb, 'principal-overdue action has no interest reminder date');

create temporary table attention_next_cycle as
select public.get_management_dashboard('2026-08-16', '2026-08-16') as value;

select ok(exists(select 1 from attention_next_cycle, jsonb_array_elements(value -> 'upcoming') item where item ->> 'name' = 'Phát sinh kỳ kế tiếp'), 'a later positive cycle becomes actionable again');
select is((select item ->> 'reminderDate' from attention_next_cycle, jsonb_array_elements(value -> 'upcoming') item where item ->> 'name' = 'Phát sinh kỳ kế tiếp'), '2026-08-30', 'later cycle uses its own reminder date');
select cmp_ok((select item ->> 'interestVnd' from attention_next_cycle, jsonb_array_elements(value -> 'upcoming') item where item ->> 'name' = 'Phát sinh kỳ kế tiếp')::bigint, '>', 0::bigint, 'later cycle reappears only with positive balance');
select ok((select bool_and((item ->> 'interestVnd')::bigint > 0) from attention_at_tenth, jsonb_array_elements(value -> 'upcoming') item), 'every regular interest reminder is actionable');

select * from finish();
rollback;
