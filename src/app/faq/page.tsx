"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { cx } from "@/lib/format";

export default function FaqPage() {
  const faqs = useStoreData((d) => d.faqs);
  const visible = faqs.filter((f) => f.visible);
  const [openId, setOpenId] = useState<string | null>(visible[0]?.id ?? null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="text-center">
        <h1 className="font-display text-4xl font-extrabold">Frequently asked questions</h1>
        <p className="mt-2 text-cocoa/60">Quick answers about hours, delivery, payments and more. Still stuck? <Link href="/contact" className="font-bold text-brand-700 hover:underline">Contact us</Link>.</p>
      </header>

      <ul className="mt-10 space-y-3">
        {visible.map((f) => {
          const open = openId === f.id;
          return (
            <li key={f.id} className="overflow-hidden rounded-2xl border border-cocoa/10 bg-white shadow-card">
              <button
                onClick={() => setOpenId(open ? null : f.id)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-bold"
              >
                {f.question}
                <ChevronDown className={cx("h-5 w-5 shrink-0 text-cocoa/40 transition-transform", open && "rotate-180")} />
              </button>
              {open && <p className="animate-fadeIn px-5 pb-5 text-sm leading-relaxed text-cocoa/70">{f.answer}</p>}
            </li>
          );
        })}
      </ul>

      <div className="mt-12 rounded-2xl bg-brand-50 p-6 text-center ring-1 ring-brand-100">
        <h2 className="font-display text-xl font-bold">Still have a question?</h2>
        <p className="mt-1 text-sm text-cocoa/60">Call +250 788 123 456 or message us on WhatsApp — a human always answers.</p>
        <Link href="/contact" className="mt-4 inline-flex h-11 items-center rounded-xl bg-brand-600 px-6 font-bold text-white hover:bg-brand-700">Get in touch</Link>
      </div>
    </div>
  );
}
