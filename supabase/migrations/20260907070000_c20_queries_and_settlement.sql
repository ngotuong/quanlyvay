begin;

create function public.get_general_expenses_page(p_page integer default 1, p_size integer default 25)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  perform private.require_active_user();
  if p_page is null or p_size is null or p_page < 1 or p_page > 1000000 or p_size < 1 or p_size > 100 then raise exception 'Invalid page' using errcode='22023'; end if;
  with rows as materialized (
    select t.*, e.category, exists(select 1 from public.transactions r where r.reversal_of_id=t.id and r.type='REVERSAL') as reversed
    from public.transactions t left join public.expenses e on e.transaction_id=t.id
    where t.loan_id is null and t.type='EXPENSE'
  ), categories as (
    select coalesce(category, 'Chi phí khác') as category, sum(amount_vnd) as amount
    from rows where not reversed group by coalesce(category, 'Chi phí khác')
  ), page_rows as (
    select * from rows order by transaction_date desc, created_at desc, id desc limit p_size offset (p_page-1)*p_size
  )
  select jsonb_build_object(
    'totalCount', (select count(*) from rows),
    'totalVnd', (select coalesce(sum(amount_vnd),0)::text from rows where not reversed),
    'categories', (select coalesce(jsonb_agg(jsonb_build_object('category', category, 'amountVnd', amount::text) order by amount desc, category),'[]') from categories),
    'items', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'type', type, 'transaction_date', transaction_date,
      'amount_vnd', amount_vnd::text, 'note', note, 'created_at', created_at, 'reversed', reversed,
      'expenses', jsonb_build_object('category', category)) order by transaction_date desc, created_at desc, id desc),'[]') from page_rows)
  ) into result;
  return result;
end;
$$;

create function public.preview_settlement(p_loan_id uuid, p_settlement_date date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare calculated jsonb; principal numeric; interest numeric;
begin
  perform private.require_writer();
  if p_loan_id is null or p_settlement_date is null then raise exception 'Loan and date required' using errcode='22023'; end if;
  calculated := private.calculate_loan_json(p_loan_id, p_settlement_date);
  principal := (calculated->>'principalOutstandingVnd')::numeric;
  interest := (calculated->>'interestBalanceVnd')::numeric;
  if calculated->>'status' = 'SETTLED' or principal < 0 or interest < 0 then
    raise exception 'Settlement unavailable' using errcode='23514';
  end if;
  return jsonb_build_object('principalVnd', principal::text, 'interestVnd', interest::text,
    'totalVnd', (principal+interest)::text, 'date', p_settlement_date);
end;
$$;

create function public.settle_loan_confirmed(p_loan_id uuid, p_settlement_date date,
  p_idempotency_key text, p_expected_principal text, p_expected_interest text, p_note text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare preview jsonb;
begin
  perform private.require_writer();
  perform 1 from public.loans where id=p_loan_id for update;
  if not found then raise exception 'Loan does not exist' using errcode='P0002'; end if;
  -- Delegate retries to the original RPC, which verifies matching input and reversal state.
  if exists(select 1 from public.loan_lifecycle_events where idempotency_key=p_idempotency_key || ':event') then
    return public.settle_loan(p_loan_id, p_settlement_date, p_idempotency_key, p_note);
  end if;
  preview := public.preview_settlement(p_loan_id, p_settlement_date);
  if preview->>'principalVnd' is distinct from p_expected_principal
    or preview->>'interestVnd' is distinct from p_expected_interest then
    -- A stale user confirmation is an HTTP conflict, not a retryable serialization failure.
    raise exception 'Settlement preview changed' using errcode='PT409';
  end if;
  return public.settle_loan(p_loan_id, p_settlement_date, p_idempotency_key, p_note);
end;
$$;

revoke all on function public.get_general_expenses_page(integer,integer) from public, anon;
revoke all on function public.preview_settlement(uuid,date) from public, anon;
revoke all on function public.settle_loan_confirmed(uuid,date,text,text,text,text) from public, anon;
grant execute on function public.get_general_expenses_page(integer,integer), public.preview_settlement(uuid,date),
  public.settle_loan_confirmed(uuid,date,text,text,text,text) to authenticated;

commit;
