begin;

create or replace function private.sanitize_audit_log_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.old_data := private.sanitize_audit_payload(new.table_name, new.old_data);
  new.new_data := private.sanitize_audit_payload(new.table_name, new.new_data);
  return new;
end;
$$;

revoke all on function private.sanitize_audit_log_insert() from public;

drop trigger if exists audit_logs_sanitize_before_insert on public.audit_logs;
create trigger audit_logs_sanitize_before_insert
before insert on public.audit_logs
for each row execute function private.sanitize_audit_log_insert();

comment on function private.sanitize_audit_log_insert() is
  'Defense-in-depth: sanitizes Web Push material even when an audit row is inserted outside the normal table audit trigger.';

-- A rotated VAPID key pair makes every existing browser subscription unusable. Remove the
-- subscriptions deliberately so devices must opt in again; operational delivery rows cascade.
-- Financial ledgers and loan history are not touched.
delete from public.push_subscriptions;

-- C18 deliberately preserved immutable historical rows while the sanitized read path rolled out.
-- C19 is the approved one-time remediation: rewrite only payloads whose sanitized representation
-- differs, then immediately restore the append-only guard in the same transaction.
alter table public.audit_logs disable trigger audit_logs_immutable;

update public.audit_logs
set
  old_data = private.sanitize_audit_payload(table_name, old_data),
  new_data = private.sanitize_audit_payload(table_name, new_data)
where
  old_data is distinct from private.sanitize_audit_payload(table_name, old_data)
  or new_data is distinct from private.sanitize_audit_payload(table_name, new_data);

alter table public.audit_logs enable trigger audit_logs_immutable;

do $$
begin
  if exists (
    select 1
    from public.audit_logs
    where table_name = 'push_subscriptions'
      and (
        coalesce(old_data, '{}'::jsonb) ?| array['endpoint', 'p256dh', 'auth_secret']
        or coalesce(new_data, '{}'::jsonb) ?| array['endpoint', 'p256dh', 'auth_secret']
      )
  ) then
    raise exception 'C19 audit scrub failed: raw Web Push material remains';
  end if;

  if exists (select 1 from public.push_subscriptions) then
    raise exception 'C19 subscription invalidation failed';
  end if;
end;
$$;

comment on table public.audit_logs is
  'Append-only audit history. Historical Web Push payloads were scrubbed in C19; inserts are sanitized before storage.';

commit;
