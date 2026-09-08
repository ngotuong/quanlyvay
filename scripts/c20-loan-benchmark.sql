-- Disposable C20 test database only. Every fixture rolls back.
\set ON_ERROR_STOP on
begin;
set local statement_timeout='180s';
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
('20000000-0000-0000-0000-000000000161','c20_benchmark@auth.local',now(),'{"provisioned_by_app":"true","username":"c20_benchmark","display_name":"C20 fake benchmark","app_role":"OWNER"}');
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000161',true);
insert into public.counterparties(id,name) values ('30000000-0000-0000-0000-000000000161','C20 benchmark fake');
insert into public.loans(counterparty_id,name,direction,original_principal_vnd,disbursement_date,term_days,interest_cycle_days,initial_daily_rate_percent)
select '30000000-0000-0000-0000-000000000161','C20 benchmark '||lpad(n::text,4,'0'),case when n%2=0 then 'LENDING'::public.loan_direction else 'BORROWING'::public.loan_direction end,
100000000,'2025-01-01',null,30,0.1 from generate_series(1,1000) n;
insert into public.transactions(loan_id,type,transaction_date,amount_vnd,idempotency_key)
select id,'DISBURSEMENT',disbursement_date,original_principal_vnd,'benchmark-'||id from public.loans where counterparty_id='30000000-0000-0000-0000-000000000161';
insert into public.transactions(loan_id,type,transaction_date,amount_vnd,idempotency_key)
select l.id,'INTEREST_PAYMENT','2025-01-01'::date+n*30,1000000,'benchmark-payment-'||l.id||'-'||n
from public.loans l cross join generate_series(1,12) n where counterparty_id='30000000-0000-0000-0000-000000000161';
set local role authenticated;
do $$declare started timestamptz; result jsonb; begin
  started:=clock_timestamp(); result:=public.list_loan_summaries('2026-09-07','C20 benchmark');
  raise notice 'C20 BENCH before: milliseconds=%, bytes=%, items=%',extract(epoch from clock_timestamp()-started)*1000,octet_length(result::text),jsonb_array_length(result->'items');
  started:=clock_timestamp(); result:=public.list_loan_summaries_page('2026-09-07','C20 benchmark');
  raise notice 'C20 BENCH after: milliseconds=%, bytes=%, items=%, total=%',extract(epoch from clock_timestamp()-started)*1000,octet_length(result::text),jsonb_array_length(result->'items'),result->>'totalCount';
end $$;
rollback;
