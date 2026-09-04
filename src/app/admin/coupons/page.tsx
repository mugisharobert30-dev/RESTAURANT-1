"use client";

import { useState } from "react";
import { Copy, Ticket, Trash2 } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { logAudit } from "@/lib/db";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { fmtRWF } from "@/lib/format";
import type { Coupon } from "@/lib/types";
import { Badge, Button, ConfirmDialog, Input, Modal, Select } from "@/components/ui";
import { BulkSelectBar } from "@/components/admin/bulk-select";

export default function AdminCouponsPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const coupons = useStoreData((d) => d.coupons);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ code: "", type: "percentage" as Coupon["type"], value: 10, min_order: 0, max_uses: 100 });
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const allSelected = coupons.length > 0 && coupons.every((c) => selected.includes(c.id));
  const someSelected = coupons.some((c) => selected.includes(c.id));
  const toggleAll = () => setSelected(allSelected ? [] : coupons.map((c) => c.id));
  const toggleOne = (id: string) => setSelected((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  const removeSelected = () => {
    store.mutate((d) => {
      d.coupons = d.coupons.filter((c) => !selected.includes(c.id));
    });
    logAudit(auth.profile!.full_name, "Deleted coupons", "Coupon", "", `${selected.length} code(s)`);
    toast(`Deleted ${selected.length} coupon${selected.length === 1 ? "" : "s"}.`);
    setSelected([]);
    setConfirmDelete(false);
  };

  const save = () => {
    if (!form.code.trim()) return toast("The coupon needs a code.", "error");
    if (coupons.some((c) => c.code.toLowerCase() === form.code.toLowerCase())) return toast("That code already exists.", "error");
    store.mutate((d) => {
      d.coupons.unshift({
        id: `cp-${Date.now()}`,
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: form.value,
        min_order: form.min_order,
        max_uses: form.max_uses,
        used_count: 0,
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        active: true,
      });
    });
    logAudit(auth.profile!.full_name, "Created coupon", "Coupon", form.code.toUpperCase(), "");
    toast(`Coupon ${form.code.toUpperCase()} is ready.`);
    setCreating(false);
    setForm({ code: "", type: "percentage", value: 10, min_order: 0, max_uses: 100 });
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold"><Ticket className="h-7 w-7 text-brand-600" /> Coupons</h1>
          <p className="mt-1 text-sm text-cocoa/55">Guests apply these at checkout. Usage and expiry are enforced automatically.</p>
        </div>
        <Button onClick={() => setCreating(true)}>New coupon</Button>
      </header>

      <BulkSelectBar allSelected={allSelected} someSelected={someSelected} count={selected.length} total={coupons.length} onToggleAll={toggleAll} label="coupons">
        <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)} disabled={selected.length === 0}>
          <Trash2 className="h-3.5 w-3.5" /> Delete ({selected.length})
        </Button>
      </BulkSelectBar>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {coupons.map((c) => {
          const pct = Math.min(100, Math.round((c.used_count / Math.max(1, c.max_uses)) * 100));
          const expired = new Date(c.ends_at) < new Date();
          return (
            <li key={c.id} className={`relative overflow-hidden rounded-2xl border-2 border-dashed bg-white p-5 shadow-card ${selected.includes(c.id) ? "border-brand-500 bg-brand-50/40" : "border-brand-300"}`}>
              <div className="absolute left-0 top-0 flex h-full w-10 items-center justify-center border-r border-brand-200/60 bg-stone-50/70">
                <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleOne(c.id)} aria-label={`Select ${c.code}`} className="h-4 w-4 rounded accent-brand-600" />
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(c.code);
                  toast(`${c.code} copied.`);
                }}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-cocoa/40 hover:bg-brand-50 hover:text-brand-700"
                aria-label={`Copy ${c.code}`}
              >
                <Copy className="h-4 w-4" />
              </button>
              <p className="pl-8 font-mono text-xl font-extrabold tracking-wider text-brand-700">{c.code}</p>
              <p className="mt-1 pl-8 text-sm font-semibold">{c.type === "percentage" ? `${c.value}% off` : `${fmtRWF(c.value)} off`}{c.min_order > 0 && <span className="font-normal text-cocoa/50"> · min {fmtRWF(c.min_order)}</span>}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1.5 flex items-center justify-between text-xs text-cocoa/50">
                <span>{c.used_count}/{c.max_uses} redeemed</span>
                <span>until {new Date(c.ends_at).toLocaleDateString()}</span>
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Badge tone={expired ? "red" : c.active ? "green" : "neutral"}>{expired ? "Expired" : c.active ? "Active" : "Paused"}</Badge>
                <button
                  onClick={() => store.mutate((d) => {
                    const cc = d.coupons.find((x) => x.id === c.id);
                    if (cc) cc.active = !cc.active;
                  })}
                  disabled={expired}
                  className="ml-auto rounded-lg px-2.5 py-1 text-xs font-bold text-cocoa/60 ring-1 ring-cocoa/15 hover:bg-stone-50 disabled:opacity-40"
                >
                  {c.active ? "Pause" : "Resume"}
                </button>
                <button
                  onClick={() => toggleOne(c.id)}
                  className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                  aria-label={`${selected.includes(c.id) ? "Deselect" : "Select for delete"} ${c.code}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${selected.length} coupon${selected.length === 1 ? "" : "s"}?`}
        message="Guests will no longer be able to apply these at checkout."
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={removeSelected}
      />

      <Modal open={creating} onClose={() => setCreating(false)} title="New coupon">
        <div className="space-y-4">
          <Input label="Coupon code *" name="couponCode" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="MOTO2026" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" name="couponType" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Coupon["type"] })}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed (RWF)</option>
            </Select>
            <Input label="Value" name="couponValue" type="number" min={1} value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Minimum order (RWF)" name="couponMin" type="number" min={0} value={form.min_order} onChange={(e) => setForm({ ...form, min_order: Number(e.target.value) })} />
            <Input label="Max uses" name="couponMax" type="number" min={1} value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: Number(e.target.value) })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={save}>Create coupon</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
