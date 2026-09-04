"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  StoreData,
} from "./store";
import type {
  Category,
  MenuItem,
  Order,
  Reservation,
  RestaurantTable,
  Review,
  Coupon,
  Promotion,
  InventoryItem,
  Profile,
  RestaurantSettings,
} from "./types";
import { SETTINGS, CATEGORIES, MENU_ITEMS, TABLES, COUPONS, PROMOTIONS, FAQS, GALLERY } from "./seed";

// A full months/day shorthand map used to normalise settings keys.
const DAY_FULL_TO_SHORT: Record<string, string> = {
  monday: "mon",
  tuesday: "tue",
  wednesday: "wed",
  thursday: "thu",
  friday: "fri",
  saturday: "sat",
  sunday: "sun",
};

function dayShortToFull(k: string): string {
  for (const full of Object.keys(DAY_FULL_TO_SHORT)) {
    if (DAY_FULL_TO_SHORT[full] === k) return full;
  }
  return k;
}

export interface LoadedData {
  categories: Category[];
  menuItems: MenuItem[];
  tables: RestaurantTable[];
  orders: Order[];
  reservations: Reservation[];
  reviews: Review[];
  coupons: Coupon[];
  promotions: Promotion[];
  inventory: InventoryItem[];
  profiles: Profile[];
  settings: RestaurantSettings | null;
}

function normalizeSettings(row: any): RestaurantSettings {
  const oh: any = {};
  if (row?.opening_hours) {
    for (const [key, val] of Object.entries(row.opening_hours)) {
      const short = DAY_FULL_TO_SHORT[key] ?? key;
      oh[short] = val;
    }
  }
  const base: RestaurantSettings = JSON.parse(JSON.stringify(SETTINGS));
  return {
    ...base,
    ...row,
    opening_hours: Object.keys(oh).length > 0 ? oh : base.opening_hours,
    socials: row?.socials && typeof row.socials === "object" ? { ...base.socials, ...row.socials } : base.socials,
  };
}

export async function loadStoreData(client: SupabaseClient): Promise<Partial<LoadedData>> {
  const out: Partial<LoadedData> = {};

  const [cat, menu, tables, coupons, promos, faqs] = await Promise.all([
    client.from("categories").select("*").order("sort_order"),
    client.from("menu_items").select("*"),
    client.from("restaurant_tables").select("*"),
    client.from("coupons").select("*"),
    client.from("promotions").select("*"),
    client.from("faqs").select("*"),
  ]);

  if (cat.data?.length) out.categories = cat.data as Category[];
  if (menu.data?.length) out.menuItems = menu.data as MenuItem[];
  if (tables.data?.length) out.tables = tables.data as RestaurantTable[];
  if (coupons.data?.length) out.coupons = coupons.data as Coupon[];
  if (promos.data?.length) out.promotions = promos.data as Promotion[];

  const [orders, reservations, reviews, inventory] = await Promise.all([
    client.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
    client.from("reservations").select("*").order("created_at", { ascending: false }),
    client.from("reviews").select("*").order("created_at", { ascending: false }),
    client.from("inventory_items").select("*"),
  ]);

  if (orders.data?.length) {
    out.orders = (orders.data as any[]).map((o) => {
      const items = Array.isArray(o.order_items)
        ? (o.order_items as any[]).map((li: any) => ({
            id: li.id,
            menu_item_id: li.menu_item_id,
            name: li.name_snapshot ?? li.menu_item_id,
            quantity: li.quantity,
            unit_price: Number(li.unit_price),
            options: li.options ?? [],
            special_instructions: li.special_instructions ?? undefined,
          }))
        : [];
      return {
        ...o,
        items,
        subtotal: Number(o.subtotal),
        delivery_fee: Number(o.delivery_fee),
        discount: Number(o.discount),
        tax: Number(o.tax),
        total: Number(o.total),
      } as Order;
    });
  }
  if (reservations.data?.length) out.reservations = reservations.data as Reservation[];
  if (reviews.data?.length) out.reviews = reviews.data as Review[];
  if (inventory.data?.length) out.inventory = inventory.data as InventoryItem[];

  const [settingsR, prof] = await Promise.all([
    client.from("restaurant_settings").select("*").eq("id", 1).maybeSingle(),
    client.from("profiles").select("*"),
  ]);
  if (settingsR.data) out.settings = normalizeSettings(settingsR.data);
  if (prof.data?.length) out.profiles = prof.data as Profile[];

  return out;
}

