begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

create function pg_temp.run_financial_fixture(
  fixture_id text,
  fixture_input jsonb
)
returns jsonb
language plpgsql
as $$
declare
  counterparty_id uuid := extensions.gen_random_uuid();
  loan_id uuid := extensions.gen_random_uuid();
  event jsonb;
  transaction_id uuid;
  original_transaction_id uuid;
  original_amount bigint;
  transaction_map jsonb := '{}'::jsonb;
  result jsonb;
  normalized_periods jsonb;
begin
  insert into public.counterparties (id, name)
  values (counterparty_id, 'Fixture ' || fixture_id);

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
    loan_id,
    counterparty_id,
    fixture_id,
    (fixture_input ->> 'direction')::public.loan_direction,
    (fixture_input ->> 'originalPrincipalVnd')::bigint,
    (fixture_input ->> 'disbursementDate')::date,
    (fixture_input ->> 'termDays')::integer,
    (fixture_input ->> 'interestCycleDays')::smallint,
    (fixture_input ->> 'initialDailyRatePercent')::numeric
  );

  for event in
    select value from jsonb_array_elements(fixture_input -> 'events')
  loop
    case event ->> 'type'
      when 'INTEREST_PAYMENT' then
        insert into public.transactions (
          loan_id, type, transaction_date, amount_vnd, note, idempotency_key
        ) values (
          loan_id,
          'INTEREST_PAYMENT',
          (event ->> 'date')::date,
          (event ->> 'amountVnd')::bigint,
          event ->> 'note',
          fixture_id || ':' || (event ->> 'id')
        ) returning id into transaction_id;
        transaction_map := transaction_map || jsonb_build_object(event ->> 'id', transaction_id::text);

      when 'PRINCIPAL_PAYMENT' then
        insert into public.transactions (
          loan_id, type, transaction_date, amount_vnd, note, idempotency_key
        ) values (
          loan_id,
          'PRINCIPAL_PAYMENT',
          (event ->> 'date')::date,
          (event ->> 'amountVnd')::bigint,
          event ->> 'note',
          fixture_id || ':' || (event ->> 'id')
        ) returning id into transaction_id;
        transaction_map := transaction_map || jsonb_build_object(event ->> 'id', transaction_id::text);

      when 'RATE_CHANGE' then
        insert into public.loan_lifecycle_events (
          loan_id, event_type, effective_date, daily_rate_percent, idempotency_key
        ) values (
          loan_id,
          'RATE_CHANGE',
          (event ->> 'date')::date,
          (event ->> 'dailyRatePercent')::numeric,
          fixture_id || ':' || (event ->> 'id')
        );

      when 'BAD_DEBT_START' then
        insert into public.loan_lifecycle_events (
          loan_id, event_type, effective_date, idempotency_key
        ) values (
          loan_id,
          'BAD_DEBT_START',
          (event ->> 'date')::date,
          fixture_id || ':' || (event ->> 'id')
        );

      when 'INTEREST_RESUME' then
        insert into public.loan_lifecycle_events (
          loan_id, event_type, effective_date, daily_rate_percent, idempotency_key
        ) values (
          loan_id,
          'INTEREST_RESUME',
          (event ->> 'date')::date,
          (event ->> 'dailyRatePercent')::numeric,
          fixture_id || ':' || (event ->> 'id')
        );

      when 'SETTLEMENT' then
        insert into public.loan_lifecycle_events (
          loan_id, event_type, effective_date, idempotency_key
        ) values (
          loan_id,
          'SETTLEMENT',
          (event ->> 'date')::date,
          fixture_id || ':' || (event ->> 'id') || ':event'
        );

        insert into public.transactions (
          loan_id, type, transaction_date, amount_vnd, idempotency_key
        ) values (
          loan_id,
          'PRINCIPAL_PAYMENT',
          (event ->> 'date')::date,
          (event ->> 'principalAmountVnd')::bigint,
          fixture_id || ':' || (event ->> 'id') || ':principal'
        );

        if (event ->> 'interestAmountVnd')::bigint > 0 then
          insert into public.transactions (
            loan_id, type, transaction_date, amount_vnd, idempotency_key
          ) values (
            loan_id,
            'INTEREST_PAYMENT',
            (event ->> 'date')::date,
            (event ->> 'interestAmountVnd')::bigint,
            fixture_id || ':' || (event ->> 'id') || ':interest'
          );
        end if;

      when 'REVERSAL' then
        original_transaction_id := (transaction_map ->> (event ->> 'reversesTransactionId'))::uuid;
        select amount_vnd into strict original_amount
        from public.transactions
        where id = original_transaction_id;

        insert into public.transactions (
          loan_id,
          type,
          transaction_date,
          amount_vnd,
          note,
          reversal_of_id,
          idempotency_key
        ) values (
          loan_id,
          'REVERSAL',
          (event ->> 'date')::date,
          original_amount,
          event ->> 'note',
          original_transaction_id,
          fixture_id || ':' || (event ->> 'id')
        );

      else
        raise exception 'Unsupported fixture event: %', event ->> 'type';
    end case;
  end loop;

  result := public.calculate_loan(
    loan_id,
    (fixture_input ->> 'asOfDate')::date
  ) - 'loanId' - 'asOfDate';

  select coalesce(
    jsonb_agg(value - 'openingPrincipalVnd' - 'closingPrincipalVnd' order by ordinal),
    '[]'::jsonb
  ) into normalized_periods
  from jsonb_array_elements(result -> 'periods') with ordinality as period(value, ordinal);

  return jsonb_set(result, '{periods}', normalized_periods);
