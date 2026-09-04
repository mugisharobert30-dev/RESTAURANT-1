"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, UtensilsCrossed } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { logAudit } from "@/lib/db";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { slugify, cx } from "@/lib/format";
import type { MenuItem } from "@/lib/types";
import { Badge, Button, ConfirmDialog, EmptyState, Input, Modal, Select, Textarea } from "@/components/ui";
import { FoodImage } from "@/components/food-image";
import { BulkSelectBar } from "@/components/admin/bulk-select";

const EMPTY_FORM = {
  name: "",
  category_id: "",
  price: 5000,
  description: "",
  ingredients: "",
  allergens: "",
  prep_time_min: 20,
  portion_info: "Serves one",
  spicy_level: 0 as MenuItem["spicy_level"],
  is_vegetarian: false,
  is_vegan: false,
  available: true,
  featured: false,
  popular: false,
  image_url: "",
};

export default function AdminMenuPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const menuItems = useStoreData((d) => d.menuItems);
  const categories = useStoreData((d) => d.categories);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const filtered = useMemo(() =>
    menuItems.filter((m) => {
      if (catFilter !== "all" && m.category_id !== catFilter) return false;
      if (query && !`${m.name} ${m.description}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    }), [menuItems, query, catFilter]);

  const visibleIds = filtered.map((m) => m.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const someSelected = visibleIds.some((id) => selected.includes(id));
  const toggleAll = () =>
    setSelected(allSelected ? selected.filter((id) => !visibleIds.includes(id)) : [...selected, ...visibleIds].filter((id, i, a) => a.indexOf(id) === i));
  const toggleOne = (id: string) => setSelected((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  const removeSelected = () => {
    store.mutate((d) => {
      d.menuItems = d.menuItems.filter((m) => !selected.includes(m.id));
    });
    logAudit(auth.profile!.full_name, "Deleted dishes", "MenuItem", "", `${selected.length} dish(es)`);
    toast(`Removed ${selected.length} dish${selected.length === 1 ? "" : "es"}.`);
    setSelected([]);
    setConfirmBulkDelete(false);
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, category_id: categories[0]?.id ?? "" });
    setCreating(true);
  };

  const openEdit = (m: MenuItem) => {
    setForm({
      name: m.name,
      category_id: m.category_id,
      price: m.price,
      description: m.description,
      ingredients: m.ingredients.join(", "),
      allergens: m.allergens.join(", "),
      prep_time_min: m.prep_time_min,
      portion_info: m.portion_info,
      spicy_level: m.spicy_level,
      is_vegetarian: m.is_vegetarian,
      is_vegan: m.is_vegan,
      available: m.available,
      featured: m.featured,
      popular: m.popular,
      image_url: m.image_url ?? "",
    });
    setEditing(m);
  };

  const save = () => {
    if (!form.name.trim() || form.price <= 0 || !form.description.trim()) {
      toast("Name, positive price and a description are required.", "error");
      return;
    }
    const payload = {
      name: form.name.trim(),
      slug: editing ? editing.slug : `${slugify(form.name)}-${Date.now().toString(36).slice(-4)}`,
      category_id: form.category_id || categories[0]?.id,
      price: Math.round(form.price),
      description: form.description.trim(),
      ingredients: form.ingredients.split(",").map((s) => s.trim()).filter(Boolean),
      allergens: form.allergens.split(",").map((s) => s.trim()).filter(Boolean),
      prep_time_min: Number(form.prep_time_min) || 15,
      portion_info: form.portion_info,
      spicy_level: form.spicy_level,
      is_vegetarian: form.is_vegetarian,
      is_vegan: form.is_vegan,
      available: form.available,
      featured: form.featured,
      popular: form.popular,
      image_url: form.image_url || undefined,
    };
    store.mutate((d) => {
      if (editing) {
        const idx = d.menuItems.findIndex((m) => m.id === editing.id);
        if (idx >= 0) d.menuItems[idx] = { ...d.menuItems[idx], ...payload };
      } else {
        d.menuItems.unshift({
          id: `mi-${Date.now()}`,
          rating_avg: 0,
          rating_count: 0,
          times_ordered: 0,
          calories: undefined,
          customization_groups: [],
          created_at: new Date().toISOString(),
          ...payload,
        } as MenuItem);
      }
    });
    logAudit(auth.profile!.full_name, editing ? "Updated dish" : "Created dish", "MenuItem", payload.name, `Price ${payload.price} RWF`);
    toast(editing ? `${payload.name} updated.` : `${payload.name} added to the menu.`);
    setEditing(null);
    setCreating(false);
  };

  const remove = () => {
    if (!deleteTarget) return;
    store.mutate((d) => {
      d.menuItems = d.menuItems.filter((m) => m.id !== deleteTarget.id);
    });
    logAudit(auth.profile!.full_name, "Deleted dish", "MenuItem", deleteTarget.name, "");
    toast(`${deleteTarget.name} removed from the menu.`);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Menu Items</h1>
          <p className="mt-1 text-sm text-cocoa/55">{menuItems.length} dishes · {menuItems.filter((m) => !m.available).length} currently unavailable</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add dish</Button>
      </header>

      <div className="flex flex-wrap gap-3">
        <label className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dishes…" type="search" className="h-10 w-full rounded-xl border border-cocoa/15 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
        </label>
        <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Filter by category" className="!w-auto">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<UtensilsCrossed className="h-5 w-5" />} title="No dishes found." message="Adjust your search or add a brand-new dish." action={<Button onClick={openCreate}>Add dish</Button>} />
      ) : (
        <>
          <BulkSelectBar allSelected={allSelected} someSelected={someSelected} count={selected.length} total={filtered.length} onToggleAll={toggleAll} label="dishes">
            <Button variant="danger" size="sm" onClick={() => setConfirmBulkDelete(true)} disabled={selected.length === 0}>
              <Trash2 className="h-3.5 w-3.5" /> Delete ({selected.length})
            </Button>
          </BulkSelectBar>
          <ul className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((m) => (
              <li key={m.id} className={`flex gap-3 rounded-2xl border bg-white p-3 shadow-card ${selected.includes(m.id) ? "border-brand-500 ring-1 ring-brand-300" : "border-cocoa/10"}`}>
                <label className="flex shrink-0 flex-col items-center gap-1 pt-1">
                  <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggleOne(m.id)} aria-label={`Select ${m.name}`} className="h-4 w-4 rounded accent-brand-600" />
                </label>
                <FoodImage item={m} rounded="rounded-xl" className="h-24 w-24 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-bold">{m.name}</p>
                    <span className="shrink-0 font-extrabold">{m.price.toLocaleString()}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-cocoa/50">{categories.find((c) => c.id === m.category_id)?.name}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {!m.available && <Badge tone="red">Unavailable</Badge>}
                    {m.featured && <Badge tone="amber">Featured</Badge>}
                    {m.popular && <Badge tone="blue">Popular</Badge>}
                    {m.is_vegetarian && <Badge tone="green">Veg</Badge>}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <button onClick={() => openEdit(m)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-700 hover:bg-brand-50"><Pencil className="h-3 w-3" /> Edit</button>
                    <button onClick={() => store.mutate((d) => {
                      const mm = d.menuItems.find((x) => x.id === m.id);
                      if (mm) mm.available = !mm.available;
                    })} className="rounded-lg px-2 py-1 text-xs font-bold text-cocoa/60 hover:bg-stone-100">Toggle availability</button>
                    <button onClick={() => toggleOne(m.id)} className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 className="h-3 w-3" />{selected.includes(m.id) ? "Deselect" : "Select"}</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal open={creating || !!editing} onClose={() => { setEditing(null); setCreating(false); }} title={editing ? `Edit — ${editing.name}` : "Add a new dish"} wide>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <Input label="Dish name *" name="miName" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Chicken Luwombo" />
            <Input label="Price (RWF) *" name="miPrice" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Category *" name="miCat" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input label="Prep time (minutes)" name="miPrep" type="number" min={1} value={form.prep_time_min} onChange={(e) => setForm({ ...form, prep_time_min: Number(e.target.value) })} />
          </div>
          <Textarea label="Description *" name="miDesc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What makes this dish special?" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-sm font-medium text-cocoa">Photo (optional)</p>
              <div className="flex items-center gap-3">
                <FoodImage item={{ ...(editing || {}), name: form.name || "Dish", category_id: form.category_id, image_url: form.image_url || undefined, id: editing?.id ?? "", slug: "", description: "", price: 0, ingredients: [], allergens: [], prep_time_min: 0, available: true, featured: false, popular: false, spicy_level: 0, is_vegetarian: false, is_vegan: false, portion_info: "", customization_groups: [], created_at: "" } as MenuItem} rounded="rounded-lg" className="h-16 w-24 shrink-0" />
                <label className="flex h-9 cursor-pointer items-center justify-center rounded-lg border border-brand-600 px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                  {form.image_url ? "Change image" : "Choose file"}
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!file.type.startsWith("image/")) return toast("Please choose an image file.", "error");
                    if (file.size > 1.5 * 1024 * 1024) return toast("Keep images under 1.5 MB (local storage limit).", "error");
                    const reader = new FileReader();
                    reader.onload = () => setForm((f) => ({ ...f, image_url: String(reader.result) }));
                    reader.readAsDataURL(file);
                  }} />
                </label>
                {form.image_url && (
                  <button onClick={() => setForm((f) => ({ ...f, image_url: "" }))} className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">Remove</button>
                )}
              </div>
              <p className="mt-1 text-xs text-cocoa/45">Leave empty to show the category placeholder.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Ingredients (comma separated)" name="miIng" value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} placeholder="Chicken, groundnut paste, banana leaves" />
            <Input label="Allergens (comma separated)" name="miAll" value={form.allergens} onChange={(e) => setForm({ ...form, allergens: e.target.value })} placeholder="Peanuts, Gluten" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Portion info" name="miPortion" value={form.portion_info} onChange={(e) => setForm({ ...form, portion_info: e.target.value })} />
            <Select label="Spice level" name="miSpice" value={String(form.spicy_level)} onChange={(e) => setForm({ ...form, spicy_level: Number(e.target.value) as MenuItem["spicy_level"] })}>
              <option value="0">Not spicy</option>
              <option value="1">Mild</option>
              <option value="2">Medium hot</option>
              <option value="3">Rwandan fire</option>
            </Select>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {([["available", "Available"], ["featured", "Featured"], ["popular", "Popular"], ["is_vegetarian", "Vegetarian"], ["is_vegan", "Vegan"]] as Array<[keyof typeof form, string]>).map(([key, label]) => (
              <label key={String(key)} className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={Boolean(form[key])}
                  onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  className="h-4 w-4 rounded accent-leaf-600"
                />
                {label}
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 border-t border-cocoa/8 pt-4">
            <Button variant="outline" onClick={() => { setEditing(null); setCreating(false); }}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Add to menu"}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete “${deleteTarget?.name}”?`}
        message="This permanently removes the dish from the public menu and admin lists. This cannot be undone."
        confirmLabel="Delete dish"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={remove}
      />

      <ConfirmDialog
        open={confirmBulkDelete}
        title={`Delete ${selected.length} dish${selected.length === 1 ? "" : "es"}?`}
        message="These dishes are permanently removed from the public menu and admin lists. This cannot be undone."
        confirmLabel="Delete dishes"
        onCancel={() => setConfirmBulkDelete(false)}
        onConfirm={removeSelected}
      />
    </div>
  );
}