// Upsert the full inventory-style collections when a store is initialised.
export async function pushCatalog(client: SupabaseClient): Promise<void> {
  const seedCats = CATEGORIES.map((c) => ({ ...c, id: c.id }));
  const seedMenu = MENU_ITEMS.map((m) => ({ ...m, id: m.id }));
  const seedTables = TABLES.map((t) => ({ ...t, id: t.id }));
  const seedCoupons = COUPONS.map((c) => ({ ...c, id: c.id }));
  const seedPromos = PROMOTIONS.map((p) => ({ ...p, id: p.id }));

  // Only push initial catalog if there are no rows yet (fresh installs).
  const catCount = await client.from("categories").select("id", { count: "exact", head: true });
  if (!catCount.count) {
    await client.from("categories").upsert(seedCats);
    await client.from("menu_items").upsert(seedMenu);
    await client.from("restaurant_tables").upsert(seedTables);
    await client.from("coupons").upsert(seedCoupons);
    await client.from("promotions").upsert(seedPromos);
  }
}

export function seedSettingsRow(): Record<string, unknown> {
  const s = SETTINGS;
  const oh: Record<string, any> = {};
  for (const [short, val] of Object.entries(s.opening_hours)) {
    oh[dayShortToFull(short)] = val;
  }
  return {
    id: 1,
    name: s.name,
    tagline: s.tagline ?? null,
    address: s.address ?? null,
    district: s.district ?? null,
    phone: s.phone ?? null,
    phone_secondary: s.phone_secondary ?? null,
    email: s.email ?? null,
    whatsapp: s.whatsapp ?? null,
    opening_hours: oh,
    delivery_fee: s.delivery_fee ?? 1500,
    delivery_zones: s.delivery_zones ?? [],
    tax_rate: s.tax_rate ?? 0,
    tax_included: s.tax_included ?? true,
    currency: s.currency ?? "RWF",
    reservation_slot_minutes: s.reservation_slot_minutes ?? 30,
    max_party_online: s.max_party_online ?? 12,
    socials: s.socials ?? {},
    wifi_password: s.wifi_password ?? null,
  };
}

export function toDbSettings(s: RestaurantSettings): Record<string, unknown> {
  const oh: Record<string, any> = {};
  for (const [short, val] of Object.entries(s.opening_hours)) {
    oh[dayShortToFull(short)] = val;
  }
  return {
    id: 1,
    name: s.name,
    tagline: s.tagline ?? null,
    address: s.address ?? null,
    district: s.district ?? null,
    phone: s.phone ?? null,
    phone_secondary: s.phone_secondary ?? null,
    email: s.email ?? null,
    whatsapp: s.whatsapp ?? null,
    opening_hours: oh,
    delivery_fee: s.delivery_fee ?? 1500,
    delivery_zones: s.delivery_zones ?? [],
    tax_rate: s.tax_rate ?? 0,
    tax_included: s.tax_included ?? true,
    currency: s.currency ?? "RWF",
    reservation_slot_minutes: s.reservation_slot_minutes ?? 30,
    max_party_online: s.max_party_online ?? 12,
    socials: s.socials ?? {},
    wifi_password: s.wifi_password ?? null,
  };
}

export function fullStoreData(data: Partial<LoadedData>): StoreData {
  return {
    categories: data.categories ?? [],
    menuItems: data.menuItems ?? [],
    orders: data.orders ?? [],
    reservations: data.reservations ?? [],
    tables: data.tables ?? [],
    reviews: data.reviews ?? [],
    coupons: data.coupons ?? [],
    promotions: data.promotions ?? [],
    inventory: data.inventory ?? [],
    movements: [],
    notifications: [],
    profiles: data.profiles ?? [],
    addresses: [],
    favorites: [],
    auditLogs: [],
    contactMessages: [],
    faqs: [],
    gallery: GALLERY,
    settings: data.settings ?? (JSON.parse(JSON.stringify(SETTINGS)) as RestaurantSettings),
  };
}
