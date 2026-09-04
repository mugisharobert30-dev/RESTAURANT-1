"use client";

import { useState } from "react";
import { MapPin, Plus, Star } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useStoreData } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { uid } from "@/lib/db";
import type { DeliveryAddress } from "@/lib/types";
import { Badge, Button, Card, EmptyState, Input, Modal } from "@/components/ui";

export default function AddressesPage() {
  const auth = useAuth();
  const addresses = useStoreData((d) => d.addresses);
  const mine = addresses.filter((a) => a.customer_id === auth.profile?.id);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ label: "Home", address_line: "", district: "Gasabo, Kigali", phone: "" });

  const save = () => {
    if (!form.address_line.trim() || !form.phone.trim()) return;
    store.mutate((d) => {
      const isFirst = d.addresses.filter((a) => a.customer_id === auth.profile?.id).length === 0;
      d.addresses.push({
        id: uid("adr"),
        customer_id: auth.profile!.id,
        ...form,
        is_default: isFirst,
      });
    });
    setOpen(false);
    setForm({ label: "Home", address_line: "", district: "Gasabo, Kigali", phone: "" });
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Delivery Addresses</h1>
          <p className="mt-1 text-sm text-cocoa/60">Save addresses so checkout takes seconds.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add address</Button>
      </header>

      {mine.length === 0 ? (
        <EmptyState icon={<MapPin className="h-5 w-5" />} title="No saved addresses yet." message="Add one and we'll remember it for your next delivery." action={<Button onClick={() => setOpen(true)}>Add your first address</Button>} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {mine.map((a) => (
            <li key={a.id}>
              <Card className="p-5">
                <div className="flex items-start justify-between">
                  <p className="flex items-center gap-2 font-bold"><MapPin className="h-4 w-4 text-brand-600" />{a.label}</p>
                  {a.is_default && <Badge tone="green"><Star className="h-3 w-3" /> Default</Badge>}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-cocoa/70">{a.address_line}<br />{a.district}</p>
                <p className="mt-1 text-sm text-cocoa/50">{a.phone}</p>
                <div className="mt-3 flex gap-2 text-xs">
                  {!a.is_default && (
                    <button className="font-bold text-brand-700 hover:underline" onClick={() => store.mutate((d) => {
                      d.addresses.forEach((x) => (x.is_default = x.id === a.id));
                    })}>Set as default</button>
                  )}
                  <button
                    className="ml-auto font-semibold text-red-600 hover:underline"
                    onClick={() => store.mutate((d) => {
                      d.addresses = d.addresses.filter((x) => x.id !== a.id);
                    })}
                  >
                    Remove
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add delivery address">
        <div className="space-y-4">
          <Input label="Label" name="addrLabel" placeholder="Home, Office, Mum's place…" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <Input label="Street / house / landmark *" name="addrLine" placeholder="KG 11 Ave, House 24, near Kimihurura Roundabout" value={form.address_line} onChange={(e) => setForm({ ...form, address_line: e.target.value })} />
          <Input label="District / sector" name="addrDistrict" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
          <Input label="Phone *" name="addrPhone" type="tel" placeholder="+250 788 123 456" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save address</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
