begin;

-- C117 keeps dashboard reporting periods independent from the operational
-- interest-reminder calendar month while preserving one authoritative loan
-- calculation per loan.
create or replace function public.get_management_dashboard_bundle_v5(
  p_period_start date,
  p_period_end date,
  p_previous_start date,
  p_previous_end date,
  p_balance_start date,
  p_balance_end date,
  p_reminder_start date,
  p_reminder_end date,
  p_reminder_as_of date
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
  projection_reminder_date date;
  projection_period_end date;
  reminder_candidates jsonb;
  reminder_candidate jsonb;
  reminder_cursor date;
  reminder_date date;
  upcoming_period_end date;
  reminder_status public.loan_status;
  reminder_principal bigint;
  due_interest_balance bigint;
  payments_after_due bigint;
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
     or p_balance_start is null or p_balance_end is null
     or p_reminder_start is null or p_reminder_end is null
     or p_reminder_as_of is null then
    raise exception 'dashboard dates are required' using errcode = '22023';
  end if;
  if p_period_start > p_period_end
     or p_previous_start > p_previous_end
     or p_balance_start > p_balance_end
     or p_reminder_start > p_reminder_end then
    raise exception 'dashboard period start cannot be after period end' using errcode = '22007';
  end if;
  if p_reminder_start <> date_trunc('month', p_reminder_start)::date
     or p_reminder_end <> (date_trunc('month', p_reminder_start) + interval '1 month - 1 day')::date
     or p_reminder_as_of not between p_reminder_start and p_reminder_end then
    raise exception 'dashboard reminder window must be the calendar month containing reminder as-of date'
      using errcode = '22023';
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
      and loan.disbursement_date <= greatest(p_period_end, p_previous_end, p_reminder_end)
    order by loan.maturity_date nulls last, loan.id
  loop
    projection_reminder_date := null;
    projection_period_end := null;
    reminder_candidates := '[]'::jsonb;
    calculation_date := case
      when loan_row.disbursement_date <= p_period_end then p_period_end
      else p_previous_end
    end;

    reminder_cursor := greatest(p_reminder_start, loan_row.disbursement_date);
    while reminder_cursor <= p_reminder_end loop
      reminder_date := private.next_interest_reminder_date(
        private.interest_schedule_anchor_date(loan_row.id, loan_row.disbursement_date, reminder_cursor),
        loan_row.maturity_date,
        loan_row.interest_cycle_days,
        loan_row.interest_reminder_offset_days,
        reminder_cursor
      );
      exit when reminder_date is null or reminder_date > p_reminder_end;

      upcoming_period_end := private.next_interest_due_date(
        private.interest_schedule_anchor_date(loan_row.id, loan_row.disbursement_date, reminder_date),
        loan_row.maturity_date,
        loan_row.interest_cycle_days,
        reminder_date
      );
      reminder_candidates := reminder_candidates || jsonb_build_array(jsonb_build_object(
        'reminderDate', reminder_date::text,
        'periodEndDate', upcoming_period_end::text
      ));
      calculation_date := greatest(calculation_date, upcoming_period_end);
      reminder_cursor := reminder_date + 1;
    end loop;

    continue when loan_row.disbursement_date > greatest(p_period_end, p_previous_end)
      and jsonb_array_length(reminder_candidates) = 0;

    if loan_row.disbursement_date <= p_period_end then
      select state.calculated_status, state.principal_outstanding_vnd, state.calculation_end
      into current_status, current_principal, current_calculation_end
      from private.dashboard_loan_state_at(loan_row.id, p_period_end) as state;

      if current_status = 'ACTIVE' then
        projection_reminder_date := private.next_interest_reminder_date(
          private.interest_schedule_anchor_date(loan_row.id, loan_row.disbursement_date, p_period_end),
          loan_row.maturity_date,
          loan_row.interest_cycle_days,
          loan_row.interest_reminder_offset_days,
          p_period_end
        );
        projection_period_end := case when projection_reminder_date is null then null else private.next_interest_due_date(
          private.interest_schedule_anchor_date(loan_row.id, loan_row.disbursement_date, p_period_end),
          loan_row.maturity_date,
          loan_row.interest_cycle_days,
          projection_reminder_date
        ) end;
        calculation_date := greatest(calculation_date, coalesce(projection_period_end, p_period_end));
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
          coalesce(projection_period_end, p_period_end)
        );
        if loan_row.direction = 'LENDING' then
          projected_lending_interest := projected_lending_interest + greatest(due_interest_balance, 0);
        else
          projected_borrowing_interest := projected_borrowing_interest + greatest(due_interest_balance, 0);
        end if;

      end if;
    end if;

    if jsonb_array_length(reminder_candidates) > 0 then
      for reminder_candidate in
        select value
        from jsonb_array_elements(reminder_candidates)
        order by (value ->> 'reminderDate')::date
      loop
        reminder_date := (reminder_candidate ->> 'reminderDate')::date;
        upcoming_period_end := (reminder_candidate ->> 'periodEndDate')::date;

        select state.calculated_status, state.principal_outstanding_vnd
        into reminder_status, reminder_principal
        from private.dashboard_loan_state_at(
          loan_row.id,
          greatest(p_reminder_as_of, reminder_date)
        ) as state;

        continue when reminder_status <> 'ACTIVE';

        due_interest_balance := private.dashboard_interest_balance_at(
          loan_row.id,
          calculation,
          upcoming_period_end
        );

        payments_after_due := 0;
        if upcoming_period_end < p_reminder_as_of then
          select coalesce(sum(transaction.amount_vnd), 0)
          into payments_after_due
          from public.transactions as transaction
          where transaction.loan_id = loan_row.id
            and transaction.type = 'INTEREST_PAYMENT'
            and transaction.transaction_date > upcoming_period_end
            and transaction.transaction_date <= p_reminder_as_of
            and not exists (
              select 1
              from public.transactions as reversal
              where reversal.type = 'REVERSAL'
                and reversal.reversal_of_id = transaction.id
                and reversal.transaction_date <= p_reminder_as_of
            );
        end if;

        due_interest_balance := greatest(due_interest_balance - payments_after_due, 0);
        if due_interest_balance > 0 then
          upcoming := upcoming || jsonb_build_array(jsonb_build_object(
            'id', loan_row.id::text,
            'name', loan_row.name,
            'direction', loan_row.direction::text,
            'status', 'ACTIVE',
            'attentionType', 'INTEREST_DUE',
            'reminderDate', reminder_date::text,
            'periodEndDate', upcoming_period_end::text,
            'dueDate', reminder_date::text,
            'principalVnd', greatest(reminder_principal, 0)::text,
            'interestVnd', due_interest_balance::text
          ));
          exit;
        end if;
      end loop;
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
    'reminderStartDate', p_reminder_start::text,
    'reminderEndDate', p_reminder_end::text,
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

