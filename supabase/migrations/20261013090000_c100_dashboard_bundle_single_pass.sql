begin;

create or replace function private.dashboard_accrued_through(
  p_calculation jsonb,
  p_cutoff_date date
)
returns bigint
language plpgsql
immutable
set search_path = ''
as $$
declare
  period_entry jsonb;
  period_start date;
  period_end date;
  partial_accrual bigint;
  total_accrual bigint := 0;
begin
  if p_calculation is null or p_cutoff_date is null then
    return 0;
  end if;

  for period_entry in
    select value
    from jsonb_array_elements(coalesce(p_calculation -> 'periods', '[]'::jsonb))
    order by (value ->> 'startDate')::date
  loop
    period_start := (period_entry ->> 'startDate')::date;
    period_end := (period_entry ->> 'endDate')::date;

    if period_start > p_cutoff_date then
      exit;
    end if;

    if period_end <= p_cutoff_date then
      total_accrual := total_accrual + (period_entry ->> 'accruedInterestVnd')::bigint;
    else
      select coalesce(round(sum(
        (segment ->> 'principalVnd')::numeric
        * (segment ->> 'dailyRatePercent')::numeric / 100
        * (least((segment ->> 'endDate')::date, p_cutoff_date)
          - (segment ->> 'startDate')::date + 1)
      ))::bigint, 0)
      into partial_accrual
      from jsonb_array_elements(coalesce(period_entry -> 'segments', '[]'::jsonb)) as segment
      where (segment ->> 'startDate')::date <= p_cutoff_date;

      total_accrual := total_accrual + partial_accrual;
      exit;
    end if;
  end loop;

  return total_accrual;
end;
$$;

create or replace function private.dashboard_loan_state_at(
  p_loan_id uuid,
  p_as_of_date date
)
returns table (
  calculated_status public.loan_status,
  principal_outstanding_vnd bigint,
  calculation_end date
)
language sql
stable
security definer
set search_path = ''
as $$
  with loan_row as (
    select loan.*
    from public.loans as loan
    where loan.id = p_loan_id
  ), settlement as (
    select min(event.effective_date) as effective_date
    from public.loan_lifecycle_events as event
    where event.loan_id = p_loan_id
      and event.event_type = 'SETTLEMENT'
      and event.effective_date <= p_as_of_date
      and not exists (
        select 1
        from public.loan_settlement_reversals as reversal
        where reversal.settlement_event_id = event.id
      )
  ), snapshot as (
    select
      loan.*,
      settlement.effective_date as settlement_date,
      least(p_as_of_date, coalesce(settlement.effective_date, p_as_of_date)) as effective_end
    from loan_row as loan
    cross join settlement
  ), latest_state as (
    select event.event_type
    from snapshot
    join lateral (
      select state_event.event_type
      from public.loan_lifecycle_events as state_event
      where state_event.loan_id = snapshot.id
        and state_event.event_type in ('BAD_DEBT_START', 'INTEREST_RESUME')
        and state_event.effective_date <= snapshot.effective_end
      order by state_event.effective_date desc, state_event.created_at desc, state_event.id desc
      limit 1
    ) as event on true
  )
  select
    case
      when snapshot.settlement_date is not null then 'SETTLED'::public.loan_status
      when (select event_type from latest_state) = 'BAD_DEBT_START' then 'BAD_DEBT'::public.loan_status
      when p_as_of_date > snapshot.maturity_date then 'OVERDUE'::public.loan_status
      else 'ACTIVE'::public.loan_status
    end,
    snapshot.original_principal_vnd - coalesce((
      select sum(transaction.amount_vnd)
      from public.transactions as transaction
      where transaction.loan_id = snapshot.id
        and transaction.type = 'PRINCIPAL_PAYMENT'
        and transaction.transaction_date <= snapshot.effective_end
        and not exists (
          select 1
          from public.transactions as reversal
          where reversal.type = 'REVERSAL'
            and reversal.reversal_of_id = transaction.id
        )
    ), 0),
    snapshot.effective_end
  from snapshot;
