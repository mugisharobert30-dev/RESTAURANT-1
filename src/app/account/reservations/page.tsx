"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useStoreData } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { RESERVATION_STATUS_LABELS, TABLE_AREA_LABELS, type ReservationStatus } from "@/lib/types";
import { Badge, Button, ConfirmDialog, EmptyState } from "@/components/ui";

export default function AccountReservationsPage() {
  const auth = useAuth();
  const reservations = useStoreData((d) => d.reservations);
  const mine = reservations
    .filter((r) => r.customer_id === auth.profile?.id)
    .sort((a, b) => (b.date + b.time_slot).localeCompare(a.date + a.time_slot));

  const todayIso = new Date().toISOString().slice(0, 10);
  const upcoming = mine.filter((r) => !["cancelled", "completed", "no_show"].includes(r.status) && r.date >= todayIso);
  const past = mine.filter((r) => !upcoming.includes(r));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold">Reservations</h1>
        <p className="mt-1 text-sm text-cocoa/60">Free cancellation or modification up to 2 hours before your booking.</p>
      </header>

      <section aria-label="Upcoming reservations">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-cocoa/45">Upcoming</h2>
        {upcoming.length === 0 ? (
          <EmptyState icon={<CalendarDays className="h-5 w-5" />} title="You don't have any upcoming reservations." message="The terrace is lovely this time of year." action={<Link href="/reservations"><Button>Reserve a Table</Button></Link>} />
        ) : (
          <ul className="space-y-3">
            {upcoming.map((r) => (
              <li key={r.id} className="rounded-2xl border border-cocoa/10 bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{new Date(`${r.date}T${r.time_slot}:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} at {r.time_slot}</p>
                    <p className="mt-0.5 text-sm text-cocoa/55">{r.party_size} guests · {TABLE_AREA_LABELS[r.area]}{r.occasion ? ` · ${r.occasion}` : ""}</p>
                    <p className="mt-0.5 font-mono text-xs text-brand-700">{r.reservation_number}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={r.status === "confirmed" ? "green" : "amber"}>{RESERVATION_STATUS_LABELS[r.status]}</Badge>
                    <Button size="sm" variant="outline" onClick={() => {
                      const newTime = window.prompt("New time (e.g., 19:30):", r.time_slot);
                      if (newTime && /^\d{2}:\d{2}$/.test(newTime)) {
                        store.mutate((d) => {
                          const rr = d.reservations.find((x) => x.id === r.id);
                          if (rr) rr.time_slot = newTime;
                        });
                      }
                    }}>Modify</Button>
                    <ConfirmCancel reservationId={r.id} />
                  </div>
                </div>
                {r.special_requests && <p className="mt-2 rounded-lg bg-stone-50 px-3 py-2 text-xs italic text-cocoa/60">“{r.special_requests}”</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Past reservations">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-cocoa/45">Past</h2>
        {past.length === 0 ? (
          <p className="text-sm text-cocoa/50">Your dining history will appear here after your first visit.</p>
        ) : (
          <ul className="space-y-2">
            {past.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cocoa/8 bg-white px-4 py-3 text-sm shadow-card">
                <span className="font-semibold">{r.date} · {r.time_slot}</span>
                <span className="text-cocoa/55">{r.party_size} guests · {TABLE_AREA_LABELS[r.area]}</span>
                <span className="font-mono text-xs text-cocoa/40">{r.reservation_number}</span>
                <Badge tone={r.status === "completed" || r.status === "seated" ? "green" : "neutral"}>{RESERVATION_STATUS_LABELS[r.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ConfirmCancel({ reservationId }: { reservationId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="ghost" className="!text-red-600 hover:!bg-red-50" onClick={() => setOpen(true)}>Cancel booking</Button>
      <ConfirmDialog
        open={open}
        title="Cancel this reservation?"
        message="Your table will be released for other guests. You can always book again — no fees involved."
        confirmLabel="Yes, cancel it"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          store.mutate((d) => {
            const r = d.reservations.find((x) => x.id === reservationId);
            if (r) r.status = "cancelled" as ReservationStatus;
          });
          setOpen(false);
        }}
      />
    </>
  );
}
