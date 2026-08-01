begin;

create or replace function private.next_interest_due_date(
  p_disbursement_date date,
  p_maturity_date date,
  p_cycle_days integer,
  p_as_of_date date
)
returns date
language sql
immutable
strict
set search_path = ''
as $$
  select least(
    p_maturity_date,
    p_disbursement_date
      + ((((greatest(p_as_of_date, p_disbursement_date) - p_disbursement_date) / p_cycle_days) + 1) * p_cycle_days)
      - 1
  )
$$;

create or replace function public.get_dashboard(p_as_of_date date, p_months integer default 6)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  loan_row public.loans%rowtype;
  calculation jsonb;
  due_calculation jsonb;
  principal_outstanding bigint;
  interest_balance bigint;
  accrued_total bigint;
  due_date date;
  lending_outstanding bigint := 0;
  borrowing_outstanding bigint := 0;
  lending_accrued bigint := 0;
  borrowing_accrued bigint := 0;
  projected_lending_interest bigint := 0;
  projected_borrowing_interest bigint := 0;
  interest_collected bigint := 0;
  interest_paid bigint := 0;
  expenses_paid bigint := 0;
  upcoming jsonb := '[]'::jsonb;
  overdue jsonb := '[]'::jsonb;
  cash_flow jsonb;
