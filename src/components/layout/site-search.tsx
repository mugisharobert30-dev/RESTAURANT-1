"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, Search, UtensilsCrossed } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { useLanguage } from "@/context/language-context";
import { cx, fmtRWF } from "@/lib/format";
import { FoodImage } from "@/components/food-image";
import type { MenuItem } from "@/lib/types";

type SearchResult =
  | { kind: "dish"; href: string; title: string; subtitle: string; price: string; item: MenuItem }
  | { kind: "page"; href: string; title: string; subtitle: string }
  | { kind: "gallery"; href: string; title: string; subtitle: string };

export function SiteSearch() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const menuItems = useStoreData((d) => d.menuItems);
  const categories = useStoreData((d) => d.categories);
  const gallery = useStoreData((d) => d.gallery);
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQ(""), [pathname]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const term = q.trim().toLowerCase();

  const results = useMemo<SearchResult[]>(() => {
    if (term.length < 1) return [];
    const pages: SearchResult[] = [
      { kind: "page", href: "/menu", title: t("nav.menu"), subtitle: "Browse all dishes" },
      { kind: "page", href: "/about", title: t("nav.about"), subtitle: "Our story" },
      { kind: "page", href: "/reservations", title: t("nav.reservations"), subtitle: "Book a table" },
      { kind: "page", href: "/contact", title: t("nav.contact"), subtitle: "Get in touch" },
      { kind: "page", href: "/gallery", title: "Gallery", subtitle: "Photos of our space and food" },
      { kind: "page", href: "/faq", title: "FAQ", subtitle: "Frequently asked questions" },
      { kind: "page", href: "/checkout", title: t("nav.order"), subtitle: "Order online" },
    ].filter((p) => (p.title + " " + p.subtitle).toLowerCase().includes(term)) as SearchResult[];

    const dishes: SearchResult[] = menuItems
      .filter((m) =>
        (m.name + " " + m.description + " " + m.ingredients.join(" "))
          .toLowerCase()
          .includes(term)
      )
      .slice(0, 8)
      .map((m) => ({
        kind: "dish" as const,
        href: `/menu/${m.slug}`,
        title: m.name,
        subtitle: categories.find((c) => c.id === m.category_id)?.name ?? "Dish",
        price: fmtRWF(m.price),
        item: m,
      }));

    const galleryResults: SearchResult[] = gallery
      .filter((g) => g.title.toLowerCase().includes(term) || g.group.toLowerCase().includes(term))
      .slice(0, 3)
      .map((g) => ({ kind: "gallery" as const, href: "/gallery", title: g.title, subtitle: `Gallery · ${g.group}` }));

    return [...dishes, ...pages, ...galleryResults];
  }, [term, menuItems, categories, gallery, t]);

  const hasQuery = term.length >= 1;
  const open = focused && hasQuery;

  return (
    <div ref={boxRef} className="relative w-full">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa/40" aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search menu &amp; site…"
          type="search"
          aria-label="Search the site"
          className="h-10 w-full rounded-xl border border-cocoa/15 bg-stone-50 pl-9 pr-3 text-sm placeholder:text-cocoa/40 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </label>

      {open && (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-cocoa/10 bg-white shadow-xl animate-fadeIn">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-cocoa/45">No results for “{q}”.</p>
          ) : (
            <>
              {results.some((r) => r.kind === "dish") && (
                <p className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-cocoa/40">Dishes</p>
              )}
              <ul className="max-h-80 overflow-y-auto py-1">
                {results.map((r) => (
                  <li key={r.kind === "dish" ? r.item.id : r.href}>
                    <Link
                      href={r.href}
                      onClick={() => setFocused(false)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-stone-50"
                    >
                      {r.kind === "dish" ? (
                        <>
                          <span className="flex h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                            <FoodImage
                              item={r.item}
                              rounded="rounded-lg"
                              className="h-full w-full"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-cocoa">{r.title}</span>
                            <span className="block truncate text-xs text-cocoa/50">{r.subtitle}</span>
                          </span>
                          <span className="shrink-0 text-sm font-bold text-brand-700">{r.price}</span>
                        </>
                      ) : r.kind === "gallery" ? (
                        <>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                            <UtensilsCrossed className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-cocoa">{r.title}</span>
                            <span className="block truncate text-xs text-cocoa/50">{r.subtitle}</span>
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-cocoa/70">
                            <Search className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-cocoa">{r.title}</span>
                            <span className="block truncate text-xs text-cocoa/50">{r.subtitle}</span>
                          </span>
                        </>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-1.5 border-t border-cocoa/8 px-4 py-2 text-[11px] text-cocoa/45">
                <CornerDownLeft className="h-3 w-3" /> Enter to open · Esc to close
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
