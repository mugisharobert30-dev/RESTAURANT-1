"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { fmtRWF } from "@/lib/format";
import { ORDER_TYPE_LABELS } from "@/lib/types";
import { Card, StatCard } from "@/components/ui";

const PIE_COLORS = ["#D9710B", "#35702B", "#2C6E8F", "#8F5A2C", "#7C3AED"];

export default function AdminAnalyticsPage() {
  const orders = useStoreData((d) => d.orders);
  const menuItems = useStoreData((d) => d.menuItems);
  const categories = useStoreData((d) => d.categories);
  const [rangeDays, setRangeDays] = useState(30);

  const stats = useMemo(() => {
    const since = new Date(Date.now() - rangeDays * 86400000).toISOString();
    const scoped = orders.filter((o) => o.created_at >= since && o.status !== "cancelled");

    const byDay = new Map<string, { revenue: number; orders: number }>();
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      byDay.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
    }
    scoped.forEach((o) => {
      const key = o.created_at.slice(0, 10);
      const entry = byDay.get(key);
      if (entry) {
        entry.revenue += o.total;
        entry.orders += 1;
      }
    });
    const daily = Array.from(byDay.entries()).map(([date, v]) => ({
      date: new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      revenue: v.revenue,
      orders: v.orders,
    }));

    const typeCounts = new Map<string, number>();
    scoped.forEach((o) => typeCounts.set(o.type, (typeCounts.get(o.type) ?? 0) + 1));
    const byType = Array.from(typeCounts.entries()).map(([type, count]) => ({ name: ORDER_TYPE_LABELS[type as keyof typeof ORDER_TYPE_LABELS] ?? type, value: count }));

    const itemRevenue = new Map<string, { qty: number; revenue: number }>();
    scoped.forEach((o) =>
      o.items.forEach((oi) => {
        const cur = itemRevenue.get(oi.menu_item_id) ?? { qty: 0, revenue: 0 };
        cur.qty += oi.quantity;
        cur.revenue += oi.unit_price * oi.quantity;
        itemRevenue.set(oi.menu_item_id, cur);
      })
    );
    const topItems = Array.from(itemRevenue.entries())
      .map(([id, v]) => ({ name: menuItems.find((m) => m.id === id)?.name ?? id, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    const catQty = new Map<string, number>();
    scoped.forEach((o) =>
      o.items.forEach((oi) => {
        const item = menuItems.find((m) => m.id === oi.menu_item_id);
        if (!item) return;
        catQty.set(item.category_id, (catQty.get(item.category_id) ?? 0) + oi.quantity);
      })
    );
    const byCategory = Array.from(catQty.entries()).map(([id, value]) => ({
      name: categories.find((c) => c.id === id)?.name ?? "Other",
      value,
    }));

    const revenue = scoped.reduce((s, o) => s + o.total, 0);
    const activeCustomers = Array.from(new Set(scoped.map((o) => o.customer_id)));
    const repeat = activeCustomers.filter((id) => scoped.filter((o) => o.customer_id === id).length > 1).length;

    return {
      daily,
      byType,
      byCategory,
      topItems,
      revenue,
      orderCount: scoped.length,
      aov: scoped.length ? Math.round(revenue / scoped.length) : 0,
      repeatRate: activeCustomers.length ? Math.round((repeat / activeCustomers.length) * 100) : 0,
    };
  }, [orders, menuItems, categories, rangeDays]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Analytics</h1>
          <p className="mt-1 text-sm text-cocoa/55">Business performance across the last {rangeDays} days.</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-cocoa/10">
          {[7, 30, 90].map((r) => (
            <button key={r} onClick={() => setRangeDays(r)} aria-pressed={rangeDays === r}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${rangeDays === r ? "bg-brand-600 text-white" : "text-cocoa/55 hover:bg-stone-50"}`}>
              {r} days
            </button>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={fmtRWF(stats.revenue)} icon={<TrendingUp className="h-5 w-5" />} tone="leaf" />
        <StatCard label="Orders" value={stats.orderCount} tone="sky" />
        <StatCard label="Avg order value" value={fmtRWF(stats.aov)} tone="brand" />
        <StatCard label="Repeat rate" value={`${stats.repeatRate}%`} sub="of active guests reordered" tone="brand" />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-lg font-bold">Daily revenue</h2>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.daily} margin={{ left: -12, right: 6 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D9710B" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#D9710B" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#241a1220" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.floor(stats.daily.length / 7)} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v / 1000}k`} tickLine={false} axisLine={false} />
                <RTooltip formatter={(v) => fmtRWF(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid #e7e0d5" }} />
                <Area type="monotone" dataKey="revenue" stroke="#D9710B" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-lg font-bold">Orders per day</h2>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.daily} margin={{ left: -18, right: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#241a1220" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.floor(stats.daily.length / 7)} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid #e7e0d5" }} />
                <Bar dataKey="orders" fill="#2C6E8F" radius={[6, 6, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-lg font-bold">Order channels</h2>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.byType} dataKey="value" nameKey="name" innerRadius={52} outerRadius={86} paddingAngle={3}>
                  {stats.byType.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <RTooltip contentStyle={{ borderRadius: 12, border: "1px solid #e7e0d5" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-lg font-bold">Best sellers by revenue</h2>
          <ul className="mt-3 space-y-2.5">
            {stats.topItems.map((t, i) => (
              <li key={t.name}>
                <p className="flex justify-between text-sm font-semibold">
                  <span><span className="mr-1.5 text-cocoa/35">{i + 1}.</span>{t.name}</span>
                  <span>{fmtRWF(t.revenue)}</span>
                </p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-leaf-600" style={{ width: `${(t.revenue / stats.topItems[0].revenue) * 100}%` }} />
                </div>
                <p className="mt-0.5 text-[11px] text-cocoa/40">{t.qty} plates sold</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