begin
  perform private.require_active_user();

  if p_as_of_date is null then
    raise exception 'as_of_date is required' using errcode = '22023';
  end if;

  if p_months is null or p_months < 1 or p_months > 24 then
    raise exception 'months must be between 1 and 24' using errcode = '22023';
  end if;

  for loan_row in select * from public.loans order by maturity_date, id loop
    calculation := private.calculate_loan_json(loan_row.id, greatest(p_as_of_date, loan_row.disbursement_date));
    principal_outstanding := (calculation ->> 'principalOutstandingVnd')::bigint;
    interest_balance := (calculation ->> 'interestBalanceVnd')::bigint;

    select coalesce(sum((period ->> 'accruedInterestVnd')::bigint), 0)
    into accrued_total
    from jsonb_array_elements(calculation -> 'periods') as period;

    if loan_row.direction = 'LENDING' then
      lending_outstanding := lending_outstanding + principal_outstanding;
      lending_accrued := lending_accrued + accrued_total;
    else
      borrowing_outstanding := borrowing_outstanding + principal_outstanding;
      borrowing_accrued := borrowing_accrued + accrued_total;
    end if;

    if (calculation ->> 'status') = 'OVERDUE' then
      overdue := overdue || jsonb_build_array(jsonb_build_object(
        'id', loan_row.id::text,
        'name', loan_row.name,
        'direction', loan_row.direction::text,
        'status', 'OVERDUE',
        'dueDate', loan_row.maturity_date::text,
        'principalVnd', principal_outstanding::text,
        'interestVnd', interest_balance::text
      ));
    elsif (calculation ->> 'status') = 'ACTIVE' then
      due_date := private.next_interest_due_date(
        loan_row.disbursement_date,
        loan_row.maturity_date,
        loan_row.interest_cycle_days,
        p_as_of_date
      );
      due_calculation := private.calculate_loan_json(loan_row.id, due_date);

      if loan_row.direction = 'LENDING' then
        projected_lending_interest := projected_lending_interest
          + greatest((due_calculation ->> 'interestBalanceVnd')::bigint, 0);
      else
        projected_borrowing_interest := projected_borrowing_interest
          + greatest((due_calculation ->> 'interestBalanceVnd')::bigint, 0);
      end if;

      if due_date between p_as_of_date and p_as_of_date + 30 then
        upcoming := upcoming || jsonb_build_array(jsonb_build_object(
          'id', loan_row.id::text,
          'name', loan_row.name,
          'direction', loan_row.direction::text,
          'status', 'ACTIVE',
          'dueDate', due_date::text,
          'principalVnd', principal_outstanding::text,
          'interestVnd', (due_calculation ->> 'interestBalanceVnd')
        ));
      end if;
    end if;
  end loop;

  with effective as (
    select transaction.*
    from public.transactions as transaction
    where transaction.type <> 'REVERSAL'
      and transaction.transaction_date <= p_as_of_date
      and not exists (
        select 1 from public.transactions as reversal
        where reversal.type = 'REVERSAL'
          and reversal.reversal_of_id = transaction.id
          and reversal.transaction_date <= p_as_of_date
      )
  )
  select
    coalesce(sum(effective.amount_vnd) filter (
      where effective.type = 'INTEREST_PAYMENT' and loan.direction = 'LENDING'
    ), 0),
    coalesce(sum(effective.amount_vnd) filter (
      where effective.type = 'INTEREST_PAYMENT' and loan.direction = 'BORROWING'
    ), 0),
    coalesce(sum(effective.amount_vnd) filter (where effective.type = 'EXPENSE'), 0)
  into interest_collected, interest_paid, expenses_paid
  from effective
  left join public.loans as loan on loan.id = effective.loan_id;

  with months as (
    select generate_series(
      date_trunc('month', p_as_of_date)::date - ((p_months - 1) * interval '1 month'),
      date_trunc('month', p_as_of_date)::date,
      interval '1 month'
    )::date as month_start
  ),
  effective as (
    select transaction.*, loan.direction
    from public.transactions as transaction
    left join public.loans as loan on loan.id = transaction.loan_id
    where transaction.type <> 'REVERSAL'
      and transaction.transaction_date <= p_as_of_date
      and not exists (
        select 1 from public.transactions as reversal
        where reversal.type = 'REVERSAL'
          and reversal.reversal_of_id = transaction.id
          and reversal.transaction_date <= p_as_of_date
      )
  ),
  monthly as (
    select
      month.month_start,
      coalesce(sum(effective.amount_vnd) filter (where
        (effective.type = 'DISBURSEMENT' and effective.direction = 'BORROWING')
        or (effective.type in ('INTEREST_PAYMENT', 'PRINCIPAL_PAYMENT') and effective.direction = 'LENDING')
      ), 0)::bigint as inflow,
      coalesce(sum(effective.amount_vnd) filter (where
        effective.type = 'EXPENSE'
        or (effective.type = 'DISBURSEMENT' and effective.direction = 'LENDING')
        or (effective.type in ('INTEREST_PAYMENT', 'PRINCIPAL_PAYMENT') and effective.direction = 'BORROWING')
      ), 0)::bigint as outflow
    from months as month
    left join effective on date_trunc('month', effective.transaction_date)::date = month.month_start
    group by month.month_start
    order by month.month_start
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'month', to_char(month_start, 'YYYY-MM'),
    'inflowVnd', inflow::text,
    'outflowVnd', outflow::text,
    'netVnd', (inflow - outflow)::text
  ) order by month_start), '[]'::jsonb)
  into cash_flow
  from monthly;

  return jsonb_build_object(
    'asOfDate', p_as_of_date::text,
    'lendingOutstandingVnd', lending_outstanding::text,
    'borrowingOutstandingVnd', borrowing_outstanding::text,
    'interestCollectedVnd', interest_collected::text,
    'interestPaidVnd', interest_paid::text,
    'expensesPaidVnd', expenses_paid::text,
    'cashProfitVnd', (interest_collected - interest_paid - expenses_paid)::text,
    'accrualProfitVnd', (lending_accrued - borrowing_accrued - expenses_paid)::text,
    'projectedLendingInterestVnd', projected_lending_interest::text,
    'projectedBorrowingInterestVnd', projected_borrowing_interest::text,
    'upcoming', upcoming,
    'overdue', overdue,
    'cashFlow', cash_flow
  );
end;
$$;

revoke all on function public.get_dashboard(date, integer) from public, anon;
grant execute on function public.get_dashboard(date, integer) to authenticated, service_role;

comment on function public.get_dashboard(date, integer) is
  'Authoritative dashboard aggregates for outstanding principal, cash/accrual profit, projected interest, due loans, and monthly cash flow.';

commit;
