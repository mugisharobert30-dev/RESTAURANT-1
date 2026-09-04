-- ============================================================================
-- LUWOMBO — Full clean reinstall helper.
-- Drops EVERY schema object the migrations create, so 001_initial_schema.sql
-- and 002_seed_data.sql can be re-run from a clean slate.
-- SAFE TO RE-RUN. DESTRUCTIVE (drops all Luwombo tables/data).
--
-- Run this FIRST, then 001_initial_schema.sql, then 002_seed_data.sql.
-- ============================================================================

-- Drop tables (and any views, triggers, policies depending on them).
drop table if exists public.audit_logs cascade;
drop table if exists public.notifications cascade;
drop table if exists public.stock_movements cascade;
drop table if exists public.inventory_items cascade;
drop table if exists public.promotions cascade;
drop table if exists public.coupons cascade;
drop table if exists public.reviews cascade;
drop table if exists public.reservations cascade;
drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.restaurant_tables cascade;
drop table if exists public.menu_items cascade;
drop table if exists public.categories cascade;
drop table if exists public.profiles cascade;
drop table if exists public.delivery_addresses cascade;
drop table if exists public.favorites cascade;
drop table if exists public.faqs cascade;
drop table if exists public.contact_messages cascade;
drop table if exists public.gallery_photos cascade;
drop table if exists public.restaurant_settings cascade;

-- Drop helper functions/triggers (trigger drops cascade from the tables above).
drop function if exists public.touch_updated_at cascade;
drop function if exists public.refresh_item_rating cascade;
drop function if exists public.handle_new_user cascade;
drop function if exists public.auth_role cascade;
drop function if exists public.is_staff cascade;

-- Drop enum types (cascade removes any dependent columns).
drop type if exists notif_kind cascade;
drop type if exists movement_type cascade;
drop type if exists promotion_type cascade;
drop type if exists discount_type cascade;
drop type if exists table_area cascade;
drop type if exists reservation_status cascade;
drop type if exists order_type cascade;
drop type if exists payment_method cascade;
drop type if exists payment_status cascade;
drop type if exists order_status cascade;
drop type if exists user_role cascade;
