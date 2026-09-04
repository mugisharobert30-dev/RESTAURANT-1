-- ============================================================================
-- LUWOMBO RESTAURANT — Initial schema (PostgreSQL / Supabase)
-- Run in the Supabase SQL editor or via `supabase db push`.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------- enums ----
create type user_role          as enum ('customer','admin','manager','waiter','kitchen','cashier','delivery');
create type order_status       as enum ('received','confirmed','preparing','ready','out_for_delivery','completed','cancelled');
create type payment_status     as enum ('pending','paid','failed','refunded');
create type payment_method     as enum ('mtn_momo','airtel_money','card','cash_on_delivery','pay_at_counter');
create type order_type         as enum ('dine_in','takeaway','delivery');
create type reservation_status as enum ('pending','confirmed','seated','completed','cancelled','no_show');
create type table_area         as enum ('main_hall','terrace','garden','private');
create type discount_type      as enum ('percentage','fixed');
create type promotion_type     as enum ('seasonal','first_order','birthday','happy_hour');
create type movement_type      as enum ('in','out','adjustment');
create type notif_kind         as enum ('order','reservation','payment','inventory','review','message','table_request','promo');

-- -------------------------------------------------------------- profiles ----
-- Linked 1-to-1 with auth.users. Role drives every RLS policy below.
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  email         text not null unique,
  phone         text not null default '',
  role          user_role not null default 'customer',
  avatar_url    text,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);

-- ------------------------------------------------------------ categories ----
create table public.categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  description text,
  sort_order  int  not null default 0,
  active      boolean not null default true
);

-- ------------------------------------------------------------ menu items ----
create table public.menu_items (
  id                   uuid primary key default uuid_generate_v4(),
  category_id          uuid not null references public.categories(id) on delete restrict,
  name                 text not null,
  slug                 text not null unique,
  description          text not null default '',
  price                numeric(12,2) not null check (price >= 0),
  image_url            text,
  ingredients          text[] not null default '{}',
  allergens            text[] not null default '{}',
  prep_time_min        int not null default 15,
  available            boolean not null default true,
  featured             boolean not null default false,
  popular              boolean not null default false,
  spicy_level          smallint not null default 0 check (spicy_level between 0 and 3),
  is_vegetarian        boolean not null default false,
  is_vegan             boolean not null default false,
  portion_info         text not null default 'Serves one',
  calories             int,
  rating_avg           numeric(3,2) not null default 0,
  rating_count         int not null default 0,
  times_ordered        int not null default 0,
  customization_groups jsonb not null default '[]',
  created_at           timestamptz not null default now()
);
create index menu_items_category_idx on public.menu_items (category_id);
create index menu_items_available_idx on public.menu_items (available) where available;

-- ------------------------------------------------------- restaurant tables ---
create table public.restaurant_tables (
  id         uuid primary key default uuid_generate_v4(),
  label      text not null unique,
  area       table_area not null default 'main_hall',
  seats      smallint not null default 4,
  qr_token   text not null unique default encode(gen_random_bytes(6),'hex'),
  active     boolean not null default true
);

