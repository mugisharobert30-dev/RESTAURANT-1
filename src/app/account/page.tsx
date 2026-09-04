"use client";

import Link from "next/link";
import { CalendarDays, Clock, Heart, PackageSearch, Star } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useStoreData } from "@/hooks/use-store";
import { fmtRWF, fmtDate } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_TYPE_LABELS, RESERVATION_STATUS_LABELS } from "@/lib/types";
import { Badge, Card, EmptyState, Button } from "@/components/ui";

export default function AccountOverview() {
  const auth = useAuth();
  const orders = useStoreData((d) => d.orders);
  const reservations = useStoreData((d) => d.reservations);
  const menuItems = useStoreData((d) => d.menuItems);

  const myOrders = orders.filter((o) => o.customer_id === auth.profile?.id);
  const activeOrder = myOrders.find((o) => !["completed", "cancelled"].includes(o.status));
  const upcoming = reservations
    .filter((r) => r.customer_id === auth.profile?.id && !["completed", "cancelled", "no_show"].includes(r.status) && r.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => (a.date + a.time_slot).localeCompare(b.date + b.time_slot))[0];
  const favSet = new Set(useStoreData((d) => d.favorites).filter((f) => f.customer_id === auth.profile?.id).map((f) => f.menu_item_id));
  const favorites = menuItems.filter((m) => favSet.has(m.id));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold">Muraho, {auth.profile!.full_name.split(" ")[0]} 👋</h1>
        <p className="mt-1 text-sm text-cocoa/60">Here is everything happening with your orders and tables.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-cocoa/45"><PackageSearch className="h-4 w-4 text-brand-600" /> Active order</p>
          {activeOrder ? (
            <>
              <p className="mt-2 font-bold">{activeOrder.order_number}</p>
              <p className="mt-1 flex items-center gap-2 text-sm"><Badge tone="amber">{ORDER_STATUS_LABELS[activeOrder.status]}</Badge><span className="text-cocoa/50">{fmtRWF(activeOrder.total)}</span></p>
              <Link href={`/order/${activeOrder.id}`} className="mt-3 inline-block text-sm font-bold text-brand-700 hover:underline">Track order →</Link>
            </>
          ) : (
            <p className="mt-3 text-sm text-cocoa/50">No active order right now.</p>
          )}
        </Card>

        <Card className="p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-cocoa/45"><CalendarDays className="h-4 w-4 text-brand-600" /> Upcoming reservation</p>
          {upcoming ? (
            <>
              <p className="mt-2 font-bold">{upcoming.date} · {upcoming.time_slot}</p>
              <p className="mt-1 text-sm text-cocoa/60">{upcoming.party_size} guests · {RESERVATION_STATUS_LABELS[upcoming.status]}</p>
              <Link href="/account/reservations" className="mt-3 inline-block text-sm font-bold text-brand-700 hover:underline">Manage →</Link>
            </>
          ) : (
            <p className="mt-3 text-sm text-cocoa/50">No upcoming reservation.</p>
          )}
        </Card>

        <Card className="p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-cocoa/45"><Heart className="h-4 w-4 text-brand-600" /> Favorites</p>
          {favorites.length > 0 ? (
            <>
              <ul className="mt-2 space-y-1 text-sm font-semibold">
                {favorites.slice(0, 3).map((f) => <li key={f.id} className="truncate">{f.name}</li>)}
              </ul>
              <Link href="/account/favorites" className="mt-3 inline-block text-sm font-bold text-brand-700 hover:underline">See all →</Link>
            </>
          ) : (
            <p className="mt-3 text-sm text-cocoa/50">Save meals you love for quick ordering.</p>
          )}
        </Card>
      </div>

      <section aria-label="Recent orders">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Recent orders</h2>
          <Link href="/account/orders" className="text-sm font-bold text-brand-700 hover:underline">View all</Link>
        </div>
        {myOrders.length === 0 ? (
          <EmptyState icon={<PackageSearch className="h-5 w-5" />} title="You haven't placed an order yet." message="Your first luwombo is one tap away." action={<Link href="/menu"><Button>Explore Menu</Button></Link>} />
        ) : (
          <ul className="space-y-3">
            {myOrders.slice(0, 4).map((o) => (
              <li key={o.id}>
                <Link href={`/order/${o.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-2xl border border-cocoa/10 bg-white p-4 shadow-card transition-shadow hover:shadow-soft">
                  <span className="font-mono text-sm font-extrabold text-brand-700">{o.order_number}</span>
                  <span className="text-sm text-cocoa/55">{fmtDate(o.created_at)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-cocoa/70">{o.items.map((i) => i.name).join(", ")}</span>
                  <Badge tone={["completed"].includes(o.status) ? "green" : o.status === "cancelled" ? "red" : "amber"}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                  <span className="font-extrabold">{fmtRWF(o.total)}</span>
                  <span className="hidden text-xs text-cocoa/40 sm:inline">{ORDER_TYPE_LABELS[o.type]}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Quick actions" className="grid gap-3 sm:grid-cols-3">
        <Link href="/menu?order=1" className="flex items-center justify-center gap-2 rounded-2xl bg-brand-600 p-4 font-bold text-white shadow-card hover:bg-brand-700"><Clock className="h-5 w-5" /> Reorder in a minute</Link>
        <Link href="/reservations" className="flex items-center justify-center gap-2 rounded-2xl bg-leaf-700 p-4 font-bold text-white shadow-card hover:bg-leaf-800"><CalendarDays className="h-5 w-5" /> Book a table</Link>
        <Link href="/menu" className="flex items-center justify-center gap-2 rounded-2xl bg-white p-4 font-bold ring-1 ring-cocoa/15 shadow-card hover:ring-brand-400"><Star className="h-5 w-5 text-brand-600" /> Discover new dishes</Link>
      </section>
    </div>
  );
}
