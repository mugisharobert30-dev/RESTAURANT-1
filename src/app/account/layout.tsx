"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BellRing, CalendarDays, Heart, LayoutDashboard, MapPin, ReceiptText, UserRound } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useStoreData } from "@/hooks/use-store";
import { cx } from "@/lib/format";

const NAV = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "My Orders", icon: ReceiptText },
  { href: "/account/reservations", label: "Reservations", icon: CalendarDays },
  { href: "/account/favorites", label: "Favorites", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile", icon: UserRound },
  { href: "/account/notifications", label: "Notifications", icon: BellRing },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading, logout } = useAuth();
  const notifications = useStoreData((d) => d.notifications);
  const unread = notifications.filter((n) => n.target === "customer" && n.user_id === profile?.id && !n.read).length;

  useEffect(() => {
    if (!loading && !profile) router.replace("/login?next=" + encodeURIComponent(pathname));
  }, [loading, profile, router, pathname]);

  if (loading || !profile) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-cocoa/50">Loading your account…</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside aria-label="Account navigation">
          <div className="rounded-2xl border border-cocoa/10 bg-white p-4 shadow-card lg:sticky lg:top-24">
            <div className="flex items-center gap-3 border-b border-cocoa/8 pb-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-leaf-100 font-bold text-leaf-800 ring-1 ring-leaf-200">
                {profile.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{profile.full_name}</p>
                <p className="truncate text-xs text-cocoa/50">{profile.email}</p>
              </div>
            </div>
            <nav className="mt-3 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
              {NAV.map((n) => {
                const active = n.href === "/account" ? pathname === "/account" : pathname.startsWith(n.href);
                return (
                  <Link key={n.href} href={n.href}
                    className={cx("flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                      active ? "bg-brand-600 text-white shadow-sm" : "text-cocoa/65 hover:bg-brand-50 hover:text-brand-700")}>
                    <n.icon className="h-4 w-4 shrink-0" />
                    {n.label}
                    {n.href === "/account/notifications" && unread > 0 && (
                      <span className={cx("ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold", active ? "bg-white text-brand-700" : "bg-red-500 text-white")}>{unread}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <button onClick={() => logout()} className="mt-3 w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 lg:text-left">Log out</button>
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
