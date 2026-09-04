"use client";

import {
  ADDRESSES,
  AUDIT_LOGS,
  CATEGORIES,
  CONTACT_MESSAGES,
  COUPONS,
  FAVORITES,
  FAQS,
  GALLERY,
  INVENTORY,
  MENU_ITEMS,
  NOTIFICATIONS,
  ORDERS,
  PROMOTIONS,
  PROFILES,
  RESERVATIONS,
  REVIEWS,
  SETTINGS,
  STOCK_MOVEMENTS,
  TABLES,
} from "./seed";
import { cutoffFor, deletableIds, deletableIdsHard } from "./cleanup";
import type {
  AppNotification,
  AuditLog,
  Category,
  CleanupTarget,
  ContactMessage,
  Coupon,
  DeliveryAddress,
  FaqItem,
  Favorite,
  GalleryPhoto,
  InventoryItem,
  MenuItem,
  Order,
  Promotion,
  Profile,
  Reservation,
  RestaurantSettings,
  RestaurantTable,
  ResetTarget,
  Review,
  StockMovement,
} from "./types";

const STORAGE_KEY = "luwombo_store_v1";

export interface StoreData {
  categories: Category[];
  menuItems: MenuItem[];
  orders: Order[];
  reservations: Reservation[];
  tables: RestaurantTable[];
  reviews: Review[];
  coupons: Coupon[];
  promotions: Promotion[];
  inventory: InventoryItem[];
  movements: StockMovement[];
  notifications: AppNotification[];
  profiles: Profile[];
  addresses: DeliveryAddress[];
  favorites: Favorite[];
  auditLogs: AuditLog[];
  contactMessages: ContactMessage[];
  faqs: FaqItem[];
  gallery: GalleryPhoto[];
  settings: RestaurantSettings;
}

function freshSeed(): StoreData {
  return JSON.parse(JSON.stringify({
    categories: CATEGORIES,
    menuItems: MENU_ITEMS,
    orders: ORDERS,
    reservations: RESERVATIONS,
    tables: TABLES,
    reviews: REVIEWS,
    coupons: COUPONS,
    promotions: PROMOTIONS,
    inventory: INVENTORY,
    movements: STOCK_MOVEMENTS,
    notifications: NOTIFICATIONS,
    profiles: PROFILES,
    addresses: ADDRESSES,
    favorites: FAVORITES,
    auditLogs: AUDIT_LOGS,
    contactMessages: CONTACT_MESSAGES,
    faqs: FAQS,
    gallery: GALLERY,
    settings: SETTINGS,
  })) as StoreData;
}

type Listener = () => void;

class Store {
  private data: StoreData = freshSeed();
  private loaded = false;
  private listeners = new Set<Listener>();
  private sb: { from: (t: string) => any } | null = null;
  private loadCount = 0;