end;
$$;

select is(
  pg_temp.run_financial_fixture(
    'base_15_day_cycle',
    $json${"direction":"LENDING","originalPrincipalVnd":"100000000","disbursementDate":"2026-08-01","termDays":30,"interestCycleDays":15,"initialDailyRatePercent":"0.1","asOfDate":"2026-08-30","events":[]}$json$::jsonb
  ),
  $json${"maturityDate":"2026-08-30","status":"ACTIVE","principalOutstandingVnd":"100000000","interestBalanceVnd":"3000000","periods":[{"kind":"SCHEDULED","startDate":"2026-08-01","endDate":"2026-08-15","dayCount":15,"segments":[{"startDate":"2026-08-01","endDate":"2026-08-15","dayCount":15,"principalVnd":"100000000","dailyRatePercent":"0.1"}],"openingInterestBalanceVnd":"0","accruedInterestVnd":"1500000","interestPaymentsVnd":"0","closingInterestBalanceVnd":"1500000"},{"kind":"SCHEDULED","startDate":"2026-08-16","endDate":"2026-08-30","dayCount":15,"segments":[{"startDate":"2026-08-16","endDate":"2026-08-30","dayCount":15,"principalVnd":"100000000","dailyRatePercent":"0.1"}],"openingInterestBalanceVnd":"1500000","accruedInterestVnd":"1500000","interestPaymentsVnd":"0","closingInterestBalanceVnd":"3000000"}]}$json$::jsonb,
  'fixture base_15_day_cycle matches the C2 oracle'
);

select is(
  pg_temp.run_financial_fixture(
    'base_30_day_cycle_short_final',
    $json${"direction":"BORROWING","originalPrincipalVnd":"200000000","disbursementDate":"2026-08-01","termDays":45,"interestCycleDays":30,"initialDailyRatePercent":"0.05","asOfDate":"2026-09-14","events":[]}$json$::jsonb
  ),
  $json${"maturityDate":"2026-09-14","status":"ACTIVE","principalOutstandingVnd":"200000000","interestBalanceVnd":"4500000","periods":[{"kind":"SCHEDULED","startDate":"2026-08-01","endDate":"2026-08-30","dayCount":30,"segments":[{"startDate":"2026-08-01","endDate":"2026-08-30","dayCount":30,"principalVnd":"200000000","dailyRatePercent":"0.05"}],"openingInterestBalanceVnd":"0","accruedInterestVnd":"3000000","interestPaymentsVnd":"0","closingInterestBalanceVnd":"3000000"},{"kind":"SCHEDULED","startDate":"2026-08-31","endDate":"2026-09-14","dayCount":15,"segments":[{"startDate":"2026-08-31","endDate":"2026-09-14","dayCount":15,"principalVnd":"200000000","dailyRatePercent":"0.05"}],"openingInterestBalanceVnd":"3000000","accruedInterestVnd":"1500000","interestPaymentsVnd":"0","closingInterestBalanceVnd":"4500000"}]}$json$::jsonb,
  'fixture base_30_day_cycle_short_final matches the C2 oracle'
);

