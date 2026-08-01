begin;

create extension if not exists pgtap with schema extensions;
select plan(28);

select has_schema('private', 'private helper schema exists');

select has_type('public', 'app_role', 'app_role enum exists');
select has_type('public', 'loan_direction', 'loan_direction enum exists');
select has_type('public', 'loan_status', 'loan_status enum exists');
select has_type('public', 'transaction_type', 'transaction_type enum exists');
select has_type('public', 'lifecycle_event_type', 'lifecycle_event_type enum exists');
select has_type('public', 'interest_period_kind', 'interest_period_kind enum exists');
select has_type('public', 'notification_type', 'notification_type enum exists');

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'counterparties', 'counterparties table exists');
select has_table('public', 'loans', 'loans table exists');
select has_table('public', 'loan_lifecycle_events', 'loan lifecycle table exists');
select has_table('public', 'transactions', 'transactions table exists');
select has_table('public', 'expenses', 'expenses table exists');
select has_table('public', 'interest_periods', 'interest periods table exists');
select has_table('public', 'notifications', 'notifications table exists');
select has_table('public', 'push_subscriptions', 'push subscriptions table exists');
select has_table('public', 'audit_logs', 'audit logs table exists');

select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.counterparties'::regclass), 'counterparties has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.loans'::regclass), 'loans has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.loan_lifecycle_events'::regclass), 'loan lifecycle has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.transactions'::regclass), 'transactions has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.expenses'::regclass), 'expenses has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.interest_periods'::regclass), 'interest periods has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.notifications'::regclass), 'notifications has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.push_subscriptions'::regclass), 'push subscriptions has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.audit_logs'::regclass), 'audit logs has RLS');

select * from finish();
rollback;
