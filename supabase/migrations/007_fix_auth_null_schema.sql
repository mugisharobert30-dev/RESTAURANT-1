-- ============================================================================
-- LUWOMBO — Fix "500: Database error querying schema" on login (007)
--
-- Cause: demo staff users were inserted directly into auth.users via SQL
-- (migrations 004 / 006). Supabase Auth expects several columns in
-- auth.users to hold an empty string (not NULL). Direct inserts leave them
-- NULL so login fails with "Database error querying schema". A missing
-- auth.identities row for a password user also triggers the same failure.
--
-- This version is SCHEMA-AWARE: it only touches columns that actually exist
-- in your auth.users, so it works on both current and older Supabase auth
-- schemas (older ones may not have `nonce` / `email_change_token_current`).
--
-- Run in Supabase SQL Editor. Idempotent — safe to re-run.
-- ============================================================================

do $$
declare
  colname text;
begin
  for colname in
    select c.column_name
    from information_schema.columns c
    where c.table_schema = 'auth'
      and c.table_name = 'users'
      and c.column_name in (
        'confirmation_token','recovery_token',
        'email_change_token_new','email_change_token_current',
        'reauthentication_token','email_change','nonce'
      )
  loop
    execute format('update auth.users set %I = '' '' where %I is null', colname, colname);
  end loop;
end $$;

-- (2) Make sure the demo staff email/password users have auth.identities rows.
insert into auth.identities
  (provider_id, user_id, identity_data, provider, last_sign_in_at,
   created_at, updated_at, id)
select
  au.id::text,
  au.id,
  jsonb_build_object(
    'sub', au.id::text,
    'email', au.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  au.created_at,
  au.created_at,
  au.updated_at,
  au.id
from auth.users au
join public.profiles p on p.id = au.id
where p.role in ('superadmin','admin','manager','waiter','kitchen','cashier','delivery')
  and not exists (
    select 1 from auth.identities i
    where i.user_id = au.id and i.provider = 'email'
  );

-- (3) Sanity check — staff users with identity + no NULL blockers.
select u.email, i.provider,
       coalesce(u.confirmation_token,'') as confirmation_token,
       coalesce(u.recovery_token,'') as recovery_token
from auth.users u
left join auth.identities i on i.user_id = u.id and i.provider = 'email'
join public.profiles p on p.id = u.id
where p.role <> 'customer'
order by u.email;
