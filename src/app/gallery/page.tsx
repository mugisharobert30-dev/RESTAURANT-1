"use client";

import { useState } from "react";
import { useStoreData } from "@/hooks/use-store";
import { GalleryImage } from "@/components/food-image";
import { Tabs } from "@/components/ui";

type Group = "all" | "food" | "interior" | "events" | "team";
const GROUPS: Array<{ value: Group; label: string }> = [
  { value: "all", label: "All" },
  { value: "food", label: "Food" },
  { value: "interior", label: "Our spaces" },
  { value: "events", label: "Events" },
  { value: "team", label: "Team" },
];

export default function GalleryPage() {
  const gallery = useStoreData((d) => d.gallery);
  const [group, setGroup] = useState<Group>("all");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const photos = group === "all" ? gallery : gallery.filter((p) => p.group === group);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold">Gallery</h1>
          <p className="mt-2 max-w-xl text-cocoa/60">A look inside Luwombo — the plates, the people and the places we love to host you.</p>
        </div>
        <Tabs tabs={GROUPS.map((g) => ({ value: g.value, label: g.label }))} active={group} onChange={(g) => setGroup(g as Group)} />
      </header>

      <div className="mt-8 columns-2 gap-4 md:columns-3 [&>*]:mb-4">
        {photos.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setLightbox(p.title)}
            aria-label={`Enlarge photo: ${p.title}`}
            className="group relative block w-full break-inside-avoid overflow-hidden rounded-2xl shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <GalleryImage gradient={p.gradient} icon={p.icon} title={p.title} image_url={p.image_url} className={`w-full ${i % 3 === 0 ? "aspect-[4/5]" : i % 3 === 1 ? "aspect-square" : "aspect-[4/3]"}`} />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
              {p.title}
            </span>
          </button>
        ))}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-label={lightbox}>
          <div className="absolute inset-0 bg-cocoa/70 animate-fadeIn" onClick={() => setLightbox(null)} />
          <figure className="relative max-w-lg rounded-2xl bg-white p-4 shadow-xl animate-fadeUp">
            <GalleryImage
              gradient={gallery.find((g) => g.title === lightbox)?.gradient ?? ["#B45309", "#78350F"]}
              icon={gallery.find((g) => g.title === lightbox)?.icon ?? "soup"}
              title={lightbox}
              image_url={gallery.find((g) => g.title === lightbox)?.image_url}
              className="aspect-[4/3] w-full rounded-xl"
            />
            <figcaption className="pt-3 text-center text-sm font-semibold">{lightbox}</figcaption>
            <button onClick={() => setLightbox(null)} className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-cocoa text-white" aria-label="Close photo view">✕</button>
          </figure>
        </div>
      )}
    </div>
  );
}
