"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle, CalendarDays, ChefHat, Clock, DollarSign, PackageSearch,
  ShoppingBag, Star, TrendingUp, UsersRound,
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useStoreData } from "@/hooks/use-store";
import { Card, StatCard } from "@/components/ui";
import { fmtNum, fmtRWF, timeAgo } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/types";

export default function AdminDashboard() {
  const orders = useStoreData((d) => d.orders);
  const reservations = useStoreData((d) => d.reservations);
  const customers = useStoreData((d) => d.profiles);
  const menuItems = useStoreData((d) => d.menuItems);
  const reviews = useStoreData((d) => d.reviews);
  const inventory = useStoreData((d) => d.inventory);

  const [todayLabel, setTodayLabel] = useState("");
  useEffect(() => {
    setTodayLabel(new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  }, []);

  const todayIso = new Date().toISOString().slice(0, 10);
  const todaysOrders = orders.filter((o) => o.created_at.slice(0, 10) === todayIso && o.status !== "cancelled");
  const todaySales = todaysOrders.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => ["received", "confirmed"].includes(o.status)).length;
  const completed = orders.filter((o) => o.status === "completed").length;
  const todayReservations = reservations.filter((r) => r.date === todayIso && r.status !== "cancelled");
  const customerCount = customers.filter((p) => p.role === "customer").length;
  const lowStock = inventory.filter((i) => i.current_stock < i.min_stock);
  const avgOrderValue = todaysOrders.length ? Math.round(todaySales / todaysOrders.length) : 0;

  const revenueByDay: Array<{ day: string; revenue: number; orders: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const isoDay = day.toISOString().slice(0, 10);
    const dayOrders = orders.filter((o) => o.created_at.slice(0, 10) === isoDay && o.status !== "cancelled");
    revenueByDay.push({
      day: day.toLocaleDateString("en-GB", { weekday: "short" }),
      revenue: dayOrders.reduce((s, o) => s + o.total, 0),
      orders: dayOrders.length,
    });
  }

  const popularItems = [...menuItems].sort((a, b) => b.times_ordered - a.times_ordered).slice(0, 5);
  const maxOrdered = popularItems[0]?.times_ordered || 1;
  const recentReviews = reviews.slice(0, 4);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Dashboard</h1>
          <p className="mt-1 text-sm text-cocoa/55">
            {todayLabel && <>{todayLabel} · Karibu, here is your restaurant at a glance.</>}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/kitchen" className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700"><ChefHat className="h-4 w-4" /> Kitchen</Link>
          <Link href="/admin/orders" className="inline-flex h-10 items-center gap-2 rounded-xl border border-cocoa/15 bg-white px-4 text-sm font-bold hover:border-brand-400">All orders</Link>
        </div>
      </header>

      {lowStock.length > 0 && (
        <Link href="/admin/inventory" className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 ring-1 ring-red-200 transition-colors hover:bg-red-100">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm font-semibold text-red-800">
            {lowStock.length} ingredient{lowStock.length > 1 ? "s" : ""} below minimum ({lowStock.map((i) => i.name).join(", ")}) — reorder from supplier.
          </p>
          <span className="ml-auto font-bold text-sm text-red-700 underline">Review stock →</span>
        </Link>
      )}

      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Today's sales" value={fmtRWF(todaySales)} sub={`${todaysOrders.length} orders`} icon={<DollarSign className="h-5 w-5" />} tone="leaf" />
        <StatCard label="Pending orders" value={pending} sub="Need action now" icon={<Clock className="h-5 w-5" />} tone={pending > 0 ? "red" : "brand"} />
        <StatCard label="Completed orders" value={completed} sub="All time" icon={<ShoppingBag className="h-5 w-5" />} tone="sky" />
        <StatCard label="Avg order value" value={fmtRWF(avgOrderValue)} sub="Today" icon={<TrendingUp className="h-5 w-5" />} tone="brand" />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Revenue — last 14 days</h2>
            <span className="rounded-lg bg-stone-100 px-2 py-1 text-xs font-bold text-cocoa/60">RWF</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByDay} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#35702B" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#35702B" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [fmtRWF(Number(v)), "Revenue"]} contentStyle={{ borderRadius: 12, border: "1px solid #e7e5e4", fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#35702B" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-1 font-display text-lg font-bold">Popular meals</h2>
          <ul className="mt-4 space-y-4">
            {popularItems.map((m) => (
              <li key={m.id}>
                <div className="flex justify-between text-sm">
                  <span className="truncate pr-2 font-semibold">{m.name}</span>
                  <span className="shrink-0 text-cocoa/50">{fmtNum(m.times_ordered)}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700" style={{ width: `${(m.times_ordered / maxOrdered) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5">
          <h2 className="font-display text-lg font-bold">Orders per day</h2>
          <div className="mt-3 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByDay} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [String(v), "Orders"]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="orders" fill="#D9710B" radius={[6, 6, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Today&apos;s reservations</h2>
            <Link href="/admin/reservations" className="text-xs font-bold text-brand-700 hover:underline">Manage →</Link>
          </div>
          <p className="mt-1 flex items-center gap-2 text-sm text-cocoa/55"><CalendarDays className="h-4 w-4" />{todayReservations.length} bookings · {todayReservations.reduce((s, r) => s + r.party_size, 0)} guests expected</p>
          <ul className="mt-3 space-y-2">
            {todayReservations.length === 0 && <li className="text-sm text-cocoa/40">No reservations for today.</li>}
            {todayReservations.slice(0, 4).map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm">
                <span className="font-semibold">{r.time_slot} · {r.customer_name}</span>
                <span className="text-cocoa/50">{r.party_size} pax</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Latest reviews</h2>
            <Link href="/admin/reviews" className="text-xs font-bold text-brand-700 hover:underline">See all →</Link>
          </div>
          <ul className="mt-3 space-y-3">
            {recentReviews.map((r) => (
              <li key={r.id} className="rounded-xl bg-stone-50 px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-xs font-bold">
                  <Star className="h-3.5 w-3.5 fill-brand-500 text-brand-500" />{r.rating} · {r.customer_name}
                  <span className="ml-auto font-normal text-cocoa/40">{timeAgo(r.created_at)}</span>
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-cocoa/65">{r.comment}</p>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <MiniStat label="Customers" value={customerCount} icon={<UsersRound className="h-4 w-4" />} href="/admin/customers" />
        <MiniStat label="Menu items" value={menuItems.length} icon={<ShoppingBag className="h-4 w-4" />} href="/admin/menu" />
        <MiniStat label="Low-stock alerts" value={lowStock.length} icon={<PackageSearch className="h-4 w-4" />} href="/admin/inventory" />
        <MiniStat label="Live orders" value={orders.filter((o) => ["received", "confirmed", "preparing"].includes(o.status)).length} icon={<ChefHat className="h-4 w-4" />} href="/admin/kitchen" />
        <MiniStat label="Newest status" value={ORDER_STATUS_LABELS[orders[0]?.status ?? "completed"].split(" ")[0]} icon={<Clock className="h-4 w-4" />} href="/admin/orders" />
      </section>
    </div>
  );
}

function MiniStat({ label, value, icon, href }: { label: string; value: number | string; icon: React.ReactNode; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl border border-cocoa/8 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
      <span>
        <span className="block text-lg font-extrabold leading-tight">{value}</span>
        <span className="block text-[11px] font-medium uppercase tracking-wide text-cocoa/45">{label}</span>
      </span>
    </Link>
  );
}
