begin;

-- Supabase's historical default table grants leaked non-DML capabilities onto
-- three append-only ledgers. RLS and immutable row triggers do not protect TRUNCATE.
revoke all on table public.loan_term_corrections from anon, authenticated;
revoke all on table public.loan_settlement_reversals from anon, authenticated;
revoke all on table public.legacy_loan_onboardings from anon, authenticated;

grant select on table public.loan_term_corrections to authenticated;
grant select on table public.loan_settlement_reversals to authenticated;
grant select on table public.legacy_loan_onboardings to authenticated;

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;

create or replace function private.lock_idempotency_key(
  p_operation text,
  p_idempotency_key text
)
returns void
language plpgsql
volatile
set search_path = ''
as $$
begin
  if btrim(coalesce(p_operation, '')) = ''
     or btrim(coalesce(p_idempotency_key, '')) = '' then
    raise exception 'operation and idempotency_key are required' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_operation || ':' || p_idempotency_key, 123)
  );
end;
$$;

revoke all on function private.lock_idempotency_key(text, text) from public, anon, authenticated;

-- Patch only RPCs whose first idempotency lookup previously happened before any
-- row/advisory lock. Other financial RPCs already serialize on the loan row.
do $migration$
declare
  target record;
  definition text;
  patched text;
  needle constant text := E'  if btrim(coalesce(p_idempotency_key, \'\')) = \'\' then\n    raise exception \'idempotency_key is required\' using errcode = \'22023\';\n  end if;';
begin
  for target in
    select * from (values
      ('public.create_loan(uuid,text,public.loan_direction,bigint,date,integer,smallint,numeric,text,text)'::regprocedure, 'create_loan'),
      ('public.correct_loan_terms(uuid,public.loan_direction,bigint,date,integer,smallint,numeric,text,text)'::regprocedure, 'correct_loan_terms'),
      ('public.onboard_legacy_loan(uuid,date,bigint,bigint,date,text,text)'::regprocedure, 'onboard_legacy_loan'),
      ('public.record_expense(uuid,date,bigint,text,text,text)'::regprocedure, 'record_expense'),
      ('public.reverse_transaction(uuid,date,text,text,date)'::regprocedure, 'reverse_transaction')
    ) as functions(signature, operation)
  loop
    select pg_catalog.pg_get_functiondef(target.signature) into definition;
    patched := replace(
      definition,
      needle,
      needle || format(E'\n\n  perform private.lock_idempotency_key(%L, p_idempotency_key);', target.operation)
    );
    if patched = definition then
      raise exception 'C123 could not add idempotency lock to %', target.signature;
    end if;
    execute patched;
  end loop;
end;
$migration$;

comment on function private.lock_idempotency_key(text, text) is
  'Serializes identical in-flight mutation requests before their first idempotency lookup.';

commit;