  async init(): Promise<void> {
    if (this.loaded || typeof window === "undefined") return;
    this.loaded = true;
    try {
      const seedSuper = PROFILES.find((p) => p.role === "superadmin");

      // Try to load real data from Supabase first.
      const supabaseEnabled = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      if (supabaseEnabled) {
        const { createBrowserSupabaseClient } = await import("./supabase");
        const client = createBrowserSupabaseClient();
        this.sb = client;
        try {
          const { loadStoreData, fullStoreData } = await import("./supabase-data");
          const loaded = await loadStoreData(client);
          const merged: StoreData = { ...freshSeed(), ...fullStoreData(loaded) };
          merged.profiles = [
            ...(seedSuper && !merged.profiles.some((p) => p.email === seedSuper.email)
              ? [JSON.parse(JSON.stringify(seedSuper))]
              : []),
            ...merged.profiles.filter((p) => p.email !== seedSuper?.email),
          ];
          this.data = merged;
        } catch (e) {
          // Fall back to local cache if the DB load fails.
          const raw = window.localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as Partial<StoreData>;
            this.data = { ...freshSeed(), ...parsed };
            if (seedSuper && !this.data.profiles.some((p) => p.email === seedSuper.email)) {
              this.data.profiles.unshift(JSON.parse(JSON.stringify(seedSuper)));
            }
          }
        }
      } else {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<StoreData>;
          this.data = { ...freshSeed(), ...parsed };
          if (seedSuper && !this.data.profiles.some((p) => p.email === seedSuper.email)) {
            this.data.profiles.unshift(JSON.parse(JSON.stringify(seedSuper)));
          }
        }
      }
    } catch {
      this.data = freshSeed();
    }
    const cfg = this.data.settings.auto_cleanup;
    if (cfg?.enabled && cfg.targets.length > 0) {
      try {
        this.applyPurge(cfg.targets, cutoffFor(cfg.older_than_days));
      } catch {}
    }
    const rst = this.data.settings.auto_reset;
    if (rst?.enabled && rst.targets.length > 0) {
      try {
        this.applyPurgeHard(rst.targets, cutoffFor(rst.older_than_days));
      } catch {}
    }
    this.emit();
  }

  reset(preserveSettings = false): void {
    const savedSettings = preserveSettings ? this.data.settings : undefined;
    const savedProfiles = this.data.profiles;
    this.data = freshSeed();
    if (preserveSettings && savedSettings) {
      this.data.settings = savedSettings;
    }
    if (savedProfiles && savedProfiles.length > 0) {
      this.data.profiles = savedProfiles;
    }
    const seedSuper = PROFILES.find((p) => p.role === "superadmin");
    if (seedSuper && !this.data.profiles.some((p) => p.email === seedSuper.email)) {
      this.data.profiles.unshift(JSON.parse(JSON.stringify(seedSuper)));
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem("luwombo_session");
      document.cookie = "lr_session=; path=/; max-age=0";
    }
    this.emit();
  }

  get(): StoreData {
    return this.data;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(): void {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch {}
    }
    this.listeners.forEach((l) => l());
  }

  mutate(fn: (d: StoreData) => void): void {
    fn(this.data);
    this.emit();
    void this.persist();
  }

  private persistTimer: ReturnType<typeof setTimeout> | null = null;

  private persist(): void {
    if (!this.sb) return;
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => void this.persistNow(), 800);
  }

  private async persistNow(): Promise<void> {
    if (!this.sb) return;
    const sb = this.sb;
    const d = this.data;
    try {
      const settingsRow = (await import("./supabase-data")).toDbSettings(d.settings);
      await sb.from("restaurant_settings").upsert(settingsRow);
    } catch (e) {
      console.warn("[store] settings persist failed", e);
    }
    try {
      if (d.categories.length) await sb.from("categories").upsert(d.categories as any);
    } catch (e) {
      console.warn("[store] categories persist failed", e);
    }
    try {
      if (d.menuItems.length) await sb.from("menu_items").upsert(d.menuItems as any);
    } catch (e) {
      console.warn("[store] menu persist failed", e);
    }
    try {
      if (d.tables.length) await sb.from("restaurant_tables").upsert(d.tables as any);
    } catch (e) {
      console.warn("[store] tables persist failed", e);
    }
    try {
      if (d.coupons.length) await sb.from("coupons").upsert(d.coupons as any);
    } catch (e) {
      console.warn("[store] coupons persist failed", e);
    }
    try {
      if (d.promotions.length) await sb.from("promotions").upsert(d.promotions as any);
    } catch (e) {
      console.warn("[store] promotions persist failed", e);
    }
    try {
      if (d.inventory.length) await sb.from("inventory_items").upsert(d.inventory as any);
    } catch (e) {
      console.warn("[store] inventory persist failed", e);
    }
    try {
      if (d.profiles.length) await sb.from("profiles").upsert(d.profiles as any);
    } catch (e) {
      console.warn("[store] profiles persist failed", e);
    }
  }

  // Re-fetch profiles (and any new registrations) from Supabase and merge
  // them into the local store so admins see fresh signups without a reload.
  async refreshProfiles(setBusy?: (b: boolean) => void): Promise<number> {
    setBusy?.(true);
    try {
      if (!this.sb) {
        const enabled = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        if (enabled) {
          const { createBrowserSupabaseClient } = await import("./supabase");
          this.sb = createBrowserSupabaseClient();
        }
      }
      if (!this.sb) return 0;
      const { data, error } = await (this.sb as any).from("profiles").select("*");
      if (error) throw error;
      const rows = (data ?? []) as Profile[];
      if (!rows.length) return 0;
      const seedSuper = PROFILES.find((p) => p.role === "superadmin");
      const merged = [...rows];
      if (seedSuper && !merged.some((p) => p.email === seedSuper.email)) {
        merged.unshift(JSON.parse(JSON.stringify(seedSuper)));
      }
      const existing = new Map(this.data.profiles.map((p) => [p.id, p]));
      for (const p of merged) existing.set(p.id, p);
      this.data.profiles = Array.from(existing.values());
      this.emit();
      return rows.length;
    } catch (e) {
      console.warn("[store] profiles refresh failed", e);
      return 0;
    } finally {
      setBusy?.(false);
    }
  }

  purge(targets: CleanupTarget[], days: number): Record<string, number> {
    return this.applyPurge(targets, cutoffFor(days));
  }

  purgeHard(targets: ResetTarget[], days: number): Record<string, number> {
    return this.applyPurgeHard(targets, cutoffFor(days));
  }

  private applyPurge(targets: CleanupTarget[], cutoff: number): Record<string, number> {
    const counts: Record<string, number> = {};
    this.mutate((d) => {
      for (const t of targets) {
        const ids = deletableIds(d, t, cutoff);
        if (ids.length === 0) continue;
        const gone = new Set(ids);
        if (t === "orders") d.orders = d.orders.filter((x) => !gone.has(x.id));
        else if (t === "reservations") d.reservations = d.reservations.filter((x) => !gone.has(x.id));
        else if (t === "reviews") d.reviews = d.reviews.filter((x) => !gone.has(x.id));
        else if (t === "notifications") d.notifications = d.notifications.filter((x) => !gone.has(x.id));
        else if (t === "auditLogs") d.auditLogs = d.auditLogs.filter((x) => !gone.has(x.id));
        else if (t === "movements") d.movements = d.movements.filter((x) => !gone.has(x.id));
        else if (t === "contactMessages") d.contactMessages = d.contactMessages.filter((x) => !gone.has(x.id));
        counts[t] = ids.length;
      }
    });
    return counts;
  }

  private applyPurgeHard(targets: ResetTarget[], cutoff: number): Record<string, number> {
    const counts: Record<string, number> = {};
    this.mutate((d) => {
      for (const t of targets) {
        const ids = deletableIdsHard(d, t, cutoff);
        if (ids.length === 0) continue;
        const gone = new Set(ids);
        if (t === "orders") d.orders = d.orders.filter((x) => !gone.has(x.id));
        else if (t === "reservations") d.reservations = d.reservations.filter((x) => !gone.has(x.id));
        else if (t === "reviews") d.reviews = d.reviews.filter((x) => !gone.has(x.id));
        else if (t === "notifications") d.notifications = d.notifications.filter((x) => !gone.has(x.id));
        else if (t === "auditLogs") d.auditLogs = d.auditLogs.filter((x) => !gone.has(x.id));
        else if (t === "movements") d.movements = d.movements.filter((x) => !gone.has(x.id));
        else if (t === "contactMessages") d.contactMessages = d.contactMessages.filter((x) => !gone.has(x.id));
        else if (t === "coupons") d.coupons = d.coupons.filter((x) => !gone.has(x.id));
        else if (t === "promotions") d.promotions = d.promotions.filter((x) => !gone.has(x.id));
        counts[t] = ids.length;
      }
    });
    return counts;
  }
}

declare global {
  interface Window {
    __luwomboStore?: Store;
  }
}

export const store: Store =
  typeof window !== "undefined" && window.__luwomboStore
    ? window.__luwomboStore
    : (() => {
        const s = new Store();
        if (typeof window !== "undefined") window.__luwomboStore = s;
        return s;
      })();

if (typeof window !== "undefined") {
  void store.init();
}