$$;

create or replace function private.dashboard_interest_balance_at(
  p_loan_id uuid,
  p_calculation jsonb,
  p_cutoff_date date
)
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  disbursement_date date;
  effective_end date;
  interest_payments bigint := 0;
begin
  select loan.disbursement_date
  into strict disbursement_date
  from public.loans as loan
  where loan.id = p_loan_id;

  select least(
    p_cutoff_date,
    coalesce(max((period ->> 'endDate')::date), p_cutoff_date)
  )
  into effective_end
  from jsonb_array_elements(coalesce(p_calculation -> 'periods', '[]'::jsonb)) as period;

  select coalesce(sum(transaction.amount_vnd), 0)
  into interest_payments
  from public.transactions as transaction
  where transaction.loan_id = p_loan_id
    and transaction.type = 'INTEREST_PAYMENT'
    and private.interest_payment_allocation_date(transaction.id, transaction.transaction_date)
      between disbursement_date and effective_end
    and transaction.transaction_date <= effective_end
    and not exists (
      select 1
      from public.transactions as reversal
      where reversal.type = 'REVERSAL'
        and reversal.reversal_of_id = transaction.id
    );

  return private.dashboard_accrued_through(p_calculation, effective_end) - interest_payments;
end;
$$;

create or replace function public.get_management_dashboard_bundle_v4(
  p_period_start date,
  p_period_end date,
  p_previous_start date,
  p_previous_end date,
  p_balance_start date,
  p_balance_end date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  loan_row record;
  calculation jsonb;
  calculation_date date;
  current_status public.loan_status;
  current_principal bigint;
  current_calculation_end date;
  current_accrued bigint;
  current_before bigint;
  current_in_period bigint;
  current_interest_balance bigint;
  previous_accrued bigint;
  previous_before bigint;
  previous_in_period bigint;
  reminder_date date;
  upcoming_period_end date;
  due_interest_balance bigint;
  active_lending_outstanding bigint := 0;
  bad_debt_lending_outstanding bigint := 0;
  total_lending_exposure bigint := 0;
  active_borrowing_outstanding bigint := 0;
  bad_debt_borrowing_outstanding bigint := 0;
  total_borrowing_exposure bigint := 0;
  lending_accrued bigint := 0;
  borrowing_accrued bigint := 0;
  previous_lending_accrued bigint := 0;
  previous_borrowing_accrued bigint := 0;
  projected_lending_interest bigint := 0;
  projected_borrowing_interest bigint := 0;
  interest_collected bigint := 0;
  interest_paid bigint := 0;
  expenses_paid bigint := 0;
  previous_interest_collected bigint := 0;
  previous_interest_paid bigint := 0;
  previous_expenses_paid bigint := 0;
  upcoming jsonb := '[]'::jsonb;
  overdue jsonb := '[]'::jsonb;
  cash_flow jsonb;
  counterparty_exposure_map jsonb := '{}'::jsonb;
  counterparty_exposure_entry jsonb;
  counterparty_exposure jsonb := '[]'::jsonb;
  dashboard jsonb;
  previous_dashboard jsonb;
  previous_balance_dashboard jsonb;
begin
  perform private.require_active_user();

  if p_period_start is null or p_period_end is null
     or p_previous_start is null or p_previous_end is null
     or p_balance_start is null or p_balance_end is null then
    raise exception 'dashboard dates are required' using errcode = '22023';
  end if;
  if p_period_start > p_period_end
     or p_previous_start > p_previous_end
     or p_balance_start > p_balance_end then
    raise exception 'dashboard period start cannot be after period end' using errcode = '22007';
  end if;
  if p_period_end - p_period_start > 1826
     or p_previous_end - p_previous_start > 1826 then
    raise exception 'dashboard period cannot exceed five years' using errcode = '22023';
  end if;

  for loan_row in
    select loan.*, counterparty.name as counterparty_name
    from public.loans as loan
    join public.counterparties as counterparty on counterparty.id = loan.counterparty_id
    where not loan.is_test_data
      and loan.disbursement_date <= greatest(p_period_end, p_previous_end)
    order by loan.maturity_date nulls last, loan.id
  loop
    reminder_date := null;
    upcoming_period_end := null;
    calculation_date := case
      when loan_row.disbursement_date <= p_period_end then p_period_end
      else p_previous_end
    end;

    if loan_row.disbursement_date <= p_period_end then
      select state.calculated_status, state.principal_outstanding_vnd, state.calculation_end
      into current_status, current_principal, current_calculation_end
      from private.dashboard_loan_state_at(loan_row.id, p_period_end) as state;

      if current_status = 'ACTIVE' then
        reminder_date := private.next_interest_reminder_date(
          private.interest_schedule_anchor_date(loan_row.id, loan_row.disbursement_date, p_period_end),
          loan_row.maturity_date,
          loan_row.interest_cycle_days,
          loan_row.interest_reminder_offset_days,
          p_period_end
        );
        upcoming_period_end := case when reminder_date is null then null else private.next_interest_due_date(
          private.interest_schedule_anchor_date(loan_row.id, loan_row.disbursement_date, p_period_end),
          loan_row.maturity_date,
          loan_row.interest_cycle_days,
          reminder_date
        ) end;
        calculation_date := greatest(calculation_date, coalesce(upcoming_period_end, p_period_end));
      end if;
    end if;

    if loan_row.disbursement_date <= p_previous_end then
      calculation_date := greatest(calculation_date, p_previous_end);
    end if;

    calculation := private.calculate_loan_json(loan_row.id, calculation_date);

    if loan_row.disbursement_date <= p_period_end then
      current_accrued := private.dashboard_accrued_through(calculation, p_period_end);
      current_before := case
        when p_period_start > loan_row.disbursement_date
          then private.dashboard_accrued_through(calculation, p_period_start - 1)
        else 0
      end;
      current_in_period := greatest(current_accrued - current_before, 0);
      current_interest_balance := private.dashboard_interest_balance_at(
        loan_row.id,
        calculation,
        current_calculation_end
      );

      if loan_row.direction = 'LENDING' then
        total_lending_exposure := total_lending_exposure + current_principal;
        lending_accrued := lending_accrued + current_in_period;
        if current_status = 'BAD_DEBT' then
          bad_debt_lending_outstanding := bad_debt_lending_outstanding + current_principal;
        else
          active_lending_outstanding := active_lending_outstanding + current_principal;
        end if;
      else
        total_borrowing_exposure := total_borrowing_exposure + current_principal;
        borrowing_accrued := borrowing_accrued + current_in_period;
        if current_status = 'BAD_DEBT' then
          bad_debt_borrowing_outstanding := bad_debt_borrowing_outstanding + current_principal;
        else
          active_borrowing_outstanding := active_borrowing_outstanding + current_principal;
        end if;
      end if;

      counterparty_exposure_entry := coalesce(
        counterparty_exposure_map -> loan_row.counterparty_id::text,
        jsonb_build_object(
          'counterpartyId', loan_row.counterparty_id::text,
          'name', loan_row.counterparty_name,
          'lendingVnd', '0',
          'badDebtVnd', '0',
          'borrowingVnd', '0'
        )
      );
      counterparty_exposure_entry := counterparty_exposure_entry || jsonb_build_object(
        'lendingVnd', (
          (counterparty_exposure_entry ->> 'lendingVnd')::bigint
          + case when loan_row.direction = 'LENDING' and current_status <> 'BAD_DEBT' then current_principal else 0 end
        )::text,
        'badDebtVnd', (
          (counterparty_exposure_entry ->> 'badDebtVnd')::bigint
          + case when loan_row.direction = 'LENDING' and current_status = 'BAD_DEBT' then current_principal else 0 end
        )::text,
        'borrowingVnd', (
          (counterparty_exposure_entry ->> 'borrowingVnd')::bigint
          + case when loan_row.direction = 'BORROWING' then current_principal else 0 end
        )::text
      );
      counterparty_exposure_map := jsonb_set(
        counterparty_exposure_map,
        array[loan_row.counterparty_id::text],
        counterparty_exposure_entry,
        true
      );

      if current_status = 'OVERDUE' then
        overdue := overdue || jsonb_build_array(jsonb_build_object(
          'id', loan_row.id::text,
          'name', loan_row.name,
          'direction', loan_row.direction::text,
          'status', 'OVERDUE',
          'attentionType', 'PRINCIPAL_OVERDUE',
          'reminderDate', null,
          'periodEndDate', loan_row.maturity_date::text,
          'dueDate', loan_row.maturity_date::text,
          'principalVnd', current_principal::text,
          'interestVnd', current_interest_balance::text
        ));
      elsif current_status = 'ACTIVE' then
        due_interest_balance := private.dashboard_interest_balance_at(
          loan_row.id,
          calculation,
          coalesce(upcoming_period_end, p_period_end)
        );
        if loan_row.direction = 'LENDING' then
          projected_lending_interest := projected_lending_interest + greatest(due_interest_balance, 0);
        else
          projected_borrowing_interest := projected_borrowing_interest + greatest(due_interest_balance, 0);
        end if;

        if reminder_date between p_period_end and p_period_end + 30
           and due_interest_balance > 0 then
          upcoming := upcoming || jsonb_build_array(jsonb_build_object(
            'id', loan_row.id::text,
            'name', loan_row.name,
            'direction', loan_row.direction::text,
            'status', 'ACTIVE',
            'attentionType', 'INTEREST_DUE',
            'reminderDate', reminder_date::text,
            'periodEndDate', upcoming_period_end::text,
            'dueDate', reminder_date::text,
            'principalVnd', current_principal::text,
            'interestVnd', greatest(due_interest_balance, 0)::text
          ));
        end if;
      end if;
    end if;

    if loan_row.disbursement_date <= p_previous_end then
      previous_accrued := private.dashboard_accrued_through(calculation, p_previous_end);
      previous_before := case
        when p_previous_start > loan_row.disbursement_date
          then private.dashboard_accrued_through(calculation, p_previous_start - 1)
        else 0
      end;
      previous_in_period := greatest(previous_accrued - previous_before, 0);
      if loan_row.direction = 'LENDING' then
        previous_lending_accrued := previous_lending_accrued + previous_in_period;
      else
        previous_borrowing_accrued := previous_borrowing_accrued + previous_in_period;
      end if;
    end if;
  end loop;

  select coalesce(jsonb_agg(item order by (item ->> 'dueDate')::date, (item ->> 'principalVnd')::bigint desc, item ->> 'name'), '[]'::jsonb)
  into overdue
  from jsonb_array_elements(overdue) as item;

  select coalesce(jsonb_agg(item order by (item ->> 'reminderDate')::date, (item ->> 'interestVnd')::bigint desc, item ->> 'name'), '[]'::jsonb)
  into upcoming
  from jsonb_array_elements(upcoming) as item;

  select coalesce(jsonb_agg(ranked.item order by ranked.total_vnd desc, ranked.item ->> 'name'), '[]'::jsonb)
  into counterparty_exposure
  from (
    select
      exposure.value || jsonb_build_object(
        'totalVnd', (
          (exposure.value ->> 'lendingVnd')::bigint
          + (exposure.value ->> 'badDebtVnd')::bigint
          + (exposure.value ->> 'borrowingVnd')::bigint
        )::text
      ) as item,
      (exposure.value ->> 'lendingVnd')::bigint
        + (exposure.value ->> 'badDebtVnd')::bigint
        + (exposure.value ->> 'borrowingVnd')::bigint as total_vnd
    from jsonb_each(counterparty_exposure_map) as exposure
    where (exposure.value ->> 'lendingVnd')::bigint
      + (exposure.value ->> 'badDebtVnd')::bigint
      + (exposure.value ->> 'borrowingVnd')::bigint > 0
    order by total_vnd desc, exposure.value ->> 'name'
    limit 10
  ) as ranked;

  with effective as (
    select transaction.*, loan.direction
    from public.transactions as transaction
    left join public.loans as loan on loan.id = transaction.loan_id
    where (loan.id is null or not loan.is_test_data)
      and transaction.type <> 'REVERSAL'
      and transaction.transaction_date between p_period_start and p_period_end
      and not exists (
        select 1 from public.transactions as reversal
        where reversal.type = 'REVERSAL'
          and reversal.reversal_of_id = transaction.id
          and reversal.transaction_date <= p_period_end
      )
      and not exists (
        select 1 from private.legacy_onboarding_transactions opening
        where opening.transaction_id = transaction.id
      )
  )
  select
    coalesce(sum(effective.amount_vnd) filter (
      where effective.type = 'INTEREST_PAYMENT' and effective.direction = 'LENDING'
    ), 0),
    coalesce(sum(effective.amount_vnd) filter (
      where effective.type = 'INTEREST_PAYMENT' and effective.direction = 'BORROWING'
    ), 0),
    coalesce(sum(effective.amount_vnd) filter (where effective.type = 'EXPENSE'), 0)
  into interest_collected, interest_paid, expenses_paid
  from effective;

  with effective as (
    select transaction.*, loan.direction
    from public.transactions as transaction
    left join public.loans as loan on loan.id = transaction.loan_id
    where (loan.id is null or not loan.is_test_data)
      and transaction.type <> 'REVERSAL'
      and transaction.transaction_date between p_previous_start and p_previous_end
      and not exists (
        select 1 from public.transactions as reversal
        where reversal.type = 'REVERSAL'
          and reversal.reversal_of_id = transaction.id
          and reversal.transaction_date <= p_previous_end
      )
      and not exists (
        select 1 from private.legacy_onboarding_transactions opening
        where opening.transaction_id = transaction.id
      )
  )
  select
    coalesce(sum(effective.amount_vnd) filter (
      where effective.type = 'INTEREST_PAYMENT' and effective.direction = 'LENDING'
    ), 0),
    coalesce(sum(effective.amount_vnd) filter (
      where effective.type = 'INTEREST_PAYMENT' and effective.direction = 'BORROWING'
    ), 0),
    coalesce(sum(effective.amount_vnd) filter (where effective.type = 'EXPENSE'), 0)
  into previous_interest_collected, previous_interest_paid, previous_expenses_paid
  from effective;

  with months as (
    select generate_series(
      date_trunc('month', p_period_start)::date,
      date_trunc('month', p_period_end)::date,
      interval '1 month'
    )::date as month_start
  ), effective as (
    select transaction.*, loan.direction
    from public.transactions as transaction
    left join public.loans as loan on loan.id = transaction.loan_id
    where (loan.id is null or not loan.is_test_data)
      and transaction.type <> 'REVERSAL'
      and transaction.transaction_date between p_period_start and p_period_end
      and not exists (
        select 1 from public.transactions as reversal
        where reversal.type = 'REVERSAL'
          and reversal.reversal_of_id = transaction.id
          and reversal.transaction_date <= p_period_end
      )
      and not exists (
        select 1 from private.legacy_onboarding_transactions opening
        where opening.transaction_id = transaction.id
      )
  ), monthly as (
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

  dashboard := jsonb_build_object(
    'periodStartDate', p_period_start::text,
    'periodEndDate', p_period_end::text,
    'activeLendingOutstandingVnd', active_lending_outstanding::text,
    'badDebtLendingOutstandingVnd', bad_debt_lending_outstanding::text,
    'totalLendingExposureVnd', total_lending_exposure::text,
    'activeBorrowingOutstandingVnd', active_borrowing_outstanding::text,
    'badDebtBorrowingOutstandingVnd', bad_debt_borrowing_outstanding::text,
    'totalBorrowingExposureVnd', total_borrowing_exposure::text,
    'interestCollectedVnd', interest_collected::text,
    'interestPaidVnd', interest_paid::text,
    'expensesPaidVnd', expenses_paid::text,
    'cashProfitVnd', (interest_collected - interest_paid - expenses_paid)::text,
    'accrualProfitVnd', (lending_accrued - borrowing_accrued - expenses_paid)::text,
    'lendingAccruedVnd', lending_accrued::text,
    'borrowingAccruedVnd', borrowing_accrued::text,
    'counterpartyExposure', counterparty_exposure,
    'projectedLendingInterestVnd', projected_lending_interest::text,
    'projectedBorrowingInterestVnd', projected_borrowing_interest::text,
    'upcoming', upcoming,
    'overdue', overdue,
    'cashFlow', cash_flow
  );

  previous_dashboard := jsonb_build_object(
    'periodStartDate', p_previous_start::text,
    'periodEndDate', p_previous_end::text,
    'interestCollectedVnd', previous_interest_collected::text,
    'interestPaidVnd', previous_interest_paid::text,
    'expensesPaidVnd', previous_expenses_paid::text,
    'cashProfitVnd', (previous_interest_collected - previous_interest_paid - previous_expenses_paid)::text,
    'lendingAccruedVnd', previous_lending_accrued::text,
    'borrowingAccruedVnd', previous_borrowing_accrued::text,
    'accrualProfitVnd', (
      previous_lending_accrued - previous_borrowing_accrued - previous_expenses_paid
    )::text
  );

  previous_balance_dashboard := private.get_management_balance_comparison(p_balance_end);

  return jsonb_build_object(
    'dashboard', dashboard,
    'analytics', jsonb_build_object(
      'lendingAccruedVnd', dashboard ->> 'lendingAccruedVnd',
      'borrowingAccruedVnd', dashboard ->> 'borrowingAccruedVnd',
      'counterpartyExposure', dashboard -> 'counterpartyExposure'
    ),
    'previousDashboard', previous_dashboard,
    'previousBalanceDashboard', previous_balance_dashboard
  );
end;
$$;

revoke all on function private.dashboard_accrued_through(jsonb,date) from public, anon, authenticated;
revoke all on function private.dashboard_loan_state_at(uuid,date) from public, anon, authenticated;
revoke all on function private.dashboard_interest_balance_at(uuid,jsonb,date) from public, anon, authenticated;
grant execute on function private.dashboard_accrued_through(jsonb,date) to service_role;
grant execute on function private.dashboard_loan_state_at(uuid,date) to service_role;
grant execute on function private.dashboard_interest_balance_at(uuid,jsonb,date) to service_role;

revoke all on function public.get_management_dashboard_bundle_v4(date,date,date,date,date,date) from public, anon;
grant execute on function public.get_management_dashboard_bundle_v4(date,date,date,date,date,date) to authenticated, service_role;

comment on function private.dashboard_accrued_through(jsonb,date) is
  'Extracts exact per-period rounded accrual through a cutoff from one authoritative loan calculation.';
comment on function private.dashboard_loan_state_at(uuid,date) is
  'Returns dashboard status, principal and effective calculation end with calculate_loan_json semantics.';
comment on function private.dashboard_interest_balance_at(uuid,jsonb,date) is
  'Derives an exact interest balance at a cutoff from one authoritative loan calculation and effective payments.';
comment on function public.get_management_dashboard_bundle_v4(date,date,date,date,date,date) is
  'Returns the v3 dashboard contract while calculating each included loan once at its furthest required date.';

commit;
