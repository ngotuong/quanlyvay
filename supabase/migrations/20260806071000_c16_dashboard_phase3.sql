begin;

create or replace function public.get_management_dashboard_bundle_v2(
  p_period_start date,
  p_period_end date,
  p_previous_start date,
  p_previous_end date
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'dashboard', public.get_management_dashboard(p_period_start, p_period_end),
    'analytics', public.get_management_analytics(p_period_start, p_period_end),
    'previousDashboard', public.get_management_dashboard(p_previous_start, p_previous_end)
  )
$$;

revoke all on function public.get_management_dashboard_bundle_v2(date, date, date, date) from public, anon;
grant execute on function public.get_management_dashboard_bundle_v2(date, date, date, date) to authenticated, service_role;

comment on function public.get_management_dashboard_bundle_v2(date, date, date, date) is
  'Returns current management KPIs/analytics and the immediately preceding equal-length comparison period in one client round trip.';

commit;
