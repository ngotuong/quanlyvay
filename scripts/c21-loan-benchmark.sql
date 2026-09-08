-- Disposable C20/C21 test database only. Every fixture rolls back.
\set ON_ERROR_STOP on
begin;
set local statement_timeout = '180s';

insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
('20000000-0000-0000-0000-000000000171','c21_benchmark@auth.local',now(),'{"provisioned_by_app":"true","username":"c21_benchmark","display_name":"C21 fake benchmark","app_role":"OWNER"}');
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000171',true);
insert into public.counterparties(id,name) values ('30000000-0000-0000-0000-000000000171','C21 benchmark fake');
insert into public.loans(counterparty_id,name,direction,original_principal_vnd,disbursement_date,term_days,interest_cycle_days,initial_daily_rate_percent)
select '30000000-0000-0000-0000-000000000171','C21 benchmark '||lpad(n::text,4,'0'),case when n%2=0 then 'LENDING'::public.loan_direction else 'BORROWING'::public.loan_direction end,
100000000,'2025-01-01',null,30,0.1 from generate_series(1,1000) n;
insert into public.transactions(loan_id,type,transaction_date,amount_vnd,idempotency_key)
select id,'DISBURSEMENT',disbursement_date,original_principal_vnd,'c21-benchmark-'||id from public.loans where counterparty_id='30000000-0000-0000-0000-000000000171';
insert into public.transactions(loan_id,type,transaction_date,amount_vnd,idempotency_key)
select l.id,'INTEREST_PAYMENT','2025-01-01'::date+n*30,1000000,'c21-benchmark-payment-'||l.id||'-'||n
from public.loans l cross join generate_series(1,12) n where counterparty_id='30000000-0000-0000-0000-000000000171';

set local role authenticated;
select public.list_loan_summaries_page('2026-09-08','C21 benchmark',null,null,null,null,'newest',1,25) is not null as warmed_up;
create temporary table c21_benchmark_runs(run integer, milliseconds numeric, bytes integer, items integer, total integer);
do $$
declare
  started timestamptz;
  result jsonb;
  run_number integer;
begin
  for run_number in 1..7 loop
    started := clock_timestamp();
    result := public.list_loan_summaries_page('2026-09-08','C21 benchmark',null,null,null,null,'newest',1,25);
    insert into c21_benchmark_runs values (
      run_number,
      extract(epoch from clock_timestamp() - started) * 1000,
      octet_length(result::text),
      jsonb_array_length(result->'items'),
      (result->>'totalCount')::integer
    );
  end loop;
end $$;

table c21_benchmark_runs;
do $$
declare
  median_ms numeric;
  worst_ms numeric;
  largest_payload integer;
begin
  select percentile_cont(0.5) within group (order by milliseconds), max(milliseconds), max(bytes)
  into median_ms, worst_ms, largest_payload
  from c21_benchmark_runs;

  raise notice 'C21 BENCH: median_ms=%, worst_ms=%, largest_bytes=%, fixture_loans=1000, fixture_transactions=13000',
    round(median_ms, 3), round(worst_ms, 3), largest_payload;

  if median_ms > 2000 then raise exception 'C21 median threshold failed: % ms', median_ms; end if;
  if worst_ms > 3000 then raise exception 'C21 worst threshold failed: % ms', worst_ms; end if;
  if largest_payload > 50000 then raise exception 'C21 payload threshold failed: % bytes', largest_payload; end if;
  if exists(select 1 from c21_benchmark_runs where items <> 25 or total <> 1000) then
    raise exception 'C21 page shape/count threshold failed';
  end if;
end $$;

reset role;
explain (analyze, buffers, format text)
select * from private.loan_listing_facts('2026-09-08','C21 benchmark',null,null)
order by loan_id
limit 25;

rollback;
