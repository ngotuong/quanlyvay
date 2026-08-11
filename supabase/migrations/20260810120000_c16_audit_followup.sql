begin;

do $migration$
declare
  definition text;
  patched text;
begin
  select pg_get_functiondef('public.get_management_dashboard(date,date)'::regprocedure)
  into definition;

  patched := replace(
    definition,
    '  loan_row public.loans%rowtype;',
    '  loan_row record;'
  );
  patched := replace(
    patched,
    E'  cash_flow jsonb;\nbegin',
    E'  cash_flow jsonb;\n  counterparty_exposure_map jsonb := ''{}''::jsonb;\n  counterparty_exposure_entry jsonb;\n  counterparty_exposure jsonb := ''[]''::jsonb;\nbegin'
  );
  patched := replace(
    patched,
    E'    select * from public.loans\n    where disbursement_date <= p_period_end\n    order by maturity_date nulls last, id',
    E'    select loan.*, counterparty.name as counterparty_name\n    from public.loans as loan\n    join public.counterparties as counterparty on counterparty.id = loan.counterparty_id\n    where loan.disbursement_date <= p_period_end\n    order by loan.maturity_date nulls last, loan.id'
  );
  patched := replace(
    patched,
    E'      else\n        active_borrowing_outstanding := active_borrowing_outstanding + principal_outstanding;\n      end if;\n    end if;\n\n    if calculation_status = ''OVERDUE'' then',
    E'      else\n        active_borrowing_outstanding := active_borrowing_outstanding + principal_outstanding;\n      end if;\n    end if;\n\n    counterparty_exposure_entry := coalesce(\n      counterparty_exposure_map -> loan_row.counterparty_id::text,\n      jsonb_build_object(\n        ''counterpartyId'', loan_row.counterparty_id::text,\n        ''name'', loan_row.counterparty_name,\n        ''lendingVnd'', ''0'',\n        ''badDebtVnd'', ''0'',\n        ''borrowingVnd'', ''0''\n      )\n    );\n    counterparty_exposure_entry := counterparty_exposure_entry || jsonb_build_object(\n      ''lendingVnd'', (\n        (counterparty_exposure_entry ->> ''lendingVnd'')::bigint\n        + case when loan_row.direction = ''LENDING'' and calculation_status <> ''BAD_DEBT'' then principal_outstanding else 0 end\n      )::text,\n      ''badDebtVnd'', (\n        (counterparty_exposure_entry ->> ''badDebtVnd'')::bigint\n        + case when loan_row.direction = ''LENDING'' and calculation_status = ''BAD_DEBT'' then principal_outstanding else 0 end\n      )::text,\n      ''borrowingVnd'', (\n        (counterparty_exposure_entry ->> ''borrowingVnd'')::bigint\n        + case when loan_row.direction = ''BORROWING'' then principal_outstanding else 0 end\n      )::text\n    );\n    counterparty_exposure_map := jsonb_set(\n      counterparty_exposure_map,\n      array[loan_row.counterparty_id::text],\n      counterparty_exposure_entry,\n      true\n    );\n\n    if calculation_status = ''OVERDUE'' then'
  );
  patched := replace(
    patched,
    E'  end loop;\n\n  with effective as (',
    E'  end loop;\n\n  select coalesce(jsonb_agg(ranked.item order by ranked.total_vnd desc, ranked.item ->> ''name''), ''[]''::jsonb)\n  into counterparty_exposure\n  from (\n    select\n      exposure.value || jsonb_build_object(\n        ''totalVnd'', (\n          (exposure.value ->> ''lendingVnd'')::bigint\n          + (exposure.value ->> ''badDebtVnd'')::bigint\n          + (exposure.value ->> ''borrowingVnd'')::bigint\n        )::text\n      ) as item,\n      (exposure.value ->> ''lendingVnd'')::bigint\n        + (exposure.value ->> ''badDebtVnd'')::bigint\n        + (exposure.value ->> ''borrowingVnd'')::bigint as total_vnd\n    from jsonb_each(counterparty_exposure_map) as exposure\n    where (exposure.value ->> ''lendingVnd'')::bigint\n      + (exposure.value ->> ''badDebtVnd'')::bigint\n      + (exposure.value ->> ''borrowingVnd'')::bigint > 0\n    order by total_vnd desc, exposure.value ->> ''name''\n    limit 10\n  ) as ranked;\n\n  with effective as ('
  );
  patched := replace(
    patched,
    E'    ''accrualProfitVnd'', (lending_accrued - borrowing_accrued - expenses_paid)::text,\n    ''projectedLendingInterestVnd''',
    E'    ''accrualProfitVnd'', (lending_accrued - borrowing_accrued - expenses_paid)::text,\n    ''lendingAccruedVnd'', lending_accrued::text,\n    ''borrowingAccruedVnd'', borrowing_accrued::text,\n    ''counterpartyExposure'', counterparty_exposure,\n    ''projectedLendingInterestVnd'''
  );

  if patched = definition
     or position('counterparty_exposure_map' in patched) = 0
     or position('counterpartyExposure' in patched) = 0 then
    raise exception 'C16 audit follow-up could not consolidate dashboard analytics';
  end if;

  execute patched;
end;
$migration$;

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
  dashboard jsonb;
begin
  dashboard := public.get_management_dashboard(p_period_start, p_period_end);
  return jsonb_build_object(
    'lendingAccruedVnd', dashboard ->> 'lendingAccruedVnd',
    'borrowingAccruedVnd', dashboard ->> 'borrowingAccruedVnd',
    'counterpartyExposure', dashboard -> 'counterpartyExposure'
  );
end;
$$;

create or replace function public.get_management_dashboard_bundle_v2(
  p_period_start date,
  p_period_end date,
  p_previous_start date,
  p_previous_end date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  dashboard jsonb;
  previous_dashboard jsonb;
begin
  dashboard := public.get_management_dashboard(p_period_start, p_period_end);
  previous_dashboard := public.get_management_dashboard(p_previous_start, p_previous_end);

  return jsonb_build_object(
    'dashboard', dashboard,
    'analytics', jsonb_build_object(
      'lendingAccruedVnd', dashboard ->> 'lendingAccruedVnd',
      'borrowingAccruedVnd', dashboard ->> 'borrowingAccruedVnd',
      'counterpartyExposure', dashboard -> 'counterpartyExposure'
    ),
    'previousDashboard', previous_dashboard
  );
end;
$$;

revoke all on function public.get_management_analytics(date, date) from public, anon;
revoke all on function public.get_management_dashboard_bundle_v2(date, date, date, date) from public, anon;
grant execute on function public.get_management_analytics(date, date) to authenticated, service_role;
grant execute on function public.get_management_dashboard_bundle_v2(date, date, date, date) to authenticated, service_role;

comment on function public.get_management_dashboard(date, date) is
  'Period-aware management snapshot containing KPI, cash flow, due schedules and analytics from one loan-calculation pass.';
comment on function public.get_management_analytics(date, date) is
  'Backward-compatible analytics projection of the consolidated management snapshot.';
comment on function public.get_management_dashboard_bundle_v2(date, date, date, date) is
  'Returns current KPIs/analytics from one shared snapshot plus the preceding comparison snapshot.';

commit;
