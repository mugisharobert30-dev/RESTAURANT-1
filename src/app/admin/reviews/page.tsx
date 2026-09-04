"use client";

import { useState } from "react";
import { EyeOff, MessageSquareReply, Star, StarHalf, Trash2 } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { logAudit } from "@/lib/db";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { fmtDate, initials } from "@/lib/format";
import type { Review } from "@/lib/types";
import { Badge, Button, ConfirmDialog, Modal, StatCard, Textarea } from "@/components/ui";
import { BulkSelectBar } from "@/components/admin/bulk-select";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {[1, 2, 3, 4, 5].map((i) =>
        rating >= i ? <Star key={i} className="h-4 w-4 fill-current" /> : rating >= i - 0.5 ? <StarHalf key={i} className="fill-current" /> : <Star key={i} className="text-cocoa/25" />
      )}
    </span>
  );
}

export default function AdminReviewsPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const reviews = useStoreData((d) => d.reviews);
  const menuItems = useStoreData((d) => d.menuItems);
  const [replying, setReplying] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");
  const [filter, setFilter] = useState<"all" | "needs_reply" | "hidden">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmBulk, setConfirmBulk] = useState<"hide" | "delete" | null>(null);

  const filtered = reviews
    .filter((r) => (filter === "hidden" ? r.hidden : filter === "needs_reply" ? !r.response && !r.hidden : true))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const visibleIds = filtered.map((r) => r.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const someSelected = visibleIds.some((id) => selected.includes(id));
  const toggleAll = () =>
    setSelected(allSelected ? selected.filter((id) => !visibleIds.includes(id)) : [...selected, ...visibleIds].filter((id, i, a) => a.indexOf(id) === i));
  const toggleOne = (id: string) => setSelected((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  const setBulkHidden = (hidden: boolean) => {
    store.mutate((d) => {
      d.reviews.forEach((r) => {
        if (selected.includes(r.id)) r.hidden = hidden;
      });
    });
    toast(`${hidden ? "Hidden" : "Unhid"} ${selected.length} review${selected.length === 1 ? "" : "s"}.`);
    setSelected([]);
    setConfirmBulk(null);
  };

  const removeSelected = () => {
    store.mutate((d) => {
      d.reviews = d.reviews.filter((r) => !selected.includes(r.id));
    });
    logAudit(auth.profile!.full_name, "Deleted reviews", "Review", "", `${selected.length} review(s)`);
    toast(`Deleted ${selected.length} review${selected.length === 1 ? "" : "s"}.`);
    setSelected([]);
    setConfirmBulk(null);
  };

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const dishName = (id?: string) => (id ? menuItems.find((m) => m.id === id)?.name ?? "General feedback" : "General feedback");

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl font-extrabold">Guest Reviews</h1>
        <p className="mt-1 text-sm text-cocoa/55">Reply publicly to build trust. Hidden reviews are removed from the site but kept for records.</p>
      </header>

      <section className="grid grid-cols-2 xl:grid-cols-4">
        <StatCard label="Average rating" value={avg.toFixed(1)} icon={<Star className="h-5 w-5 fill-current text-amber-500" />} tone="brand" sub={`${reviews.length} total`} />
        <StatCard label="Awaiting reply" value={reviews.filter((r) => !r.response && !r.hidden).length} tone="sky" />
        <StatCard label="5-star reviews" value={reviews.filter((r) => r.rating === 5).length} tone="leaf" />
        <StatCard label="Hidden" value={reviews.filter((r) => r.hidden).length} tone={reviews.some((r) => r.hidden) ? "red" : "brand"} />
      </section>

      <div className="flex gap-1.5">
        {(["all", "needs_reply", "hidden"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold capitalize ${filter === f ? "bg-cocoa text-white" : "bg-white ring-1 ring-cocoa/10 hover:bg-stone-50"}`}>
            {f.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <BulkSelectBar allSelected={allSelected} someSelected={someSelected} count={selected.length} total={filtered.length} onToggleAll={toggleAll} label="reviews">
        <Button variant="outline" size="sm" onClick={() => setConfirmBulk("hide")} disabled={selected.length === 0}>
          <EyeOff className="h-3.5 w-3.5" /> Hide ({selected.length})
        </Button>
        <Button variant="danger" size="sm" onClick={() => setConfirmBulk("delete")} disabled={selected.length === 0}>
          <Trash2 className="h-3.5 w-3.5" /> Delete ({selected.length})
        </Button>
      </BulkSelectBar>
      <ul className="grid gap-3 lg:grid-cols-2">
        {filtered.map((r) => (
          <li key={r.id} className={`rounded-2xl border bg-white p-4 shadow-card ${r.hidden ? "border-red-200 opacity-60" : "border-cocoa/10"} ${selected.includes(r.id) ? "ring-1 ring-brand-500" : ""}`}>
            <div className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center pt-1">
                <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleOne(r.id)} aria-label={`Select review by ${r.customer_name}`} className="h-4 w-4 rounded accent-brand-600" />
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">{initials(r.customer_name)}</span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 text-sm">
                  <strong>{r.customer_name}</strong>
                  <Stars rating={r.rating} />
                  <span className="text-xs text-cocoa/40">{fmtDate(r.created_at)}</span>
                  {r.hidden && <Badge tone="red">Hidden</Badge>}
                </p>
                <p className="mt-1 text-xs font-semibold text-brand-700">{dishName(r.menu_item_id)}</p>
                <p className="mt-1.5 text-sm text-cocoa/70">“{r.comment}”</p>
                {r.response && (
                  <div className="mt-2 rounded-xl bg-leaf-50 px-3 py-2 ring-1 ring-leaf-200">
                    <p className="text-xs font-bold text-leaf-800">Luwombo replied</p>
                    <p className="text-sm text-leaf-900">{r.response}</p>
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant={r.response ? "outline" : "primary"} onClick={() => { setReplying(r); setReplyText(r.response ?? ""); }}>
                    <MessageSquareReply className="h-3.5 w-3.5" /> {r.response ? "Edit reply" : "Reply"}
                  </Button>
                  <button onClick={() => store.mutate((d) => {
                    const rr = d.reviews.find((x) => x.id === r.id);
                    if (rr) rr.hidden = !rr.hidden;
                  })} className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-cocoa/55 ring-1 ring-cocoa/15 hover:bg-stone-50">
                    <EyeOff className="h-3.5 w-3.5" /> {r.hidden ? "Unhide" : "Hide"}
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Modal open={!!replying} onClose={() => setReplying(null)} title={`Reply to ${replying?.customer_name ?? ""}`}>
        <div className="space-y-4">
          <p className="rounded-xl bg-stone-50 p-3 text-sm italic text-cocoa/60">“{replying?.comment}”</p>
          <Textarea label="Your public reply *" name="replyText" rows={3} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Murakoze cyane! We're delighted you enjoyed…" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReplying(null)}>Cancel</Button>
            <Button onClick={() => {
              if (!replyText.trim()) return toast("Write a reply first.", "error");
              store.mutate((d) => {
                const rr = d.reviews.find((x) => x.id === replying!.id);
                if (rr) rr.response = replyText.trim();
              });
              logAudit(auth.profile!.full_name, "Replied to review", "Review", replying!.id, "");
              toast("Reply published.");
              setReplying(null);
            }}>Publish reply</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
