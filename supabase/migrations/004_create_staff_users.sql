-- ============================================================================
-- LUWOMBO — Step 2/2: Demo staff accounts (Supabase Auth + profiles)
-- Run in the Supabase SQL Editor. Safe to re-run (idempotent).
--
-- REQUIRES: 004a_add_superadmin_role.sql already ran (adds 'superadmin' to
-- the user_role enum). Run that file first, then this one.
--
-- Creates:
--   Super Admin: root@luwombo.rw   / super1234
--   Admin:       admin@luwombo.rw  / admin1234
--   Manager:     manager@luwombo.rw/ staff1234
--   Kitchen:     chef@luwombo.rw   / staff1234
--   Waiter:      waiter@luwombo.rw / staff1234
--   Cashier:     cashier@luwombo.rw/ staff1234
-- ============================================================================

-- Create the auth.users rows (bcrypt password, email pre-confirmed).
-- Idempotent: if the email already exists it is left untouched.
insert into auth.users
  (instance_id, id, aud, role, email, phone, encrypted_password,
   email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data,
   created_at, updated_at,
   confirmation_token, recovery_token, email_change_token_new,
   reauthentication_token, is_sso_user, deleted_at)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  s.email,
  s.phone,
  crypt(s.pass, gen_salt('bf')),
  now(),
  jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
  jsonb_build_object('full_name', s.full_name, 'role', s.role),
  now(),
  now(),
  '', '', '', '', false, null
from (values
  ('root@luwombo.rw',    'super1234', 'Root Admin',    'superadmin', '+250780000001'),
  ('admin@luwombo.rw',   'admin1234', 'Admin Account', 'admin',      '+250780000002'),
  ('manager@luwombo.rw', 'staff1234', 'Manager',       'manager',    '+250780000003'),
  ('chef@luwombo.rw',    'staff1234', 'Chef',          'kitchen',    '+250780000004'),
  ('waiter@luwombo.rw',  'staff1234', 'Waiter',        'waiter',     '+250780000005'),
  ('cashier@luwombo.rw', 'staff1234', 'Cashier',       'cashier',    '+250780000006')
) as s(email, pass, full_name, role, phone)
on conflict do nothing;

-- Create/update the matching profiles (only if the profiles table exists,
-- i.e. after the schema migration has run).
insert into public.profiles (id, full_name, email, phone, role, active, created_at)
select au.id, s.full_name, au.email, s.phone, s.role::public.user_role, true, now()
from (values
  ('root@luwombo.rw',    'super1234', 'Root Admin',    'superadmin', '+250780000001'),
  ('admin@luwombo.rw',   'admin1234', 'Admin Account', 'admin',      '+250780000002'),
  ('manager@luwombo.rw', 'staff1234', 'Manager',       'manager',    '+250780000003'),
  ('chef@luwombo.rw',    'staff1234', 'Chef',          'kitchen',    '+250780000004'),
  ('waiter@luwombo.rw',  'staff1234', 'Waiter',        'waiter',     '+250780000005'),
  ('cashier@luwombo.rw', 'staff1234', 'Cashier',       'cashier',    '+250780000006')
) as s(email, pass, full_name, role, phone)
join auth.users au on au.email = s.email
on conflict (id) do update set
  full_name = excluded.full_name,
  phone     = excluded.phone,
  role      = excluded.role,
  active    = true;