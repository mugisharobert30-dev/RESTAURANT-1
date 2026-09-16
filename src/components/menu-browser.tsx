"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { FoodCard } from "@/components/food-card";
import { EmptyState, Skeleton, Select, Button } from "@/components/ui";
import { cx } from "@/lib/format";

type DietFilter = "all" | "vegetarian" | "vegan" | "spicy";
type SortOption = "popular" | "price-asc" | "price-desc" | "rating" | "fastest";

export function MenuBrowser({ compactCategories }: { compactCategories?: boolean }) {
  const categories = useStoreData((d) => d.categories);
  const menuItems = useStoreData((d) => d.menuItems);
  const favorites = useStoreData((d) => d.favorites);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [diet, setDiet] = useState<DietFilter>("all");
  const [sort, setSort] = useState<SortOption>("popular");
  const [showFilters, setShowFilters] = useState(false);

  const activeCats = categories.filter((c) => c.active).sort((a, b) => a.sort_order - b.sort_order);
  const priceCeiling = Math.ceil(Math.max(...menuItems.map((m) => m.price), 1000) / 1000) * 1000;

  const filtered = useMemo(() => {
    let items = [...menuItems];
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.ingredients.some((i) => i.toLowerCase().includes(q)) ||
          activeCats.find((c) => c.id === m.category_id)?.name.toLowerCase().includes(q)
      );
    }
    if (category !== "all") items = items.filter((m) => m.category_id === category);
    if (maxPrice > 0) items = items.filter((m) => m.price <= maxPrice);
    if (diet === "vegetarian") items = items.filter((m) => m.is_vegetarian);
    if (diet === "vegan") items = items.filter((m) => m.is_vegan);
    if (diet === "spicy") items = items.filter((m) => m.spicy_level >= 2);
    switch (sort) {
      case "price-asc": items.sort((a, b) => a.price - b.price); break;
      case "price-desc": items.sort((a, b) => b.price - a.price); break;
      case "rating": items.sort((a, b) => b.rating_avg - a.rating_avg); break;
      case "fastest": items.sort((a, b) => a.prep_time_min - b.prep_time_min); break;
      default: items.sort((a, b) => Number(b.featured) - Number(a.featured) || b.times_ordered - a.times_ordered);
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuItems, query, category, maxPrice, diet, sort]);

  const favIds = new Set(favorites.map((f) => f.menu_item_id));

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search the menu</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 h-[18px] w-[18px] -translate-y-1/2 text-cocoa/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search food — try 'luwombo', 'brochettes', 'juice'..."
            className="h-12 w-full rounded-xl border border-cocoa/15 bg-white pl-10 pr-4 text-base shadow-card placeholder:text-cocoa/40 focus:outline-none focus:ring-2 focus:ring-brand-500/60 sm:text-sm"
            type="search"
          />
        </label>
        <div className="flex gap-2">
          <Select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} aria-label="Sort menu" className="!w-auto !h-12 rounded-xl">
            <option value="popular">Most popular</option>
            <option value="rating">Top rated</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="fastest">Fastest to prepare</option>
          </Select>
          <Button variant="outline" className="!h-12 lg:hidden" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Button>
        </div>
      </div>

      <div className={cx("mt-4 grid gap-6", showFilters ? "grid-cols-1" : "lg:grid-cols-[220px_1fr]")}>
        <aside className={cx("space-y-5", !showFilters && "hidden lg:block")} aria-label="Menu filters">
          {!compactCategories && (
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-cocoa/50">Categories</h3>
              <ul className="space-y-1">
                <li>
                  <button onClick={() => setCategory("all")} className={cx("w-full rounded-lg px-3 py-2 text-left text-sm font-medium", category === "all" ? "bg-brand-600 text-white" : "text-cocoa/70 hover:bg-brand-50 hover:text-brand-700")}>
                    All dishes
                  </button>
                </li>
                {activeCats.map((c) => (
                  <li key={c.id}>
                    <button onClick={() => setCategory(c.id)} className={cx("w-full rounded-lg px-3 py-2 text-left text-sm font-medium", category === c.id ? "bg-brand-600 text-white" : "text-cocoa/70 hover:bg-brand-50 hover:text-brand-700")}>
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {compactCategories && (
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-cocoa/50">Category</h3>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">All categories</option>
                {activeCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-cocoa/50">
              Max price {maxPrice > 0 && <span className="text-brand-700">· {maxPrice.toLocaleString()} RWF</span>}
            </h3>
            <input type="range" min={1000} max={priceCeiling} step={500} value={maxPrice || priceCeiling} onChange={(e) => setMaxPrice(Number(e.target.value) === priceCeiling ? 0 : Number(e.target.value))} className="w-full accent-brand-600" aria-label="Maximum price filter" />
            <div className="mt-1 flex justify-between text-xs text-cocoa/40">
              <span>1,000</span>
              <button onClick={() => setMaxPrice(0)} className="font-medium text-brand-700 hover:underline">Reset</button>
              <span>{priceCeiling.toLocaleString()}+</span>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-cocoa/50">Dietary</h3>
            <div className="flex flex-wrap gap-2">
              {([
                ["all", "Everything"],
                ["vegetarian", "Vegetarian"],
                ["vegan", "Vegan"],
                ["spicy", "Spicy"],
              ] as Array<[DietFilter, string]>).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setDiet(value)}
                  aria-pressed={diet === value}
                  className={cx("rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors", diet === value ? "bg-leaf-700 text-white ring-leaf-700" : "bg-white text-cocoa/70 ring-cocoa/15 hover:ring-brand-400")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div>
          <p className="mb-3 text-sm text-cocoa/50" role="status">
            {filtered.length} dish{filtered.length === 1 ? "" : "es"} {query && <>matching “{query}”</>}
          </p>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Search className="h-5 w-5" />}
              title="No dishes found"
              message={`Nothing matches "${query}". Try 'isombe', 'chicken', or clear your filters.`}
              action={
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setQuery(""); setCategory("all"); setDiet("all"); setMaxPrice(0); }}>Clear all filters</Button>
                </div>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => (
                <FoodCard key={item.id} item={item} isFavorite={favIds.has(item.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MenuSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-cocoa/8 bg-white p-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="mt-3 h-5 w-3/4" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-1 h-4 w-2/3" />
          <Skeleton className="mt-4 h-9 w-28" />
        </div>
      ))}
    </div>
  );
}
