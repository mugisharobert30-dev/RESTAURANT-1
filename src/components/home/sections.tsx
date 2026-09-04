"use client";

import Link from "next/link";
import { ArrowRight, ChefHat, Bike, UtensilsCrossed, CalendarCheck } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { FoodCard } from "@/components/food-card";
import { SectionHeading } from "@/components/ui";

export function PopularDishes() {
  const menuItems = useStoreData((d) => d.menuItems);
  const favorites = useStoreData((d) => d.favorites);
  const favIds = new Set(favorites.map((f) => f.menu_item_id));
  const popular = [...menuItems]
    .filter((m) => m.available)
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.times_ordered - a.times_ordered)
    .slice(0, 6);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading eyebrow="Guest favorites" title="Most loved at Luwombo" subtitle="The plates our guests keep coming back for — slow-cooked, charcoal-kissed, unforgettable." />
        <Link href="/menu" className="group inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-800">
          View full menu
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {popular.map((item) => (
          <FoodCard key={item.id} item={item} isFavorite={favIds.has(item.id)} />
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { icon: UtensilsCrossed, title: "Pick your dishes", text: "Browse the live menu, customize portions and add favorites to your cart." },
  { icon: ChefHat, title: "We cook it fresh", text: "Our kitchen starts immediately — watch your order move in real time." },
  { icon: Bike, title: "Enjoy your way", text: "Delivery to your door, takeaway pickup, or dine with us on the terrace." },
];

export function HowItWorks() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading center eyebrow="Simple as 1–2–3" title="Ordering takes less than two minutes" subtitle="No account needed to order — though one saves your details for next time." />
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-cocoa/8 bg-cream p-6 text-center shadow-card">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-0.5 text-xs font-extrabold text-white">STEP {i + 1}</span>
              <div className="mx-auto mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-leaf-700 text-white shadow-sm">
                <s.icon className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-cocoa/60">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function PromoStrip() {
  const promotions = useStoreData((d) => d.promotions);
  const active = promotions.filter((p) => p.active);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="Happening now" title="Offers worth coming back for" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {active.map((p) => (
          <article key={p.id} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-leaf-800 p-6 text-white shadow-card">
            <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ring-white/25">{p.badge}</span>
            <h3 className="mt-4 font-display text-xl font-bold">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/85">{p.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ReservationCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-leaf-900 px-6 py-14 text-center text-white sm:px-12" style={{ background: "linear-gradient(115deg, #25471F, #203C1D 55%, #92450E)" }}>
        <CalendarCheck className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rotate-12 opacity-10" />
        <h2 className="font-display text-3xl font-bold sm:text-4xl">Planning a special evening?</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/75">
          Reserve the terrace at sunset, the garden under the trees, or our private Umurage Room for up to 12 guests.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/reservations" className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-white px-8 font-extrabold text-leaf-900 transition-transform active:scale-[.98]">Reserve a Table</Link>
          <a href={`tel:+250788123456`} className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-white/30 px-8 font-bold text-white hover:bg-white/10">Call us instead</a>
        </div>
      </div>
    </section>
  );
}
