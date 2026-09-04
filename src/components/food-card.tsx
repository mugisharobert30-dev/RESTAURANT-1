"use client";

import Link from "next/link";
import { Clock, Flame, Heart, Leaf, Plus, Star } from "lucide-react";
import type { MenuItem } from "@/lib/types";
import { fmtRWF } from "@/lib/format";
import { FoodImage } from "./food-image";
import { useCart } from "@/context/cart-context";
import { cx } from "@/lib/format";
import { useState } from "react";
import { Badge } from "./ui";

export function FoodCard({ item, isFavorite }: { item: MenuItem; isFavorite?: boolean }) {
  const { add, setOpen } = useCart();
  const [fav, setFav] = useState(!!isFavorite);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-cocoa/8 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft">
      <div className="relative">
        <Link href={`/menu/${item.slug}`} aria-label={`View ${item.name}`}>
          <FoodImage item={item} className="h-44 w-full transition-transform duration-300 group-hover:scale-[1.02]" rounded="rounded-none" />
        </Link>
        <button
          onClick={() => setFav((f) => !f)}
          aria-label={fav ? `Remove ${item.name} from favorites` : `Save ${item.name} to favorites`}
          aria-pressed={fav}
          className={cx(
            "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur transition-colors",
            fav ? "bg-red-500/95 text-white" : "bg-white/85 text-cocoa/60 hover:text-red-500"
          )}
        >
          <Heart className="h-4.5 w-4.5 h-[18px] w-[18px]" fill={fav ? "currentColor" : "none"} />
        </button>
        <div className="absolute left-3 top-3 flex gap-1.5">
          {item.popular && <Badge tone="amber"><Star className="h-3 w-3" /> Popular</Badge>}
          {(item.is_vegetarian || item.is_vegan) && (
            <Badge tone="green">
              <Leaf className="h-3 w-3" /> {item.is_vegan ? "Vegan" : "Veg"}
            </Badge>
          )}
          {!item.available && <Badge tone="red">Unavailable</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/menu/${item.slug}`} className="font-display text-base font-bold leading-snug text-cocoa hover:text-brand-700">
            {item.name}
          </Link>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-cocoa/60">{item.description}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-cocoa/50">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{item.prep_time_min} min</span>
          <span className="flex items-center gap-1 font-semibold text-brand-700"><Star className="h-3.5 w-3.5 fill-current" />{item.rating_avg.toFixed(1)}</span>
          {item.spicy_level > 0 && (
            <span className="flex items-center gap-0.5 text-red-500" title={`Spicy level ${item.spicy_level}/3`}>
              {[...Array(item.spicy_level)].map((_, i) => <Flame key={i} className="h-3.5 w-3.5 fill-current" />)}
            </span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-lg font-extrabold text-cocoa">{fmtRWF(item.price)}</span>
          <button
            onClick={() => {
              add(item);
              setOpen(true);
            }}
            disabled={!item.available}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-95 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>
    </article>
  );
}
