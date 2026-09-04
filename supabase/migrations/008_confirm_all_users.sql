-- Confirm all unconfirmed user accounts at once.
-- NOTE: `confirmed_at` is a generated column in this Supabase version and
-- is computed automatically from email_confirmed_at, so we only set
-- email_confirmed_at (plus reset the pending tokens).
update auth.users set
  email_confirmed_at = now(),
  confirmation_token = '',
  recovery_token = ''
where email_confirmed_at is null;
