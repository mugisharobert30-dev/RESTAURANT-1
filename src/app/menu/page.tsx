import type { Metadata } from "next";
import { MenuBrowser } from "@/components/menu-browser";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Menu — Rwandan & International Cuisine",
  description: "Browse the full Luwombo Restaurant menu: traditional luwombo, charcoal brochettes, grilled tilapia, fresh juices and more. Order online for delivery or takeaway in Kigali.",
};

export default function MenuPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-4xl font-extrabold">Our Menu</h1>
        <p className="mt-2 text-cocoa/60">
          Everything is cooked fresh to order. Tap any dish to customize it — portions, extras and cooking preferences.
        </p>
      </header>
      <Suspense fallback={null}>
        <MenuBrowser />
      </Suspense>
    </div>
  );
}
