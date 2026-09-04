"use client";

import { store } from "./store";
import type {
  AppNotification,
  AuditLog,
  Category,
  ContactMessage,
  Coupon,
  DeliveryAddress,
  FaqItem,
  InventoryItem,
  MenuItem,
  Order,
  OrderType,
  PaymentMethod,
  Profile,
  Promotion,
  Reservation,
  Review,
  StockMovement,
} from "./types";
import { orderFlowFor } from "./types";
const isBrowser = typeof window !== "undefined";
export const SUPABASE_ENABLED = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function newOrderNumber(existing: number): string {
  const d = new Date();
  const ym = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `LRW-${ym}-${String(existing + 1).padStart(3, "0")}`;
}

export function newReservationNumber(): string {
  return `RES-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function logAudit(actor: string, action: string, entity: string, entityId: string, details: string): void {
  store.mutate((d) => {
    d.auditLogs.unshift({ id: uid("log"), actor, action, entity, entity_id: entityId, details, created_at: new Date().toISOString() });
  });
}

export function notify(target: "customer" | "admin", n: Omit<AppNotification, "id" | "created_at" | "read" | "target">): void {
  store.mutate((d) => {
    d.notifications.unshift({ ...n, id: uid("ntf"), target, read: false, created_at: new Date().toISOString() });
  });
}

export interface CartLinePayload {
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  options: string[];
  special_instructions?: string;
}

export interface PlaceOrderInput {
  lines: CartLinePayload[];
  customer?: Profile | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  type: OrderType;
  table_label?: string;
  delivery_address?: string;
  payment_method?: PaymentMethod;
  coupon_code?: string;
  discount?: number;
  special_instructions?: string;
}

export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  const d = store.get();
  const subtotal = input.lines.reduce((s, l) => s + l.unit_price * l.quantity, 0);
  const delivery_fee = input.type === "delivery" ? d.settings.delivery_fee : 0;
  const discount = input.discount ?? 0;
  const total = subtotal + delivery_fee - discount;
  const nowIso = new Date().toISOString();
  const orderNumber = newOrderNumber(d.orders.length);
  const payment_status: Order["payment_status"] =
    input.payment_method === "cash_on_delivery" || input.payment_method === "pay_at_counter" ? "pending" : "paid";
  const status: Order["status"] = payment_status === "paid" ? "confirmed" : "received";

  // Try to persist as a real Supabase order first (RLS-aware).
  let finalId = uid("ord");
  let persistedId: string | undefined;
  try {
    const { persistOrder } = await import("./supabase-write");
    const res = await persistOrder({
      customer_id: input.customer?.id,
      customer_name: input.customer_name || input.customer?.full_name || "Guest",
      customer_phone: input.customer_phone || input.customer?.phone || "-",
      customer_email: input.customer_email ?? input.customer?.email,
      order_number: orderNumber,
      type: input.type,
      table_label: input.table_label,
      status,
      payment_status,
      payment_method: input.payment_method,
      subtotal,
      delivery_fee,
      discount,
      total,
      delivery_address: input.delivery_address,
      special_instructions: input.special_instructions,
      lines: input.lines.map((l) => ({ ...l })),
    });
    if (res.ok && res.orderId) {
      persistedId = res.orderId;
      finalId = res.orderId;
    }
  } catch {
    // fall through to store-local
  }

  const order: Order = {
    id: finalId,
    order_number: orderNumber,
    customer_id: input.customer?.id,
    customer_name: input.customer_name || input.customer?.full_name || "Guest",
    customer_phone: input.customer_phone || input.customer?.phone || "-",
    customer_email: input.customer_email ?? input.customer?.email,
    type: input.type,
    table_label: input.table_label,
    status,
    payment_status,
    payment_method: input.payment_method,
    items: input.lines.map((l, i) => ({ ...l, id: persistedId ? `oli-${finalId}-${i}` : `oli-${i}` })),
    subtotal,
    delivery_fee,
    discount,
    tax: 0,
    total,
    coupon_code: input.coupon_code,
    delivery_address: input.delivery_address,
    special_instructions: input.special_instructions,
    created_at: nowIso,
    updated_at: nowIso,
  };
  store.mutate((dd) => {
    dd.orders.unshift(order);
    for (const line of order.items) {
      const mi = dd.menuItems.find((m) => m.id === line.menu_item_id);
      if (mi) mi.times_ordered += line.quantity;
    }
    if (order.coupon_code) {
      const c = dd.coupons.find((c) => c.code === order.coupon_code);
      if (c) c.used_count += 1;
    }
    dd.notifications.unshift({
      id: uid("ntf"),
      target: "admin",
      title: `New order ${order.order_number}`,
      body: `${order.customer_name} placed a ${order.type.replace("_", "-")} order of ${total.toLocaleString()} RWF.`,
      kind: "order",
      read: false,
      link: "/admin/orders",
      created_at: nowIso,
    });
    if (order.customer_id) {
      dd.notifications.unshift({
        id: uid("ntf"),
        target: "customer",
        user_id: order.customer_id,
        title: `Order ${order.order_number} received`,
        body: "We received your order and the kitchen is getting started.",
        kind: "order",
        read: false,
        link: `/order/${order.id}`,
        created_at: nowIso,
      });
    }
  });
  scheduleDemoProgression(order.id);
  return JSON.parse(JSON.stringify(order));
}

const DEMO_STEP_MS: Record<string, number> = {
  confirmed: 12_000,
  preparing: 25_000,
  ready: 50_000,
};

function scheduleDemoProgression(orderId: string): void {
  if (!isBrowser) return;
  const advance = (toStatus: Order["status"], afterMs: number) => {
    window.setTimeout(() => {
      let proceed = false;
      store.mutate((d) => {
        const o = d.orders.find((o) => o.id === orderId);
        if (!o) return;
        const flow = orderFlowFor(o.type);
        const currentIdx = flow.indexOf(o.status);
        const targetIdx = flow.indexOf(toStatus);
        if (currentIdx >= 0 && targetIdx > currentIdx && targetIdx === currentIdx + 1 && o.status !== "cancelled" && o.status !== "completed") {
          o.status = toStatus;
          o.updated_at = new Date().toISOString();
          proceed = true;
          if (o.customer_id) {
            d.notifications.unshift({
              id: uid("ntf"),
              target: "customer",
              user_id: o.customer_id,
              title: `Order ${o.order_number}: ${toStatus.replace(/_/g, " ")}`,
              body: toStatus === "ready" ? "Your order is ready!" : `Your order is now ${toStatus}.`,
              kind: "order",
              read: false,
              link: `/order/${o.id}`,
              created_at: new Date().toISOString(),
            });
          }
        }
      });
    }, afterMs);
  };
  advance("confirmed", 10_000);
  advance("preparing", 28_000);
  advance("ready", 55_000);
}

export async function updateOrderStatus(orderId: string, status: Order["status"], actor: string): Promise<void> {
  store.mutate((d) => {
    const o = d.orders.find((x) => x.id === orderId);
    if (!o) return;
    o.status = status;
    o.updated_at = new Date().toISOString();
    if (o.customer_id && ["preparing", "ready", "out_for_delivery", "completed", "cancelled"].includes(status)) {
      d.notifications.unshift({
        id: uid("ntf"),
        target: "customer",
        user_id: o.customer_id,
        title: `Order ${o.order_number}: ${status.replace(/_/g, " ")}`,
        body: status === "out_for_delivery" ? "Your rider is on the way." : status === "completed" ? "Thank you for dining with Luwombo!" : `Your order is now ${status.replace(/_/g, " ")}.`,
        kind: "order",
        read: false,
        link: `/order/${o.id}`,
        created_at: new Date().toISOString(),
      });
    }
  });
  logAudit(actor, `Marked ${status.replace(/_/g, " ")}`, "Order", orderId, "");
  try {
    const { persistOrderStatus } = await import("./supabase-write");
    await persistOrderStatus(orderId, status);
  } catch {
    // store-local only
  }
}

export async function setPaymentStatus(orderId: string, ps: Order["payment_status"], actor: string): Promise<void> {
  let orderStatus: Order["status"] = "received";
  store.mutate((d) => {
    const o = d.orders.find((x) => x.id === orderId);
    if (!o) return;
    o.payment_status = ps;
    if (ps === "paid" && o.status === "received") o.status = "confirmed";
    o.updated_at = new Date().toISOString();
    orderStatus = o.status;
  });
  logAudit(actor, `Payment ${ps}`, "Order", orderId, "");
  try {
    const { persistOrderPaymentStatus } = await import("./supabase-write");
    await persistOrderPaymentStatus(orderId, ps, orderStatus);
  } catch {
    // store-local only
  }
}

export async function validateCoupon(code: string, subtotal: number): Promise<{ ok: boolean; message: string; discount: number }> {
  await wait(300);
  const c = store.get().coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
  if (!c || !c.active) return { ok: false, message: "This code doesn't exist or is no longer active.", discount: 0 };
  const nowT = Date.now();
  if (new Date(c.starts_at).getTime() > nowT) return { ok: false, message: "This code isn't active yet.", discount: 0 };
  if (new Date(c.ends_at).getTime() < nowT) return { ok: false, message: "This code has expired.", discount: 0 };
  if (c.used_count >= c.max_uses) return { ok: false, message: "This code has reached its usage limit.", discount: 0 };
  if (subtotal < c.min_order) return { ok: false, message: `Minimum order of ${c.min_order.toLocaleString()} RWF required.`, discount: 0 };
  const discount = c.type === "percentage" ? Math.round((subtotal * c.value) / 100) : Math.min(c.value, subtotal);
  return { ok: true, message: `Code applied — you save ${discount.toLocaleString()} RWF!`, discount };
}

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function createReservation(input: Omit<Reservation, "id" | "reservation_number" | "created_at" | "status"> & { customer?: Profile | null }): Promise<Reservation> {
  await wait(400);
  const base = { ...input } as Partial<Reservation>;
  delete (base as Partial<Reservation> & { customer?: Profile }).customer;
  const resNumber = newReservationNumber();

  // Try to persist as a real Supabase reservation (RLS-aware).
  let finalId = uid("res");
  try {
    const { persistReservation } = await import("./supabase-write");
    const res = await persistReservation({
      customer_id: input.customer?.id,
      customer_name: base.customer_name!,
      customer_phone: base.customer_phone!,
      customer_email: base.customer_email,
      reservation_number: resNumber,
      date: base.date!,
      time_slot: base.time_slot!,
      party_size: base.party_size!,
      area: base.area!,
      occasion: base.occasion,
      special_requests: base.special_requests,
      status: "confirmed",
    });
    if (res.ok && res.id) finalId = res.id;
  } catch {
    // store-local only
  }

  const res: Reservation = {
    ...base,
    customer_id: input.customer?.id,
    id: finalId,
    reservation_number: resNumber,
    status: "confirmed",
    created_at: new Date().toISOString(),
  } as Reservation;

  store.mutate((d) => {
    d.reservations.unshift(res);
    d.notifications.unshift({
      id: uid("ntf"),
      target: "admin",
      title: "New reservation",
      body: `${res.customer_name} · ${res.party_size} guests · ${res.date} ${res.time_slot} (${res.area.replace(/_/g, " ")})`,
      kind: "reservation",
      read: false,
      link: "/admin/reservations",
      created_at: res.created_at,
    });
    if (res.customer_id) {
      d.notifications.unshift({
        id: uid("ntf"),
        target: "customer",
        user_id: res.customer_id,
        title: `Reservation ${res.reservation_number} confirmed`,
        body: `Table for ${res.party_size}, ${res.date} at ${res.time_slot}. We look forward to hosting you!`,
        kind: "reservation",
        read: false,
        link: "/account/reservations",
        created_at: res.created_at,
      });
    }
  });
  return res;
}

export async function getAvailableSlots(date: string, partySize: number): Promise<string[]> {
  const d = store.get();
  const slots: string[] = [];
  const day = new Date(`${date}T00:00:00`).getDay();
  const key = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][day];
  const hours = d.settings.opening_hours[key];
  if (!hours || hours.closed) return slots;
  const [oh] = hours.open.split(":").map(Number);
  const [ch] = hours.close.split(":").map(Number);
  const step = d.settings.reservation_slot_minutes / 60;
  for (let h = oh; h < ch; h += step * 2) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
  }
  const taken = new Map<string, number>();
  for (const r of d.reservations) {
    if (r.date !== date || ["cancelled", "no_show"].includes(r.status)) continue;
    taken.set(r.time_slot, (taken.get(r.time_slot) ?? 0) + r.party_size);
  }
  const capacityPerSlot = 24;
  const todayIso = new Date().toISOString().slice(0, 10);
  const nowH = new Date().getHours();
  return slots.filter((s) => {
    if ((taken.get(s) ?? 0) + partySize > capacityPerSlot) return false;
    if (date === todayIso && Number(s.split(":")[0]) <= nowH) return false;
    return true;
  });
}

export async function signInWithSupabase(emailOrPhone: string, password: string): Promise<Profile> {
  const { createBrowserSupabaseClient, isSupabaseConfigured } = await import("./supabase");
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  const sb = createBrowserSupabaseClient();
  const { data, error } = await sb.auth.signInWithPassword({
    email: emailOrPhone.trim().toLowerCase(),
    password,
  });
  if (error || !data.user) throw new Error(error?.message || "Login failed.");
  const { data: row } = await sb.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
  if (!row) throw new Error("No profile found for this account.");
  return {
    id: row.id,
    full_name: row.full_name ?? row.email ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    role: row.role ?? "customer",
    avatar_url: row.avatar_url,
    active: row.active ?? true,
    created_at: row.created_at ?? new Date().toISOString(),
  } as Profile;
}

export async function registerWithSupabase(input: {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<Profile> {
  const { createBrowserSupabaseClient, isSupabaseConfigured } = await import("./supabase");
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  const sb = createBrowserSupabaseClient();
  const { data, error } = await sb.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: { data: { full_name: input.full_name, phone: input.phone } },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Could not create your account.");
  await new Promise((r) => setTimeout(r, 1200));
  const { data: row } = await sb.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
  if (row) {
    return {
      id: row.id,
      full_name: row.full_name ?? input.full_name,
      email: row.email ?? input.email,
      phone: row.phone ?? input.phone,
      role: row.role ?? "customer",
      active: row.active ?? true,
      created_at: row.created_at ?? new Date().toISOString(),
    } as Profile;
  }
  return {
    id: data.user.id,
    full_name: input.full_name,
    email: data.user.email ?? "",
    phone: input.phone,
    role: "customer",
    active: true,
    created_at: new Date().toISOString(),
  } as Profile;
}
