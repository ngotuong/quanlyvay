begin;

create index if not exists loan_lifecycle_events_listing_idx
  on public.loan_lifecycle_events (loan_id, event_type, effective_date desc, created_at desc, id desc);

create index if not exists transactions_loan_type_date_idx
  on public.transactions (loan_id, type, transaction_date, id)
  where type in ('PRINCIPAL_PAYMENT', 'INTEREST_PAYMENT');

create or replace function private.loan_listing_facts(
  p_as_of_date date,
  p_query text default null,
  p_disbursed_from date default null,
  p_disbursed_to date default null
)
returns table (
  loan_id uuid,
  calculated_status public.loan_status,
  principal_outstanding_vnd bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    loan.id,
    case
      when settlement.effective_date is not null then 'SETTLED'::public.loan_status
      when state.event_type = 'BAD_DEBT_START' then 'BAD_DEBT'::public.loan_status
      when p_as_of_date > loan.maturity_date then 'OVERDUE'::public.loan_status
      else 'ACTIVE'::public.loan_status
    end,
    loan.original_principal_vnd - coalesce(principal.paid_vnd, 0)
  from public.loans as loan
  join public.counterparties as counterparty on counterparty.id = loan.counterparty_id
  left join lateral (
    select event.effective_date
    from public.loan_lifecycle_events as event
    where event.loan_id = loan.id
      and event.event_type = 'SETTLEMENT'
      and event.effective_date <= p_as_of_date
      and not exists (
        select 1 from public.loan_settlement_reversals as reversal
        where reversal.settlement_event_id = event.id
      )
    order by event.effective_date, event.created_at, event.id
    limit 1
  ) as settlement on true
  left join lateral (
    select event.event_type
    from public.loan_lifecycle_events as event
    where event.loan_id = loan.id
      and event.event_type in ('BAD_DEBT_START', 'INTEREST_RESUME')
      and event.effective_date <= least(p_as_of_date, coalesce(settlement.effective_date, p_as_of_date))
    order by event.effective_date desc, event.created_at desc, event.id desc
    limit 1
  ) as state on true
  left join lateral (
    select coalesce(sum(transaction.amount_vnd), 0)::bigint as paid_vnd
    from public.transactions as transaction
    where transaction.loan_id = loan.id
      and transaction.type = 'PRINCIPAL_PAYMENT'
      and transaction.transaction_date <= least(p_as_of_date, coalesce(settlement.effective_date, p_as_of_date))
      and not exists (
        select 1 from public.transactions as reversal
        where reversal.type = 'REVERSAL' and reversal.reversal_of_id = transaction.id
      )
  ) as principal on true
  where (nullif(btrim(p_query), '') is null
      or loan.name ilike '%' || btrim(p_query) || '%'
      or counterparty.name ilike '%' || btrim(p_query) || '%')
    and (p_disbursed_from is null or loan.disbursement_date >= p_disbursed_from)
    and (p_disbursed_to is null or loan.disbursement_date <= p_disbursed_to);
$$;

revoke all on function private.loan_listing_facts(date, text, date, date) from public, anon, authenticated;
grant execute on function private.loan_listing_facts(date, text, date, date) to service_role;

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
  counts jsonb;
  total_count integer;
begin
  perform private.require_active_user();

  if p_page is null or p_size is null or p_page < 1 or p_page > 1000000 or p_size < 1 or p_size > 100 then raise exception 'Invalid page' using errcode='22023'; end if;
  if p_as_of_date is null then raise exception 'as-of date is required' using errcode='22023'; end if;
  if p_sort not in ('newest', 'oldest', 'outstanding_desc', 'name') then raise exception 'unsupported loan sort' using errcode='22023'; end if;

  select
    count(*) filter (where (p_direction is null or loan.direction = p_direction)
      and (p_status is null or fact.calculated_status = p_status))::integer,
    jsonb_build_object(
      'all', count(*),
      'lending', count(*) filter (where loan.direction = 'LENDING'),
      'borrowing', count(*) filter (where loan.direction = 'BORROWING'),
      'active', count(*) filter (where fact.calculated_status = 'ACTIVE'),
      'badDebt', count(*) filter (where fact.calculated_status = 'BAD_DEBT'),
      'settled', count(*) filter (where fact.calculated_status = 'SETTLED')
    )
  into total_count, counts
  from private.loan_listing_facts(p_as_of_date, p_query, p_disbursed_from, p_disbursed_to) as fact
  join public.loans as loan on loan.id = fact.loan_id;

  for loan_record in
    select loan.*, counterparty.name as counterparty_name,
      fact.calculated_status, fact.principal_outstanding_vnd
    from private.loan_listing_facts(p_as_of_date, p_query, p_disbursed_from, p_disbursed_to) as fact
    join public.loans as loan on loan.id = fact.loan_id
    join public.counterparties as counterparty on counterparty.id = loan.counterparty_id
    where (p_direction is null or loan.direction = p_direction)
      and (p_status is null or fact.calculated_status = p_status)
    order by
      case when p_sort = 'oldest' then loan.disbursement_date end asc,
      case when p_sort = 'oldest' then loan.created_at end asc,
      case when p_sort = 'outstanding_desc' then fact.principal_outstanding_vnd end desc,
      case when p_sort = 'name' then loan.name end asc,
      case when p_sort = 'newest' then loan.disbursement_date end desc,
      case when p_sort = 'newest' then loan.created_at end desc,
      loan.id
    limit p_size offset (p_page - 1) * p_size
  loop
    calculation := private.calculate_loan_json(loan_record.id, p_as_of_date) - 'periods';
    reminder_date := null;
    period_end := null;
    if loan_record.calculated_status <> 'SETTLED' then
      reminder_date := private.next_interest_reminder_date(
        loan_record.disbursement_date, loan_record.maturity_date,
        loan_record.interest_cycle_days, loan_record.interest_reminder_offset_days, p_as_of_date
      );
      if reminder_date is not null then
        period_end := private.next_interest_due_date(
          loan_record.disbursement_date, loan_record.maturity_date,
          loan_record.interest_cycle_days, reminder_date
        );
      end if;
    end if;

    select
      (select coalesce(sum(transaction.amount_vnd), 0)
       from public.transactions as transaction
       where transaction.loan_id = loan_record.id
         and transaction.type = 'INTEREST_PAYMENT'
         and transaction.transaction_date <= p_as_of_date
         and not exists (select 1 from public.transactions as reversal
           where reversal.type = 'REVERSAL' and reversal.reversal_of_id = transaction.id
             and reversal.transaction_date <= p_as_of_date)
         and not exists (select 1 from private.legacy_onboarding_transactions as opening
           where opening.transaction_id = transaction.id))
      +
      (select coalesce(sum(onboarding.interest_collected_vnd), 0)
       from public.legacy_loan_onboardings as onboarding
       where onboarding.loan_id = loan_record.id and onboarding.as_of_date <= p_as_of_date)
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

  return jsonb_build_object('totalCount', coalesce(total_count, 0), 'items', rows,
    'counts', coalesce(counts, jsonb_build_object('all',0,'lending',0,'borrowing',0,'active',0,'badDebt',0,'settled',0)));
end;
$$;

revoke all on function public.list_loan_summaries_page(date, text, public.loan_direction, public.loan_status, date, date, text, integer, integer) from public, anon;
grant execute on function public.list_loan_summaries_page(date, text, public.loan_direction, public.loan_status, date, date, text, integer, integer) to authenticated, service_role;

comment on function public.list_loan_summaries_page(date, text, public.loan_direction, public.loan_status, date, date, text, integer, integer) is
  'Returns one page of authoritative loan cards; derives status/principal set-wise before calculating interest for selected cards.';

commit;
