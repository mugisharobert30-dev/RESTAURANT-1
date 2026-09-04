"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Clock, MailOpen, Plus, Save, Settings2, Trash2 } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { logAudit } from "@/lib/db";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { fmtDate, timeAgo, cx } from "@/lib/format";
import type { FaqItem, GalleryPhoto } from "@/lib/types";
import { GalleryImage } from "@/components/food-image";
import { Badge, Button, ConfirmDialog, Input, Modal, Select, Tabs, Textarea } from "@/components/ui";

type TabKey = "restaurant" | "delivery" | "faqs" | "messages" | "gallery";

const GALLERY_GROUPS: Array<{ value: GalleryPhoto["group"]; label: string }> = [
  { value: "food", label: "Food" },
  { value: "interior", label: "Our spaces" },
  { value: "events", label: "Events" },
  { value: "team", label: "Team" },
];

const GALLERY_ICONS: Array<{ value: string; label: string }> = [
  { value: "soup", label: "Soup" },
  { value: "flame", label: "Flame" },
  { value: "citrus", label: "Citrus" },
  { value: "sun", label: "Sun" },
  { value: "home", label: "Home" },
  { value: "lamp", label: "Lamp" },
  { value: "partyPopper", label: "Party" },
  { value: "users", label: "Guests" },
  { value: "chefHat", label: "Chef" },
  { value: "handHeart", label: "Hospitality" },
];

const COLOR_PRESETS: Array<[string, string]> = [
  ["#B45309", "#78350F"],
  ["#EA580C", "#7C2D12"],
  ["#166534", "#14532D"],
  ["#7C3AED", "#3B0764"],
  ["#BE185D", "#500724"],
  ["#0369A1", "#082F49"],
  ["#15803D", "#052E16"],
  ["#65A30D", "#1A2E05"],
];