select is(
  pg_temp.run_financial_fixture(
    'partial_principal_mid_period',
    $json${"direction":"LENDING","originalPrincipalVnd":"100000000","disbursementDate":"2026-08-01","termDays":30,"interestCycleDays":15,"initialDailyRatePercent":"0.1","asOfDate":"2026-08-30","events":[{"id":"partial-p-1","date":"2026-08-10","type":"PRINCIPAL_PAYMENT","amountVnd":"40000000","note":"Trả gốc một phần"}]}$json$::jsonb
  ),
  $json${"maturityDate":"2026-08-30","status":"ACTIVE","principalOutstandingVnd":"60000000","interestBalanceVnd":"2200000","periods":[{"kind":"SCHEDULED","startDate":"2026-08-01","endDate":"2026-08-15","dayCount":15,"segments":[{"startDate":"2026-08-01","endDate":"2026-08-10","dayCount":10,"principalVnd":"100000000","dailyRatePercent":"0.1"},{"startDate":"2026-08-11","endDate":"2026-08-15","dayCount":5,"principalVnd":"60000000","dailyRatePercent":"0.1"}],"openingInterestBalanceVnd":"0","accruedInterestVnd":"1300000","interestPaymentsVnd":"0","closingInterestBalanceVnd":"1300000"},{"kind":"SCHEDULED","startDate":"2026-08-16","endDate":"2026-08-30","dayCount":15,"segments":[{"startDate":"2026-08-16","endDate":"2026-08-30","dayCount":15,"principalVnd":"60000000","dailyRatePercent":"0.1"}],"openingInterestBalanceVnd":"1300000","accruedInterestVnd":"900000","interestPaymentsVnd":"0","closingInterestBalanceVnd":"2200000"}]}$json$::jsonb,
  'fixture partial_principal_mid_period matches the C2 oracle'
);

select is(
  pg_temp.run_financial_fixture(
    'rate_change_effective_date',
    $json${"direction":"LENDING","originalPrincipalVnd":"100000000","disbursementDate":"2026-08-01","termDays":15,"interestCycleDays":15,"initialDailyRatePercent":"0.1","asOfDate":"2026-08-15","events":[{"id":"rate-1","date":"2026-08-08","type":"RATE_CHANGE","dailyRatePercent":"0.2"}]}$json$::jsonb
  ),
  $json${"maturityDate":"2026-08-15","status":"ACTIVE","principalOutstandingVnd":"100000000","interestBalanceVnd":"2300000","periods":[{"kind":"SCHEDULED","startDate":"2026-08-01","endDate":"2026-08-15","dayCount":15,"segments":[{"startDate":"2026-08-01","endDate":"2026-08-07","dayCount":7,"principalVnd":"100000000","dailyRatePercent":"0.1"},{"startDate":"2026-08-08","endDate":"2026-08-15","dayCount":8,"principalVnd":"100000000","dailyRatePercent":"0.2"}],"openingInterestBalanceVnd":"0","accruedInterestVnd":"2300000","interestPaymentsVnd":"0","closingInterestBalanceVnd":"2300000"}]}$json$::jsonb,
  'fixture rate_change_effective_date matches the C2 oracle'
);

select is(
  pg_temp.run_financial_fixture(
    'interest_under_over_carry',
    $json${"direction":"LENDING","originalPrincipalVnd":"100000000","disbursementDate":"2026-08-01","termDays":30,"interestCycleDays":15,"initialDailyRatePercent":"0.1","asOfDate":"2026-08-30","events":[{"id":"interest-pay-1","date":"2026-08-15","type":"INTEREST_PAYMENT","amountVnd":"1000000","note":"Thanh toán thiếu"},{"id":"interest-pay-2","date":"2026-08-30","type":"INTEREST_PAYMENT","amountVnd":"2200000","note":"Thanh toán thừa"}]}$json$::jsonb
  ),
  $json${"maturityDate":"2026-08-30","status":"ACTIVE","principalOutstandingVnd":"100000000","interestBalanceVnd":"-200000","periods":[{"kind":"SCHEDULED","startDate":"2026-08-01","endDate":"2026-08-15","dayCount":15,"segments":[{"startDate":"2026-08-01","endDate":"2026-08-15","dayCount":15,"principalVnd":"100000000","dailyRatePercent":"0.1"}],"openingInterestBalanceVnd":"0","accruedInterestVnd":"1500000","interestPaymentsVnd":"1000000","closingInterestBalanceVnd":"500000"},{"kind":"SCHEDULED","startDate":"2026-08-16","endDate":"2026-08-30","dayCount":15,"segments":[{"startDate":"2026-08-16","endDate":"2026-08-30","dayCount":15,"principalVnd":"100000000","dailyRatePercent":"0.1"}],"openingInterestBalanceVnd":"500000","accruedInterestVnd":"1500000","interestPaymentsVnd":"2200000","closingInterestBalanceVnd":"-200000"}]}$json$::jsonb,
  'fixture interest_under_over_carry matches the C2 oracle'
);

