"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Bike, Check, ChefHat, CheckCircle2, ClipboardList, CreditCard, MapPin, PackageCheck, ReceiptText, UtensilsCrossed, XCircle } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { fmtDateTime, fmtRWF, cx } from "@/lib/format";
import { orderFlowFor, ORDER_STATUS_LABELS, ORDER_TYPE_LABELS, PAYMENT_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { Badge, EmptyState, Button } from "@/components/ui";

const STEP_ICONS: Record<string, typeof ClipboardList> = {
  received: ClipboardList,
  confirmed: CreditCard,
  preparing: ChefHat,
  ready: PackageCheck,
  out_for_delivery: Bike,
  completed: CheckCircle2,
};

function TrackingContent() {
  const params = useParams<{ id: string }>();
  const placed = useSearchParams().get("placed") === "1";
  const orders = useStoreData((d) => d.orders);
  const settings = useStoreData((d) => d.settings);
  const order = orders.find((o) => o.id === params.id);

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Order not found"
          message="We couldn't find that order on this device. If you just ordered, give it a second and refresh."
          action={
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()}>Refresh</Button>
              <Link href="/menu"><Button variant="outline">Back to Menu</Button></Link>
            </div>
          }
        />
      </div>
    );
  }

  const flow = orderFlowFor(order.type).filter((s) => s !== "completed" || true);
  const currentIdx = flow.indexOf(order.status);
  const cancelled = order.status === "cancelled";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {placed && (
        <div className="mb-8 rounded-2xl bg-leaf-700 p-6 text-white shadow-soft animate-fadeUp" role="status">
          <p className="flex items-center gap-2 font-display text-xl font-bold"><CheckCircle2 className="h-6 w-6" /> Thank you! Your order is in.</p>
          <p className="mt-1 text-white/85">Order <strong>{order.order_number}</strong> · {fmtRWF(order.total)} · {ORDER_TYPE_LABELS[order.type]}</p>
          <p className="mt-3 text-sm text-white/75">Estimated {(order.type === "delivery" ? "delivery" : "ready")} in ~{order.items.reduce((m, l) => Math.max(m, 25), 25)} min. We will update you right here.</p>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold">{order.order_number}</h1>
          <p className="mt-1 text-sm text-cocoa/55">Placed {fmtDateTime(order.created_at)}</p>
        </div>
        <Badge tone={order.payment_status === "paid" ? "green" : order.payment_status === "failed" ? "red" : "amber"}>
          {PAYMENT_STATUS_LABELS[order.payment_status]} · {ORDER_TYPE_LABELS[order.type]}
        </Badge>
      </div>

      <section aria-label="Order progress" className="mt-8 rounded-2xl border border-cocoa/10 bg-white p-5 sm:p-7 shadow-card">
        {cancelled ? (
          <div className="flex items-center gap-3 text-red-600">
            <XCircle className="h-8 w-8" />
            <div>
              <p className="font-bold">Order cancelled</p>
              <p className="text-sm text-cocoa/60">This order was cancelled. Any payment made is being refunded.</p>
            </div>
          </div>
        ) : (
          <ol className="relative grid gap-0 sm:grid-cols-5">
            {flow.map((status: OrderStatus, i) => {
              const done = i <= currentIdx;
              const Icon = STEP_ICONS[status] ?? ClipboardList;
              return (
                <li key={status} className={cx("relative flex items-start gap-3 pb-6 sm:flex-col sm:text-center", i === flow.length - 1 && "pb-0")}>
                  {i > 0 && <span aria-hidden="true" className={cx("absolute left-[15px] top-7 h-full w-0.5 sm:left-0 sm:top-[22px] sm:h-0.5 sm:w-full -translate-x-0", done ? "bg-leaf-500" : "bg-stone-200")} />}
                  <span className={cx("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white", done ? "bg-leaf-600 text-white" : "bg-stone-200 text-cocoa/40")}>
                    {i < currentIdx ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span className={cx("text-xs font-bold sm:text-sm", done ? "text-cocoa" : "text-cocoa/35")}>
                    {ORDER_STATUS_LABELS[status]}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        {!cancelled && (
          <p className="mt-6 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900" role="status">
            {order.status === "received" && "We received your order — confirming details now."}
            {order.status === "confirmed" && "Payment confirmed. The kitchen is about to start."}
            {order.status === "preparing" && "Your food is being prepared fresh. Almost there!"}
            {order.status === "ready" && (order.type === "delivery" ? "Packing for the rider…" : "Your order is ready at the counter!")}
            {order.status === "out_for_delivery" && `Your rider is heading to ${order.delivery_address}.`}
            {order.status === "completed" && "Enjoyed your meal? Leave a review from My Orders."}
          </p>
        )}
      </section>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <section aria-label="Ordered items" className="rounded-2xl border border-cocoa/10 bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold"><ReceiptText className="h-5 w-5 text-brand-600" /> Items</h2>
          <ul className="mt-3 divide-y divide-cocoa/6 text-sm">
            {order.items.map((l, i) => (
              <li key={i} className="flex justify-between gap-3 py-2.5">
                <span><strong>{l.quantity} ×</strong> {l.name}{l.options?.length ? <span className="block text-xs text-cocoa/45">{l.options.join(", ")}</span> : null}</span>
                <span className="font-semibold">{fmtRWF(l.unit_price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t border-cocoa/8 pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-cocoa/60">Subtotal</dt><dd>{fmtRWF(order.subtotal)}</dd></div>
            {order.delivery_fee > 0 && <div className="flex justify-between"><dt className="text-cocoa/60">Delivery</dt><dd>{fmtRWF(order.delivery_fee)}</dd></div>}
            {order.discount > 0 && <div className="flex justify-between text-leaf-700"><dt>Discount</dt><dd>−{fmtRWF(order.discount)}</dd></div>}
            <div className="flex justify-between text-base font-extrabold"><dt>Total</dt><dd>{fmtRWF(order.total)}</dd></div>
          </dl>
        </section>

        <section aria-label="Delivery information" className="rounded-2xl border border-cocoa/10 bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold"><MapPin className="h-5 w-5 text-brand-600" /> Details</h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div><dt className="text-xs uppercase tracking-wide text-cocoa/40">Customer</dt><dd className="font-semibold">{order.customer_name}</dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-cocoa/40">Phone</dt><dd className="font-semibold">{order.customer_phone}</dd></div>
            <div><dt className="text-xs uppercase tracking-wide text-cocoa/40">Type</dt><dd className="font-semibold">{ORDER_TYPE_LABELS[order.type]}{order.table_label ? ` · Table ${order.table_label}` : ""}</dd></div>
            {order.delivery_address && (
              <div><dt className="text-xs uppercase tracking-wide text-cocoa/40">Deliver to</dt><dd className="font-semibold">{order.delivery_address}</dd></div>
            )}
            {order.special_instructions && (
              <div><dt className="text-xs uppercase tracking-wide text-cocoa/40">Instructions</dt><dd className="italic text-cocoa/70">“{order.special_instructions}”</dd></div>
            )}
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-cocoa/15 px-4 text-sm font-semibold hover:border-brand-400">
              <UtensilsCrossed className="h-4 w-4" /> Call restaurant
            </a>
            <a href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`Hello Luwombo! About my order ${order.order_number}: `)}`}
               target="_blank" rel="noreferrer"
               className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white hover:brightness-105">
              WhatsApp support
            </a>
          </div>
        </section>
      </div>

      <div className="mt-8 text-center">
        <Link href="/menu" className="text-sm font-bold text-brand-700 hover:underline">Order something else →</Link>
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={null}>
      <TrackingContent />
    </Suspense>
  );
}
