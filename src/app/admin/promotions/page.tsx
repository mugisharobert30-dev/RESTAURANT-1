"use client";

import { useState } from "react";
import { CalendarDays, Megaphone, Pause, Play, Plus, Sparkles, Trash2 } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { logAudit } from "@/lib/db";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import type { Promotion } from "@/lib/types";
import { Badge, Button, ConfirmDialog, Input, Modal, Select, Textarea } from "@/components/ui";
import { BulkSelectBar } from "@/components/admin/bulk-select";

const TYPE_LABELS: Record<Promotion["type"], string> = {
  seasonal: "Seasonal",
  first_order: "First order",
  birthday: "Birthday",
  happy_hour: "Happy hour",
};

export default function AdminPromotionsPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const promotions = useStoreData((d) => d.promotions);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [form, setForm] = useState({ title: "", description: "", badge: "", type: "seasonal" as Promotion["type"] });
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const allSelected = promotions.length > 0 && promotions.every((p) => selected.includes(p.id));
  const someSelected = promotions.some((p) => selected.includes(p.id));
  const toggleAll = () => setSelected(allSelected ? [] : promotions.map((p) => p.id));
  const toggleOne = (id: string) => setSelected((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  const removeSelected = () => {
    store.mutate((d) => {
      d.promotions = d.promotions.filter((p) => !selected.includes(p.id));
    });
    logAudit(auth.profile!.full_name, "Deleted promotions", "Promotion", "", `${selected.length} banner(s)`);
    toast(`Deleted ${selected.length} promotion${selected.length === 1 ? "" : "s"}.`);
    setSelected([]);
    setConfirmDelete(false);
  };

  const toggleActive = (p: Promotion) => {
    const next = !p.active;
    store.mutate((d) => {
      const pp = d.promotions.find((x) => x.id === p.id);
      if (pp) pp.active = next;
    });
    logAudit(auth.profile!.full_name, next ? "Activated promotion" : "Paused promotion", "Promotion", p.title, "");
    toast(next ? `"${p.title}" is now live.` : `"${p.title}" paused.`);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold"><Megaphone className="h-7 w-7 text-brand-600" /> Promotions</h1>
          <p className="mt-1 text-sm text-cocoa/55">Banners shown on the homepage and marketing channels.</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New promotion</Button>
      </header>

      <BulkSelectBar allSelected={allSelected} someSelected={someSelected} count={selected.length} total={promotions.length} onToggleAll={toggleAll} label="promotions">
        <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)} disabled={selected.length === 0}>
          <Trash2 className="h-3.5 w-3.5" /> Delete ({selected.length})
        </Button>
      </BulkSelectBar>

      <ul className="grid gap-4 lg:grid-cols-2">
        {promotions.map((p) => {
          const expired = new Date(p.ends_at) < new Date();
          return (
            <li key={p.id} className={`relative ${p.active && !expired ? "rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white shadow-card" : "rounded-2xl border border-cocoa/10 bg-white p-5 opacity-70 shadow-card"} ${selected.includes(p.id) ? "ring-2 ring-brand-500" : ""}`}>
              <div className="absolute left-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded border border-white/50 bg-white/80">
                <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleOne(p.id)} aria-label={`Select ${p.title}`} className="h-3.5 w-3.5 rounded accent-brand-600" />
              </div>
              <div className="flex items-start justify-between gap-3 pl-7">
                <div>
                  <Badge tone={expired ? "red" : p.active ? "green" : "neutral"}>{expired ? "Ended" : p.active ? "Live" : "Paused"}</Badge>
                  <p className={`mt-2 font-display text-xl font-extrabold ${p.active && !expired ? "" : "text-cocoa/70"}`}>{p.title}</p>
                  <p className={`mt-1 text-sm ${p.active && !expired ? "text-white/85" : "text-cocoa/55"}`}>{p.description}</p>
                </div>
                {p.badge && (
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${p.active && !expired ? "bg-white/20" : "bg-brand-100 text-brand-800"}`}>
                    <Sparkles className="h-3 w-3" /> {p.badge}
                  </span>
                )}
              </div>
              <p className={`mt-3 inline-flex rounded-lg bg-black/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${p.active && !expired ? "" : "bg-stone-100 text-cocoa/60"}`}>
                {TYPE_LABELS[p.type]}
              </p>
              <p className={`mt-2 flex items-center gap-1.5 text-xs ${p.active && !expired ? "text-white/70" : "text-cocoa/40"}`}>
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(p.starts_at).toLocaleDateString()} - {new Date(p.ends_at).toLocaleDateString()}
              </p>
              <div className="mt-4 flex items-center gap-2">
                {expired ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-bold text-cocoa/40">
                    Ended
                  </span>
                ) : (
                  <button onClick={() => toggleActive(p)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${p.active ? "bg-white/20 hover:bg-white/30" : "ring-1 ring-cocoa/15 hover:bg-stone-50"}`}>
                    {p.active ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> Activate</>}
                  </button>
                )}
                <button onClick={() => setDeleteTarget(p)} className={`ml-auto rounded-lg p-1.5 ${p.active && !expired ? "hover:bg-white/20" : "text-red-600 hover:bg-red-50"}`} aria-label={`Delete ${p.title}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <Modal open={creating} onClose={() => setCreating(false)} title="New promotion">
        <div className="space-y-4">
          <Input label="Title *" name="promoTitle" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Umuganda Special" />
          <Textarea label="Description" name="promoDesc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="15% off family platters every last Saturday..." />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" name="promoType" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Promotion["type"] })}>
              {(Object.keys(TYPE_LABELS) as Array<Promotion["type"]>).map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </Select>
            <Input label="Badge text" name="promoBadge" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="-15%" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!form.title.trim()) return toast("Give the promotion a title.", "error");
              store.mutate((d) => {
                d.promotions.unshift({
                  id: `pr-${Date.now()}`,
                  title: form.title.trim(),
                  description: form.description.trim(),
                  badge: form.badge.trim(),
                  type: form.type,
                  active: true,
                  starts_at: new Date().toISOString(),
                  ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
                });
              });
              logAudit(auth.profile!.full_name, "Created promotion", "Promotion", form.title, "");
              toast("Promotion is live on the homepage.");
              setCreating(false);
              setForm({ title: "", description: "", badge: "", type: "seasonal" });
            }}>Launch promotion</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.title}"?`}
        message="The promotion disappears from the homepage immediately."
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          store.mutate((d) => {
            d.promotions = d.promotions.filter((p) => p.id !== deleteTarget.id);
          });
          toast("Promotion deleted.");
          setDeleteTarget(null);
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${selected.length} promotion${selected.length === 1 ? "" : "s"}?`}
        message="The selected promotions disappear from the homepage immediately."
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={removeSelected}
      />
    </div>
  );
}
