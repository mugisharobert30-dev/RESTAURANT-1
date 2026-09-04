"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, Search, Trash2, Ban } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { setPaymentStatus, updateOrderStatus } from "@/lib/db";
import { store } from "@/lib/store";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { fmtRWF, fmtDateTime, cx } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_TYPE_LABELS, PAYMENT_STATUS_LABELS, type Order, type OrderStatus } from "@/lib/types";
import { Badge, Button, ConfirmDialog, EmptyState } from "@/components/ui";
import { BulkSelectBar } from "@/components/admin/bulk-select";

const STATUS_FILTERS = ["all", "received", "confirmed", "preparing", "ready", "out_for_delivery", "completed", "cancelled"] as const;
const PAYMENT_FILTERS = ["all", "paid", "pending", "failed", "refunded"] as const;

const STATUS_TONE: Record<string, string> = {
  received: "bg-sky-100 text-sky-800 ring-sky-200",
  confirmed: "bg-blue-100 text-blue-800 ring-blue-200",
  preparing: "bg-brand-100 text-brand-800 ring-brand-200",
  ready: "bg-purple-100 text-purple-800 ring-purple-200",
  out_for_delivery: "bg-indigo-100 text-indigo-800 ring-indigo-200",
  completed: "bg-leaf-100 text-leaf-800 ring-leaf-200",
  cancelled: "bg-red-100 text-red-700 ring-red-200",
};

