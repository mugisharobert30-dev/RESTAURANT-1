"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu as MenuIcon, ShoppingBag, User } from "lucide-react";
import { cx } from "@/lib/format";
import { LANGUAGES } from "@/lib/i18n";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import { SiteSearch } from "./site-search";

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Luwombo Restaurant home">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-leaf-700 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M3 11h18a9 9 0 0 1-9 9 9 9 0 0 1-9-9Z" strokeLinejoin="round" />
          <path d="M7 8c0-2.5 2-4.5 5-4.5S17 5.5 17 8" strokeLinecap="round" />
          <path d="M12 3.5V2" strokeLinecap="round" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block font-display text-lg font-bold tracking-wide text-cocoa">LUWOMBO</span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-600">Restaurant · Kigali</span>
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { t, lang, setLang } = useLanguage();
  const { count, setOpen } = useCart();
  const { profile, isStaff, logout } = useAuth();
  const langRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/menu", label: t("nav.menu") },
    { href: "/about", label: t("nav.about") },
    { href: "/reservations", label: t("nav.reservations") },
    { href: "/contact", label: t("nav.contact") },
  ];

  return (
    <header className={cx("sticky top-0 z-50 border-b transition-shadow", scrolled ? "border-cocoa/8 bg-white/95 shadow-sm backdrop-blur" : "border-transparent bg-white")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Main navigation" className="ml-6 hidden flex-1 items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              className={cx(
                "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                pathname === l.href ? "text-brand-700" : "text-cocoa/70 hover:bg-cocoa/5 hover:text-cocoa"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden w-48 shrink-0 lg:block xl:w-64">
          <SiteSearch />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:gap-2">
          <div className="relative hidden sm:block" ref={langRef}>
            <button
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-semibold text-cocoa/70 hover:bg-cocoa/5 hover:text-cocoa"
              aria-haspopup="listbox"
              aria-expanded={langOpen}
              aria-label="Change language"
            >
              {LANGUAGES.find((l) => l.code === lang)?.label.split(" ")[0]}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {langOpen && (
              <ul role="listbox" className="absolute right-0 mt-1 w-40 overflow-hidden rounded-xl border border-cocoa/10 bg-white py-1 shadow-lg animate-fadeIn">
                {LANGUAGES.map((l) => (
                  <li key={l.code}>
                    <button
                      role="option"
                      aria-selected={l.code === lang}
                      onClick={() => {
                        setLang(l.code);
                        setLangOpen(false);
                      }}
                      className={cx("w-full px-4 py-2 text-left text-sm hover:bg-stone-50", l.code === lang && "font-bold text-brand-700")}
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link href="/checkout" className="hidden md:block">
            <span className="inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700">
              {t("cta.orderNow")}
            </span>
          </Link>

          <button
            onClick={() => setOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-cocoa/70 hover:bg-cocoa/5 hover:text-cocoa"
            aria-label={`Open cart, ${count} items`}
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </button>

          <div className="relative" ref={accountRef}>
            {profile ? (
              <>
                <button
                  onClick={() => setAccountOpen((o) => !o)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-leaf-100 text-sm font-bold text-leaf-800 ring-1 ring-leaf-200"
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                >
                  {profile.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </button>
                {accountOpen && (
                  <ul className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-cocoa/10 bg-white py-1.5 shadow-lg animate-fadeIn">
                    <li className="px-4 pb-2 pt-1">
                      <p className="truncate text-sm font-bold text-cocoa">{profile.full_name}</p>
                      <p className="truncate text-xs text-cocoa/50">{profile.email}</p>
                    </li>
                    <li><Link href="/account" className="block px-4 py-2 text-sm hover:bg-stone-50">{t("nav.account")}</Link></li>
                    <li><Link href="/account/orders" className="block px-4 py-2 text-sm hover:bg-stone-50">{t("nav.orders")}</Link></li>
                    <li><Link href="/account/favorites" className="block px-4 py-2 text-sm hover:bg-stone-50">{t("nav.favorites")}</Link></li>
                    {isStaff && <li><Link href="/admin" className="block px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-stone-50">Staff dashboard</Link></li>}
                    <li className="border-t border-cocoa/8"><button onClick={() => logout()} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">{t("nav.logout")}</button></li>
                  </ul>
                )}
              </>
            ) : (
              <Link href="/login" className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-cocoa/70 hover:bg-cocoa/5 hover:text-cocoa">
                <User className="h-5 w-5" />
                <span className="hidden xl:inline">{t("nav.login")}</span>
              </Link>
            )}
          </div>

          <button onClick={() => setMobileOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl text-cocoa hover:bg-cocoa/5 lg:hidden" aria-label="Open menu" aria-expanded={mobileOpen}>
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="border-t border-cocoa/8 bg-white px-4 py-2 lg:hidden">
        <SiteSearch />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-cocoa/50 animate-fadeIn" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-white shadow-xl animate-slideIn">
            <div className="flex items-center justify-between border-b border-cocoa/8 p-4">
              <Logo />
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="rounded-lg p-2 text-cocoa/60 hover:bg-cocoa/5">✕</button>
            </div>
            <div className="border-b border-cocoa/8 p-3">
              <SiteSearch />
            </div>
            <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto p-3">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className={cx("block rounded-xl px-4 py-3 text-base font-semibold", pathname === l.href ? "bg-brand-50 text-brand-700" : "text-cocoa/80 hover:bg-stone-50")}>
                  {l.label}
                </Link>
              ))}
              {profile && (
                <>
                  <hr className="my-2 border-cocoa/8" />
                  <Link href="/account" className="block rounded-xl px-4 py-3 text-base font-semibold text-cocoa/80 hover:bg-stone-50">{t("nav.account")}</Link>
                  {isStaff && <Link href="/admin" className="block rounded-xl px-4 py-3 text-base font-semibold text-brand-700 hover:bg-stone-50">Staff dashboard</Link>}
                  <button onClick={() => logout()} className="block w-full rounded-xl px-4 py-3 text-left text-base font-semibold text-red-600 hover:bg-red-50">{t("nav.logout")}</button>
                </>
              )}
            </nav>
            <div className="border-t border-cocoa/8 p-4">
              <Link href="/menu?order=1" className="flex h-12 items-center justify-center rounded-xl bg-brand-600 text-base font-bold text-white">{t("cta.orderNow")}</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