export default function AdminSettingsPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const settings = useStoreData((d) => d.settings);
  const faqs = useStoreData((d) => d.faqs);
  const messages = useStoreData((d) => d.contactMessages);
  const gallery = useStoreData((d) => d.gallery);
  const [tab, setTab] = useState<TabKey>("restaurant");
  const [form, setForm] = useState(settings);
  const [faqModal, setFaqModal] = useState<FaqItem | null>(null);
  const [faqCreating, setFaqCreating] = useState(false);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "" });
  const [deleteFaq, setDeleteFaq] = useState<FaqItem | null>(null);
  const [newZone, setNewZone] = useState("");
  const [dirty, setDirty] = useState(false);
  const [galleryModal, setGalleryModal] = useState<GalleryPhoto | null>(null);
  const [galleryCreating, setGalleryCreating] = useState(false);
  const [galleryForm, setGalleryForm] = useState({ title: "", group: "food" as GalleryPhoto["group"], icon: "soup", from: "#B45309", to: "#78350F", image_url: "" });
  const [deleteGallery, setDeleteGallery] = useState<GalleryPhoto | null>(null);

  const patch = (u: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...u }));
    setDirty(true);
  };

  const save = () => {
    store.mutate((d) => {
      d.settings = { ...form, auto_cleanup: d.settings.auto_cleanup };
    });
    logAudit(auth.profile!.full_name, "Updated settings", "RestaurantSettings", "settings", "");
    toast("Settings saved.");
    setDirty(false);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold"><Settings2 className="h-7 w-7 text-brand-600" /> Settings</h1>
          <p className="mt-1 text-sm text-cocoa/55">Restaurant profile, delivery configuration, FAQs and the guest message inbox.</p>
        </div>
        {tab !== "messages" && tab !== "faqs" && tab !== "gallery" && (
          <Button onClick={save} disabled={!dirty}>
            <Save className="h-4 w-4" /> {dirty ? "Save changes" : "Saved"}
          </Button>
        )}
      </header>

      <Tabs<TabKey>
        tabs={[
          { value: "restaurant", label: "Restaurant" },
          { value: "delivery", label: "Delivery" },
          { value: "faqs", label: "FAQs", count: faqs.length },
          { value: "gallery", label: "Gallery", count: gallery.length },
          { value: "messages", label: "Messages", count: messages.filter((m) => !m.handled).length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {(tab === "restaurant" || tab === "delivery") && (
        <div className="grid gap-4 lg:grid-cols-2">
          {tab === "restaurant" ? (
            <>
              <section className="rounded-2xl border border-cocoa/10 bg-white p-5 shadow-card">
                <h2 className="font-display text-lg font-bold">Profile</h2>
                <div className="mt-4 space-y-4">
                  <Input label="Restaurant name" name="stName" value={form.name} onChange={(e) => patch({ name: e.target.value })} />
                  <Input label="Tagline" name="stTagline" value={form.tagline} onChange={(e) => patch({ tagline: e.target.value })} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Address" name="stAddress" value={form.address} onChange={(e) => patch({ address: e.target.value })} />
                    <Input label="District" name="stDistrict" value={form.district} onChange={(e) => patch({ district: e.target.value })} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Phone" name="stPhone" value={form.phone} onChange={(e) => patch({ phone: e.target.value })} />
                    <Input label="Secondary phone" name="stPhone2" value={form.phone_secondary} onChange={(e) => patch({ phone_secondary: e.target.value })} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Email" name="stEmail" type="email" value={form.email} onChange={(e) => patch({ email: e.target.value })} />
                    <Input label="WhatsApp number" name="stWa" value={form.whatsapp} onChange={(e) => patch({ whatsapp: e.target.value })} />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-cocoa/10 bg-white p-5 shadow-card">
                <h2 className="font-display text-lg font-bold">Operations</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input label="Tax rate (%)" name="stTax" type="number" value={form.tax_rate * 100} onChange={(e) => patch({ tax_rate: Number(e.target.value) / 100 })} />
                  <Select label="Currency" name="stCurrency" value={form.currency} onChange={(e) => patch({ currency: e.target.value })}>
                    <option value="RWF">RWF — Rwandan Franc</option>
                    <option value="USD">USD — US Dollar</option>
                  </Select>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold sm:col-span-2">
                    <input type="checkbox" checked={form.tax_included} onChange={(e) => patch({ tax_included: e.target.checked })} className="h-4 w-4 rounded accent-leaf-600" />
                    Menu prices already include tax
                  </label>
                  <Input label="Reservation slot length (min)" name="stSlot" type="number" value={form.reservation_slot_minutes} onChange={(e) => patch({ reservation_slot_minutes: Number(e.target.value) })} />
                  <Input label="Max party size bookable online" name="stParty" type="number" value={form.max_party_online} onChange={(e) => patch({ max_party_online: Number(e.target.value) })} />
                  <Input label="Wi-Fi password (for table cards)" name="stWifi" value={form.wifi_password} onChange={(e) => patch({ wifi_password: e.target.value })} className="sm:col-span-2" />
                </div>

                <h3 className="mt-6 flex items-center gap-1.5 font-display font-bold"><Clock className="h-4 w-4 text-brand-600" /> Opening hours</h3>
                <div className="mt-3 space-y-2">
                  {Object.entries(form.opening_hours).map(([day, h]) => (
                    <div key={day} className="flex items-center gap-2 text-sm">
                      <span className="w-20 capitalize text-cocoa/60">{day}</span>
                      <input type="time" aria-label={`${day} opens`} disabled={h.closed} value={h.open} onChange={(e) => patch({ opening_hours: { ...form.opening_hours, [day]: { ...h, open: e.target.value } } })} className="h-9 rounded-lg border border-cocoa/15 px-2 text-sm disabled:bg-stone-100" />
                      <span className="text-cocoa/40">–</span>
                      <input type="time" aria-label={`${day} closes`} disabled={h.closed} value={h.close} onChange={(e) => patch({ opening_hours: { ...form.opening_hours, [day]: { ...h, close: e.target.value } } })} className="h-9 rounded-lg border border-cocoa/15 px-2 text-sm disabled:bg-stone-100" />
                      <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs font-semibold">
                        <input type="checkbox" checked={!h.closed} onChange={(e) => patch({ opening_hours: { ...form.opening_hours, [day]: { ...h, closed: !e.target.checked } } })} className="h-3.5 w-3.5 rounded accent-leaf-600" />
                        Open
                      </label>
                    </div>
                  ))}
                </div>

                <h3 className="mt-6 font-display font-bold">Socials</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {(Object.keys(form.socials) as Array<keyof typeof form.socials>).map((k) => (
                    <Input key={k} label={`Instagram / ${k}`} name={`social_${k}`} value={form.socials[k]} onChange={(e) => patch({ socials: { ...form.socials, [k]: e.target.value } })} placeholder={`https://${k}.com/luwombo`} />
                  ))}
                </div>
              </section>
            </>
          ) : (
            <section className="rounded-2xl border border-cocoa/10 bg-white p-5 shadow-card lg:col-span-2">
              <h2 className="font-display text-lg font-bold">Delivery configuration</h2>
              <div className="mt-4 max-w-xs">
                <Input label="Standard delivery fee (RWF)" name="dzFee" type="number" min={0} value={form.delivery_fee} onChange={(e) => patch({ delivery_fee: Number(e.target.value) })} hint="Applied inside Kigali unless a zone overrides it." />
              </div>
              <h3 className="mt-6 font-display font-bold">Delivery zones</h3>
              <p className="text-sm text-cocoa/50">Neighborhoods you deliver to. Guests see these listed at checkout.</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {form.delivery_zones.map((z) => (
                  <li key={z} className="flex items-center gap-1.5 rounded-full bg-leaf-50 py-1 pl-3 pr-1.5 text-sm font-semibold text-leaf-900 ring-1 ring-leaf-200">
                    {z}
                    <button onClick={() => patch({ delivery_zones: form.delivery_zones.filter((x) => x !== z) })} aria-label={`Remove ${z}`} className="rounded-full p-0.5 hover:bg-leaf-200"><Trash2 className="h-3 w-3" /></button>
                  </li>
                ))}
              </ul>
              <form
                className="mt-3 flex max-w-md gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const z = newZone.trim();
                  if (!z || form.delivery_zones.includes(z)) return;
                  patch({ delivery_zones: [...form.delivery_zones, z] });
                  setNewZone("");
                }}
              >
                <Input name="newZone" value={newZone} onChange={(e) => setNewZone(e.target.value)} placeholder="Add a neighborhood, e.g. Nyamirambo" />
                <Button type="submit" className="mt-[22px] shrink-0"><Plus className="h-4 w-4" /> Add</Button>
              </form>
            </section>
          )}
        </div>
      )}

      {tab === "faqs" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setFaqForm({ question: "", answer: "" }); setFaqCreating(true); }}><Plus className="h-4 w-4" /> New FAQ</Button>
          </div>
          {faqs.map((f) => (
            <article key={f.id} className="rounded-2xl border border-cocoa/10 bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold">{f.question}</h3>
                {!f.visible && <Badge tone="red">Hidden</Badge>}
              </div>
              <p className="mt-1 text-sm text-cocoa/60">{f.answer}</p>
              <div className="mt-3 flex items-center gap-2 border-t border-cocoa/8 pt-3">
                <button onClick={() => { setFaqForm({ question: f.question, answer: f.answer }); setFaqModal(f); }} className="rounded-lg px-2.5 py-1 text-xs font-bold text-brand-700 hover:bg-brand-50">Edit</button>
                <button onClick={() => store.mutate((d) => {
                  const ff = d.faqs.find((x) => x.id === f.id);
                  if (ff) ff.visible = !ff.visible;
                })} className="rounded-lg px-2.5 py-1 text-xs font-bold text-cocoa/60 ring-1 ring-cocoa/15 hover:bg-stone-50">{f.visible ? "Hide" : "Show"}</button>
                <button onClick={() => setDeleteFaq(f)} className="ml-auto rounded-lg p-1.5 text-red-600 hover:bg-red-50" aria-label={`Delete FAQ`}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === "messages" && (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id} className={cx("rounded-2xl border bg-white p-4 shadow-card transition-opacity", m.handled && "opacity-60")}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <strong>{m.name}</strong>
                <a href={`mailto:${m.email}`} className="text-sm text-brand-700 hover:underline">{m.email}</a>
                <span className="text-sm text-cocoa/50">{m.phone}</span>
                <span className="ml-auto text-xs text-cocoa/40">{fmtDate(m.created_at)} · {timeAgo(m.created_at)}</span>
              </div>
              <p className="mt-1 text-sm font-semibold">{m.subject}</p>
              <p className="mt-1 text-sm text-cocoa/65">{m.message}</p>
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" variant={m.handled ? "outline" : "success"} onClick={() => {
                  store.mutate((d) => {
                    const mm = d.contactMessages.find((x) => x.id === m.id);
                    if (mm) mm.handled = !mm.handled;
                  });
                  if (!m.handled) toast("Marked as handled.");
                }}>
                  <MailOpen className="h-3.5 w-3.5" /> {m.handled ? "Reopen" : "Mark handled"}
                </Button>
                <button onClick={() => store.mutate((d) => {
                  d.contactMessages = d.contactMessages.filter((x) => x.id !== m.id);
                })} className="ml-auto rounded-lg p-1.5 text-red-600 hover:bg-red-50" aria-label="Delete message"><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
          {messages.length === 0 && <p className="rounded-2xl border border-dashed border-cocoa/20 bg-white p-12 text-center text-sm text-cocoa/45">No guest messages yet.</p>}
        </ul>
      )}

      {tab === "gallery" && (
        <div className="space-y-3">
          <div className="flex items-center justify-end">
            <Button size="sm" onClick={() => { setGalleryForm({ title: "", group: "food", icon: "soup", from: "#B45309", to: "#78350F", image_url: "" }); setGalleryCreating(true); }}><Plus className="h-4 w-4" /> New photo</Button>
          </div>
          <p className="text-sm text-cocoa/50">These appear on the public Gallery page. Drag order with the arrows and pick a gradient + icon for each photo.</p>
          <ul className="space-y-3">
            {gallery.map((g, i) => (
              <li key={g.id} className="flex items-center gap-4 rounded-2xl border border-cocoa/10 bg-white p-3 shadow-card">
                <div className="flex flex-col gap-1">
                  <button onClick={() => store.mutate((d) => {
                    const arr = d.gallery;
                    if (i > 0) { const t = arr[i - 1]; arr[i - 1] = arr[i]; arr[i] = t; }
                  })} disabled={i === 0} className="rounded p-1 text-cocoa/40 hover:bg-stone-100 disabled:opacity-20" aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button onClick={() => store.mutate((d) => {
                    const arr = d.gallery;
                    if (i < arr.length - 1) { const t = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = t; }
                  })} disabled={i === gallery.length - 1} className="rounded p-1 text-cocoa/40 hover:bg-stone-100 disabled:opacity-20" aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></button>
                </div>
                <GalleryImage gradient={g.gradient} icon={g.icon} title={g.title} image_url={g.image_url} className="h-16 w-24 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{g.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">{GALLERY_GROUPS.find((x) => x.value === g.group)?.label ?? g.group}</Badge>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => { setGalleryForm({ title: g.title, group: g.group, icon: g.icon, from: g.gradient[0], to: g.gradient[1], image_url: g.image_url ?? "" }); setGalleryModal(g); }} className="rounded-lg px-2.5 py-1 text-xs font-bold text-brand-700 hover:bg-brand-50">Edit</button>
                  <button onClick={() => setDeleteGallery(g)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50" aria-label={`Delete ${g.title}`}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </li>
            ))}
          </ul>
          {gallery.length === 0 && <p className="rounded-2xl border border-dashed border-cocoa/20 bg-white p-12 text-center text-sm text-cocoa/45">No photos yet. Add your first one.</p>}
        </div>
      )}

      <Modal open={galleryCreating || !!galleryModal} onClose={() => { setGalleryModal(null); setGalleryCreating(false); }} title={galleryModal ? "Edit photo" : "New photo"}>
        <div className="space-y-4">
          <Input label="Title *" name="galTitle" value={galleryForm.title} onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })} placeholder="Sunday family buffet" />
          <div>
            <p className="mb-1.5 text-sm font-medium text-cocoa">Photo (optional)</p>
            <div className="flex items-center gap-3">
              <GalleryImage gradient={[galleryForm.from, galleryForm.to]} icon={galleryForm.icon} title={galleryForm.title || "Photo"} image_url={galleryForm.image_url || undefined} className="h-16 w-24 shrink-0 rounded-lg" />
              <label className="flex h-9 cursor-pointer items-center justify-center rounded-lg border border-brand-600 px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                {galleryForm.image_url ? "Change image" : "Choose file"}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!file.type.startsWith("image/")) return toast("Please choose an image file.", "error");
                  if (file.size > 1.5 * 1024 * 1024) return toast("Keep images under 1.5 MB (local storage limit).", "error");
                  const reader = new FileReader();
                  reader.onload = () => setGalleryForm((f) => ({ ...f, image_url: String(reader.result) }));
                  reader.readAsDataURL(file);
                }} />
              </label>
              {galleryForm.image_url && (
                <button onClick={() => setGalleryForm((f) => ({ ...f, image_url: "" }))} className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">Remove</button>
              )}
            </div>
            <p className="mt-1 text-xs text-cocoa/45">Leave empty to keep the gradient + icon placeholder.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Group" name="galGroup" value={galleryForm.group} onChange={(e) => setGalleryForm({ ...galleryForm, group: e.target.value as GalleryPhoto["group"] })}>
              {GALLERY_GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </Select>
            <Select label="Icon" name="galIcon" value={galleryForm.icon} onChange={(e) => setGalleryForm({ ...galleryForm, icon: e.target.value })}>
              {GALLERY_ICONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Gradient from" name="galFrom" type="color" value={galleryForm.from} onChange={(e) => setGalleryForm({ ...galleryForm, from: e.target.value })} />
            <Input label="Gradient to" name="galTo" type="color" value={galleryForm.to} onChange={(e) => setGalleryForm({ ...galleryForm, to: e.target.value })} />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-cocoa">Quick gradient presets</p>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map(([from, to], idx) => (
                <button key={idx} type="button" onClick={() => setGalleryForm((f) => ({ ...f, from, to }))} aria-label="Apply gradient" className="h-8 w-8 rounded-full ring-1 ring-cocoa/10 transition-transform hover:scale-110" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cocoa/10 p-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-cocoa/60">Preview</p>
              <p className="truncate text-sm font-semibold">{galleryForm.title || "Untitled photo"}</p>
            </div>
            <GalleryImage gradient={[galleryForm.from, galleryForm.to]} icon={galleryForm.icon} title={galleryForm.title} image_url={galleryForm.image_url || undefined} className="h-14 w-20 rounded-lg" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setGalleryModal(null); setGalleryCreating(false); }}>Cancel</Button>
            <Button onClick={() => {
              if (!galleryForm.title.trim()) return toast("Give the photo a title.", "error");
              store.mutate((d) => {
                if (galleryModal) {
                  const g = d.gallery.find((x) => x.id === galleryModal.id);
                  if (g) {
                    g.title = galleryForm.title.trim();
                    g.group = galleryForm.group;
                    g.icon = galleryForm.icon;
                    g.gradient = [galleryForm.from, galleryForm.to];
                    g.image_url = galleryForm.image_url || undefined;
                  }
                } else {
                  d.gallery.push({ id: `ph-${Date.now()}`, title: galleryForm.title.trim(), group: galleryForm.group, icon: galleryForm.icon, gradient: [galleryForm.from, galleryForm.to], image_url: galleryForm.image_url || undefined });
                }
              });
              logAudit(auth.profile!.full_name, galleryModal ? "Updated gallery photo" : "Added gallery photo", "Gallery", galleryForm.title.trim(), "");
              toast(galleryModal ? "Photo updated." : "Photo added to the gallery.");
              setGalleryModal(null);
              setGalleryCreating(false);
              setGalleryForm({ title: "", group: "food", icon: "soup", from: "#B45309", to: "#78350F", image_url: "" });
            }}>{galleryModal ? "Save" : "Add photo"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={faqCreating || !!faqModal} onClose={() => { setFaqModal(null); setFaqCreating(false); }} title={faqModal ? "Edit FAQ" : "New FAQ"}>
        <div className="space-y-4">
          <Input label="Question *" name="faqQ" value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} placeholder="Do you cater for events?" />
          <Textarea label="Answer *" name="faqA" rows={4} value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setFaqModal(null); setFaqCreating(false); }}>Cancel</Button>
            <Button onClick={() => {
              if (!faqForm.question.trim() || !faqForm.answer.trim()) return toast("Fill in both fields.", "error");
              store.mutate((d) => {
                if (faqModal) {
                  const f = d.faqs.find((x) => x.id === faqModal.id);
                  if (f) {
                    f.question = faqForm.question.trim();
                    f.answer = faqForm.answer.trim();
                  }
                } else {
                  d.faqs.push({ id: `faq-${Date.now()}`, question: faqForm.question.trim(), answer: faqForm.answer.trim(), visible: true });
                }
              });
              toast(faqModal ? "FAQ updated." : "FAQ published.");
              setFaqModal(null);
              setFaqCreating(false);
            }}>{faqModal ? "Save" : "Publish"}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteFaq}
        title="Delete this FAQ?"
        message="Guests will no longer see it on the FAQ page."
        onCancel={() => setDeleteFaq(null)}
        onConfirm={() => {
          if (!deleteFaq) return;
          store.mutate((d) => {
            d.faqs = d.faqs.filter((f) => f.id !== deleteFaq.id);
          });
          toast("FAQ deleted.");
          setDeleteFaq(null);
        }}
      />

      <ConfirmDialog
        open={!!deleteGallery}
        title="Remove this gallery photo?"
        message="It will disappear from the public Gallery page."
        onCancel={() => setDeleteGallery(null)}
        onConfirm={() => {
          if (!deleteGallery) return;
          store.mutate((d) => {
            d.gallery = d.gallery.filter((g) => g.id !== deleteGallery.id);
          });
          logAudit(auth.profile!.full_name, "Deleted gallery photo", "Gallery", deleteGallery.title, "");
          toast("Photo removed from the gallery.");
          setDeleteGallery(null);
        }}
      />
    </div>
  );
}
