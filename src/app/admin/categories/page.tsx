"use client";

import { useState } from "react";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { logAudit } from "@/lib/db";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { slugify } from "@/lib/format";
import type { Category } from "@/lib/types";
import { Badge, Button, ConfirmDialog, Input, Modal, Textarea } from "@/components/ui";

export default function AdminCategoriesPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const categories = useStoreData((d) => d.categories);
  const menuItems = useStoreData((d) => d.menuItems);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const save = () => {
    if (!form.name.trim()) return;
    store.mutate((d) => {
      if (editing) {
        const c = d.categories.find((x) => x.id === editing.id);
        if (c) {
          c.name = form.name.trim();
          c.description = form.description.trim();
        }
      } else {
        d.categories.push({
          id: `cat-${Date.now()}`,
          name: form.name.trim(),
          slug: slugify(form.name),
          description: form.description.trim(),
          sort_order: Math.max(0, ...d.categories.map((c) => c.sort_order)) + 1,
          active: true,
        });
      }
    });
    logAudit(auth.profile!.full_name, editing ? "Updated category" : "Created category", "Category", form.name, "");
    toast(editing ? "Category updated." : "Category created.");
    setEditing(null);
    setCreating(false);
    setForm({ name: "", description: "" });
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold"><Layers className="h-7 w-7 text-brand-600" /> Categories</h1>
          <p className="mt-1 text-sm text-cocoa/55">{categories.length} categories organize your menu for guests.</p>
        </div>
        <Button onClick={() => { setForm({ name: "", description: "" }); setCreating(true); }}><Plus className="h-4 w-4" /> Add category</Button>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.slice().sort((a, b) => a.sort_order - b.sort_order).map((c) => (
          <li key={c.id} className="rounded-2xl border border-cocoa/10 bg-white p-4 shadow-card">
            <div className="flex items-start justify-between">
              <p className="font-bold">{c.name}</p>
              {!c.active && <Badge tone="red">Hidden</Badge>}
            </div>
            <p className="mt-1 line-clamp-2 min-h-[2rem] text-xs text-cocoa/50">{c.description || "No description."}</p>
            <p className="mt-2 text-xs text-cocoa/45"><strong>{menuItems.filter((m) => m.category_id === c.id).length}</strong> dishes · /{c.slug}</p>
            <div className="mt-3 flex items-center gap-2 border-t border-cocoa/8 pt-3">
              <button onClick={() => { setEditing(c); setForm({ name: c.name, description: c.description ?? "" }); }} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-700 hover:bg-brand-50"><Pencil className="h-3 w-3" /> Edit</button>
              <button onClick={() => store.mutate((d) => {
                const cc = d.categories.find((x) => x.id === c.id);
                if (cc) cc.active = !cc.active;
              })} className="rounded-lg px-2 py-1 text-xs font-bold text-cocoa/60 hover:bg-stone-100">{c.active ? "Hide" : "Show"}</button>
              <button onClick={() => setDeleteTarget(c)} className="ml-auto rounded-lg p-1.5 text-red-600 hover:bg-red-50" aria-label={`Delete ${c.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </li>
        ))}
      </ul>

      <Modal open={creating || !!editing} onClose={() => { setEditing(null); setCreating(false); }} title={editing ? `Edit — ${editing.name}` : "New category"}>
        <div className="space-y-4">
          <Input label="Name *" name="catName" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Seafood" />
          <Textarea label="Short description" name="catDesc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Shown on the menu page header…" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setEditing(null); setCreating(false); }}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save" : "Create"}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete “${deleteTarget?.name}”?`}
        message={`${menuItems.filter((m) => m.category_id === deleteTarget?.id).length} dishes are in this category. They will not be deleted but will need a new category.`}
        confirmLabel="Delete anyway"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            store.mutate((d) => {
              d.categories = d.categories.filter((c) => c.id !== deleteTarget.id);
            });
            toast("Category deleted.");
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
