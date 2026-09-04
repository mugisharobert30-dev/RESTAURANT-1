"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Clock, Users } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { getAvailableSlots, createReservation } from "@/lib/db";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { TABLE_AREA_LABELS, type Reservation, type TableArea } from "@/lib/types";
import { Button, Input, Select, Textarea, Skeleton } from "@/components/ui";
import { cx } from "@/lib/format";

const OCCASIONS = ["Just dining", "Birthday", "Date night", "Business lunch", "Anniversary", "Family gathering"];

export default function ReservationsPage() {
  const settings = useStoreData((d) => d.settings);
  const auth = useAuth();
  const { toast } = useToast();

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [partySize, setPartySize] = useState(2);
  const [area, setArea] = useState<TableArea>("main_hall");
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slot, setSlot] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [requests, setRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Reservation | null>(null);

  useEffect(() => {
    if (auth.profile) {
      setName((n) => n || auth.profile!.full_name);
      setPhone((p) => p || auth.profile!.phone);
    }
  }, [auth.profile]);

  useEffect(() => {
    let active = true;
    setSlots(null);
    setSlot("");
    void getAvailableSlots(date, partySize).then((s) => {
      if (!active) return;
      setSlots(s);
      setSlot(s[0] ?? "");
    });
    return () => {
      active = false;
    };
  }, [date, partySize]);

  const submit = async () => {
    if (!name.trim() || !phone.trim() || !slot) {
      toast("Please fill your name, phone and pick a time.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createReservation({
        customer_name: name,
        customer_phone: phone,
        customer_email: auth.profile?.email,
        date,
        time_slot: slot,
        party_size: partySize,
        area,
        occasion,
        special_requests: requests || undefined,
        customer: auth.profile,
      });
      setConfirmed(res);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-3xl border border-cocoa/10 bg-white p-10 shadow-card animate-fadeUp">
          <CheckCircle2 className="mx-auto h-16 w-16 text-leaf-600" />
          <h1 className="mt-4 font-display text-3xl font-extrabold">Table reserved!</h1>
          <p className="mt-2 text-cocoa/60">Your confirmation number is</p>
          <p className="my-2 font-display text-4xl font-extrabold tracking-wide text-brand-700">{confirmed.reservation_number}</p>
          <dl className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-x-4 gap-y-2 text-left text-sm">
            <dt className="text-cocoa/50">Date</dt><dd className="font-bold">{confirmed.date}</dd>
            <dt className="text-cocoa/50">Time</dt><dd className="font-bold">{confirmed.time_slot}</dd>
            <dt className="text-cocoa/50">Guests</dt><dd className="font-bold">{confirmed.party_size}</dd>
            <dt className="text-cocoa/50">Area</dt><dd className="font-bold">{TABLE_AREA_LABELS[confirmed.area]}</dd>
          </dl>
          <p className="mt-5 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900">
            We have sent a confirmation to your notifications. Need to change plans? You can modify or cancel free up to 2 hours before.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            {auth.profile ? (
              <Link href="/account/reservations"><Button size="lg">Manage my reservations</Button></Link>
            ) : (
              <Link href="/menu?order=1"><Button size="lg">Pre-order dishes</Button></Link>
            )}
            <Button variant="outline" size="lg" onClick={() => setConfirmed(null)}>Make another booking</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl font-extrabold">Reserve a Table</h1>
        <p className="mt-2 text-cocoa/60">
          Pick a time that suits you — we will confirm instantly. For parties larger than {settings.max_party_online}, please call {settings.phone}.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="mt-8 space-y-8"
      >
        <section aria-label="When and how many" className="grid gap-5 sm:grid-cols-[1fr_auto]">
          <div className="space-y-4 rounded-2xl border border-cocoa/10 bg-white p-5 shadow-card">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-bold"><CalendarDays className="h-4 w-4 text-brand-600" /> Date</span>
              <input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 w-full rounded-xl border border-cocoa/15 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/60"
              />
            </label>

            <div>
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-bold"><Users className="h-4 w-4 text-brand-600" /> Guests</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPartySize(n)}
                    aria-pressed={partySize === n}
                    className={cx("h-11 w-11 rounded-xl text-sm font-extrabold transition-colors", partySize === n ? "bg-brand-600 text-white" : "bg-stone-100 text-cocoa/60 hover:bg-brand-100")}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPartySize(8)}
                  aria-pressed={partySize === 8}
                  className={cx("h-11 rounded-xl px-3 text-sm font-extrabold transition-colors", partySize === 8 ? "bg-brand-600 text-white" : "bg-stone-100 text-cocoa/60 hover:bg-brand-100")}
                >
                  7+
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-cocoa/10 bg-white p-5 shadow-card sm:w-64">
            <span className="mb-2 block text-sm font-bold">Where would you like to sit?</span>
            <ul className="space-y-2">
              {(Object.keys(TABLE_AREA_LABELS) as TableArea[]).map((a) => (
                <li key={a}>
                  <button
                    type="button"
                    onClick={() => setArea(a)}
                    aria-pressed={area === a}
                    className={cx("w-full rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition-all", area === a ? "border-brand-600 bg-brand-50 text-brand-800" : "border-cocoa/10 hover:border-brand-300")}
                  >
                    {TABLE_AREA_LABELS[a]}
                    <span className="block text-xs font-normal text-cocoa/50">
                      {{ main_hall: "Indoor classic", terrace: "Open air, sunset", garden: "Under the trees", private: "Umurage Room · up to 12" }[a]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-label="Available times" className="rounded-2xl border border-cocoa/10 bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-1.5 text-sm font-bold"><Clock className="h-4 w-4 text-brand-600" /> Available times for {date}</h2>
          {slots === null ? (
            <div className="mt-3 flex flex-wrap gap-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-20" />)}</div>
          ) : slots.length === 0 ? (
            <p className="mt-3 rounded-xl bg-stone-100 px-4 py-3 text-sm text-cocoa/60">
              No online slots left for this date and party size. Call us at {settings.phone} — we often squeeze guests in.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  aria-pressed={slot === s}
                  className={cx("h-10 rounded-xl px-4 text-sm font-bold transition-colors", slot === s ? "bg-brand-600 text-white shadow-sm" : "bg-stone-100 text-cocoa/70 hover:bg-brand-100")}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </section>

        <section aria-label="Contact details" className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name *" name="resName" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Chantal Uwase" required />
          <Input label="Phone number *" name="resPhone" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 788 123 456" required />
        </section>

        <section className="space-y-4">
          <div>
            <span className="mb-2 block text-sm font-medium">Is this a special occasion?</span>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((o) => (
                <button key={o} type="button" onClick={() => setOccasion(o)} aria-pressed={occasion === o}
                  className={cx("rounded-full px-4 py-1.5 text-xs font-semibold ring-1 transition-colors", occasion === o ? "bg-leaf-700 text-white ring-leaf-700" : "bg-white text-cocoa/70 ring-cocoa/15 hover:ring-brand-400")}>
                  {o}
                </button>
              ))}
            </div>
          </div>
          <Textarea label="Special requests (optional)" name="resRequests" value={requests} onChange={(e) => setRequests(e.target.value)} placeholder="High chair needed, birthday cake at 21:00, quiet corner…" />
        </section>

        <Button type="submit" size="lg" loading={submitting} disabled={!slot} className="w-full sm:w-auto">
          Confirm reservation{slot && ` at ${slot}`}
        </Button>
      </form>
    </div>
  );
}
