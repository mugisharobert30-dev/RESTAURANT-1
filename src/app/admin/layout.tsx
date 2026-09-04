"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3, BellRing, CalendarDays, ChefHat, ClipboardList, CreditCard, DatabaseBackup, ExternalLink,
  LayoutDashboard, LogOut, Menu as MenuIcon, PackageSearch, ScrollText, Settings,
  ShoppingBag, Star, Tags, TicketPercent, UsersRound, UtensilsCrossed, X, QrCode, Layers,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useStoreData } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { cx, timeAgo } from "@/lib/format";

const NAV_GROUPS: Array<{ label: string; items: Array<{ href: string; label: string; icon: typeof LayoutDashboard; roles?: string[] }> }> = [
  {
    label: "Operations",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/kitchen", label: "Kitchen Display", icon: ChefHat, roles: ["superadmin", "admin", "manager", "kitchen"] },
      { href: "/admin/reservations", label: "Reservations", icon: CalendarDays },
      { href: "/admin/tables", label: "Tables & QR", icon: QrCode },
    ],
  },
  {
    label: "Menu & Stock",
    items: [
      { href: "/admin/menu", label: "Menu Items", icon: UtensilsCrossed },
      { href: "/admin/categories", label: "Categories", icon: Layers },
      { href: "/admin/inventory", label: "Inventory", icon: PackageSearch },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/admin/promotions", label: "Promotions", icon: Tags },
      { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/admin/customers", label: "Customers", icon: UsersRound },
      { href: "/admin/staff", label: "Staff", icon: ClipboardList, roles: ["superadmin", "admin", "manager"] },
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/notifications", label: "Notifications", icon: BellRing },
      { href: "/admin/data", label: "Data & Reset", icon: DatabaseBackup },
      { href: "/admin/settings", label: "Settings", icon: Settings, roles: ["superadmin", "admin", "manager"] },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText, roles: ["superadmin", "admin"] },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const notifications = useStoreData((d) => d.notifications);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => n.target === "admin" && !n.read);

  const isLoginPage = pathname.startsWith("/admin/login");

  useEffect(() => {
    if (!isLoginPage && !auth.loading && !auth.isStaff) router.replace("/admin/login");
  }, [auth.loading, auth.isStaff, auth.profile, isLoginPage, router]);

  useEffect(() => setSidebarOpen(false), [pathname]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  if (isLoginPage) return <>{children}</>;

  if (!auth.isStaff || !auth.profile) {
    return <div className="flex min-h-screen items-center justify-center bg-cream text-cocoa/50">Checking credentials…</div>;
  }

  const allowed = (roles?: string[]) => !roles || roles.includes(auth.profile!.role);

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-cocoa/10 bg-white px-4 lg:px-6">
        <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-cocoa/5 lg:hidden" aria-label="Open admin menu"><MenuIcon className="h-5 w-5" /></button>
        <Link href="/admin" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-leaf-700 text-white font-display font-bold">L</span>
          <span className="font-display text-lg font-bold tracking-wide">LUWOMBO<span className="ml-1.5 hidden rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-brand-800 align-middle sm:inline">Admin</span></span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-cocoa/60 hover:bg-cocoa/5 hover:text-cocoa sm:flex" target="_blank">
            <ExternalLink className="h-4 w-4" /> View site
          </Link>
          <div className="relative" ref={bellRef}>
            <button onClick={() => setBellOpen((o) => !o)} className="relative rounded-lg p-2 hover:bg-cocoa/5" aria-label={`Notifications (${unread.length} unread)`} aria-expanded={bellOpen}>
              <BellRing className="h-5 w-5 text-cocoa/70" />
              {unread.length > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold text-white">{unread.length}</span>}
            </button>
            {bellOpen && (
              <div className="absolute right-0 mt-2 w-96 max-w-[92vw] overflow-hidden rounded-2xl border border-cocoa/10 bg-white shadow-xl animate-fadeIn">
                <div className="flex items-center justify-between border-b border-cocoa/8 px-4 py-3">
                  <p className="text-sm font-bold">Alerts</p>
                  <button onClick={() => store.mutate((d) => d.notifications.forEach((n) => { if (n.target === "admin") n.read = true; }))} className="text-xs font-bold text-brand-700 hover:underline">Mark all read</button>
                </div>
                <ul className="max-h-96 divide-y divide-cocoa/6 overflow-y-auto">
                  {notifications.filter((n) => n.target === "admin").slice(0, 12).map((n) => (
                    <li key={n.id}>
                      <Link href={n.link ?? "/admin"} onClick={() => setBellOpen(false)} className={cx("block px-4 py-3 hover:bg-stone-50", !n.read && "bg-brand-50/60")}>
                        <p className="text-sm font-semibold">{n.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-cocoa/55">{n.body}</p>
                        <p className="mt-1 text-[11px] text-cocoa/40">{timeAgo(n.created_at)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/admin/notifications" onClick={() => setBellOpen(false)} className="block border-t border-cocoa/8 px-4 py-3 text-center text-sm font-bold text-brand-700 hover:bg-stone-50">See all</Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-cocoa/10 py-1.5 pl-1.5 pr-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-leaf-100 text-xs font-bold text-leaf-800">{auth.profile.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</span>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-bold leading-tight">{auth.profile.full_name}</span>
              <span className="block text-[10px] capitalize leading-tight text-cocoa/50">{auth.profile.role}</span>
            </span>
          </div>
          <button onClick={() => { auth.logout(); router.push("/admin/login"); }} className="rounded-lg p-2 text-cocoa/60 hover:bg-red-50 hover:text-red-600" aria-label="Log out"><LogOut className="h-5 w-5" /></button>
        </div>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-cocoa/50 animate-fadeIn" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-white shadow-xl animate-slideIn">
            <SidebarNav pathname={pathname} allowed={allowed} onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 overflow-y-auto border-r border-cocoa/10 bg-white px-3 py-4 lg:block" aria-label="Admin navigation">
          <SidebarNav pathname={pathname} allowed={allowed} />
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarNav({ pathname, allowed, onNavigate }: { pathname: string; allowed: (roles?: string[]) => boolean; onNavigate?: () => void }) {
  return (
    <nav className="space-y-5">
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((i) => allowed(i.roles));
        if (items.length === 0) return null;
        return (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-cocoa/35">{group.label}</p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link href={item.href} onClick={onNavigate}
                      className={cx("flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                        active ? "bg-leaf-700 text-white shadow-sm" : "text-cocoa/65 hover:bg-leaf-50 hover:text-leaf-800")}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
