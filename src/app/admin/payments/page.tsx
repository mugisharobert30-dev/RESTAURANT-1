"use client";

import { useMemo, useState } from "react";
import { BanknoteIcon, CreditCard, Search, Smartphone } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { setPaymentStatus } from "@/lib/db";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { fmtRWF, fmtDateTime } from "@/lib/format";
import type { PaymentMethod, PaymentStatus } from "@/lib/types";
import { Badge, Button, StatCard } from "@/components/ui";

const METHOD_LABELS: Record<PaymentMethod, string> = {
  mtn_momo: "MTN MoMo",
  airtel_money: "Airtel Money",
  card: "Card",
  cash_on_delivery: "Cash on delivery",
  pay_at_counter: "Pay at counter",
};

const METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  mtn_momo: <Smartphone className="h-4 w-4 text-amber-600" />,
  airtel_money: <Smartphone className="h-4 w-4 text-red-600" />,
  card: <CreditCard className="h-4 w-4 text-sky-600" />,
  cash_on_delivery: <BanknoteIcon className="h-4 w-4 text-leaf-700" />,
  pay_at_counter: <BanknoteIcon className="h-4 w-4 text-cocoa/50" />,
};

export default function AdminPaymentsPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const orders = useStoreData((d) => d.orders);
  const [statusFilter, setStatusFilter] = useState<"all" | PaymentStatus>("all");
  const [query, setQuery] = useState("");

  const payments = useMemo(() =>
    orders
      .filter((o) => (statusFilter === "all" ? true : o.payment_status === statusFilter))
      .filter((o) => !query || o.order_number.toLowerCase().includes(query.toLowerCase()) || o.customer_name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [orders, statusFilter, query]);

  const collected = orders.filter((o) => o.payment_status === "paid").reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.payment_status === "pending").reduce((s, o) => s + o.total, 0);
  const refunded = orders.filter((o) => o.payment_status === "refunded").reduce((s, o) => s + o.total, 0);
  const momoShare = Math.round((orders.filter((o) => ["mtn_momo", "airtel_money"].includes(o.payment_method ?? "")).length / Math.max(1, orders.length)) * 100);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl font-extrabold">Payments</h1>
        <p className="mt-1 text-sm text-cocoa/55">{momoShare}% of orders arrive via mobile money — Rwanda&apos;s favorite way to pay.</p>
      </header>

      <section className="grid grid-cols-2 xl:grid-cols-4">
        <StatCard label="Collected" value={fmtRWF(collected)} tone="leaf" />
        <StatCard label="Awaiting payment" value={fmtRWF(pending)} tone="brand" />
        <StatCard label="Refunded" value={fmtRWF(refunded)} tone="red" />
        <StatCard label="Transactions" value={orders.length} tone="sky" />
      </section>

      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1.5">
          {(["all", "pending", "paid", "refunded", "failed"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} aria-pressed={statusFilter === s}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold capitalize ${statusFilter === s ? "bg-cocoa text-white" : "bg-white ring-1 ring-cocoa/10 hover:bg-stone-50"}`}>
              {s}
            </button>
          ))}
        </div>
        <label className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Order # or customer…" type="search" className="h-10 w-full rounded-xl border border-cocoa/15 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
        </label>
      </div>

      <div className="space-y-3 sm:hidden" aria-label="Transactions list">
        {payments.map((o) => (
          <div key={o.id} className="rounded-2xl border border-cocoa/10 bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{o.order_number}</p>
                <p className="text-xs text-cocoa/40">{fmtDateTime(o.created_at)}</p>
              </div>
              <span className="shrink-0 font-extrabold">{fmtRWF(o.total)}</span>
            </div>
            <p className="mt-2 text-sm text-cocoa/70">{o.customer_name}</p>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm font-medium">
              {METHOD_ICONS[o.payment_method ?? "cash_on_delivery"]}{METHOD_LABELS[o.payment_method ?? "cash_on_delivery"]}
              <span className="font-mono text-xs text-cocoa/55">{o.order_number.replace("LR-", "TXN-")}</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-cocoa/6 pt-3">
              <Badge tone={o.payment_status === "paid" ? "green" : o.payment_status === "refunded" ? "blue" : o.payment_status === "failed" ? "red" : "amber"}>{o.payment_status}</Badge>
              <span className="ml-auto flex gap-1.5">
                {o.payment_status === "pending" && (
                  <Button size="sm" onClick={() => {
                    setPaymentStatus(o.id, "paid", auth.profile!.full_name);
                    toast(`${o.order_number} marked paid (${auth.profile?.full_name}).`);
                  }}>Mark paid</Button>
                )}
                {(o.payment_status === "paid" || o.payment_status === "failed") && (
                  <Button size="sm" variant="outline" onClick={() => {
                    setPaymentStatus(o.id, "refunded", auth.profile!.full_name);
                    toast(`${o.order_number} refunded.`);
                  }}>Refund</Button>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-cocoa/10 bg-white shadow-card sm:block">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-cocoa/10 bg-stone-50 text-xs uppercase tracking-wide text-cocoa/45">
              <th className="px-4 py-3 font-bold">Transaction</th>
              <th className="px-4 py-3 font-bold">Customer</th>
              <th className="px-4 py-3 font-bold">Method</th>
              <th className="px-4 py-3 font-bold">Reference</th>
              <th className="px-4 py-3 font-bold">Amount</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cocoa/6">
            {payments.map((o) => (
              <tr key={o.id} className="hover:bg-stone-50/60">
                <td className="px-4 py-3">
                  <p className="font-bold">{o.order_number}</p>
                  <p className="text-xs text-cocoa/40">{fmtDateTime(o.created_at)}</p>
                </td>
                <td className="px-4 py-3 text-cocoa/70">{o.customer_name}</td>
                <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 font-medium">{METHOD_ICONS[o.payment_method ?? "cash_on_delivery"]}{METHOD_LABELS[o.payment_method ?? "cash_on_delivery"]}</span></td>
                <td className="px-4 py-3 font-mono text-xs text-cocoa/55">{o.order_number.replace("LR-", "TXN-")}</td>
                <td className="px-4 py-3 font-extrabold whitespace-nowrap">{fmtRWF(o.total)}</td>
                <td className="px-4 py-3">
                  <Badge tone={o.payment_status === "paid" ? "green" : o.payment_status === "refunded" ? "blue" : o.payment_status === "failed" ? "red" : "amber"}>{o.payment_status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="flex gap-1.5">
                    {o.payment_status === "pending" && (
                      <Button size="sm" onClick={() => {
                        setPaymentStatus(o.id, "paid", auth.profile!.full_name);
                        toast(`${o.order_number} marked paid (${auth.profile?.full_name}).`);
                      }}>Mark paid</Button>
                    )}
                    {(o.payment_status === "paid" || o.payment_status === "failed") && (
                      <Button size="sm" variant="outline" onClick={() => {
                        setPaymentStatus(o.id, "refunded", auth.profile!.full_name);
                        toast(`${o.order_number} refunded.`);
                      }}>Refund</Button>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payments.length === 0 && <div className="rounded-2xl border border-dashed border-cocoa/20 bg-white p-12 text-center text-sm text-cocoa/45">No transactions match this filter.</div>}
    </div>
  );
}
