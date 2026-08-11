begin;

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
  owner_exists boolean;
begin
  if coalesce(new.raw_user_meta_data ->> 'provisioned_by_app', 'false') <> 'true' then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('quanlyvay-auth-profile-provisioning', 0)
  );

  requested_username := lower(btrim(new.raw_user_meta_data ->> 'username'));
  requested_display_name := btrim(new.raw_user_meta_data ->> 'display_name');
  owner_exists := exists (
    select 1
    from public.profiles
    where role = 'OWNER' and is_active
  );

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

  if not owner_exists then
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

comment on function private.provision_auth_profile() is
  'Creates one immutable application profile per provisioned Auth user; the first active account is OWNER and later accounts are EDITOR or VIEWER.';

commit;
