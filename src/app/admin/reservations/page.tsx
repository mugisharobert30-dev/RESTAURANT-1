"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Search, Trash2, Ban } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { TABLE_AREA_LABELS, RESERVATION_STATUS_LABELS, type ReservationStatus } from "@/lib/types";
import { Badge, Button, ConfirmDialog } from "@/components/ui";
import { BulkSelectBar } from "@/components/admin/bulk-select";
import { cx } from "@/lib/format";

const STATUSES: ReservationStatus[] = ["pending", "confirmed", "seated", "completed", "cancelled", "no_show"];

export default function AdminReservationsPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const reservations = useStoreData((d) => d.reservations);
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().slice(0, 10));
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const days = useMemo(() => {
    const arr: string[] = [];
    for (let i = -1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      arr.push(d.toISOString().slice(0, 10));
    }
    return arr;
  }, []);

  const filtered = reservations
    .filter((r) => r.date === dateFilter)
    .filter((r) => !query || r.customer_name.toLowerCase().includes(query.toLowerCase()) || r.reservation_number.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.time_slot.localeCompare(b.time_slot));

  const totalGuests = filtered.filter((r) => !["cancelled", "no_show"].includes(r.status)).reduce((s, r) => s + r.party_size, 0);

  const visibleIds = filtered.map((r) => r.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const someSelected = visibleIds.some((id) => selected.includes(id));
  const toggleAll = () =>
    setSelected(allSelected ? selected.filter((id) => !visibleIds.includes(id)) : [...selected, ...visibleIds].filter((id, i, a) => a.indexOf(id) === i));
  const toggleOne = (id: string) => setSelected((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  const removeSelected = () => {
    store.mutate((d) => {
      d.reservations = d.reservations.filter((r) => !selected.includes(r.id));
    });
    toast(`Deleted ${selected.length} reservation${selected.length === 1 ? "" : "s"}.`);
    setSelected([]);
    setConfirmDelete(false);
  };

  const cancelSelected = () => {
    store.mutate((d) => {
      for (const id of selected) {
        const r = d.reservations.find((x) => x.id === id);
        if (r) r.status = "cancelled";
      }
    });
    toast(`Cancelled ${selected.length} reservation${selected.length === 1 ? "" : "s"}.`);
    setSelected([]);
    setConfirmCancel(false);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Reservations</h1>
          <p className="mt-1 text-sm text-cocoa/55">{filtered.length} bookings · {totalGuests} guests on {dateFilter}</p>
        </div>
        <label className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or reservation #…" className="h-10 w-full rounded-xl border border-cocoa/15 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50" type="search" />
        </label>
      </header>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {days.map((d) => {
          const count = reservations.filter((r) => r.date === d && !["cancelled"].includes(r.status)).length;
          return (
            <button key={d} onClick={() => setDateFilter(d)} aria-pressed={dateFilter === d}
              className={cx("flex h-16 w-[74px] shrink-0 flex-col items-center justify-center rounded-xl text-xs font-bold transition-colors",
                dateFilter === d ? "bg-brand-600 text-white" : "bg-white text-cocoa/60 ring-1 ring-cocoa/10 hover:text-cocoa")}>
              <CalendarDays className="mb-0.5 h-3.5 w-3.5 opacity-70" />
              {new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short" })}
              <span>{d.slice(5)}</span>
              {count > 0 && <span className={cx("mt-0.5 rounded-full px-1.5 text-[10px]", dateFilter === d ? "bg-white/25" : "bg-brand-100 text-brand-800")}>{count}</span>}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cocoa/20 bg-white p-12 text-center text-sm text-cocoa/45">
          No reservations for this day yet.
        </div>
      ) : (
        <>
          <BulkSelectBar allSelected={allSelected} someSelected={someSelected} count={selected.length} total={filtered.length} onToggleAll={toggleAll} label="reservations">
            <Button variant="outline" size="sm" onClick={() => setConfirmCancel(true)} disabled={selected.length === 0} className="text-red-600 hover:border-red-300 hover:text-red-700">
              <Ban className="h-3.5 w-3.5" /> Cancel ({selected.length})
            </Button>
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)} disabled={selected.length === 0}>
              <Trash2 className="h-3.5 w-3.5" /> Delete ({selected.length})
            </Button>
          </BulkSelectBar>
          <ul className="grid gap-3 lg:grid-cols-2">
            {filtered.map((r) => (
              <li key={r.id} className={`rounded-2xl border bg-white p-4 shadow-card ${selected.includes(r.id) ? "border-brand-500 ring-1 ring-brand-300" : "border-cocoa/10"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-bold">{r.time_slot} · {r.customer_name}</p>
                    <p className="text-sm text-cocoa/55">{r.party_size} guests · {TABLE_AREA_LABELS[r.area]}{r.occasion ? ` · ${r.occasion}` : ""}</p>
                    <p className="mt-1 font-mono text-xs text-brand-700">{r.reservation_number}</p>
                    {r.special_requests && <p className="mt-2 rounded-lg bg-stone-50 px-3 py-1.5 text-xs italic text-cocoa/60">“{r.special_requests}”</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2 py-1">
                    <Badge tone={r.status === "confirmed" ? "green" : r.status === "pending" ? "amber" : r.status === "seated" ? "blue" : r.status === "cancelled" ? "red" : "neutral"}>
                      {RESERVATION_STATUS_LABELS[r.status]}
                    </Badge>
                    <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleOne(r.id)} aria-label={`Select ${r.reservation_number}`} className="h-4 w-4 rounded accent-brand-600" />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-cocoa/8 pt-3">
                  {STATUSES.filter((s) => s !== r.status).map((s) => (
                    <button key={s} onClick={() => {
                      store.mutate((d) => {
                        const rr = d.reservations.find((x) => x.id === r.id);
                        if (rr) rr.status = s;
                      });
                      toast(`${r.reservation_number} → ${RESERVATION_STATUS_LABELS[s]} (${auth.profile?.full_name})`);
                    }}
                      className={cx("rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize ring-1 transition-colors hover:bg-stone-50", s === "cancelled" ? "text-red-600 ring-red-200" : "text-cocoa/60 ring-cocoa/15")}>
                      {s.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${selected.length} reservation${selected.length === 1 ? "" : "s"}?`}
        message="The selected bookings are permanently removed from the dashboard."
        confirmLabel="Delete reservations"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={removeSelected}
      />

      <ConfirmDialog
        open={confirmCancel}
        title={`Cancel ${selected.length} reservation${selected.length === 1 ? "" : "s"}?`}
        message="The selected bookings will be marked as cancelled and their tables freed up."
        confirmLabel="Cancel reservations"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={cancelSelected}
      />
    </div>
  );
}
