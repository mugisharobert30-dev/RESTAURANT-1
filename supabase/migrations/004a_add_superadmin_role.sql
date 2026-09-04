-- ============================================================================
-- LUWOMBO — Step 1/2: add 'superadmin' to the user_role enum.
-- Run this FIRST, on its own, then run 004b_create_staff_users.sql.
-- Safe to re-run.
-- ============================================================================

do $$
begin
  begin
    alter type public.user_role add value 'superadmin';
  exception when duplicate_object then
    null; -- already present
  end;
end $$;