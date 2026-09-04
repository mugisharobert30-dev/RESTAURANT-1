"use client";

import Link from "next/link";
import { Clock, MapPin, ShieldCheck, Star } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useStoreData } from "@/hooks/use-store";
import { FoodImage } from "@/components/food-image";
import { fmtRWF } from "@/lib/format";

export function Hero() {
  const { t } = useLanguage();
  const menuItems = useStoreData((d) => d.menuItems);
  const settings = useStoreData((d) => d.settings);
  const stars = menuItems.filter((m) => m.featured && m.available).slice(0, 3);

  return (
    <section className="relative overflow-hidden bg-leaf-900">
      <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, #203C1D 10%, #25471F 45%, #783A0F 100%)" }} aria-hidden="true" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.07]" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <circle cx="15" cy="20" r="30" fill="#fff" />
        <circle cx="85" cy="80" r="35" fill="#fff" />
        <path d="M0 70 Q 30 50, 60 68 T 100 55" stroke="#fff" strokeWidth="2.5" fill="none" />
      </svg>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div className="animate-fadeUp text-center lg:text-left">
            <p className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-300 ring-1 ring-white/15 lg:mx-0">
              <MapPin className="h-3.5 w-3.5" /> Kimihurura · Kigali · Rwanda
            </p>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg lg:mx-0">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href="/menu?order=1" className="inline-flex h-13 min-h-[52px] items-center justify-center rounded-xl bg-brand-500 px-8 text-base font-extrabold text-white shadow-lg transition-all hover:bg-brand-400 active:scale-[.98]">
                {t("cta.orderNow")}
              </Link>
              <Link href="/reservations" className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-white/30 bg-white/10 px-8 text-base font-bold text-white backdrop-blur transition-colors hover:bg-white/20">
                {t("cta.reserve")}
              </Link>
            </div>
            <dl className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-white/70 lg:justify-start">
              <div className="flex items-center gap-2"><Star className="h-4 w-4 fill-brand-400 text-brand-400" /><strong className="text-white">4.8</strong> · 900+ guest ratings</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-brand-400" />{settings.opening_hours.mon.open}–{settings.opening_hours.sun.close} daily</div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-400" />MoMo · Airtel · Visa accepted</div>
            </dl>
          </div>

          <div className="relative hidden h-[420px] lg:block" aria-hidden="true">
            {stars[0] && (
              <div className="absolute right-40 top-2 w-64 animate-floaty overflow-hidden rounded-2xl bg-white shadow-xl">
                <FoodImage item={stars[0]} className="h-32 w-full" rounded="rounded-none" />
                <div className="p-3">
                  <p className="truncate text-sm font-bold">{stars[0].name}</p>
                  <p className="text-xs font-semibold text-brand-700">{fmtRWF(stars[0].price)}</p>
                </div>
              </div>
            )}
            {stars[1] && (
              <div className="absolute right-4 top-36 w-56 animate-floaty overflow-hidden rounded-2xl bg-white shadow-xl" style={{ animationDelay: "1.2s" }}>
                <FoodImage item={stars[1]} className="h-28 w-full" rounded="rounded-none" />
                <div className="p-3">
                  <p className="truncate text-sm font-bold">{stars[1].name}</p>
                  <p className="text-xs font-semibold text-brand-700">{fmtRWF(stars[1].price)}</p>
                </div>
              </div>
            )}
            {stars[2] && (
              <div className="absolute bottom-0 right-56 w-52 animate-floaty overflow-hidden rounded-2xl bg-white shadow-xl" style={{ animationDelay: "2s" }}>
                <FoodImage item={stars[2]} className="h-28 w-full" rounded="rounded-none" />
                <div className="p-3">
                  <p className="truncate text-sm font-bold">{stars[2].name}</p>
                  <p className="text-xs font-semibold text-brand-700">{fmtRWF(stars[2].price)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <svg className="absolute bottom-0 left-0 h-6 w-full text-cream" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 6 L100 6 L100 0 Q 50 8, 0 0 Z" fill="currentColor" />
      </svg>
    </section>
  );
}
