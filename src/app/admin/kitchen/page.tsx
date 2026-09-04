"use client";

import { useEffect, useState } from "react";
import { Bike, ChefHat, CheckCircle2, Clock, Store, UtensilsCrossed, BellRing } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { updateOrderStatus } from "@/lib/db";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { cx, elapsedSince } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const COLUMNS: Array<{ status: OrderStatus; label: string; next?: OrderStatus; nextLabel?: string; accent: string }> = [
  { status: "received", label: "New orders", next: "preparing", nextLabel: "Start cooking", accent: "border-sky-300" },
  { status: "confirmed", label: "Confirmed", next: "preparing", nextLabel: "Start cooking", accent: "border-blue-300" },
  { status: "preparing", label: "Preparing", next: "ready", nextLabel: "Mark ready", accent: "border-brand-300" },
  { status: "ready", label: "Ready to serve", next: "completed", nextLabel: "Complete", accent: "border-leaf-300" },
];

export default function KitchenDisplayPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const orders = useStoreData((d) => d.orders);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold"><ChefHat className="h-7 w-7 text-brand-600" /> Kitchen Display</h1>
          <p className="mt-1 text-sm text-cocoa/55">Live board — tap a card&apos;s button to move it along. Auto-refreshes every 30s.</p>
        </div>
        <p className="rounded-xl bg-white px-4 py-2 text-sm font-bold ring-1 ring-cocoa/10">
          {orders.filter((o) => ["received", "confirmed"].includes(o.status)).length} waiting · {orders.filter((o) => o.status === "preparing").length} cooking
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const list = orders.filter((o) => o.status === col.status);
          return (
            <section key={col.status} aria-label={col.label} className={cx("rounded-2xl border-t-4 bg-stone-50 p-3", col.accent)}>
              <h2 className="mb-3 flex items-center justify-between px-1 text-sm font-extrabold uppercase tracking-wide text-cocoa/60">
                {col.label}
                <span className="rounded-full bg-white px-2 py-0.5 text-xs ring-1 ring-cocoa/10">{list.length}</span>
              </h2>
              <ul className="space-y-3">
                {list.length === 0 && <li className="rounded-xl bg-white/60 px-3 py-6 text-center text-sm text-cocoa/35">Nothing here</li>}
                {list.map((o) => <KitchenCard key={o.id} order={o} nextStatus={col.next} nextLabel={col.nextLabel} onMove={() => {
                  void updateOrderStatus(o.id, col.next!, auth.profile?.full_name ?? "Kitchen");
                  toast(`${o.order_number} → ${col.nextLabel}`);
                }} />)}
              </ul>
            </section>
          );
        })}
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-card">
        <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-cocoa/60"><BellRing className="h-4 w-4 text-brand-600" /> Table requests</h2>
        <p className="mt-2 text-sm text-cocoa/55">Waiter calls and bill requests appear in Notifications instantly.</p>
      </section>
    </div>
  );
}

function KitchenCard({ order, nextStatus, nextLabel, onMove }: { order: Order; nextStatus?: OrderStatus; nextLabel?: string; onMove: () => void }) {
  const mins = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60_000);
  const urgent = mins >= 20;
  const TypeIcon = order.type === "delivery" ? Bike : order.type === "takeaway" ? Store : UtensilsCrossed;

  return (
    <li className={cx("rounded-xl border-2 bg-white p-3.5 shadow-card transition-transform active:scale-[.99]", urgent ? "border-red-300" : "border-transparent")}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-extrabold">{order.order_number}</span>
        <span className={cx("flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold", urgent ? "bg-red-100 text-red-700" : "bg-stone-100 text-cocoa/60")}>
          <Clock className="h-3 w-3" /> {elapsedSince(order.created_at)}
        </span>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-cocoa/55">
        <TypeIcon className="h-3.5 w-3.5" /> {order.type.replace(/_/g, "-")}{order.table_label ? ` · ${order.table_label}` : ""} · {order.customer_name}
      </p>
      <ul className="mt-2.5 space-y-1.5 border-t border-dashed border-cocoa/15 pt-2.5">
        {order.items.map((l, i) => (
          <li key={i}>
            <p className="text-sm font-extrabold">{l.quantity} × {l.name}</p>
            {l.options.length > 0 && <p className="text-xs text-brand-700">+ {l.options.join(", ")}</p>}
            {l.special_instructions && <p className="text-xs italic text-red-600">“{l.special_instructions}”</p>}
          </li>
        ))}
      </ul>
      {order.type === "delivery" && order.delivery_address && <p className="mt-2 truncate text-xs text-cocoa/50">→ {order.delivery_address}</p>}
      {nextStatus && nextLabel && (
        <button
          onClick={onMove}
          className={cx("mt-3 h-11 w-full rounded-xl text-sm font-extrabold text-white transition-colors",
            nextStatus === "ready" ? "bg-purple-500 hover:bg-purple-600" : nextStatus === "completed" ? "bg-leaf-600 hover:bg-leaf-700" : "bg-brand-600 hover:bg-brand-700")}
        >
          {nextLabel === "Complete" && <CheckCircle2 className="mr-1 inline h-4 w-4" />}
          {nextLabel}
        </button>
      )}
    </li>
  );
}
