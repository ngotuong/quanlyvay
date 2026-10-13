begin;

alter function private.dashboard_accrued_through(jsonb, date) stable;

comment on function private.dashboard_accrued_through(jsonb,date) is
  'C100: sums authoritative calculated periods through a cutoff; STABLE because its PL/pgSQL expressions are not classified immutable by PostgreSQL.';

commit;
