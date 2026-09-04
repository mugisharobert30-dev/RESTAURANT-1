"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Check, Clock, Flame, Heart, Leaf, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/context/toast-context";
import { FoodImage } from "@/components/food-image";
import { FoodCard } from "@/components/food-card";
import { Button, Badge, EmptyState } from "@/components/ui";
import { fmtRWF } from "@/lib/format";

export default function FoodDetailPage() {
  const params = useParams<{ slug: string }>();
  const menuItems = useStoreData((d) => d.menuItems);
  const categories = useStoreData((d) => d.categories);
  const reviews = useStoreData((d) => d.reviews);
  const favorites = useStoreData((d) => d.favorites);
  const { add, setOpen } = useCart();
  const { toast } = useToast();

  const item = menuItems.find((m) => m.slug === params.slug);

  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [instructions, setInstructions] = useState("");
  const [fav, setFav] = useState(false);

  if (!item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          title="Dish not found"
          message="This dish may have been renamed or removed. Explore the menu for today's offerings."
          action={<Link href="/menu" className="inline-flex h-11 items-center rounded-xl bg-brand-600 px-6 font-bold text-white">Back to Menu</Link>}
        />
      </div>
    );
  }

  const category = categories.find((c) => c.id === item.category_id);
  const optionPrice = Object.entries(selected).reduce((sum, [, optName]) => {
    const opt = item.customization_groups.flatMap((g) => g.options).find((o) => o.name === optName);
    return sum + (opt?.price ?? 0);
  }, 0);
  const unitPrice = item.price + optionPrice;

  const handleAdd = () => {
    add(item, quantity, Object.values(selected).filter(Boolean), instructions || undefined);
    setOpen(true);
  };

  const related = menuItems.filter((m) => m.category_id === item.category_id && m.id !== item.id && m.available).slice(0, 3);
  const itemReviews = reviews.filter((r) => r.menu_item_id === item.id && !r.hidden);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-cocoa/50">
        <Link href="/menu" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline"><ArrowLeft className="h-4 w-4" /> Menu</Link>
        <span aria-hidden="true"> / </span>
        <span>{category?.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="animate-fadeUp">
          <FoodImage item={item} className="aspect-[4/3] w-full shadow-soft" />
          <div className="mt-3 flex flex-wrap gap-2">
            {item.popular && <Badge tone="amber"><Star className="h-3 w-3" /> Guest favorite</Badge>}
            {item.is_vegan ? <Badge tone="green"><Leaf className="h-3 w-3" /> Vegan</Badge> : item.is_vegetarian && <Badge tone="green"><Leaf className="h-3 w-3" /> Vegetarian</Badge>}
            {item.spicy_level > 0 && <Badge tone="red">{[...Array(item.spicy_level)].map((_, i) => <Flame key={i} className="h-3 w-3 fill-current" />)} Spicy</Badge>}
            {!item.available && <Badge tone="neutral">Currently unavailable</Badge>}
          </div>
        </div>

        <div>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{item.name}</h1>
          <p className="mt-3 leading-relaxed text-cocoa/70">{item.description}</p>

          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-xl bg-white p-3 shadow-card ring-1 ring-cocoa/5">
              <dt className="text-xs font-medium uppercase text-cocoa/40">Rating</dt>
              <dd className="mt-0.5 flex items-center font-bold"><Star className="mr-1 h-4 w-4 fill-brand-500 text-brand-500" />{item.rating_avg.toFixed(1)} <span className="ml-1 text-xs font-normal text-cocoa/40">({item.rating_count})</span></dd>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-card ring-1 ring-cocoa/5">
              <dt className="text-xs font-medium uppercase text-cocoa/40">Prep time</dt>
              <dd className="mt-0.5 flex items-center font-bold"><Clock className="mr-1 h-4 w-4 text-brand-600" />~{item.prep_time_min} min</dd>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-card ring-1 ring-cocoa/5">
              <dt className="text-xs font-medium uppercase text-cocoa/40">Portion</dt>
              <dd className="mt-0.5 line-clamp-2 font-semibold leading-snug">{item.portion_info}</dd>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-card ring-1 ring-cocoa/5">
              <dt className="text-xs font-medium uppercase text-cocoa/40">Calories</dt>
              <dd className="mt-0.5 font-bold">{item.calories ?? "—"} kcal</dd>
            </div>
          </dl>

          {(item.ingredients.length > 0 || item.allergens.length > 0) && (
            <div className="mt-5 space-y-2 rounded-xl border border-cocoa/10 bg-white p-4 text-sm">
              {item.ingredients.length > 0 && (
                <p><span className="font-bold">Ingredients:</span> <span className="text-cocoa/70">{item.ingredients.join(", ")}</span></p>
              )}
              {item.allergens.length > 0 && (
                <p><span className="font-bold">Allergens:</span>{" "}
                  {item.allergens.map((a) => (
                    <span key={a} className="mr-1.5 inline-block rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-100">{a}</span>
                  ))}
                </p>
              )}
            </div>
          )}

          {item.customization_groups.map((group) => (
            <fieldset key={group.id} className="mt-5">
              <legend className="mb-2 text-sm font-bold">
                {group.name}
                {group.required && <span className="ml-1 text-xs font-medium text-red-500">*required</span>}
              </legend>
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => {
                  const isSelected = selected[group.id] === opt.name;
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() =>
                        setSelected((s) => {
                          if (group.type === "single") {
                            const next = { ...s };
                            if (isSelected) delete next[group.id];
                            else next[group.id] = opt.name;
                            return next;
                          }
                          return s;
                        })
                      }
                      className={isSelected ? "flex items-center gap-1.5 rounded-full bg-leaf-700 px-4 py-2 text-sm font-semibold text-white ring-2 ring-leaf-700 ring-offset-2" : "flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-cocoa/70 ring-1 ring-cocoa/15 hover:ring-brand-400"}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                      {opt.name}
                      {opt.price > 0 && <span className={isSelected ? "text-brand-200" : "text-brand-600"}>+{fmtRWF(opt.price)}</span>}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <div className="mt-5">
            <label htmlFor="instructions" className="mb-1.5 block text-sm font-bold">Special instructions</label>
            <textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              placeholder="e.g., no onions, extra chili sauce on the side..."
              className="w-full rounded-xl border border-cocoa/15 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/60"
            />
          </div>

          <div className="sticky bottom-20 mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-cocoa/10 bg-white p-4 shadow-soft md:bottom-4">
            <div className="flex items-center rounded-xl border border-cocoa/15">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="flex h-11 w-10 items-center justify-center text-cocoa/60 hover:text-cocoa" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
              <span className="w-9 text-center text-base font-extrabold" aria-live="polite">{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(20, q + 1))} className="flex h-11 w-10 items-center justify-center text-cocoa/60 hover:text-cocoa" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
            </div>
            <Button size="lg" className="flex-1 min-w-[220px]" disabled={!item.available} onClick={handleAdd}>
              <ShoppingBag className="h-5 w-5" />
              Add to cart · {fmtRWF(unitPrice * quantity)}
            </Button>
            <button
              onClick={() => {
                setFav((f) => !f);
                toast(fav ? "Removed from favorites." : `${item.name} saved to your favorites!`);
              }}
              className={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 transition-colors ${fav ? "bg-red-500 text-white ring-red-500" : "bg-white text-cocoa/60 ring-cocoa/15 hover:text-red-500"}`}
              aria-label={fav ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className="h-5 w-5" fill={fav ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>

      {itemReviews.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold">Guest reviews</h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {itemReviews.map((r) => (
              <li key={r.id} className="rounded-2xl border border-cocoa/8 bg-white p-5 shadow-card">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-brand-500 text-brand-500" : "text-stone-300"}`} />)}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-cocoa/75">“{r.comment}”</p>
                <p className="mt-3 text-xs text-cocoa/50"><strong className="text-cocoa">{r.customer_name}</strong></p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold">You might also like</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((m) => <FoodCard key={m.id} item={m} isFavorite={favorites.some((f) => f.menu_item_id === m.id)} />)}
          </div>
        </section>
      )}
    </div>
  );
}
