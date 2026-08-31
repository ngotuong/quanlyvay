begin;

drop policy if exists audit_logs_owner_select on public.audit_logs;

revoke select on public.audit_logs from authenticated;
revoke usage, select on sequence public.audit_logs_id_seq from authenticated;

comment on table public.audit_logs is
  'Append-only raw audit history. Application users read only through get_audit_logs_sanitized(); direct authenticated access is revoked.';

commit;
