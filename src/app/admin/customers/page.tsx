"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Search, Trash2, UsersRound } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { logAudit } from "@/lib/db";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { fmtDate, initials } from "@/lib/format";
import { Badge, Button, ConfirmDialog } from "@/components/ui";

export default function AdminCustomersPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const profiles = useStoreData((d) => d.profiles);
  const orders = useStoreData((d) => d.orders);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const customers = useMemo(() =>
    profiles
      .filter((p) => p.role === "customer")
      .filter((p) => !query || p.full_name.toLowerCase().includes(query.toLowerCase()) || p.email.toLowerCase().includes(query.toLowerCase()) || p.phone.includes(query))
      .map((p) => {
        const myOrders = orders.filter((o) => o.customer_id === p.id && o.status !== "cancelled");
        return {
          ...p,
          orderCount: myOrders.length,
          totalSpent: myOrders.reduce((s, o) => s + o.total, 0),
          lastOrder: myOrders.sort((a, b) => b.created_at.localeCompare(a.created_at))[0],
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent),
    [profiles, orders, query]);

  const visibleIds = customers.map((c) => c.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const someSelected = visibleIds.some((id) => selected.includes(id));

  const toggleAll = () => {
    setSelected(allSelected ? selected.filter((id) => !visibleIds.includes(id)) : [...selected, ...visibleIds].filter((id, i, a) => a.indexOf(id) === i));
  };

  const toggleOne = (id: string) => {
    setSelected((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  };

  const removeSelected = () => {
    store.mutate((d) => {
      d.profiles = d.profiles.filter((p) => !selected.includes(p.id));
    });
    logAudit(auth.profile!.full_name, "Deleted customer accounts", "Profile", "", `${selected.length} account(s)`);
    toast(`Removed ${selected.length} customer account${selected.length === 1 ? "" : "s"}.`);
    setSelected([]);
    setConfirmDelete(false);
  };

  const handleRefresh = async () => {
    const before = profiles.length;
    const count = await store.refreshProfiles(setRefreshing);
    if (count > before) toast(`Found ${count - before} new customer${count - before === 1 ? "" : "s"}.`);
    else if (count > 0) toast("Customer list is up to date.");
    else toast("No customer data available to refresh.", "info");
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Customers</h1>
          <p className="mt-1 text-sm text-cocoa/55">{customers.length} registered guests · ranked by lifetime value</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa/40" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, email or phone…" type="search" className="h-10 w-full rounded-xl border border-cocoa/15 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
          </label>
          <Button variant="outline" onClick={() => void handleRefresh()} loading={refreshing} title="Fetch the latest customers from the database">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button variant="danger" onClick={() => selected.length > 0 && setConfirmDelete(true)} disabled={selected.length === 0}>
            <Trash2 className="h-4 w-4" /> Delete ({selected.length})
          </Button>
        </div>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-cocoa/10 bg-white shadow-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-cocoa/10 bg-stone-50 text-xs uppercase tracking-wide text-cocoa/45">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }} onChange={toggleAll} aria-label="Select all customers" className="h-4 w-4 rounded accent-brand-600" />
              </th>
              <th className="px-4 py-3 font-bold">Customer</th>
              <th className="px-4 py-3 font-bold">Contact</th>
              <th className="px-4 py-3 font-bold">Orders</th>
              <th className="px-4 py-3 font-bold">Total spent</th>
              <th className="px-4 py-3 font-bold">Member since</th>
              <th className="px-4 py-3 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cocoa/6">
            {customers.map((c) => (
              <tr key={c.id} className={selected.includes(c.id) ? "bg-brand-50/50" : "hover:bg-stone-50/60"}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleOne(c.id)} aria-label={`Select ${c.full_name}`} className="h-4 w-4 rounded accent-brand-600" />
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-leaf-100 text-xs font-bold text-leaf-800">{initials(c.full_name)}</span>
                    <span className="font-semibold">{c.full_name}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-cocoa/60"><p>{c.email}</p><p>{c.phone}</p></td>
                <td className="px-4 py-3 font-bold">{c.orderCount}{c.lastOrder && <p className="text-xs font-normal text-cocoa/40">last {fmtDate(c.lastOrder.created_at)}</p>}</td>
                <td className="px-4 py-3 font-extrabold">{c.totalSpent.toLocaleString()} RWF</td>
                <td className="px-4 py-3 text-cocoa/60">{fmtDate(c.created_at)}</td>
                <td className="px-4 py-3">
                  <Badge tone={c.active ? "green" : "red"}>{c.active ? "Active" : "Disabled"}</Badge>
                  {c.totalSpent > 30000 && <Badge tone="amber">VIP</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {customers.length === 0 && (
        <div className="rounded-2xl border border-dashed border-cocoa/20 bg-white p-12 text-center text-sm text-cocoa/45">
          <UsersRound className="mx-auto mb-2 h-8 w-8 text-cocoa/30" />
          No customers match your search.
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${selected.length} customer account${selected.length === 1 ? "" : "s"}?`}
        message="Removing accounts clears their profile from the dashboard. It does not delete their order history. This cannot be undone."
        confirmLabel="Delete accounts"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={removeSelected}
      />
    </div>
  );
}

