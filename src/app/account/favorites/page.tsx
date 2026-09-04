"use client";

import { useAuth } from "@/context/auth-context";
import { useStoreData } from "@/hooks/use-store";
import { FoodCard } from "@/components/food-card";
import { Button, EmptyState } from "@/components/ui";
import Link from "next/link";
import { Heart } from "lucide-react";

export default function FavoritesPage() {
  const auth = useAuth();
  const favorites = useStoreData((d) => d.favorites);
  const menuItems = useStoreData((d) => d.menuItems);

  const mine = menuItems.filter((m) => favorites.some((f) => f.customer_id === auth.profile?.id && f.menu_item_id === m.id));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl font-extrabold">Favorites</h1>
        <p className="mt-1 text-sm text-cocoa/60">Your saved meals — one tap from cart to kitchen.</p>
      </header>

      {mine.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-5 w-5" />}
          title="Save your favorite meals here."
          message="Tap the heart on any dish and it will be waiting for you."
          action={<Link href="/menu"><Button>Browse Menu</Button></Link>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {mine.map((m) => (
            <FoodCard key={m.id} item={m} isFavorite />
          ))}
        </div>
      )}
    </div>
  );
}