export default function AdminOrdersPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const orders = useStoreData((d) => d.orders);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [paymentFilter, setPaymentFilter] = useState<(typeof PAYMENT_FILTERS)[number]>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (paymentFilter !== "all" && o.payment_status !== paymentFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))
        );
      }
      return true;
    });
  }, [orders, statusFilter, paymentFilter, query]);

  const shown = filtered.slice(0, 40);
  const visibleIds = shown.map((o) => o.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const someSelected = visibleIds.some((id) => selected.includes(id));
  const toggleAll = () =>
    setSelected(allSelected ? selected.filter((id) => !visibleIds.includes(id)) : [...selected, ...visibleIds].filter((id, i, a) => a.indexOf(id) === i));
  const toggleOne = (id: string) => setSelected((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  const removeSelected = () => {
    store.mutate((d) => {
      d.orders = d.orders.filter((o) => !selected.includes(o.id));
    });
    toast(`Deleted ${selected.length} order${selected.length === 1 ? "" : "s"}.`);
    setSelected([]);
    setConfirmDelete(false);
  };

  const cancelSelected = () => {
    const actor = auth.profile?.full_name ?? "Staff";
    for (const id of selected) {
      void updateOrderStatus(id, "cancelled", actor);
    }
    toast(`Cancelled ${selected.length} order${selected.length === 1 ? "" : "s"}.`);
    setSelected([]);
    setConfirmCancel(false);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Orders</h1>
          <p className="mt-1 text-sm text-cocoa/55">{filtered.length} of {orders.length} orders shown</p>
        </div>
        <label className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Order #, customer or phone…"
            className="h-10 w-full rounded-xl border border-cocoa/15 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            type="search"
          />
        </label>
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} aria-pressed={statusFilter === s}
              className={cx("rounded-full px-3 py-1.5 text-xs font-bold capitalize transition-colors", statusFilter === s ? "bg-cocoa text-white" : "bg-white text-cocoa/60 ring-1 ring-cocoa/15 hover:text-cocoa")}>
              {s === "all" ? "All statuses" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by payment">
          {PAYMENT_FILTERS.map((p) => (
            <button key={p} onClick={() => setPaymentFilter(p)} aria-pressed={paymentFilter === p}
              className={cx("rounded-full px-3 py-1.5 text-xs font-bold capitalize transition-colors", paymentFilter === p ? "bg-leaf-700 text-white" : "bg-white text-cocoa/60 ring-1 ring-cocoa/15 hover:text-cocoa")}>
              {p === "all" ? "All payments" : p}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No orders match" message="Try clearing the filters or search with a different term." action={<Button variant="outline" onClick={() => { setStatusFilter("all"); setPaymentFilter("all"); setQuery(""); }}>Clear filters</Button>} />
      ) : (
        <>
          <BulkSelectBar allSelected={allSelected} someSelected={someSelected} count={selected.length} total={shown.length} onToggleAll={toggleAll} label="orders">
            <Button variant="outline" size="sm" onClick={() => setConfirmCancel(true)} disabled={selected.length === 0} className="text-red-600 hover:border-red-300 hover:text-red-700">
              <Ban className="h-3.5 w-3.5" /> Cancel ({selected.length})
            </Button>
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)} disabled={selected.length === 0}>
              <Trash2 className="h-3.5 w-3.5" /> Delete ({selected.length})
            </Button>
          </BulkSelectBar>
          <div className="overflow-x-auto rounded-2xl border border-cocoa/10 bg-white shadow-card">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-cocoa/10 bg-stone-50 text-xs uppercase tracking-wide text-cocoa/45">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allSelected} ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }} onChange={toggleAll} aria-label="Select all visible orders" className="h-4 w-4 rounded accent-brand-600" />
                </th>
                <th className="px-4 py-3 font-bold">Order</th>
                <th className="px-4 py-3 font-bold">Customer</th>
                <th className="px-4 py-3 font-bold">Items</th>
                <th className="px-4 py-3 font-bold">Total</th>
                <th className="px-4 py-3 font-bold">Type</th>
                <th className="px-4 py-3 font-bold">Payment</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cocoa/6">
              {shown.map((o: Order) => (
                <Fragment key={o.id}>
                  <tr className={selected.includes(o.id) ? "bg-brand-50/50" : "hover:bg-stone-50/60"}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggleOne(o.id)} aria-label={`Select ${o.order_number}`} className="h-4 w-4 rounded accent-brand-600" />
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setExpanded(expanded === o.id ? null : o.id)} className="flex items-center gap-1 font-mono font-extrabold text-brand-700 hover:underline">
                        {o.order_number}
                        <ChevronDown className={cx("h-3.5 w-3.5 transition-transform", expanded === o.id && "rotate-180")} />
                      </button>
                      <p className="text-[11px] text-cocoa/40">{fmtDateTime(o.created_at)}</p>
                    </td>
                    <td className="px-4 py-3"><span className="font-semibold">{o.customer_name}</span><p className="text-xs text-cocoa/45">{o.customer_phone}</p></td>
                    <td className="max-w-44 truncate px-4 py-3 text-cocoa/70">{o.items.reduce((s, l) => s + l.quantity, 0)} items · {o.items[0]?.name}</td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap">{fmtRWF(o.total)}</td>
                    <td className="px-4 py-3 text-xs">{ORDER_TYPE_LABELS[o.type]}{o.table_label ? ` · ${o.table_label}` : ""}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          const next = o.payment_status === "paid" ? "refunded" : "paid";
                          void setPaymentStatus(o.id, next, auth.profile!.full_name);
                          toast(`${o.order_number} marked ${next}.`);
                        }}
                        title="Toggle paid / refunded"
                      >
                        <Badge tone={o.payment_status === "paid" ? "green" : o.payment_status === "pending" ? "amber" : o.payment_status === "failed" ? "red" : "purple"}>
                          {PAYMENT_STATUS_LABELS[o.payment_status]}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={o.status}
                        onChange={(e) => {
                          void updateOrderStatus(o.id, e.target.value as OrderStatus, auth.profile!.full_name);
                          toast(`${o.order_number} → ${ORDER_STATUS_LABELS[e.target.value as OrderStatus]}`);
                        }}
                        aria-label={`Change status for ${o.order_number}`}
                        className={cx("rounded-lg px-2 py-1.5 text-xs font-bold capitalize ring-1 outline-none", STATUS_TONE[o.status])}
                      >
                        {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
                          <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>Details</Button>
                    </td>
                  </tr>
                  {expanded === o.id && (
                    <tr className="bg-stone-50/80">
                      <td colSpan={9} className="px-6 py-4">
                        <ul className="grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
                          {o.items.map((l, i) => (
                            <li key={i} className="flex justify-between gap-4">
                              <span>{l.quantity} × {l.name}{l.options?.length ? <em className="ml-1 text-xs text-cocoa/45">({l.options.join(", ")})</em> : null}</span>
                              <span className="shrink-0 text-cocoa/60">{fmtRWF(l.unit_price * l.quantity)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 grid gap-2 border-t border-cocoa/10 pt-3 text-xs text-cocoa/60 sm:grid-cols-3">
                          <p>Subtotal {fmtRWF(o.subtotal)}{o.delivery_fee ? ` + delivery ${fmtRWF(o.delivery_fee)}` : ""}{o.discount ? ` − discount ${fmtRWF(o.discount)}` : ""}</p>
                          <p>{o.delivery_address ?? (o.table_label ? `Table ${o.table_label}` : "Pickup at counter")}</p>
                          {o.special_instructions && <p className="italic">“{o.special_instructions}”</p>}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${selected.length} order${selected.length === 1 ? "" : "s"}?`}
        message="The selected orders are removed from the dashboard. This cannot be undone."
        confirmLabel="Delete orders"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={removeSelected}
      />

      <ConfirmDialog
        open={confirmCancel}
        title={`Cancel ${selected.length} order${selected.length === 1 ? "" : "s"}?`}
        message="The selected orders will be marked as cancelled. Kitchen production stops and customers are notified."
        confirmLabel="Cancel orders"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={cancelSelected}
      />
    </div>
  );
}
