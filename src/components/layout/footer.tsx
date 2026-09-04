"use client";

import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Logo } from "./header";
import { useStoreData } from "@/hooks/use-store";
import { useLanguage } from "@/context/language-context";

function formatHours(opening_hours: Record<string, { open: string; close: string; closed?: boolean }>) {
  const weekday = `${opening_hours.mon?.open} – ${opening_hours.mon?.close}`;
  const sat = `${opening_hours.sat?.open} – ${opening_hours.sat?.close}`;
  const sun = opening_hours.sun?.closed ? "Closed" : `${opening_hours.sun?.open} – ${opening_hours.sun?.close}`;
  return { weekday, sat, sun };
}

export function Footer() {
  const settings = useStoreData((d) => d.settings);
  const { t } = useLanguage();
  const { weekday, sat, sun } = formatHours(settings.opening_hours);

  return (
    <footer className="mt-16 border-t border-cocoa/10 bg-cocoa text-stone-300">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-16">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="[&_span]:text-white [&_span]:opacity-90">
              <Logo />
            </div>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-stone-500">
              Authentic Rwandan hospitality and cuisine in the heart of Kimihurura.
            </p>
            <div className="mt-4 flex gap-2">
              <a href={settings.socials.instagram} aria-label="Instagram" target="_blank" rel="noreferrer" className="group flex h-8 w-8 items-center justify-center rounded-lg bg-white/8 text-stone-500 transition-all hover:bg-gradient-to-br hover:from-pink-500 hover:to-orange-400 hover:text-white"><Instagram className="h-3.5 w-3.5 transition-transform group-hover:scale-110" /></a>
              <a href={settings.socials.facebook} aria-label="Facebook" target="_blank" rel="noreferrer" className="group flex h-8 w-8 items-center justify-center rounded-lg bg-white/8 text-stone-500 transition-all hover:bg-[#1877F2] hover:text-white"><Facebook className="h-3.5 w-3.5 transition-transform group-hover:scale-110" /></a>
              <a href={`https://wa.me/${settings.whatsapp}`} aria-label="WhatsApp" target="_blank" rel="noreferrer" className="group flex h-8 w-8 items-center justify-center rounded-lg bg-white/8 text-stone-500 transition-all hover:bg-[#25D366] hover:text-white"><MessageCircle className="h-3.5 w-3.5 transition-transform group-hover:scale-110" /></a>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-400">{t("footer.hoursTitle")}</h3>
            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex items-baseline gap-1.5"><span className="text-stone-400 whitespace-nowrap">Mon – Fri</span><span className="text-stone-300"> : </span><span className="text-stone-300 whitespace-nowrap">{weekday}</span></div>
              <div className="flex items-baseline gap-1.5"><span className="text-stone-400 whitespace-nowrap">Saturday</span><span className="text-stone-300"> : </span><span className="text-stone-300 whitespace-nowrap">{sat}</span></div>
              <div className="flex items-baseline gap-1.5"><span className="text-stone-400 whitespace-nowrap">Sunday</span><span className="text-stone-300"> : </span><span className="text-stone-300 whitespace-nowrap">{sun}</span></div>
            </div>
            <p className="mt-2 text-[10px] text-stone-600">Kitchen closes 45 min before closing.</p>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-400">{t("footer.explore")}</h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <li><Link href="/menu" className="text-stone-400 hover:text-white transition-colors">{t("nav.menu")}</Link></li>
              <li><Link href="/gallery" className="text-stone-400 hover:text-white transition-colors">Gallery</Link></li>
              <li><Link href="/reservations" className="text-stone-400 hover:text-white transition-colors">{t("nav.reservations")}</Link></li>
              <li><Link href="/about" className="text-stone-400 hover:text-white transition-colors">Our story</Link></li>
              <li><Link href="/faq" className="text-stone-400 hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/account" className="text-stone-400 hover:text-white transition-colors">{t("nav.account")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-400">{t("footer.support")}</h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li className="flex items-start gap-2"><MapPin className="mt-px h-3 w-3 shrink-0 text-brand-400" /><span className="text-stone-400">{settings.address}, {settings.district}</span></li>
              <li className="flex items-start gap-2"><Phone className="mt-px h-3 w-3 shrink-0 text-brand-400" /><span className="text-stone-400">{settings.phone}</span></li>
              <li className="flex items-start gap-2"><Mail className="mt-px h-3 w-3 shrink-0 text-brand-400" /><span className="text-stone-400">{settings.email}</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-[11px] text-stone-600 sm:flex-row sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Luwombo Restaurant. {t("footer.rights")}</p>
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-white/5 px-1.5 py-0.5 font-medium text-stone-500">MTN MoMo</span>
            <span className="rounded bg-white/5 px-1.5 py-0.5 font-medium text-stone-500">Airtel Money</span>
            <span className="rounded bg-white/5 px-1.5 py-0.5 font-medium text-stone-500">Visa</span>
            <span className="rounded bg-white/5 px-1.5 py-0.5 font-medium text-stone-500">Mastercard</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
