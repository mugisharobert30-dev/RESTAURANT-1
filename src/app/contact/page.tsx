"use client";

import { useState } from "react";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { store } from "@/lib/store";
import { useStoreData } from "@/hooks/use-store";
import { useToast } from "@/context/toast-context";
import { Button, Input, Select, Textarea } from "@/components/ui";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };

export default function ContactPage() {
  const settings = useStoreData((d) => d.settings);
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "General question", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Please tell us your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email so we can reply.";
    if (form.message.trim().length < 10) e.message = "A few more details would help us help you.";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    store.mutate((d) => {
      d.contactMessages.unshift({
        id: `msg-${Date.now()}`,
        ...form,
        handled: false,
        created_at: new Date().toISOString(),
      });
      d.notifications.unshift({
        id: `ntf-${Date.now()}`,
        target: "admin",
        title: "New contact message",
        body: `${form.name}: ${form.subject}`,
        kind: "message",
        read: false,
        link: "/admin/settings",
        created_at: new Date().toISOString(),
      });
    });
    setSent(true);
    toast("Message sent! We usually reply within a day.");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl font-extrabold">Contact Us</h1>
        <p className="mt-2 text-cocoa/60">Questions, events, catering or feedback — we read everything and answer quickly.</p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <section aria-label="Contact form" className="rounded-2xl border border-cocoa/10 bg-white p-6 shadow-card sm:p-8">
          {sent ? (
            <div className="py-8 text-center animate-fadeUp">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-leaf-100 text-leaf-700"><Send className="h-6 w-6" /></div>
              <h2 className="mt-4 font-display text-2xl font-bold">Murakoze! Message received.</h2>
              <p className="mt-2 text-sm text-cocoa/60">Our team will get back to you within one working day. Urgent? Call {settings.phone}.</p>
              <Button variant="outline" className="mt-6" onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", subject: "General question", message: "" }); }}>
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Your name *" name="cname" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
                <Input label="Email *" name="cemail" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Phone (optional)" name="cphone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <Select label="Subject" name="csubject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  <option>General question</option>
                  <option>Catering & events</option>
                  <option>Order support</option>
                  <option>Reservation support</option>
                  <option>Lost item</option>
                  <option>Feedback</option>
                  <option>Partnership</option>
                </Select>
              </div>
              <Textarea label="Message *" name="cmessage" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} error={errors.message} placeholder="Tell us how we can help…" />
              <Button type="submit" size="lg"><Send className="h-4 w-4" /> Send message</Button>
            </form>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-cocoa/10 bg-white p-6 shadow-card text-sm">
            <ul className="space-y-4">
              <li className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" /><span><strong>Find us</strong><br />{settings.address}<br />{settings.district}</span></li>
              <li className="flex gap-3"><Phone className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" /><span><strong>Call us</strong><br /><a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="text-brand-700 hover:underline">{settings.phone}</a><br /><a href={`tel:${settings.phone_secondary.replace(/\s/g, "")}`} className="text-brand-700 hover:underline">{settings.phone_secondary}</a></span></li>
              <li className="flex gap-3"><Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" /><span><strong>Email</strong><br /><a href={`mailto:${settings.email}`} className="text-brand-700 hover:underline">{settings.email}</a></span></li>
            </ul>
          </div>

          <div className="rounded-2xl border border-cocoa/10 bg-white p-6 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-cocoa/50"><Clock className="h-4 w-4 text-brand-600" /> Opening hours</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {DAYS.map((day) => (
                <li key={day} className="flex justify-between">
                  <span>{DAY_LABELS[day]}</span>
                  <span className="font-semibold">{settings.opening_hours[day]?.open} – {settings.opening_hours[day]?.close}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="overflow-hidden rounded-2xl border border-cocoa/10 shadow-card">
            <iframe
              title="Map to Luwombo Restaurant, Kimihurura, Kigali"
              src="https://www.openstreetmap.org/export/embed.html?bbox=30.075%2C-1.958%2C30.095%2C-1.938&layer=mapnik&marker=-1.9441%2C30.0619"
              className="h-64 w-full"
              loading="lazy"
            />
          </div>

          <a href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent("Hello Luwombo Restaurant! ")}`}
             target="_blank" rel="noreferrer"
             className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] font-bold text-white shadow-card transition-all hover:brightness-105 active:scale-[.98]">
            Chat with Luwombo on WhatsApp
          </a>
        </aside>
      </div>
    </div>
  );
}
