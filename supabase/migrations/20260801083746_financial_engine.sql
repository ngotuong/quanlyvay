begin;

alter table public.loan_lifecycle_events
  add column idempotency_key text;

alter table public.loan_lifecycle_events
  add constraint lifecycle_idempotency_not_blank
    check (btrim(idempotency_key) <> ''),
  add constraint lifecycle_idempotency_unique
    unique (idempotency_key);

comment on column public.loan_lifecycle_events.idempotency_key is
  'Required for client RPC mutations. Nullable only for trusted migration/backfill operations.';

create or replace function private.decimal_text(value numeric)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select case
    when value = 0 then '0'
    else trim(trailing '.' from trim(trailing '0' from value::text))
  end
$$;

create or replace function private.require_active_user()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null then
    if not (select private.is_active_user()) then
      raise exception 'An active application user is required'
        using errcode = '42501';
    end if;
  elsif coalesce(current_setting('role', true), '') in ('anon', 'authenticated') then
    raise exception 'An authenticated application user is required'
      using errcode = '42501';
  end if;
end;
$$;

create or replace function private.require_writer()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_active_user();

  if (select auth.uid()) is not null and not (select private.can_write()) then
    raise exception 'OWNER or EDITOR role is required'
      using errcode = '42501';
  end if;
end;
$$;

