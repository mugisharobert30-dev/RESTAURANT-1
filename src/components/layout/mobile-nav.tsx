"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ReceiptText, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { cx } from "@/lib/format";
import { useCart } from "@/context/cart-context";

export function MobileNav() {
  const pathname = usePathname();
  const { count, setOpen } = useCart();

  if (pathname.startsWith("/admin")) return null;

  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/menu", label: "Menu", icon: UtensilsCrossed },
    { href: "/account/orders", label: "Orders", icon: ReceiptText },
  ];

  return (
    <nav aria-label="Bottom navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-cocoa/10 bg-white/95 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="grid grid-cols-4">
        {items.map((i) => {
          const active = pathname === i.href;
          return (
            <Link key={i.href} href={i.href} className={cx("flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold", active ? "text-brand-700" : "text-cocoa/60")}>
              <i.icon className="h-5 w-5" aria-hidden="true" />
              {i.label}
            </Link>
          );
        })}
        <button onClick={() => setOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-cocoa/60">
          <span className="relative">
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            {count > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white">
                {count}
              </span>
            )}
          </span>
          Cart
        </button>
      </div>
    </nav>
  );
}
