begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values ('10000000-0000-0000-0000-000000000051', 'c51-owner@example.test');
insert into public.profiles (user_id, username, display_name, role, is_active, must_change_password)
values ('10000000-0000-0000-0000-000000000051', 'c51_owner', 'C51 Owner', 'OWNER', true, true);
insert into public.counterparties (id, name) values ('20000000-0000-0000-0000-000000000051', 'C51');
insert into public.loans (id, counterparty_id, name, direction, original_principal_vnd, disbursement_date, term_days, interest_cycle_days, interest_reminder_offset_days, initial_daily_rate_percent)
values ('30000000-0000-0000-0000-000000000051', '20000000-0000-0000-0000-000000000051', 'C51 loan', 'LENDING', 500000000, date '2026-09-01', null, 30, 0, 0.1);
insert into public.transactions (loan_id, type, transaction_date, amount_vnd, idempotency_key)
values ('30000000-0000-0000-0000-000000000051', 'DISBURSEMENT', date '2026-09-01', 500000000, 'c51-disbursement'),
       ('30000000-0000-0000-0000-000000000051', 'INTEREST_PAYMENT', date '2026-09-10', 100000, 'c51-interest-day');
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000051', true);
set local role authenticated;

select is(public.preview_principal_restructure('30000000-0000-0000-0000-000000000051', date '2026-09-10', 100000000) ->> 'principalBeforeVnd', '500000000', 'same-day principal preview keeps the pre-operation balance');
select is(public.preview_principal_restructure('30000000-0000-0000-0000-000000000051', date '2026-09-10', 100000000) ->> 'interestToSettleVnd', '4400000', 'same-day interest payment is included once');
select lives_ok($$select public.restructure_loan_principal('30000000-0000-0000-0000-000000000051', date '2026-09-10', 100000000, 500000000, 4400000, 'c51-restructure', null, date '2026-09-10')$$, 'same-day payment and restructure commit atomically');
select is(public.calculate_loan('30000000-0000-0000-0000-000000000051', date '2026-09-10') ->> 'principalOutstandingVnd', '400000000', 'same-day restructure leaves the expected principal');
select public.record_lifecycle_event_v2('30000000-0000-0000-0000-000000000051', 'RATE_CHANGE', date '2026-09-11', 'c51-later', '0.1', null, date '2026-09-11');
select throws_ok($$select public.complete_password_change()$$, '42501', null, 'authenticated cannot clear first-login enforcement');
select is((select must_change_password from public.profiles where user_id = auth.uid()), true, 'first-login flag remains for direct RPC callers');
select throws_ok($$select public.register_push_subscription('https://127.0.0.1/push', 'key', 'auth')$$, '22023', null, 'private push endpoints are rejected');
select is(has_function_privilege('authenticated', 'public.complete_password_change()', 'EXECUTE'), false, 'password completion RPC is server-only');
select throws_ok($$select public.reverse_principal_restructure((select id from public.loan_principal_restructures where idempotency_key = 'c51-restructure'), date '2026-09-11', 'later activity guard', 'c51-reverse', date '2026-09-11')$$, '23514', null, 'reversal rejects a restructure with later active activity');
select is((select count(*) from public.loan_principal_restructures where idempotency_key = 'c51-restructure'), 1::bigint, 'same-day remediation writes one restructure ledger');

reset role;
select * from finish();
rollback;
