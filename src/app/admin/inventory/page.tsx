"use client";

import { useState } from "react";
import { AlertTriangle, ArrowDownUp, PackageSearch, Plus } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { logAudit } from "@/lib/db";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { fmtRWF, timeAgo } from "@/lib/format";
import type { StockMovement } from "@/lib/types";
import { Badge, Button, Card, Input, Modal, Select, StatCard } from "@/components/ui";

export default function AdminInventoryPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const inventory = useStoreData((d) => d.inventory);
  const movements = useStoreData((d) => d.movements);
  const [moving, setMoving] = useState<string | null>(null);
  const [moveType, setMoveType] = useState<StockMovement["type"]>("in");
  const [qty, setQty] = useState(10);
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", unit: "kg", current_stock: 0, min_stock: 5, supplier: "", cost_per_unit: 1000 });

  const lowStock = inventory.filter((i) => i.current_stock < i.min_stock);
  const stockValue = inventory.reduce((s, i) => s + i.current_stock * i.cost_per_unit, 0);

  const submitMove = () => {
    if (!moving || qty === 0) return;
    store.mutate((d) => {
      const item = d.inventory.find((i) => i.id === moving);
      if (!item) return;
      if (moveType === "in") item.current_stock += qty;
      else if (moveType === "out") item.current_stock = Math.max(0, item.current_stock - qty);
      else item.current_stock += qty;
      item.updated_at = new Date().toISOString();
      d.movements.unshift({
        id: `mov-${Date.now()}`,
        inventory_item_id: item.id,
        item_name: item.name,
        type: moveType,
        quantity: Math.abs(qty),
        note: note || (moveType === "in" ? "Restock" : moveType === "out" ? "Kitchen usage" : "Adjustment"),
        created_by: auth.profile!.full_name,
        created_at: new Date().toISOString(),
      });
    });
    logAudit(auth.profile!.full_name, `Stock ${moveType}`, "InventoryItem", moving, `${qty}`);
    toast("Stock updated.");
    setMoving(null);
    setNote("");
    setQty(10);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold"><PackageSearch className="h-7 w-7 text-brand-600" /> Inventory</h1>
          <p className="mt-1 text-sm text-cocoa/55">Track ingredients, suppliers and stock movements.</p>
        </div>
        <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add ingredient</Button>
      </header>

      <section className="grid grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tracked items" value={inventory.length} icon={<PackageSearch className="h-5 w-5" />} />
        <StatCard label="Below minimum" value={lowStock.length} icon={<AlertTriangle className="h-5 w-5" />} tone={lowStock.length ? "red" : "leaf"} sub={lowStock.map((i) => i.name).slice(0, 2).join(", ")} />
        <StatCard label="Stock value" value={fmtRWF(stockValue)} icon={<ArrowDownUp className="h-5 w-5" />} tone="leaf" />
        <StatCard label="Movements logged" value={movements.length} icon={<ArrowDownUp className="h-5 w-5" />} tone="sky" />
      </section>

      {lowStock.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 ring-1 ring-red-200">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm font-semibold text-red-800">Reorder soon: {lowStock.map((i) => `${i.name} (${i.current_stock}/${i.min_stock})`).join(", ")}</p>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="overflow-x-auto rounded-2xl border border-cocoa/10 bg-white shadow-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-cocoa/10 bg-stone-50 text-xs uppercase tracking-wide text-cocoa/45">
                <th className="px-4 py-3 font-bold">Ingredient</th>
                <th className="px-4 py-3 font-bold">Stock</th>
                <th className="px-4 py-3 font-bold">Min</th>
                <th className="px-4 py-3 font-bold">Supplier</th>
                <th className="px-4 py-3 font-bold">Unit cost</th>
                <th className="px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cocoa/6">
              {inventory.map((i) => (
                <tr key={i.id} className={i.current_stock < i.min_stock ? "bg-red-50/40" : undefined}>
                  <td className="px-4 py-3 font-semibold">{i.name}<p className="text-xs font-normal text-cocoa/40">updated {timeAgo(i.updated_at)}</p></td>
                  <td className="px-4 py-3">
                    <span className={i.current_stock < i.min_stock ? "font-extrabold text-red-700" : "font-bold"}>{i.current_stock}</span> {i.unit}
                    {i.current_stock < i.min_stock && <Badge tone="red"><AlertTriangle className="h-3 w-3" /> Low</Badge>}
                  </td>
                  <td className="px-4 py-3 text-cocoa/55">{i.min_stock}</td>
                  <td className="px-4 py-3 text-cocoa/70">{i.supplier}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{fmtRWF(i.cost_per_unit)}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" onClick={() => { setMoving(i.id); setMoveType("in"); }}>Adjust</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Card className="p-4">
          <h2 className="font-display text-lg font-bold">Recent movements</h2>
          <ul className="mt-3 max-h-96 space-y-2.5 overflow-y-auto">
            {movements.slice(0, 12).map((m) => (
              <li key={m.id} className="rounded-xl bg-stone-50 px-3 py-2 text-sm">
                <p className="flex justify-between font-semibold">
                  <span>{m.item_name}</span>
                  <span className={m.type === "in" ? "text-leaf-700" : m.type === "out" ? "text-red-600" : "text-brand-700"}>
                    {m.type === "out" ? "−" : "+"}{m.quantity}
                  </span>
                </p>
                <p className="text-xs text-cocoa/45">{m.note} · {m.created_by.split(" ")[0]} · {timeAgo(m.created_at)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Modal open={!!moving} onClose={() => setMoving(null)} title="Stock movement">
        <div className="space-y-4">
          <Select label="Movement type" name="movType" value={moveType} onChange={(e) => setMoveType(e.target.value as StockMovement["type"])}>
            <option value="in">Stock in (delivery received)</option>
            <option value="out">Stock out (kitchen usage)</option>
            <option value="adjustment">Adjustment (correction)</option>
          </Select>
          <Input label={`Quantity ${inventory.find((i) => i.id === moving)?.unit ?? ""}`} name="movQty" type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          <Input label="Note" name="movNote" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Weekly delivery from supplier…" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMoving(null)}>Cancel</Button>
            <Button onClick={submitMove}>Record movement</Button>
          </div>
        </div>
      </Modal>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add ingredient">
        <div className="space-y-4">
          <Input label="Name *" name="invName" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Sweet potatoes" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Unit" name="invUnit" value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} />
            <Input label="Starting stock" name="invStart" type="number" value={newItem.current_stock} onChange={(e) => setNewItem({ ...newItem, current_stock: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Minimum stock" name="invMin" type="number" value={newItem.min_stock} onChange={(e) => setNewItem({ ...newItem, min_stock: Number(e.target.value) })} />
            <Input label="Cost per unit (RWF)" name="invCost" type="number" value={newItem.cost_per_unit} onChange={(e) => setNewItem({ ...newItem, cost_per_unit: Number(e.target.value) })} />
          </div>
          <Input label="Supplier" name="invSupplier" value={newItem.supplier} onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })} placeholder="Kigali Wholesale Ltd" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!newItem.name.trim()) return toast("Give the ingredient a name.", "error");
              store.mutate((d) => {
                d.inventory.unshift({
                  id: `inv-${Date.now()}`,
                  ...newItem,
                  updated_at: new Date().toISOString(),
                });
              });
              toast(`${newItem.name} is now tracked.`);
              setAdding(false);
              setNewItem({ name: "", unit: "kg", current_stock: 0, min_stock: 5, supplier: "", cost_per_unit: 1000 });
            }}>Add to inventory</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