create or replace function private.calculate_loan_json(
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
  loan_row public.loans%rowtype;
  settlement_date date;
  calculation_end date;
  period_start date;
  period_end date;
  scheduled_limit date;
  period_kind public.interest_period_kind;
  opening_interest_balance bigint := 0;
  closing_interest_balance bigint := 0;
  accrued_interest bigint := 0;
  interest_payments bigint := 0;
  principal_outstanding bigint := 0;
  segments jsonb := '[]'::jsonb;
  periods jsonb := '[]'::jsonb;
  calculated_status public.loan_status;
  latest_state public.lifecycle_event_type;
begin
  perform private.require_active_user();

  if p_as_of_date is null then
    raise exception 'as_of_date is required' using errcode = '22004';
  end if;

  select * into strict loan_row
  from public.loans
  where id = p_loan_id;

  if p_as_of_date < loan_row.disbursement_date then
    raise exception 'as_of_date cannot precede loan disbursement'
      using errcode = '22007';
  end if;

  select min(effective_date) into settlement_date
  from public.loan_lifecycle_events
  where loan_id = p_loan_id
    and event_type = 'SETTLEMENT'
    and effective_date <= p_as_of_date;

  calculation_end := least(p_as_of_date, coalesce(settlement_date, p_as_of_date));

  select loan_row.original_principal_vnd - coalesce(sum(t.amount_vnd), 0)
  into principal_outstanding
  from public.transactions as t
  where t.loan_id = p_loan_id
    and t.type = 'PRINCIPAL_PAYMENT'
    and t.transaction_date <= calculation_end
    and not exists (
      select 1
      from public.transactions as reversal
      where reversal.type = 'REVERSAL'
        and reversal.reversal_of_id = t.id
    );

  if principal_outstanding < 0 then
    raise exception 'Principal outstanding cannot be negative'
      using errcode = '23514';
  end if;

  scheduled_limit := least(loan_row.maturity_date, calculation_end);
  period_start := loan_row.disbursement_date;

  while period_start <= scheduled_limit loop
    period_end := least(
      period_start + loan_row.interest_cycle_days - 1,
      scheduled_limit
    );

    if settlement_date is not null and period_end = settlement_date then
      period_kind := 'SETTLEMENT';
    else
      period_kind := 'SCHEDULED';
    end if;

    with effective_transactions as (
      select t.*
      from public.transactions as t
      where t.loan_id = p_loan_id
        and t.type <> 'REVERSAL'
        and not exists (
          select 1
          from public.transactions as reversal
          where reversal.type = 'REVERSAL'
            and reversal.reversal_of_id = t.id
        )
    ),
    days as (
      select
        generated.day::date as business_date,
        loan_row.original_principal_vnd - coalesce((
          select sum(t.amount_vnd)
          from effective_transactions as t
          where t.type = 'PRINCIPAL_PAYMENT'
            and t.transaction_date < generated.day::date
        ), 0) as principal_vnd,
        coalesce((
          select event.daily_rate_percent
          from public.loan_lifecycle_events as event
          where event.loan_id = p_loan_id
            and event.event_type in ('RATE_CHANGE', 'INTEREST_RESUME')
            and event.effective_date <= generated.day::date
          order by event.effective_date desc, event.created_at desc, event.id desc
          limit 1
        ), loan_row.initial_daily_rate_percent) as daily_rate_percent,
        coalesce((
          select state_event.event_type <> 'BAD_DEBT_START'
          from public.loan_lifecycle_events as state_event
          where state_event.loan_id = p_loan_id
            and state_event.event_type in ('BAD_DEBT_START', 'INTEREST_RESUME')
            and case
              when state_event.event_type = 'BAD_DEBT_START'
                then state_event.effective_date + 1
              else state_event.effective_date
            end <= generated.day::date
          order by
            case
              when state_event.event_type = 'BAD_DEBT_START'
                then state_event.effective_date + 1
              else state_event.effective_date
            end desc,
            case when state_event.event_type = 'INTEREST_RESUME' then 1 else 0 end desc,
            state_event.created_at desc,
            state_event.id desc
          limit 1
        ), true) as accrues_interest
      from generate_series(
        period_start::timestamp,
        period_end::timestamp,
        interval '1 day'
      ) as generated(day)
    ),
    accruing_days as (
      select *
      from days
      where accrues_interest
        and principal_vnd > 0
    ),
    with_previous as (
      select
        *,
        lag(business_date) over (order by business_date) as previous_date,
        lag(principal_vnd) over (order by business_date) as previous_principal,
        lag(daily_rate_percent) over (order by business_date) as previous_rate
      from accruing_days
    ),
    marked as (
      select
        *,
        case
          when previous_date is null
            or business_date <> previous_date + 1
            or principal_vnd <> previous_principal
            or daily_rate_percent <> previous_rate
          then 1
          else 0
        end as starts_new_segment
      from with_previous
    ),
    numbered as (
      select
        *,
        sum(starts_new_segment) over (order by business_date) as segment_number
      from marked
    ),
    grouped as (
      select
        segment_number,
        min(business_date) as start_date,
        max(business_date) as end_date,
        count(*)::integer as day_count,
        principal_vnd,
        daily_rate_percent
      from numbered
      group by segment_number, principal_vnd, daily_rate_percent
    )
    select
      coalesce(round((
        select sum(
          principal_vnd::numeric * daily_rate_percent / 100
        )
        from accruing_days
      ))::bigint, 0),
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'startDate', start_date::text,
            'endDate', end_date::text,
            'dayCount', day_count,
            'principalVnd', principal_vnd::text,
            'dailyRatePercent', private.decimal_text(daily_rate_percent)
          ) order by start_date
        )
        from grouped
      ), '[]'::jsonb)
    into accrued_interest, segments;

    select coalesce(sum(t.amount_vnd), 0)
    into interest_payments
    from public.transactions as t
    where t.loan_id = p_loan_id
      and t.type = 'INTEREST_PAYMENT'
      and t.transaction_date between period_start and period_end
      and not exists (
        select 1
        from public.transactions as reversal
        where reversal.type = 'REVERSAL'
          and reversal.reversal_of_id = t.id
      );

    closing_interest_balance :=
      opening_interest_balance + accrued_interest - interest_payments;

    periods := periods || jsonb_build_array(jsonb_build_object(
      'kind', period_kind::text,
      'startDate', period_start::text,
      'endDate', period_end::text,
      'dayCount', period_end - period_start + 1,
      'segments', segments,
      'openingInterestBalanceVnd', opening_interest_balance::text,
      'accruedInterestVnd', accrued_interest::text,
      'interestPaymentsVnd', interest_payments::text,
      'closingInterestBalanceVnd', closing_interest_balance::text,
      'openingPrincipalVnd', (
        loan_row.original_principal_vnd - coalesce((
          select sum(t.amount_vnd)
          from public.transactions as t
          where t.loan_id = p_loan_id
            and t.type = 'PRINCIPAL_PAYMENT'
            and t.transaction_date < period_start
            and not exists (
              select 1
              from public.transactions as reversal
              where reversal.type = 'REVERSAL'
                and reversal.reversal_of_id = t.id
            )
        ), 0)
      )::text,
      'closingPrincipalVnd', (
        loan_row.original_principal_vnd - coalesce((
          select sum(t.amount_vnd)
          from public.transactions as t
          where t.loan_id = p_loan_id
            and t.type = 'PRINCIPAL_PAYMENT'
            and t.transaction_date <= period_end
            and not exists (
              select 1
              from public.transactions as reversal
              where reversal.type = 'REVERSAL'
                and reversal.reversal_of_id = t.id
            )
        ), 0)
      )::text
    ));

    opening_interest_balance := closing_interest_balance;
    period_start := period_end + 1;
  end loop;

  if calculation_end > loan_row.maturity_date then
    period_start := loan_row.maturity_date + 1;
    period_end := calculation_end;

    if settlement_date is not null and period_end = settlement_date then
      period_kind := 'SETTLEMENT';
    else
      period_kind := 'OVERDUE';
    end if;

    with effective_transactions as (
      select t.*
      from public.transactions as t
      where t.loan_id = p_loan_id
        and t.type <> 'REVERSAL'
        and not exists (
          select 1
          from public.transactions as reversal
          where reversal.type = 'REVERSAL'
            and reversal.reversal_of_id = t.id
        )
    ),
    days as (
      select
        generated.day::date as business_date,
        loan_row.original_principal_vnd - coalesce((
          select sum(t.amount_vnd)
          from effective_transactions as t
          where t.type = 'PRINCIPAL_PAYMENT'
            and t.transaction_date < generated.day::date
        ), 0) as principal_vnd,
        coalesce((
          select event.daily_rate_percent
          from public.loan_lifecycle_events as event
          where event.loan_id = p_loan_id
            and event.event_type in ('RATE_CHANGE', 'INTEREST_RESUME')
            and event.effective_date <= generated.day::date
          order by event.effective_date desc, event.created_at desc, event.id desc
          limit 1
        ), loan_row.initial_daily_rate_percent) as daily_rate_percent,
        coalesce((
          select state_event.event_type <> 'BAD_DEBT_START'
          from public.loan_lifecycle_events as state_event
          where state_event.loan_id = p_loan_id
            and state_event.event_type in ('BAD_DEBT_START', 'INTEREST_RESUME')
            and case
              when state_event.event_type = 'BAD_DEBT_START'
                then state_event.effective_date + 1
              else state_event.effective_date
            end <= generated.day::date
          order by
            case
              when state_event.event_type = 'BAD_DEBT_START'
                then state_event.effective_date + 1
              else state_event.effective_date
            end desc,
            case when state_event.event_type = 'INTEREST_RESUME' then 1 else 0 end desc,
            state_event.created_at desc,
            state_event.id desc
          limit 1
        ), true) as accrues_interest
      from generate_series(
        period_start::timestamp,
        period_end::timestamp,
        interval '1 day'
      ) as generated(day)
    ),
    accruing_days as (
      select *
      from days
      where accrues_interest
        and principal_vnd > 0
    ),
    with_previous as (
      select
        *,
        lag(business_date) over (order by business_date) as previous_date,
        lag(principal_vnd) over (order by business_date) as previous_principal,
        lag(daily_rate_percent) over (order by business_date) as previous_rate
      from accruing_days
    ),
    marked as (
      select
        *,
        case
          when previous_date is null
            or business_date <> previous_date + 1
            or principal_vnd <> previous_principal
            or daily_rate_percent <> previous_rate
          then 1
          else 0
        end as starts_new_segment
      from with_previous
    ),
    numbered as (
      select
        *,
        sum(starts_new_segment) over (order by business_date) as segment_number
      from marked
    ),
    grouped as (
      select
        segment_number,
        min(business_date) as start_date,
        max(business_date) as end_date,
        count(*)::integer as day_count,
        principal_vnd,
        daily_rate_percent
      from numbered
      group by segment_number, principal_vnd, daily_rate_percent
    )
    select
      coalesce(round((
        select sum(
          principal_vnd::numeric * daily_rate_percent / 100
        )
        from accruing_days
      ))::bigint, 0),
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'startDate', start_date::text,
            'endDate', end_date::text,
            'dayCount', day_count,
            'principalVnd', principal_vnd::text,
            'dailyRatePercent', private.decimal_text(daily_rate_percent)
          ) order by start_date
        )
        from grouped
      ), '[]'::jsonb)
    into accrued_interest, segments;

    select coalesce(sum(t.amount_vnd), 0)
    into interest_payments
    from public.transactions as t
    where t.loan_id = p_loan_id
      and t.type = 'INTEREST_PAYMENT'
      and t.transaction_date between period_start and period_end
      and not exists (
        select 1
        from public.transactions as reversal
        where reversal.type = 'REVERSAL'
          and reversal.reversal_of_id = t.id
      );

    closing_interest_balance :=
      opening_interest_balance + accrued_interest - interest_payments;

    periods := periods || jsonb_build_array(jsonb_build_object(
      'kind', period_kind::text,
      'startDate', period_start::text,
      'endDate', period_end::text,
      'dayCount', period_end - period_start + 1,
      'segments', segments,
      'openingInterestBalanceVnd', opening_interest_balance::text,
      'accruedInterestVnd', accrued_interest::text,
      'interestPaymentsVnd', interest_payments::text,
      'closingInterestBalanceVnd', closing_interest_balance::text,
      'openingPrincipalVnd', (
        loan_row.original_principal_vnd - coalesce((
          select sum(t.amount_vnd)
          from public.transactions as t
          where t.loan_id = p_loan_id
            and t.type = 'PRINCIPAL_PAYMENT'
            and t.transaction_date < period_start
            and not exists (
              select 1
              from public.transactions as reversal
              where reversal.type = 'REVERSAL'
                and reversal.reversal_of_id = t.id
            )
        ), 0)
      )::text,
      'closingPrincipalVnd', principal_outstanding::text
    ));

    opening_interest_balance := closing_interest_balance;
  end if;

  select event_type into latest_state
  from public.loan_lifecycle_events
  where loan_id = p_loan_id
    and event_type in ('BAD_DEBT_START', 'INTEREST_RESUME')
    and effective_date <= calculation_end
  order by effective_date desc, created_at desc, id desc
  limit 1;

  calculated_status := case
    when settlement_date is not null then 'SETTLED'::public.loan_status
    when latest_state = 'BAD_DEBT_START' then 'BAD_DEBT'::public.loan_status
    when p_as_of_date > loan_row.maturity_date then 'OVERDUE'::public.loan_status
    else 'ACTIVE'::public.loan_status
  end;

  return jsonb_build_object(
    'loanId', p_loan_id::text,
    'asOfDate', p_as_of_date::text,
    'maturityDate', loan_row.maturity_date::text,
    'status', calculated_status::text,
    'principalOutstandingVnd', principal_outstanding::text,
    'interestBalanceVnd', opening_interest_balance::text,
    'periods', periods
  );
