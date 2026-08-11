begin;

create or replace function public.get_management_analytics(
  p_period_start date,
  p_period_end date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  loan_row public.loans%rowtype;
  calculation jsonb;
  calculation_before_period jsonb;
  accrued_through_end bigint;
  accrued_before_period bigint;
  accrued_in_period bigint;
  lending_accrued bigint := 0;
  borrowing_accrued bigint := 0;
  counterparty_exposure jsonb;
begin
  perform private.require_active_user();

  if p_period_start is null or p_period_end is null then
    raise exception 'period start and end are required' using errcode = '22023';
  end if;
  if p_period_start > p_period_end then
    raise exception 'period start cannot be after period end' using errcode = '22007';
  end if;
  if p_period_end - p_period_start > 1826 then
    raise exception 'analytics period cannot exceed five years' using errcode = '22023';
  end if;

  for loan_row in
    select * from public.loans
    where disbursement_date <= p_period_end
    order by id
  loop
    calculation := private.calculate_loan_json(loan_row.id, p_period_end);

    select coalesce(sum((period ->> 'accruedInterestVnd')::bigint), 0)
    into accrued_through_end
    from jsonb_array_elements(calculation -> 'periods') as period;

    accrued_before_period := 0;
    if p_period_start > loan_row.disbursement_date then
      calculation_before_period := private.calculate_loan_json(loan_row.id, p_period_start - 1);
      select coalesce(sum((period ->> 'accruedInterestVnd')::bigint), 0)
      into accrued_before_period
      from jsonb_array_elements(calculation_before_period -> 'periods') as period;
    end if;
    accrued_in_period := greatest(accrued_through_end - accrued_before_period, 0);

    if loan_row.direction = 'LENDING' then
      lending_accrued := lending_accrued + accrued_in_period;
    else
      borrowing_accrued := borrowing_accrued + accrued_in_period;
    end if;
  end loop;

  with exposure as (
    select
      counterparty.id,
      counterparty.name,
      loan.direction,
      calculation.value ->> 'status' as calculated_status,
      (calculation.value ->> 'principalOutstandingVnd')::bigint as principal_outstanding
    from public.loans as loan
    join public.counterparties as counterparty on counterparty.id = loan.counterparty_id
    cross join lateral (
      select private.calculate_loan_json(loan.id, p_period_end) as value
    ) as calculation
    where loan.disbursement_date <= p_period_end
  ), grouped as (
    select
      id,
      name,
      coalesce(sum(principal_outstanding) filter (
        where direction = 'LENDING' and calculated_status <> 'BAD_DEBT'
      ), 0)::bigint as lending,
      coalesce(sum(principal_outstanding) filter (
        where direction = 'LENDING' and calculated_status = 'BAD_DEBT'
      ), 0)::bigint as bad_debt,
      coalesce(sum(principal_outstanding) filter (
        where direction = 'BORROWING'
      ), 0)::bigint as borrowing
    from exposure
    group by id, name
  ), ranked as (
    select * from grouped
    where lending + bad_debt + borrowing > 0
    order by lending + bad_debt + borrowing desc, name
    limit 10
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'counterpartyId', id::text,
    'name', name,
    'lendingVnd', lending::text,
    'badDebtVnd', bad_debt::text,
    'borrowingVnd', borrowing::text,
    'totalVnd', (lending + bad_debt + borrowing)::text
  ) order by lending + bad_debt + borrowing desc, name), '[]'::jsonb)
  into counterparty_exposure
  from ranked;

  return jsonb_build_object(
    'lendingAccruedVnd', lending_accrued::text,
    'borrowingAccruedVnd', borrowing_accrued::text,
    'counterpartyExposure', counterparty_exposure
  );
end;
$$;

create or replace function public.get_loan_management_summary(
  p_loan_id uuid,
  p_as_of_date date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  calculation jsonb;
  total_accrued bigint := 0;
  interest_recorded bigint := 0;
  onboarding_interest bigint := 0;
  principal_repaid bigint := 0;
begin
  perform private.require_active_user();

  if p_loan_id is null or p_as_of_date is null then
    raise exception 'loan and as-of date are required' using errcode = '22023';
  end if;

  if not exists (select 1 from public.loans where id = p_loan_id) then
    raise exception 'loan not found' using errcode = 'P0002';
  end if;

  calculation := private.calculate_loan_json(p_loan_id, p_as_of_date);
  select coalesce(sum((period ->> 'accruedInterestVnd')::bigint), 0)
  into total_accrued
  from jsonb_array_elements(calculation -> 'periods') as period;

  select coalesce(sum(transaction.amount_vnd), 0)
  into interest_recorded
  from public.transactions as transaction
  where transaction.loan_id = p_loan_id
    and transaction.type = 'INTEREST_PAYMENT'
    and transaction.transaction_date <= p_as_of_date
    and not exists (
      select 1 from public.transactions as reversal
      where reversal.type = 'REVERSAL'
        and reversal.reversal_of_id = transaction.id
        and reversal.transaction_date <= p_as_of_date
    )
    and not exists (
      select 1 from private.legacy_onboarding_transactions opening
      where opening.transaction_id = transaction.id
    );

  select coalesce(sum(onboarding.interest_collected_vnd), 0)
  into onboarding_interest
  from public.legacy_loan_onboardings as onboarding
  where onboarding.loan_id = p_loan_id
    and onboarding.as_of_date <= p_as_of_date;

  select coalesce(sum(transaction.amount_vnd), 0)
  into principal_repaid
  from public.transactions as transaction
  where transaction.loan_id = p_loan_id
    and transaction.type = 'PRINCIPAL_PAYMENT'
    and transaction.transaction_date <= p_as_of_date
    and not exists (
      select 1 from public.transactions as reversal
      where reversal.type = 'REVERSAL'
        and reversal.reversal_of_id = transaction.id
        and reversal.transaction_date <= p_as_of_date
    )
    and not exists (
      select 1 from private.legacy_onboarding_transactions opening
      where opening.transaction_id = transaction.id
    );

  return jsonb_build_object(
    'asOfDate', p_as_of_date::text,
    'totalAccruedInterestVnd', total_accrued::text,
    'interestRecordedVnd', (interest_recorded + onboarding_interest)::text,
    'principalRepaidVnd', principal_repaid::text
  );
end;
$$;

revoke all on function public.get_management_analytics(date, date) from public, anon;
revoke all on function public.get_loan_management_summary(uuid, date) from public, anon;
grant execute on function public.get_management_analytics(date, date) to authenticated, service_role;
grant execute on function public.get_loan_management_summary(uuid, date) to authenticated, service_role;

comment on function public.get_management_analytics(date, date) is
  'Authoritative accrued-interest comparison and top counterparty exposure for management charts.';
comment on function public.get_loan_management_summary(uuid, date) is
  'Authoritative per-loan accrued, recorded interest, and principal repayment summary including legacy opening history.';

commit;
