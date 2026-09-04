import type { MetadataRoute } from "next";
import { CATEGORIES, MENU_ITEMS } from "@/lib/seed";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://luwombo.rw";

export default function sitemap(): MetadataRoute.Sitemap {
  const statics = ["", "/menu", "/reservations", "/about", "/gallery", "/contact", "/faq", "/login", "/register"].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  const categoryPages = CATEGORIES.map((c) => ({
    url: `${BASE}/menu?category=${c.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const dishPages = MENU_ITEMS.map((m) => ({
    url: `${BASE}/menu/${m.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...statics, ...categoryPages, ...dishPages];
}

