begin;

create or replace function private.sanitize_audit_payload(
  p_table_name text,
  p_payload jsonb
)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case
    when p_payload is null then null
    when p_table_name = 'push_subscriptions' then
      (p_payload - array['endpoint', 'p256dh', 'auth_secret']) ||
      case
        when nullif(p_payload ->> 'endpoint', '') is null then '{}'::jsonb
        else jsonb_build_object(
          'endpoint_fingerprint',
          'sha256:' || encode(extensions.digest(p_payload ->> 'endpoint', 'sha256'), 'hex')
        )
      end
    else p_payload
  end
$$;

create or replace function private.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_id uuid;
begin
  row_id := case
    when tg_op = 'DELETE' then (to_jsonb(old) ->> tg_argv[0])::uuid
    else (to_jsonb(new) ->> tg_argv[0])::uuid
  end;

  insert into public.audit_logs (
    actor_user_id,
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    request_id
  ) values (
    (select auth.uid()),
    tg_table_name,
    row_id,
    tg_op,
    case
      when tg_op in ('UPDATE', 'DELETE') then private.sanitize_audit_payload(tg_table_name, to_jsonb(old))
    end,
    case
      when tg_op in ('INSERT', 'UPDATE') then private.sanitize_audit_payload(tg_table_name, to_jsonb(new))
    end,
    nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-request-id'
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function public.get_audit_logs_sanitized()
returns table (
  id text,
  actor_user_id uuid,
  table_name text,
  record_id uuid,
  action text,
  old_data jsonb,
  new_data jsonb,
  changed_at timestamptz,
  request_id text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (
    (select private.is_owner())
    or coalesce((select auth.jwt() ->> 'role'), '') = 'service_role'
  ) then
    raise exception 'Only OWNER or service_role can read sanitized audit history'
      using errcode = '42501';
  end if;

  return query
  select
    audit.id::text,
    audit.actor_user_id,
    audit.table_name,
    audit.record_id,
    audit.action,
    private.sanitize_audit_payload(audit.table_name, audit.old_data),
    private.sanitize_audit_payload(audit.table_name, audit.new_data),
    audit.changed_at,
    audit.request_id
  from public.audit_logs as audit;
end;
$$;

revoke all on function private.sanitize_audit_payload(text, jsonb) from public;
revoke all on function public.get_audit_logs_sanitized() from public, anon;
grant execute on function public.get_audit_logs_sanitized() to authenticated, service_role;

comment on function private.sanitize_audit_payload(text, jsonb) is
  'Removes Web Push endpoint/key material from audit payloads and retains only a SHA-256 endpoint fingerprint.';
comment on function public.get_audit_logs_sanitized() is
  'OWNER/service-role projection for append-only audit history; raw push subscription secrets are never returned.';

-- Compatibility phase: keep the existing OWNER raw-table policy until the web UI and export route
-- have moved to get_audit_logs_sanitized(). A follow-up migration revokes raw access only after the
-- new web release is verified, avoiding an audit-page outage during rollout.

commit;
