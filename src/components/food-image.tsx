"use client";

import { Beef, CakeSlice, ChefHat, Citrus, Coffee, Croissant, CupSoda, Fish, Flame, Salad, Sandwich, Soup, UtensilsCrossed } from "lucide-react";
import type { MenuItem } from "@/lib/types";
import { cx } from "@/lib/format";

const CATEGORY_ART: Record<string, [string, string, typeof Soup]> = {
  "cat-trad": ["#92400E", "#451A03", Soup],
  "cat-grill": ["#B91C1C", "#450A0A", Flame],
  "cat-mains": ["#C2410C", "#431407", UtensilsCrossed],
  "cat-breakfast": ["#D97706", "#78350F", Croissant],
  "cat-veg": ["#15803D", "#052E16", Salad],
  "cat-snacks": ["#CA8A04", "#713F12", Sandwich],
  "cat-desserts": ["#BE185D", "#500724", CakeSlice],
  "cat-juices": ["#EA580C", "#7C2D12", Citrus],
  "cat-drinks": ["#0369A1", "#082F49", CupSoda],
  "cat-coffee": ["#57534E", "#1C1917", Coffee],
  "cat-specials": ["#166534", "#14532D", ChefHat],
};

export function FoodImage({ item, className, rounded = "rounded-t-2xl" }: { item: MenuItem; className?: string; rounded?: string }) {
  if (item.image_url) {
    return (
      <div className={cx("relative overflow-hidden bg-stone-200", rounded, className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image_url} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
      </div>
    );
  }
  const [from, to] = CATEGORY_ART[item.category_id] ?? ["#D97706", "#78350F"];
  const Icon = CATEGORY_ART[item.category_id]?.[2] ?? UtensilsCrossed;
  const seed = item.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rot = seed % 40 - 20;
  return (
    <div className={cx("relative overflow-hidden", rounded, className)} style={{ background: `linear-gradient(${135 + rot}deg, ${from}, ${to})` }} role="img" aria-label={item.name}>
      <svg className="absolute inset-0 h-full w-full opacity-[0.16]" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <circle cx={20 + (seed % 30)} cy={30} r="26" fill="#fff" />
        <circle cx={80 - (seed % 20)} cy={75} r="18" fill="#fff" />
        <path d={`M0 ${70 + (seed % 15)} Q 25 ${55 + (seed % 20)}, 50 ${72} T 100 ${60}`} stroke="#fff" strokeWidth="3" fill="none" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/30">
          <Icon className="h-8 w-8 text-white/90" />
        </div>
      </div>
    </div>
  );
}

export function GalleryImage({ gradient, icon, title, className, image_url }: { gradient: [string, string]; icon: string; title: string; className?: string; image_url?: string }) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    soup: Soup, flame: Flame, citrus: Citrus, sun: SunIcon, home: HomeIcon, lamp: LampIcon,
    partyPopper: PartyIcon, users: UsersIcon, chefHat: ChefHat, handHeart: HeartHandIcon,
  };
  const Icon = icons[icon] ?? UtensilsCrossed;
  if (image_url) {
    return (
      <div className={cx("relative overflow-hidden bg-stone-200", className)} role="img" aria-label={title}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image_url} alt={title} loading="lazy" className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className={cx("relative overflow-hidden", className)} style={{ background: `linear-gradient(140deg, ${gradient[0]}, ${gradient[1]})` }} role="img" aria-label={title}>
      <svg className="absolute inset-0 h-full w-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <circle cx="25" cy="25" r="30" fill="#fff" />
        <circle cx="80" cy="80" r="24" fill="#fff" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon className="h-10 w-10 text-white/80" />
      </div>
    </div>
  );
}

function SunIcon(props: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" className={props.className}><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>;
}
function HomeIcon(props: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" className={props.className}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function LampIcon(props: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" className={props.className}><path d="M9 18h6"/><path d="M10 22h4"/><path d="m12 2-5 10h10L12 2z"/></svg>;
}
function PartyIcon(props: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" className={props.className}><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/></svg>;
}
function UsersIcon(props: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" className={props.className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function HeartHandIcon(props: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" className={props.className}><path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16"/><path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><path d="m2 15 6 6"/><path d="M19.5 8.5c.7-.7 1.5-1.6 1.5-2.7A2.73 2.73 0 0 0 16 4a2.78 2.78 0 0 0-5 1.8c0 1.2.8 2 1.5 2.8L16 12Z"/></svg>;
}