select is(
  pg_temp.run_financial_fixture(
    'early_settlement',
    $json${"direction":"LENDING","originalPrincipalVnd":"80000000","disbursementDate":"2026-08-01","termDays":60,"interestCycleDays":15,"initialDailyRatePercent":"0.075","asOfDate":"2026-08-22","events":[{"id":"settlement-interest-1","date":"2026-08-15","type":"INTEREST_PAYMENT","amountVnd":"900000"},{"id":"settlement-1","date":"2026-08-22","type":"SETTLEMENT","principalAmountVnd":"80000000","interestAmountVnd":"420000"}]}$json$::jsonb
  ),
  $json${"maturityDate":"2026-09-29","status":"SETTLED","principalOutstandingVnd":"0","interestBalanceVnd":"0","periods":[{"kind":"SCHEDULED","startDate":"2026-08-01","endDate":"2026-08-15","dayCount":15,"segments":[{"startDate":"2026-08-01","endDate":"2026-08-15","dayCount":15,"principalVnd":"80000000","dailyRatePercent":"0.075"}],"openingInterestBalanceVnd":"0","accruedInterestVnd":"900000","interestPaymentsVnd":"900000","closingInterestBalanceVnd":"0"},{"kind":"SETTLEMENT","startDate":"2026-08-16","endDate":"2026-08-22","dayCount":7,"segments":[{"startDate":"2026-08-16","endDate":"2026-08-22","dayCount":7,"principalVnd":"80000000","dailyRatePercent":"0.075"}],"openingInterestBalanceVnd":"0","accruedInterestVnd":"420000","interestPaymentsVnd":"420000","closingInterestBalanceVnd":"0"}]}$json$::jsonb,
  'fixture early_settlement matches the C2 oracle'
);

select is(
  pg_temp.run_financial_fixture(
    'overdue_without_penalty',
    $json${"direction":"BORROWING","originalPrincipalVnd":"50000000","disbursementDate":"2026-08-01","termDays":10,"interestCycleDays":15,"initialDailyRatePercent":"0.08","asOfDate":"2026-08-15","events":[]}$json$::jsonb
  ),
  $json${"maturityDate":"2026-08-10","status":"OVERDUE","principalOutstandingVnd":"50000000","interestBalanceVnd":"600000","periods":[{"kind":"SCHEDULED","startDate":"2026-08-01","endDate":"2026-08-10","dayCount":10,"segments":[{"startDate":"2026-08-01","endDate":"2026-08-10","dayCount":10,"principalVnd":"50000000","dailyRatePercent":"0.08"}],"openingInterestBalanceVnd":"0","accruedInterestVnd":"400000","interestPaymentsVnd":"0","closingInterestBalanceVnd":"400000"},{"kind":"OVERDUE","startDate":"2026-08-11","endDate":"2026-08-15","dayCount":5,"segments":[{"startDate":"2026-08-11","endDate":"2026-08-15","dayCount":5,"principalVnd":"50000000","dailyRatePercent":"0.08"}],"openingInterestBalanceVnd":"400000","accruedInterestVnd":"200000","interestPaymentsVnd":"0","closingInterestBalanceVnd":"600000"}]}$json$::jsonb,
  'fixture overdue_without_penalty matches the C2 oracle'
);