-- ---------------------------------------------------------------- orders ----
create table public.orders (
  id                uuid primary key default uuid_generate_v4(),
  order_number      text not null unique,
  customer_id       uuid references public.profiles(id) on delete set null,
  customer_name     text not null,
  customer_phone    text not null,
  customer_email    text,
  type              order_type not null default 'delivery',
  table_id          uuid references public.restaurant_tables(id) on delete set null,
  table_label       text,
  status            order_status not null default 'received',
  payment_status    payment_status not null default 'pending',
  payment_method    payment_method,
  momo_pay_ref      text,
  paid_at           timestamptz,
  subtotal          numeric(12,2) not null default 0,
  delivery_fee      numeric(12,2) not null default 0,
  discount          numeric(12,2) not null default 0,
  tax               numeric(12,2) not null default 0,
  total             numeric(12,2) not null default 0,
  coupon_id         uuid,
  delivery_address  text,
  special_instructions text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index orders_customer_idx   on public.orders (customer_id);
create index orders_status_idx     on public.orders (status);
create index orders_created_idx    on public.orders (created_at desc);

create table public.order_items (
  id                  uuid primary key default uuid_generate_v4(),
  order_id            uuid not null references public.orders(id) on delete cascade,
  menu_item_id        uuid not null references public.menu_items(id) on delete restrict,
  name_snapshot       text not null,
  quantity            int not null check (quantity > 0),
  unit_price          numeric(12,2) not null,
  options             text[] not null default '{}',
  special_instructions text
);
create index order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------- reservations ----
create table public.reservations (
  id                 uuid primary key default uuid_generate_v4(),
  reservation_number text not null unique,
  customer_id        uuid references public.profiles(id) on delete set null,
  customer_name      text not null,
  customer_phone     text not null,
  customer_email     text,
  date               date not null,
  time_slot          time not null,
  party_size         smallint not null check (party_size > 0),
  area               table_area not null default 'main_hall',
  occasion           text,
  special_requests   text,
  status             reservation_status not null default 'pending',
  created_at         timestamptz not null default now()
);
create index reservations_date_idx on public.reservations (date);

-- --------------------------------------------------------------- reviews ----
create table public.reviews (
  id            uuid primary key default uuid_generate_v4(),
  customer_id   uuid references public.profiles(id) on delete set null,
  menu_item_id  uuid references public.menu_items(id) on delete cascade,
  order_id      uuid references public.orders(id) on delete set null,
  customer_name text not null,
  rating        smallint not null check (rating between 1 and 5),
  food_rating     smallint check (food_rating between 1 and 5),
  service_rating  smallint check (service_rating between 1 and 5),
  delivery_rating smallint check (delivery_rating between 1 and 5),
  comment       text not null,
  response      text,
  hidden        boolean not null default false,
  featured      boolean not null default false,
  created_at    timestamptz not null default now()
);
create index reviews_item_idx on public.reviews (menu_item_id) where not hidden;

-- --------------------------------------------------- coupons & promotions ----
create table public.coupons (
  id         uuid primary key default uuid_generate_v4(),
  code       text not null unique,
  type       discount_type not null default 'percentage',
  value      numeric(12,2) not null check (value > 0),
  min_order  numeric(12,2) not null default 0,
  max_uses   int not null default 100,
  used_count int not null default 0,
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz not null,
  active     boolean not null default true
);

create table public.promotions (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text not null default '',
  badge       text,
  type        promotion_type not null default 'seasonal',
  active      boolean not null default true,
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz not null
);

-- ------------------------------------------------------------- inventory ----
create table public.inventory_items (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null unique,
  unit          text not null default 'kg',
  current_stock numeric(12,2) not null default 0,
  min_stock     numeric(12,2) not null default 5,
  supplier      text,
  cost_per_unit numeric(12,2) not null default 0,
  updated_at    timestamptz not null default now()
);

create table public.stock_movements (
  id                uuid primary key default uuid_generate_v4(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  type              movement_type not null,
  quantity          numeric(12,2) not null,
  note              text,
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now()
);
create index stock_movements_item_idx on public.stock_movements (inventory_item_id);

-- --------------------------------------------- notifications & audit trail ----
create table public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  target     text not null default 'admin' check (target in ('customer','admin')),
  user_id    uuid references public.profiles(id) on delete cascade,
  title      text not null,
  body       text not null default '',
  kind       notif_kind not null default 'order',
  read       boolean not null default false,
  link       text,
  created_at timestamptz not null default now()
);
create index notifications_target_idx on public.notifications (target, read);

create table public.audit_logs (
  id         uuid primary key default uuid_generate_v4(),
  actor_id   uuid references public.profiles(id) on delete set null,
  actor_name text not null,
  action     text not null,
  entity     text not null,
  entity_id  text,
  details    text,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- ------------------------------------------- misc: addresses, faqs, etc. ----
create table public.delivery_addresses (
  id           uuid primary key default uuid_generate_v4(),
  customer_id  uuid not null references public.profiles(id) on delete cascade,
  label        text not null,
  address_line text not null,
  district     text not null,
  phone        text not null,
  is_default   boolean not null default false
);

create table public.favorites (
  customer_id  uuid not null references public.profiles(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  primary key (customer_id, menu_item_id)
);

create table public.faqs (
  id       uuid primary key default uuid_generate_v4(),
  question text not null,
  answer   text not null,
  visible  boolean not null default true,
  sort_order int not null default 0
);

create table public.contact_messages (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  email      text not null,
  phone      text not null default '',
  subject    text not null,
  message    text not null,
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.gallery_photos (
  id       uuid primary key default uuid_generate_v4(),
  title    text not null,
  grp      text not null check (grp in ('food','interior','events','team')),
  image_url text not null,
  sort_order int not null default 0
);

create table public.restaurant_settings (
  id                       int primary key default 1 check (id = 1),
  name                     text not null default 'Luwombo Restaurant',
  tagline                  text,
  address                  text,
  district                 text,
  phone                    text,
  phone_secondary          text,
  email                    text,
  whatsapp                 text,
  opening_hours            jsonb not null default '{}',
  delivery_fee             numeric(12,2) not null default 1500,
  delivery_zones           text[] not null default '{}',
  tax_rate                 numeric(5,4) not null default 0,
  tax_included             boolean not null default true,
  currency                 text not null default 'RWF',
  reservation_slot_minutes int not null default 30,
  max_party_online         int not null default 12,
  socials                  jsonb not null default '{}',
  wifi_password            text
);

-- ============================================================== functions ====
create or replace function public.auth_role() returns user_role language sql stable as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff() returns boolean language sql stable as $$
  select coalesce(public.auth_role() in ('admin','manager','waiter','kitchen','cashier','delivery'), false);
$$;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

drop trigger if exists inventory_touch on public.inventory_items;
create trigger inventory_touch before update on public.inventory_items for each row execute function public.touch_updated_at();

-- Keep rating aggregates fresh when a review is added.
create or replace function public.refresh_item_rating() returns trigger language plpgsql security definer as $$
declare target uuid;
begin
  target := coalesce(new.menu_item_id, old.menu_item_id);
  update public.menu_items m set
    rating_avg   = coalesce((select avg(rating)::numeric(3,2) from public.reviews r where r.menu_item_id = target and not r.hidden), 0),
    rating_count = (select count(*) from public.reviews r where r.menu_item_id = target and not r.hidden)
  where m.id = target;
  return null;
end;
$$;

drop trigger if exists reviews_rating_agg on public.reviews;
create trigger reviews_rating_agg after insert or update or delete on public.reviews
for each row execute function public.refresh_item_rating();

-- Auto-create a customer profile on signup.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Guest'), new.email, coalesce(new.phone,''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ==================================================================== RLS ====
alter table public.profiles            enable row level security;
alter table public.categories          enable row level security;
alter table public.menu_items          enable row level security;
alter table public.restaurant_tables   enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.reservations        enable row level security;
alter table public.reviews             enable row level security;
alter table public.coupons             enable row level security;
alter table public.promotions          enable row level security;
alter table public.inventory_items     enable row level security;
alter table public.stock_movements     enable row level security;
alter table public.notifications       enable row level security;
alter table public.audit_logs          enable row level security;
alter table public.delivery_addresses  enable row level security;
alter table public.favorites           enable row level security;
alter table public.faqs                enable row level security;
alter table public.contact_messages    enable row level security;
alter table public.gallery_photos      enable row level security;
alter table public.restaurant_settings enable row level security;

-- Public catalog: readable by anyone, writable by staff.
create policy categories_public_read on public.categories for select using (true);
create policy categories_staff_write on public.categories for all using (public.is_staff()) with check (public.is_staff());

create policy menu_public_read on public.menu_items for select using (true);
create policy menu_staff_write on public.menu_items for all using (public.is_staff()) with check (public.is_staff());

create policy tables_public_read on public.restaurant_tables for select using (active);
create policy tables_admin_write on public.restaurant_tables for all using (public.is_staff()) with check (public.is_staff());

create policy faqs_public_read  on public.faqs for select using (visible or public.is_staff());
create policy faqs_staff_write on public.faqs for all using (public.is_staff()) with check (public.is_staff());

create policy gallery_public_read  on public.gallery_photos for select using (true);
create policy gallery_staff_write on public.gallery_photos for all using (public.is_staff()) with check (public.is_staff());

create policy promos_public_read  on public.promotions for select using (active or public.is_staff());
create policy promos_staff_write on public.promotions for all using (public.is_staff()) with check (public.is_staff());

create policy coupons_read  on public.coupons for select using (public.is_staff());
create policy coupons_write on public.coupons for all using (public.auth_role() in ('admin','manager')) with check (public.auth_role() in ('admin','manager'));

-- Orders: customers see their own; staff see everything.
create policy orders_customer_read on public.orders for select using (customer_id = auth.uid() or public.is_staff());
create policy orders_insert on public.orders for insert with check (customer_id = auth.uid() or customer_id is null or public.is_staff());
create policy orders_staff_update on public.orders for update using (public.is_staff()) with check (public.is_staff());
create policy orders_customer_update_limit on public.orders for update using (customer_id = auth.uid() and status in ('received')) with check (customer_id = auth.uid() and status in ('received'));

create policy order_items_read on public.order_items for select using (
  public.is_staff() or exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid())
);
create policy order_items_insert on public.order_items for insert with check (
  public.is_staff() or exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or o.customer_id is null))
);

-- Reservations.
create policy reservations_read on public.reservations for select using (customer_id = auth.uid() or public.is_staff());
create policy reservations_insert on public.reservations for insert with check (customer_id = auth.uid() or customer_id is null or public.is_staff());
create policy reservations_staff_update on public.reservations for update using (public.is_staff()) with check (public.is_staff());
create policy reservations_customer_cancel on public.reservations for update using (customer_id = auth.uid() and status in ('pending','confirmed')) with check (customer_id = auth.uid() and status in ('pending','confirmed'));

-- Reviews: anyone reads non-hidden; authors create/update their own; staff moderate.
create policy reviews_read on public.reviews for select using (not hidden or customer_id = auth.uid() or public.is_staff());
create policy reviews_insert on public.reviews for insert with check (customer_id = auth.uid() or customer_id is null);
create policy reviews_own_update on public.reviews for update using (customer_id = auth.uid() or public.is_staff()) with check (customer_id = auth.uid() or public.is_staff());

-- Inventory & stock movements: staff only.
create policy inventory_staff on public.inventory_items for all using (public.is_staff()) with check (public.is_staff());
create policy movements_staff on public.stock_movements for all using (public.is_staff()) with check (public.is_staff());

-- Notifications: admins read admin-targeted; customers read their own.
create policy notifications_read on public.notifications for select using (
  (target = 'admin' and public.is_staff()) or (user_id = auth.uid())
);
create policy notifications_customer_update on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_staff_all on public.notifications for all using (public.is_staff()) with check (public.is_staff());

-- Audit logs: append-only by staff, read by admin/manager.
create policy audit_insert on public.audit_logs for insert with check (public.is_staff());
create policy audit_read on public.audit_logs for select using (public.auth_role() in ('admin','manager'));

-- Customer-owned records.
create policy addresses_own on public.delivery_addresses for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy favorites_own on public.favorites for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());

-- Profiles are self-readable; staff can read everyone; self-update only.
create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy profiles_self_update on public.profiles for update using (id = auth.uid() or public.auth_role() in ('admin','manager')) with check (id = auth.uid() or public.auth_role() in ('admin','manager'));

-- Contact messages: anonymous inserts allowed, staff manage.
create policy messages_insert on public.contact_messages for insert with check (true);
create policy messages_staff on public.contact_messages for all using (public.is_staff()) with check (public.is_staff());

-- Settings row: world-readable, admin-writable.
create policy settings_read  on public.restaurant_settings for select using (true);
create policy settings_write on public.restaurant_settings for update using (public.auth_role() in ('admin','manager')) with check (public.auth_role() in ('admin','manager'));

-- ============================================================== realtime =====
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.reservations;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.inventory_items;
