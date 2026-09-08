begin;

create or replace function public.list_loan_summaries_page(
  p_as_of_date date,
  p_query text default null,
  p_direction public.loan_direction default null,
  p_status public.loan_status default null,
  p_disbursed_from date default null,
  p_disbursed_to date default null,
  p_sort text default 'newest',
  p_page integer default 1,
  p_size integer default 25
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  loan_record record;
  calculation jsonb;
  reminder_date date;
  period_end date;
  interest_recorded bigint;
  rows jsonb := '[]'::jsonb;
  result jsonb;
  total_count integer;
begin
  perform private.require_active_user();

  if p_page is null or p_size is null or p_page < 1 or p_page > 1000000 or p_size < 1 or p_size > 100 then raise exception 'Invalid page' using errcode='22023'; end if;
  if p_as_of_date is null then
    raise exception 'as-of date is required' using errcode = '22023';
  end if;
  if p_sort not in ('newest', 'oldest', 'outstanding_desc', 'name') then
    raise exception 'unsupported loan sort' using errcode = '22023';
  end if;

  for loan_record in
    select loan.*, counterparty.name as counterparty_name
    from public.loans as loan
    join public.counterparties as counterparty on counterparty.id = loan.counterparty_id
    where (nullif(btrim(p_query), '') is null
      or loan.name ilike '%' || btrim(p_query) || '%'
      or counterparty.name ilike '%' || btrim(p_query) || '%')
      and (p_disbursed_from is null or loan.disbursement_date >= p_disbursed_from)
      and (p_disbursed_to is null or loan.disbursement_date <= p_disbursed_to)
  loop
    calculation := private.calculate_loan_json(loan_record.id, p_as_of_date) - 'periods';
    reminder_date := null;
    period_end := null;
    if calculation ->> 'status' <> 'SETTLED' then
      reminder_date := private.next_interest_reminder_date(
        loan_record.disbursement_date,
        loan_record.maturity_date,
        loan_record.interest_cycle_days,
        loan_record.interest_reminder_offset_days,
        p_as_of_date
      );
      if reminder_date is not null then
        period_end := private.next_interest_due_date(
          loan_record.disbursement_date,
          loan_record.maturity_date,
          loan_record.interest_cycle_days,
          reminder_date
        );
      end if;
    end if;

    select
      (select coalesce(sum(transaction.amount_vnd), 0)
       from public.transactions as transaction
       where transaction.loan_id = loan_record.id
         and transaction.type = 'INTEREST_PAYMENT'
         and transaction.transaction_date <= p_as_of_date
         and not exists (
           select 1 from public.transactions as reversal
           where reversal.type = 'REVERSAL'
             and reversal.reversal_of_id = transaction.id
             and reversal.transaction_date <= p_as_of_date
         )
         and not exists (
           select 1 from private.legacy_onboarding_transactions as opening
           where opening.transaction_id = transaction.id
         ))
      +
      (select coalesce(sum(onboarding.interest_collected_vnd), 0)
       from public.legacy_loan_onboardings as onboarding
       where onboarding.loan_id = loan_record.id
         and onboarding.as_of_date <= p_as_of_date)
    into interest_recorded;

    rows := rows || jsonb_build_array(jsonb_build_object(
      'id', loan_record.id::text,
      'counterparty_id', loan_record.counterparty_id::text,
      'name', loan_record.name,
      'direction', loan_record.direction::text,
      'status', loan_record.status::text,
      'original_principal_vnd', loan_record.original_principal_vnd::text,
      'disbursement_date', loan_record.disbursement_date::text,
      'term_days', loan_record.term_days,
      'maturity_date', loan_record.maturity_date::text,
      'interest_cycle_days', loan_record.interest_cycle_days,
      'interest_reminder_offset_days', loan_record.interest_reminder_offset_days,
      'initial_daily_rate_percent', loan_record.initial_daily_rate_percent::text,
      'settled_on', loan_record.settled_on::text,
      'notes', loan_record.notes,
      'created_at', loan_record.created_at,
      'counterparties', jsonb_build_object('name', loan_record.counterparty_name),
      'calculation', calculation,
      'interestRecordedVnd', interest_recorded::text,
      'schedule', jsonb_build_object(
        'hasMaturity', loan_record.maturity_date is not null,
        'maturityDate', loan_record.maturity_date::text,
        'nextInterestDueDate', reminder_date::text,
        'nextInterestPeriodEndDate', period_end::text,
        'interestReminderOffsetDays', loan_record.interest_reminder_offset_days
      )
    ));
  end loop;

  select coalesce(jsonb_agg(item order by
    case when p_sort = 'oldest' then item ->> 'disbursement_date' end asc,
    case when p_sort = 'oldest' then item ->> 'created_at' end asc,
    case when p_sort = 'outstanding_desc' then (item -> 'calculation' ->> 'principalOutstandingVnd')::bigint end desc,
    case when p_sort = 'name' then item ->> 'name' end asc,
    case when p_sort = 'newest' then item ->> 'disbursement_date' end desc,
    case when p_sort = 'newest' then item ->> 'created_at' end desc,
    item ->> 'id'
  ), '[]'::jsonb)
  into result
  from jsonb_array_elements(rows) as item
  where (p_direction is null or item ->> 'direction' = p_direction::text)
    and (p_status is null or item -> 'calculation' ->> 'status' = p_status::text);

  total_count := jsonb_array_length(result);
  select coalesce(jsonb_agg(item order by ordinal), '[]'::jsonb) into result
  from (select item, ordinal from jsonb_array_elements(result) with ordinality as r(item, ordinal)
    order by ordinal limit p_size offset (p_page-1)*p_size) page_rows;
  return jsonb_build_object(
    'totalCount', total_count,
    'items', result,
    'counts', jsonb_build_object(
      'all', jsonb_array_length(rows),
      'lending', (select count(*) from jsonb_array_elements(rows) item where item ->> 'direction' = 'LENDING'),
      'borrowing', (select count(*) from jsonb_array_elements(rows) item where item ->> 'direction' = 'BORROWING'),
      'active', (select count(*) from jsonb_array_elements(rows) item where item -> 'calculation' ->> 'status' = 'ACTIVE'),
      'badDebt', (select count(*) from jsonb_array_elements(rows) item where item -> 'calculation' ->> 'status' = 'BAD_DEBT'),
      'settled', (select count(*) from jsonb_array_elements(rows) item where item -> 'calculation' ->> 'status' = 'SETTLED')
    )
  );
end;
$$;

revoke all on function public.list_loan_summaries_page(date, text, public.loan_direction, public.loan_status, date, date, text, integer, integer) from public, anon;
grant execute on function public.list_loan_summaries_page(date, text, public.loan_direction, public.loan_status, date, date, text, integer, integer) to authenticated, service_role;

comment on function public.list_loan_summaries_page(date, text, public.loan_direction, public.loan_status, date, date, text, integer, integer) is
  'Returns filtered loan cards with authoritative calculation and effective interest recorded through the as-of date.';

commit;