end;
$$;

create or replace function private.rebuild_loan_interest_periods(
  p_loan_id uuid,
  p_as_of_date date
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  result jsonb;
  period jsonb;
  next_version integer;
  result_status public.loan_status;
  result_settled_on date;
begin
  perform private.require_writer();
  result := private.calculate_loan_json(p_loan_id, p_as_of_date);

  select coalesce(max(calculation_version), 0) + 1
  into next_version
  from public.interest_periods
  where loan_id = p_loan_id;

  delete from public.interest_periods
  where loan_id = p_loan_id;

  for period in
    select value
    from jsonb_array_elements(result -> 'periods')
  loop
    insert into public.interest_periods (
      loan_id,
      kind,
      start_date,
      end_date,
      day_count,
      opening_principal_vnd,
      closing_principal_vnd,
      opening_interest_balance_vnd,
      accrued_interest_vnd,
      interest_payments_vnd,
      closing_interest_balance_vnd,
      segments,
      calculation_version
    ) values (
      p_loan_id,
      (period ->> 'kind')::public.interest_period_kind,
      (period ->> 'startDate')::date,
      (period ->> 'endDate')::date,
      (period ->> 'dayCount')::integer,
      (period ->> 'openingPrincipalVnd')::bigint,
      (period ->> 'closingPrincipalVnd')::bigint,
      (period ->> 'openingInterestBalanceVnd')::bigint,
      (period ->> 'accruedInterestVnd')::bigint,
      (period ->> 'interestPaymentsVnd')::bigint,
      (period ->> 'closingInterestBalanceVnd')::bigint,
      period -> 'segments',
      next_version
    );
  end loop;

  result_status := (result ->> 'status')::public.loan_status;
  select min(effective_date) into result_settled_on
  from public.loan_lifecycle_events
  where loan_id = p_loan_id
    and event_type = 'SETTLEMENT';

  update public.loans
  set
    status = result_status,
    settled_on = case when result_status = 'SETTLED' then result_settled_on end,
    updated_by = coalesce((select auth.uid()), updated_by)
  where id = p_loan_id
    and (
      status is distinct from result_status
      or settled_on is distinct from case when result_status = 'SETTLED' then result_settled_on end
    );

  return result || jsonb_build_object('calculationVersion', next_version);
end;
$$;

create or replace function private.validate_transaction()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  loan_row public.loans%rowtype;
  original_row public.transactions%rowtype;
  principal_paid bigint;
begin
  if new.type = 'REVERSAL' then
    select * into strict original_row
    from public.transactions
    where id = new.reversal_of_id;

    if original_row.type = 'REVERSAL' then
      raise exception 'A reversal cannot reverse another reversal'
        using errcode = '23514';
    end if;

    if original_row.type = 'DISBURSEMENT' then
      raise exception 'A disbursement cannot be reversed; correct the loan through a controlled workflow'
        using errcode = '23514';
    end if;

    if new.loan_id is distinct from original_row.loan_id then
      raise exception 'Reversal must belong to the same loan as the original transaction'
        using errcode = '23514';
    end if;

    if new.amount_vnd <> original_row.amount_vnd then
      raise exception 'Reversal amount must equal the original transaction amount'
        using errcode = '23514';
    end if;
  end if;

  if new.loan_id is not null then
    select * into strict loan_row
    from public.loans
    where id = new.loan_id;

    if new.transaction_date < loan_row.disbursement_date then
      raise exception 'Transaction cannot precede loan disbursement'
        using errcode = '23514';
    end if;

    if loan_row.status = 'SETTLED' and new.type <> 'REVERSAL' then
      raise exception 'Only reversals are allowed after settlement'
        using errcode = '23514';
    end if;

    if new.type = 'DISBURSEMENT' then
      if new.amount_vnd <> loan_row.original_principal_vnd then
        raise exception 'Disbursement amount must equal original principal'
          using errcode = '23514';
      end if;

      if exists (
        select 1 from public.transactions
        where loan_id = new.loan_id and type = 'DISBURSEMENT'
      ) then
        raise exception 'A loan can only have one disbursement transaction'
          using errcode = '23505';
      end if;
    end if;

    if new.type = 'PRINCIPAL_PAYMENT' then
      select coalesce(sum(t.amount_vnd), 0)
      into principal_paid
      from public.transactions as t
      where t.loan_id = new.loan_id
        and t.type = 'PRINCIPAL_PAYMENT'
        and not exists (
          select 1
          from public.transactions as reversal
          where reversal.type = 'REVERSAL'
            and reversal.reversal_of_id = t.id
        );

      if principal_paid + new.amount_vnd > loan_row.original_principal_vnd then
        raise exception 'Principal payment exceeds outstanding principal'
          using errcode = '23514';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.calculate_loan(
  p_loan_id uuid,
  p_as_of_date date
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select private.calculate_loan_json(p_loan_id, p_as_of_date)
$$;

create or replace function public.recalculate_loan(
  p_loan_id uuid,
  p_as_of_date date
)
returns jsonb
language sql
volatile
security definer
set search_path = ''
as $$
  select private.rebuild_loan_interest_periods(p_loan_id, p_as_of_date)
$$;

create or replace function public.record_financial_transaction(
  p_loan_id uuid,
  p_type public.transaction_type,
  p_transaction_date date,
  p_amount_vnd bigint,
  p_idempotency_key text,
  p_note text default null,
  p_recalculate_through date default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  existing public.transactions%rowtype;
  transaction_id uuid;
  calculation_date date;
begin
  perform private.require_writer();

  if p_type not in ('INTEREST_PAYMENT', 'PRINCIPAL_PAYMENT') then
    raise exception 'RPC only accepts INTEREST_PAYMENT or PRINCIPAL_PAYMENT'
      using errcode = '22023';
  end if;

  if p_amount_vnd is null or p_amount_vnd <= 0 then
    raise exception 'amount_vnd must be positive' using errcode = '22023';
  end if;

  if btrim(coalesce(p_idempotency_key, '')) = '' then
    raise exception 'idempotency_key is required' using errcode = '22023';
  end if;

  select * into existing
  from public.transactions
  where idempotency_key = p_idempotency_key;

  if found then
    if existing.loan_id is distinct from p_loan_id
       or existing.type is distinct from p_type
       or existing.transaction_date is distinct from p_transaction_date
       or existing.amount_vnd is distinct from p_amount_vnd
       or existing.note is distinct from p_note then
      raise exception 'Idempotency key is already used with different input'
        using errcode = '23505';
    end if;

    return existing.id;
  end if;

  insert into public.transactions (
    loan_id,
    type,
    transaction_date,
    amount_vnd,
    note,
    idempotency_key,
    created_by
  ) values (
    p_loan_id,
    p_type,
    p_transaction_date,
    p_amount_vnd,
    p_note,
    p_idempotency_key,
    (select auth.uid())
  ) returning id into transaction_id;

  calculation_date := greatest(
    p_transaction_date,
    coalesce(
      p_recalculate_through,
      (now() at time zone 'Asia/Ho_Chi_Minh')::date
    )
  );
  perform private.rebuild_loan_interest_periods(p_loan_id, calculation_date);

  return transaction_id;
end;
$$;

create or replace function public.record_lifecycle_event(
  p_loan_id uuid,
  p_event_type public.lifecycle_event_type,
  p_effective_date date,
  p_idempotency_key text,
  p_daily_rate_percent numeric default null,
  p_note text default null,
  p_recalculate_through date default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  existing public.loan_lifecycle_events%rowtype;
  event_id uuid;
  calculation_date date;
  resolved_daily_rate_percent numeric;
  latest_state public.lifecycle_event_type;
begin
  perform private.require_writer();

  if p_event_type not in ('RATE_CHANGE', 'BAD_DEBT_START', 'INTEREST_RESUME') then
    raise exception 'Use the settlement RPC for SETTLEMENT events'
      using errcode = '22023';
  end if;

  if btrim(coalesce(p_idempotency_key, '')) = '' then
    raise exception 'idempotency_key is required' using errcode = '22023';
  end if;

  resolved_daily_rate_percent := p_daily_rate_percent;

  if p_event_type = 'RATE_CHANGE' and resolved_daily_rate_percent is null then
    raise exception 'RATE_CHANGE requires daily_rate_percent'
      using errcode = '22023';
  end if;

  if p_event_type = 'INTEREST_RESUME' and resolved_daily_rate_percent is null then
    select coalesce((
      select event.daily_rate_percent
      from public.loan_lifecycle_events as event
      where event.loan_id = p_loan_id
        and event.event_type in ('RATE_CHANGE', 'INTEREST_RESUME')
        and event.effective_date < p_effective_date
      order by event.effective_date desc, event.created_at desc, event.id desc
      limit 1
    ), loan.initial_daily_rate_percent)
    into resolved_daily_rate_percent
    from public.loans as loan
    where loan.id = p_loan_id;
  end if;

  if p_event_type = 'BAD_DEBT_START' and resolved_daily_rate_percent is not null then
    raise exception 'BAD_DEBT_START does not accept daily_rate_percent'
      using errcode = '22023';
  end if;

  select * into existing
  from public.loan_lifecycle_events
  where idempotency_key = p_idempotency_key;

  if found then
    if existing.loan_id is distinct from p_loan_id
       or existing.event_type is distinct from p_event_type
       or existing.effective_date is distinct from p_effective_date
       or existing.daily_rate_percent is distinct from resolved_daily_rate_percent
       or existing.note is distinct from p_note then
      raise exception 'Idempotency key is already used with different input'
        using errcode = '23505';
    end if;

    return existing.id;
  end if;

  select event_type into latest_state
  from public.loan_lifecycle_events
  where loan_id = p_loan_id
    and event_type in ('BAD_DEBT_START', 'INTEREST_RESUME')
    and effective_date < p_effective_date
  order by effective_date desc, created_at desc, id desc
  limit 1;

  if p_event_type = 'BAD_DEBT_START' and latest_state = 'BAD_DEBT_START' then
    raise exception 'Interest accrual is already paused for bad debt'
      using errcode = '23514';
  end if;

  if p_event_type = 'INTEREST_RESUME'
     and latest_state is distinct from 'BAD_DEBT_START' then
    raise exception 'Interest can only resume after a bad-debt pause'
      using errcode = '23514';
  end if;

  insert into public.loan_lifecycle_events (
    loan_id,
    event_type,
    effective_date,
    daily_rate_percent,
    note,
    idempotency_key,
    created_by
  ) values (
    p_loan_id,
    p_event_type,
    p_effective_date,
    resolved_daily_rate_percent,
    p_note,
    p_idempotency_key,
    (select auth.uid())
  ) returning id into event_id;

  calculation_date := greatest(
    p_effective_date,
    coalesce(
      p_recalculate_through,
      (now() at time zone 'Asia/Ho_Chi_Minh')::date
    )
  );
  perform private.rebuild_loan_interest_periods(p_loan_id, calculation_date);

  return event_id;
end;
$$;

create or replace function public.reverse_transaction(
  p_transaction_id uuid,
  p_reversal_date date,
  p_note text,
  p_idempotency_key text,
  p_recalculate_through date default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  original public.transactions%rowtype;
  existing public.transactions%rowtype;
  reversal_id uuid;
  calculation_date date;
begin
  perform private.require_writer();

  if btrim(coalesce(p_note, '')) = '' then
    raise exception 'A reversal note is required' using errcode = '22023';
  end if;

  if btrim(coalesce(p_idempotency_key, '')) = '' then
    raise exception 'idempotency_key is required' using errcode = '22023';
  end if;

  select * into strict original
  from public.transactions
  where id = p_transaction_id;

  if exists (
    select 1
    from public.loan_lifecycle_events as settlement
    where settlement.loan_id = original.loan_id
      and settlement.event_type = 'SETTLEMENT'
      and settlement.effective_date = original.transaction_date
  ) then
    raise exception 'Settlement transactions require a controlled settlement correction workflow'
      using errcode = '23514';
  end if;

  select * into existing
  from public.transactions
  where idempotency_key = p_idempotency_key;

  if found then
    if existing.type <> 'REVERSAL'
       or existing.reversal_of_id is distinct from p_transaction_id
       or existing.transaction_date is distinct from p_reversal_date
       or existing.note is distinct from p_note then
      raise exception 'Idempotency key is already used with different input'
        using errcode = '23505';
    end if;

    return existing.id;
  end if;

  insert into public.transactions (
    loan_id,
    type,
    transaction_date,
    amount_vnd,
    note,
    reversal_of_id,
    idempotency_key,
    created_by
  ) values (
    original.loan_id,
    'REVERSAL',
    p_reversal_date,
    original.amount_vnd,
    p_note,
    original.id,
    p_idempotency_key,
    (select auth.uid())
  ) returning id into reversal_id;

  calculation_date := greatest(
    p_reversal_date,
    coalesce(
      p_recalculate_through,
      (now() at time zone 'Asia/Ho_Chi_Minh')::date
    )
  );
  perform private.rebuild_loan_interest_periods(original.loan_id, calculation_date);

  return reversal_id;
end;
$$;

create or replace function public.settle_loan(
  p_loan_id uuid,
  p_settlement_date date,
  p_idempotency_key text,
  p_note text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  preview jsonb;
  final_result jsonb;
  principal_due bigint;
  interest_due bigint;
  existing_event public.loan_lifecycle_events%rowtype;
begin
  perform private.require_writer();

  if btrim(coalesce(p_idempotency_key, '')) = '' then
    raise exception 'idempotency_key is required' using errcode = '22023';
  end if;

  select * into existing_event
  from public.loan_lifecycle_events
  where idempotency_key = p_idempotency_key || ':event';

  if found then
    if existing_event.loan_id is distinct from p_loan_id
       or existing_event.event_type <> 'SETTLEMENT'
       or existing_event.effective_date is distinct from p_settlement_date
       or existing_event.note is distinct from p_note then
      raise exception 'Idempotency key is already used with different input'
        using errcode = '23505';
    end if;

    return private.rebuild_loan_interest_periods(p_loan_id, p_settlement_date);
  end if;

  preview := private.calculate_loan_json(p_loan_id, p_settlement_date);
  principal_due := (preview ->> 'principalOutstandingVnd')::bigint;
  interest_due := (preview ->> 'interestBalanceVnd')::bigint;

  if principal_due <= 0 then
    raise exception 'Loan has no outstanding principal to settle'
      using errcode = '23514';
  end if;

  if interest_due < 0 then
    raise exception 'Prepaid interest credit must be resolved before settlement'
      using errcode = '23514';
  end if;

  insert into public.loan_lifecycle_events (
    loan_id,
    event_type,
    effective_date,
    note,
    idempotency_key,
    created_by
  ) values (
    p_loan_id,
    'SETTLEMENT',
    p_settlement_date,
    p_note,
    p_idempotency_key || ':event',
    (select auth.uid())
  );

  insert into public.transactions (
    loan_id,
    type,
    transaction_date,
    amount_vnd,
    note,
    idempotency_key,
    created_by
  ) values (
    p_loan_id,
    'PRINCIPAL_PAYMENT',
    p_settlement_date,
    principal_due,
    p_note,
    p_idempotency_key || ':principal',
    (select auth.uid())
  );

  if interest_due > 0 then
    insert into public.transactions (
      loan_id,
      type,
      transaction_date,
      amount_vnd,
      note,
      idempotency_key,
      created_by
    ) values (
      p_loan_id,
      'INTEREST_PAYMENT',
      p_settlement_date,
      interest_due,
      p_note,
      p_idempotency_key || ':interest',
      (select auth.uid())
    );
  end if;

  final_result := private.rebuild_loan_interest_periods(p_loan_id, p_settlement_date);
  return final_result || jsonb_build_object(
    'settledPrincipalVnd', principal_due::text,
    'settledInterestVnd', interest_due::text
  );
end;
$$;

revoke insert on public.transactions from authenticated;
revoke insert on public.loan_lifecycle_events from authenticated;
revoke insert on public.expenses from authenticated;

revoke all on function public.calculate_loan(uuid, date) from public, anon;
revoke all on function public.recalculate_loan(uuid, date) from public, anon;
revoke all on function public.record_financial_transaction(uuid, public.transaction_type, date, bigint, text, text, date) from public, anon;
revoke all on function public.record_lifecycle_event(uuid, public.lifecycle_event_type, date, text, numeric, text, date) from public, anon;
revoke all on function public.reverse_transaction(uuid, date, text, text, date) from public, anon;
revoke all on function public.settle_loan(uuid, date, text, text) from public, anon;

grant execute on function public.calculate_loan(uuid, date) to authenticated, service_role;
grant execute on function public.recalculate_loan(uuid, date) to authenticated, service_role;
grant execute on function public.record_financial_transaction(uuid, public.transaction_type, date, bigint, text, text, date) to authenticated, service_role;
grant execute on function public.record_lifecycle_event(uuid, public.lifecycle_event_type, date, text, numeric, text, date) to authenticated, service_role;
grant execute on function public.reverse_transaction(uuid, date, text, text, date) to authenticated, service_role;
grant execute on function public.settle_loan(uuid, date, text, text) to authenticated, service_role;

comment on function public.calculate_loan(uuid, date) is
  'Authoritative, read-only loan calculation for an inclusive business date.';
comment on function public.recalculate_loan(uuid, date) is
  'Rebuilds persisted interest periods and derived loan status atomically.';
comment on function public.record_financial_transaction(uuid, public.transaction_type, date, bigint, text, text, date) is
  'Idempotent RPC for principal and interest payments; recalculates affected history.';
comment on function public.record_lifecycle_event(uuid, public.lifecycle_event_type, date, text, numeric, text, date) is
  'Idempotent RPC for rate change, bad debt pause, and interest resume.';
comment on function public.reverse_transaction(uuid, date, text, text, date) is
  'Appends one immutable reversal and recalculates from the original effective history.';
comment on function public.settle_loan(uuid, date, text, text) is
  'Atomically records settlement event, remaining principal, accrued interest, and recalculation.';

commit;
