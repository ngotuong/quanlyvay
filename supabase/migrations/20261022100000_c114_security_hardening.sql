begin;

alter table public.profiles
  add column password_reset_generation bigint not null default 0;

alter table public.profiles
  add constraint profiles_password_reset_generation_nonnegative
  check (password_reset_generation >= 0);

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
  set
    must_change_password = true,
    password_reset_generation = password_reset_generation + 1
  where user_id = p_user_id;

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;
end;
$$;

comment on column public.profiles.password_reset_generation is
  'Monotonic server-managed generation. A matching protected Auth app_metadata marker proves password completion for recovery.';
comment on function public.mark_password_reset_required(uuid) is
  'OWNER-only reset marker; advances the generation before the temporary Auth password is installed.';

commit;
