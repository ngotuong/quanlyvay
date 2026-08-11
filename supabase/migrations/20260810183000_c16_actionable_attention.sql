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
    E'''status'', ''OVERDUE'',\n        ''dueDate'', loan_row.maturity_date::text,\n        ''principalVnd'', principal_outstanding::text,\n        ''interestVnd'', interest_balance::text',
    E'''status'', ''OVERDUE'',\n        ''attentionType'', ''PRINCIPAL_OVERDUE'',\n        ''reminderDate'', null,\n        ''periodEndDate'', loan_row.maturity_date::text,\n        ''dueDate'', loan_row.maturity_date::text,\n        ''principalVnd'', principal_outstanding::text,\n        ''interestVnd'', interest_balance::text'
  );

  patched := replace(
    patched,
    E'if reminder_date between p_period_end and p_period_end + 30 then\n        upcoming := upcoming || jsonb_build_array(jsonb_build_object(\n          ''id'', loan_row.id::text,\n          ''name'', loan_row.name,\n          ''direction'', loan_row.direction::text,\n          ''status'', ''ACTIVE'',\n          ''dueDate'', reminder_date::text,\n          ''principalVnd'', principal_outstanding::text,\n          ''interestVnd'', (due_calculation ->> ''interestBalanceVnd'')',
    E'if reminder_date between p_period_end and p_period_end + 30\n         and (due_calculation ->> ''interestBalanceVnd'')::bigint > 0 then\n        upcoming := upcoming || jsonb_build_array(jsonb_build_object(\n          ''id'', loan_row.id::text,\n          ''name'', loan_row.name,\n          ''direction'', loan_row.direction::text,\n          ''status'', ''ACTIVE'',\n          ''attentionType'', ''INTEREST_DUE'',\n          ''reminderDate'', reminder_date::text,\n          ''periodEndDate'', upcoming_period_end::text,\n          ''dueDate'', reminder_date::text,\n          ''principalVnd'', principal_outstanding::text,\n          ''interestVnd'', greatest((due_calculation ->> ''interestBalanceVnd'')::bigint, 0)::text'
  );

  patched := replace(
    patched,
    E'  end loop;\n\n  select coalesce(jsonb_agg(ranked.item order by ranked.total_vnd desc, ranked.item ->> ''name''), ''[]''::jsonb)',
    E'  end loop;\n\n  select coalesce(jsonb_agg(item order by (item ->> ''dueDate'')::date, (item ->> ''principalVnd'')::bigint desc, item ->> ''name''), ''[]''::jsonb)\n  into overdue\n  from jsonb_array_elements(overdue) as item;\n\n  select coalesce(jsonb_agg(item order by (item ->> ''reminderDate'')::date, (item ->> ''interestVnd'')::bigint desc, item ->> ''name''), ''[]''::jsonb)\n  into upcoming\n  from jsonb_array_elements(upcoming) as item;\n\n  select coalesce(jsonb_agg(ranked.item order by ranked.total_vnd desc, ranked.item ->> ''name''), ''[]''::jsonb)'
  );

  if patched = definition
     or position('''attentionType'', ''PRINCIPAL_OVERDUE''' in patched) = 0
     or position('''attentionType'', ''INTEREST_DUE''' in patched) = 0
     or position('interestBalanceVnd'')::bigint > 0' in patched) = 0
     or position('into upcoming' in patched) = 0 then
    raise exception 'C16 actionable attention patch did not match the dashboard contract';
  end if;

  execute patched;
end;
$migration$;

comment on function public.get_management_dashboard(date, date) is
  'Management snapshot with actionable attention: overdue principal is explicit and interest reminders require a positive projected balance.';

commit;