select is(
  pg_temp.run_financial_fixture(
    'bad_debt_pause_resume',
    $json${"direction":"LENDING","originalPrincipalVnd":"100000000","disbursementDate":"2026-08-01","termDays":60,"interestCycleDays":15,"initialDailyRatePercent":"0.1","asOfDate":"2026-08-30","events":[{"id":"bad-debt-1","date":"2026-08-10","type":"BAD_DEBT_START"},{"id":"resume-1","date":"2026-08-21","type":"INTEREST_RESUME","dailyRatePercent":"0.05"}]}$json$::jsonb
  ),
  $json${"maturityDate":"2026-09-29","status":"ACTIVE","principalOutstandingVnd":"100000000","interestBalanceVnd":"1500000","periods":[{"kind":"SCHEDULED","startDate":"2026-08-01","endDate":"2026-08-15","dayCount":15,"segments":[{"startDate":"2026-08-01","endDate":"2026-08-10","dayCount":10,"principalVnd":"100000000","dailyRatePercent":"0.1"}],"openingInterestBalanceVnd":"0","accruedInterestVnd":"1000000","interestPaymentsVnd":"0","closingInterestBalanceVnd":"1000000"},{"kind":"SCHEDULED","startDate":"2026-08-16","endDate":"2026-08-30","dayCount":15,"segments":[{"startDate":"2026-08-21","endDate":"2026-08-30","dayCount":10,"principalVnd":"100000000","dailyRatePercent":"0.05"}],"openingInterestBalanceVnd":"1000000","accruedInterestVnd":"500000","interestPaymentsVnd":"0","closingInterestBalanceVnd":"1500000"}]}$json$::jsonb,
  'fixture bad_debt_pause_resume matches the C2 oracle'
);

select is(
  pg_temp.run_financial_fixture(
    'round_half_up_at_period_end',
    $json${"direction":"LENDING","originalPrincipalVnd":"100050","disbursementDate":"2026-08-01","termDays":10,"interestCycleDays":15,"initialDailyRatePercent":"0.1","asOfDate":"2026-08-10","events":[]}$json$::jsonb
  ),
  $json${"maturityDate":"2026-08-10","status":"ACTIVE","principalOutstandingVnd":"100050","interestBalanceVnd":"1001","periods":[{"kind":"SCHEDULED","startDate":"2026-08-01","endDate":"2026-08-10","dayCount":10,"segments":[{"startDate":"2026-08-01","endDate":"2026-08-10","dayCount":10,"principalVnd":"100050","dailyRatePercent":"0.1"}],"openingInterestBalanceVnd":"0","accruedInterestVnd":"1001","interestPaymentsVnd":"0","closingInterestBalanceVnd":"1001"}]}$json$::jsonb,
  'fixture round_half_up_at_period_end matches the C2 oracle'
);

select is(
  pg_temp.run_financial_fixture(
    'reversed_principal_payment',
    $json${"direction":"LENDING","originalPrincipalVnd":"100000000","disbursementDate":"2026-08-01","termDays":30,"interestCycleDays":15,"initialDailyRatePercent":"0.1","asOfDate":"2026-08-30","events":[{"id":"reversed-p-1","date":"2026-08-10","type":"PRINCIPAL_PAYMENT","amountVnd":"40000000"},{"id":"reversal-1","date":"2026-08-12","type":"REVERSAL","reversesTransactionId":"reversed-p-1","note":"Nhập nhầm giao dịch trả gốc"}]}$json$::jsonb
  ),
  $json${"maturityDate":"2026-08-30","status":"ACTIVE","principalOutstandingVnd":"100000000","interestBalanceVnd":"3000000","periods":[{"kind":"SCHEDULED","startDate":"2026-08-01","endDate":"2026-08-15","dayCount":15,"segments":[{"startDate":"2026-08-01","endDate":"2026-08-15","dayCount":15,"principalVnd":"100000000","dailyRatePercent":"0.1"}],"openingInterestBalanceVnd":"0","accruedInterestVnd":"1500000","interestPaymentsVnd":"0","closingInterestBalanceVnd":"1500000"},{"kind":"SCHEDULED","startDate":"2026-08-16","endDate":"2026-08-30","dayCount":15,"segments":[{"startDate":"2026-08-16","endDate":"2026-08-30","dayCount":15,"principalVnd":"100000000","dailyRatePercent":"0.1"}],"openingInterestBalanceVnd":"1500000","accruedInterestVnd":"1500000","interestPaymentsVnd":"0","closingInterestBalanceVnd":"3000000"}]}$json$::jsonb,
  'fixture reversed_principal_payment matches the C2 oracle'
);

select * from finish();
rollback;
