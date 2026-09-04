-- ============================================================================
-- LUWOMBO — Fix RLS infinite recursion (005)
--
-- Problem: profiles RLS policy calls is_staff() → auth_role() → SELECT from
-- profiles → RLS fires again → infinite recursion → stack depth exceeded.
-- Also: is_staff() was missing 'superadmin' role.
--
-- Fix: Recreate auth_role() and is_staff() with SECURITY DEFINER so the inner
-- query on profiles bypasses RLS, breaking the cycle.
--
-- Run in Supabase SQL Editor. Safe to re-run (CREATE OR REPLACE).
-- ============================================================================

-- auth_role() must be security definer to avoid RLS recursion on profiles.
create or replace function public.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- is_staff() now includes superadmin (added to enum in 004a).
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
