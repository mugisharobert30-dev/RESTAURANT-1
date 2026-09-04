-- ============================================================================
-- LUWOMBO — FIX RLS INFINITE RECURSION (009) — must be applied
--
-- Symptom: Admin -> Customers list is EMPTY, and reading public.profiles
-- errors with "stack depth limit exceeded" (RLS infinite recursion).
--
-- Cause: the profiles RLS policies call is_staff() -> auth_role(), which
-- SELECTs from profiles again -> RLS fires again -> recursion -> 500.
--
-- Fix: make auth_role() and is_staff() SECURITY DEFINER (with a restricted
-- search_path) so their inner SELECT on profiles BYPASSES RLS. This is the
-- same intent as migrations 005/006, but guarantees it is applied live.
--
-- Run in Supabase SQL Editor. Safe to re-run (CREATE OR REPLACE).
-- ============================================================================

create or replace function public.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.auth_role() in ('superadmin','admin','manager','waiter','kitchen','cashier','delivery'),
    false
  );
$$;

-- Sanity check: after running, an anonymous read of profiles should succeed
-- (return the rows) instead of erroring with "stack depth limit exceeded".
select count(*) as profile_count from public.profiles;
