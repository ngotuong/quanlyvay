begin;

alter table public.profiles
  add constraint profiles_username_normalized
    check (username::text = lower(username::text));

create or replace function private.auth_email_for_username(p_username text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select lower(btrim(p_username)) || '@auth.local'
$$;

create or replace function private.validate_profile_governance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Profiles cannot be deleted; deactivate the account instead'
      using errcode = '55000';
  end if;

  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id
       or new.username is distinct from old.username then
      raise exception 'Profile identity and username are immutable'
        using errcode = '55000';
    end if;

    if old.role = 'OWNER'
       and old.is_active
       and (new.role <> 'OWNER' or not new.is_active) then
      raise exception 'The active OWNER account cannot be demoted or deactivated'
        using errcode = '23514';
    end if;
  end if;

  if new.role = 'OWNER'
     and new.is_active
     and exists (
       select 1
       from public.profiles as profile
       where profile.role = 'OWNER'
         and profile.is_active
         and profile.user_id <> new.user_id
     ) then
    raise exception 'Only one active OWNER account is allowed'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger profiles_governance
before insert or update or delete on public.profiles
for each row execute function private.validate_profile_governance();

create or replace function private.provision_auth_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
  requested_display_name text;
  requested_role public.app_role;
  profile_count integer;
begin
  if coalesce(new.raw_user_meta_data ->> 'provisioned_by_app', 'false') <> 'true' then
    return new;
  end if;

  requested_username := lower(btrim(new.raw_user_meta_data ->> 'username'));
  requested_display_name := btrim(new.raw_user_meta_data ->> 'display_name');
  profile_count := (select count(*) from public.profiles);

  if profile_count >= 2 then
    raise exception 'This installation supports at most two application accounts'
      using errcode = '23514';
  end if;

  if requested_username is null
     or requested_username !~ '^[a-z0-9._-]{3,32}$' then
    raise exception 'Provisioned username is invalid' using errcode = '22023';
  end if;

  if requested_display_name is null or requested_display_name = '' then
    raise exception 'Provisioned display name is required' using errcode = '22023';
  end if;

  if lower(coalesce(new.email, '')) <> private.auth_email_for_username(requested_username) then
    raise exception 'Auth email does not match the internal username mapping'
      using errcode = '22023';
  end if;

  if profile_count = 0 then
    requested_role := 'OWNER';
  else
    requested_role := coalesce(
      (new.raw_user_meta_data ->> 'app_role')::public.app_role,
      'VIEWER'::public.app_role
    );

    if requested_role = 'OWNER' then
      raise exception 'Additional accounts cannot be provisioned as OWNER'
        using errcode = '23514';
    end if;
  end if;

  insert into public.profiles (
    user_id,
    username,
    display_name,
    role,
    must_change_password,
    is_active
  ) values (
    new.id,
    requested_username,
    requested_display_name,
    requested_role,
    true,
    true
  );

  return new;
end;
$$;

create trigger auth_user_profile_provisioning
after insert on auth.users
for each row execute function private.provision_auth_profile();

create or replace function public.complete_password_change()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform private.require_active_user();

  update public.profiles
  set must_change_password = false
  where user_id = (select auth.uid());

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.manage_profile(
  p_user_id uuid,
  p_display_name text,
  p_role public.app_role,
  p_is_active boolean
)
returns public.profiles
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  updated_profile public.profiles%rowtype;
begin
  perform private.require_active_user();

  if not (select private.is_owner()) then
    raise exception 'OWNER role is required' using errcode = '42501';
  end if;

  if btrim(coalesce(p_display_name, '')) = '' then
    raise exception 'display_name is required' using errcode = '22023';
  end if;

  if p_role = 'OWNER' and p_user_id <> (select auth.uid()) then
    raise exception 'Additional accounts cannot be promoted to OWNER'
      using errcode = '23514';
  end if;

  update public.profiles
  set
    display_name = btrim(p_display_name),
    role = p_role,
    is_active = p_is_active
  where user_id = p_user_id
  returning * into updated_profile;

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  return updated_profile;
end;
$$;

create or replace function public.mark_password_reset_required(p_user_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform private.require_active_user();

  if not (select private.is_owner()) then
    raise exception 'OWNER role is required' using errcode = '42501';
  end if;

  update public.profiles
  set must_change_password = true
  where user_id = p_user_id;

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke insert, delete on public.profiles from authenticated;

grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

revoke all on function public.complete_password_change() from public, anon;
revoke all on function public.manage_profile(uuid, text, public.app_role, boolean) from public, anon;
revoke all on function public.mark_password_reset_required(uuid) from public, anon;

grant execute on function public.complete_password_change() to authenticated, service_role;
grant execute on function public.manage_profile(uuid, text, public.app_role, boolean) to authenticated, service_role;
grant execute on function public.mark_password_reset_required(uuid) to authenticated, service_role;

comment on function private.auth_email_for_username(text) is
  'Deterministic internal Auth email mapping. The address is never shown as a user-facing login identifier.';
comment on function public.complete_password_change() is
  'Clears the current active user must-change-password flag after Auth password update succeeds.';
comment on function public.manage_profile(uuid, text, public.app_role, boolean) is
  'OWNER-only profile management with one-owner and two-account governance enforced by trigger.';

commit;
