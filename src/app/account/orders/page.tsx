"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageSquarePlus, PackageSearch, RotateCcw, Star } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { useStoreData } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { fmtRWF, fmtDate } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_TYPE_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/types";
import type { MenuItem, Order } from "@/lib/types";
import { Badge, Button, ConfirmDialog, EmptyState, Modal, Textarea } from "@/components/ui";
import { useToast } from "@/context/toast-context";

export default function MyOrdersPage() {
  const auth = useAuth();
  const orders = useStoreData((d) => d.orders);
  const menuItems = useStoreData((d) => d.menuItems);
  const cart = useCart();
  const { toast } = useToast();
  const [reorderTarget, setReorderTarget] = useState<Order | null>(null);
  const myOrders = orders.filter((o) => o.customer_id === auth.profile?.id);

  const confirmReorder = () => {
    if (!reorderTarget) return;
    let added = 0;
    for (const l of reorderTarget.items) {
      const mi = menuItems.find((m) => m.id === l.menu_item_id);
      if (!mi || !mi.available) continue;
      cart.add(mi, l.quantity);
      added += 1;
    }
    setReorderTarget(null);
    if (added > 0) toast(`${added} item${added === 1 ? "" : "s"} added back to your cart.`);
    else toast("None of the items are currently available.", "error");
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl font-extrabold">My Orders</h1>
        <p className="mt-1 text-sm text-cocoa/60">Track live orders and reorder your favorites in one tap.</p>
      </header>

      {myOrders.length === 0 ? (
        <EmptyState icon={<PackageSearch className="h-5 w-5" />} title="You haven't placed an order yet." message="When you order, it will appear here with live tracking." action={<Link href="/menu"><Button>Explore Menu</Button></Link>} />
      ) : (
        <ul className="space-y-4">
          {myOrders.map((o) => (
            <li key={o.id} className="rounded-2xl border border-cocoa/10 bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono font-extrabold text-brand-700">{o.order_number}</p>
                  <p className="text-xs text-cocoa/50">{fmtDate(o.created_at)} · {ORDER_TYPE_LABELS[o.type]}{o.table_label ? ` · Table ${o.table_label}` : ""}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={o.status === "completed" ? "green" : o.status === "cancelled" ? "red" : "amber"}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                  <Badge tone={o.payment_status === "paid" ? "green" : o.payment_status === "refunded" ? "purple" : "amber"}>{PAYMENT_STATUS_LABELS[o.payment_status]}</Badge>
                  <span className="text-lg font-extrabold">{fmtRWF(o.total)}</span>
                </div>
              </div>

              <ul className="mt-3 divide-y divide-cocoa/6 border-t border-cocoa/8 pt-2 text-sm">
                {o.items.map((l, i) => (
                  <li key={i} className="flex items-center justify-between py-1.5">
                    <span className="truncate">{l.quantity} × {l.name}</span>
                    <span className="shrink-0 text-cocoa/60">{fmtRWF(l.unit_price * l.quantity)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-2">
                {!["completed", "cancelled"].includes(o.status) && (
                  <Link href={`/order/${o.id}`}><Button variant="outline" size="sm">Track order</Button></Link>
                )}
                <Button
                  size="sm"
                  onClick={() => setReorderTarget(o)}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reorder
                </Button>
                {o.status === "completed" && <ReviewButton order={o} customerName={auth.profile?.full_name ?? "Guest"} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReviewButton({ order, customerName }: { order: Order; customerName: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const submit = () => {
    if (comment.trim().length < 5) {
      toast("Tell us a little more about your experience.", "error");
      return;
    }
    store.mutate((d) => {
      for (const line of order.items.slice(0, 1)) {
        const mi = d.menuItems.find((m: MenuItem) => m.id === line.menu_item_id);
        if (mi) {
          mi.rating_count += 1;
          mi.rating_avg = Math.round(((mi.rating_avg * (mi.rating_count - 1)) + rating) / mi.rating_count * 10) / 10;
        }
      }
      d.reviews.unshift({
        id: `rev-${Date.now()}`,
        order_id: order.id,
        menu_item_id: order.items[0]?.menu_item_id,
        customer_name: customerName,
        rating,
        food_rating: rating,
        service_rating: rating,
        comment: comment.trim(),
        hidden: false,
        featured: false,
        created_at: new Date().toISOString(),
      });
    });
    setOpen(false);
    setComment("");
    setRating(5);
    toast("Thank you! Your review helps us improve. Murakoze cyane!");
  };

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}><MessageSquarePlus className="h-3.5 w-3.5" /> Leave review</Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`How was ${order.order_number}?`}>
        <fieldset>
          <legend className="text-sm font-bold">Overall rating</legend>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`} aria-pressed={rating >= n}>
                <Star className={`h-8 w-8 transition-colors ${n <= rating ? "fill-brand-500 text-brand-500" : "text-stone-300 hover:text-brand-300"}`} />
              </button>
            ))}
          </div>
        </fieldset>
        <div className="mt-4">
          <Textarea label="Your review" name="reviewText" rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did you love? What could be better?" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Publish review</Button>
        </div>
      </Modal>
    </>
  );
}