revoke all on function public.get_management_dashboard_bundle_v5(date,date,date,date,date,date,date,date,date) from public, anon;
grant execute on function public.get_management_dashboard_bundle_v5(date,date,date,date,date,date,date,date,date) to authenticated, service_role;

comment on function public.get_management_dashboard_bundle_v5(date,date,date,date,date,date,date,date,date) is
  'Returns the v4 dashboard contract with interest actions selected from an explicit current calendar month.';

create or replace function public.list_counterparties_with_financials(p_as_of_date date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  perform private.require_active_user();

  if p_as_of_date is null then
    raise exception 'counterparty summary as-of date is required' using errcode = '22023';
  end if;

  with loan_financials as (
    select
      loan.counterparty_id,
      coalesce(sum(greatest(state.principal_outstanding_vnd, 0)) filter (
        where loan.direction = 'LENDING' and state.calculated_status <> 'SETTLED'
      ), 0)::bigint as lending_outstanding_vnd,
      coalesce(sum(greatest(state.principal_outstanding_vnd, 0)) filter (
        where loan.direction = 'BORROWING' and state.calculated_status <> 'SETTLED'
      ), 0)::bigint as borrowing_outstanding_vnd
    from public.loans as loan
    cross join lateral private.dashboard_loan_state_at(loan.id, p_as_of_date) as state
    where not loan.is_test_data
      and loan.disbursement_date <= p_as_of_date
    group by loan.counterparty_id
  ), interest_financials as (
    select
      loan.counterparty_id,
      coalesce(sum(transaction.amount_vnd) filter (where loan.direction = 'LENDING'), 0)::bigint
        as interest_collected_vnd,
      coalesce(sum(transaction.amount_vnd) filter (where loan.direction = 'BORROWING'), 0)::bigint
        as interest_paid_vnd
    from public.transactions as transaction
    join public.loans as loan on loan.id = transaction.loan_id
    where not loan.is_test_data
      and transaction.type = 'INTEREST_PAYMENT'
      and transaction.transaction_date <= p_as_of_date
      and not exists (
        select 1
        from public.transactions as reversal
        where reversal.type = 'REVERSAL'
          and reversal.reversal_of_id = transaction.id
          and reversal.transaction_date <= p_as_of_date
      )
      and not exists (
        select 1
        from private.legacy_onboarding_transactions as opening
        where opening.transaction_id = transaction.id
      )
    group by loan.counterparty_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', counterparty.id::text,
    'name', counterparty.name,
    'notes', counterparty.notes,
    'created_at', counterparty.created_at,
    'updated_at', counterparty.updated_at,
    'lendingOutstandingVnd', coalesce(loan_financials.lending_outstanding_vnd, 0)::text,
    'borrowingOutstandingVnd', coalesce(loan_financials.borrowing_outstanding_vnd, 0)::text,
    'interestCollectedVnd', coalesce(interest_financials.interest_collected_vnd, 0)::text,
    'interestPaidVnd', coalesce(interest_financials.interest_paid_vnd, 0)::text
  ) order by counterparty.name, counterparty.id), '[]'::jsonb)
  into result
  from public.counterparties as counterparty
  left join loan_financials on loan_financials.counterparty_id = counterparty.id
  left join interest_financials on interest_financials.counterparty_id = counterparty.id
  where not counterparty.is_test_data;

  return result;
end;
$$;

revoke all on function public.list_counterparties_with_financials(date) from public, anon;
grant execute on function public.list_counterparties_with_financials(date) to authenticated, service_role;

comment on function public.list_counterparties_with_financials(date) is
  'Lists counterparties with authoritative outstanding principal by direction and effective lifetime interest cash flows.';

commit;
