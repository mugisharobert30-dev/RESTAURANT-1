"use client";

import Link from "next/link";
import { Quote, Star } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { SectionHeading } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export function ReviewsStrip() {
  const reviews = useStoreData((d) => d.reviews);
  const featured = reviews.filter((r) => r.featured && !r.hidden).slice(0, 3);

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading center eyebrow="Kind words" title="What Kigali says about us" subtitle="Real reviews from guests who ordered and dined with us." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {featured.map((r) => (
            <figure key={r.id} className="relative rounded-2xl border border-cocoa/8 bg-cream p-6 shadow-card">
              <Quote className="absolute right-5 top-5 h-8 w-8 text-brand-200" aria-hidden="true" />
              <div className="flex gap-0.5" aria-label={`Rated ${r.rating} out of 5`}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-brand-500 text-brand-500" : "text-stone-300"}`} />
                ))}
              </div>
              <blockquote className="mt-3 text-sm leading-relaxed text-cocoa/80">“{r.comment}”</blockquote>
              <figcaption className="mt-4 flex items-center justify-between text-xs text-cocoa/50">
                <span className="font-bold text-cocoa">{r.customer_name}</span>
                <span>{fmtDate(r.created_at)}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-cocoa/50">
          Ordered with us? <Link href="/account/orders" className="font-bold text-brand-700 hover:underline">Leave your own review</Link> — it means a lot to our team.
        </p>
      </div>
    </section>
  );
}
