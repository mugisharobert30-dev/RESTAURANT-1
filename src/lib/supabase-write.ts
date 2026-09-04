"use client";

import type { Order, Reservation } from "./types";
import type { CartLinePayload } from "./db";

let cachedClient: any = null;

async function ensureClient(): Promise<{ sb: any } | null> {
  const { createBrowserSupabaseClient, isSupabaseConfigured } = await import("./supabase");
  if (!isSupabaseConfigured()) return null;
  if (!cachedClient) cachedClient = createBrowserSupabaseClient();
  return { sb: cachedClient };
}

export interface PersistOrderResult {
  ok: boolean;
  orderId?: string; // the final id to use (Supabase UUID when persisted)
  error?: string;
}

// Writes an order (plus its items) to Supabase when possible.
export async function persistOrder(input: {
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  order_number: string;
  type: Order["type"];
  table_label?: string;
  status: Order["status"];
  payment_status: Order["payment_status"];
  payment_method?: Order["payment_method"];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  delivery_address?: string;
  special_instructions?: string;
  lines: CartLinePayload[];
}): Promise<PersistOrderResult> {
  const ctx = await ensureClient(); if (!ctx) return { ok: false }; const sb = ctx.sb;
  if (!sb) return { ok: false };

  try {
    const { data, error } = await sb
      .from("orders")
      .insert({
        customer_id: input.customer_id ?? null,
        customer_name: input.customer_name,
        customer_phone: input.customer_phone,
        customer_email: input.customer_email ?? null,
        order_number: input.order_number,
        type: input.type,
        table_label: input.table_label ?? null,
        status: input.status,
        payment_status: input.payment_status,
        payment_method: input.payment_method ?? null,
        subtotal: input.subtotal,
        delivery_fee: input.delivery_fee,
        discount: input.discount,
        tax: 0,
        total: input.total,
        delivery_address: input.delivery_address ?? null,
        special_instructions: input.special_instructions ?? null,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return { ok: false, error: error?.message };
    }
    const orderId: string = data.id;

    if (input.lines.length) {
      const { error: itemsError } = await sb.from("order_items").insert(
        input.lines.map((l) => ({
          order_id: orderId,
          menu_item_id: l.menu_item_id,
          name_snapshot: l.name,
          quantity: l.quantity,
          unit_price: l.unit_price,
          options: l.options ?? [],
          special_instructions: l.special_instructions ?? null,
        }))
      );
      if (itemsError) {
        return { ok: false, error: itemsError.message };
      }
    }

    return { ok: true, orderId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "persist failed" };
  }
}

export interface PersistReservationInput {
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  reservation_number: string;
  date: string;
  time_slot: string;
  party_size: number;
  area: string;
  occasion?: string;
  special_requests?: string;
  status: Reservation["status"];
}

export async function persistReservation(input: PersistReservationInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  const ctx = await ensureClient(); if (!ctx) return { ok: false }; const sb = ctx.sb;
  if (!sb) return { ok: false };
  try {
    const { data, error } = await sb
      .from("reservations")
      .insert({
        customer_id: input.customer_id ?? null,
        customer_name: input.customer_name,
        customer_phone: input.customer_phone,
        customer_email: input.customer_email ?? null,
        reservation_number: input.reservation_number,
        date: input.date,
        time_slot: input.time_slot,
        party_size: input.party_size,
        area: input.area,
        occasion: input.occasion ?? null,
        special_requests: input.special_requests ?? null,
        status: input.status,
      })
      .select("id")
      .single();
    if (error || !data?.id) return { ok: false, error: error?.message };
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "persist failed" };
  }
}

export async function persistOrderStatus(orderId: string, status: Order["status"]): Promise<{ ok: boolean; error?: string }> {
  const ctx = await ensureClient(); if (!ctx) return { ok: false }; const sb = ctx.sb;
  if (!sb) return { ok: false };
  try {
    const { error } = await sb.from("orders").update({ status }).eq("id", orderId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "update failed" };
  }
}

export async function persistOrderPaymentStatus(orderId: string, paymentStatus: Order["payment_status"], orderStatus: Order["status"]): Promise<{ ok: boolean; error?: string }> {
  const ctx = await ensureClient(); if (!ctx) return { ok: false }; const sb = ctx.sb;
  if (!sb) return { ok: false };
  try {
    const update: Record<string, unknown> = { payment_status: paymentStatus };
    if (paymentStatus === "paid" && orderStatus === "received") update.status = "confirmed";
    const { error } = await sb.from("orders").update(update).eq("id", orderId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "update failed" };
  }
}

export async function persistReservationStatus(reservationId: string, status: Reservation["status"]): Promise<{ ok: boolean; error?: string }> {
  const ctx = await ensureClient(); if (!ctx) return { ok: false }; const sb = ctx.sb;
  if (!sb) return { ok: false };
  try {
    const { error } = await sb.from("reservations").update({ status }).eq("id", reservationId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "update failed" };
  }
}
