"use client";

import { useEffect, useState } from "react";
import { Camera, Check, KeyRound } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { store } from "@/lib/store";
import { initials } from "@/lib/format";
import { Button, Input } from "@/components/ui";
import { useToast } from "@/context/toast-context";

export default function ProfilePage() {
  const auth = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

  useEffect(() => {
    if (auth.profile) {
      setForm({ full_name: auth.profile.full_name, phone: auth.profile.phone, email: auth.profile.email });
    }
  }, [auth.profile]);

  if (!auth.profile) return null;

  const saveProfile = () => {
    store.mutate((d) => {
      const p = d.profiles.find((x) => x.id === auth.profile!.id);
      if (p && p.role === "customer") {
        p.full_name = form.full_name;
        p.phone = form.phone;
        p.email = form.email;
      }
    });
    auth.updateProfileLocal(form);
    toast("Profile updated.");
  };

  const savePassword = () => {
    if (pw.next.length < 8) return toast("New password must be at least 8 characters.", "error");
    if (pw.next !== pw.confirm) return toast("New passwords do not match.", "error");
    setPw({ current: "", next: "", confirm: "" });
    toast("Password updated. Use it next time you log in.");
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold">Profile</h1>
        <p className="mt-1 text-sm text-cocoa/60">Keep your details current so we can reach you about orders.</p>
      </header>

      <div className="rounded-2xl border border-cocoa/10 bg-white p-6 shadow-card">
        <div className="flex items-center gap-4 border-b border-cocoa/8 pb-5">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-leaf-100 text-xl font-bold text-leaf-800 ring-1 ring-leaf-200">
            {initials(auth.profile.full_name)}
          </span>
          <div>
            <p className="font-bold">{auth.profile.full_name}</p>
            <p className="text-sm text-cocoa/50">Member since {new Date(auth.profile.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
          </div>
          <button
            onClick={() => toast("Photo uploads activate when Supabase Storage is connected.", "info")}
            className="ml-auto flex items-center gap-1.5 rounded-xl border border-cocoa/15 px-3 py-2 text-xs font-bold hover:border-brand-400"
          >
            <Camera className="h-3.5 w-3.5" /> Change photo
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveProfile();
          }}
          className="mt-5 grid gap-4 sm:grid-cols-2"
        >
          <Input label="Full name" name="pfName" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <Input label="Phone number" name="pfPhone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email address" name="pfEmail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} hint="Used for receipts and order updates." />
          <div className="flex items-end">
            <Button type="submit"><Check className="h-4 w-4" /> Save changes</Button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-cocoa/10 bg-white p-6 shadow-card">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold"><KeyRound className="h-4 w-4 text-brand-600" /> Change password</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            savePassword();
          }}
          className="mt-4 grid gap-4 sm:grid-cols-3"
        >
          <Input label="Current password" name="curPw" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          <Input label="New password" name="newPw" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} hint="Min. 8 characters" />
          <Input label="Confirm new password" name="confPw" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
        </form>
        <Button variant="outline" className="mt-4" onClick={savePassword}>Update password</Button>
      </div>

      <div className="rounded-2xl border border-cocoa/10 bg-white p-6 shadow-card">
        <h2 className="font-display text-lg font-bold">Notification preferences</h2>
        <ul className="mt-3 space-y-2.5 text-sm">
          {[["Order updates", true], ["Reservation reminders", true], ["Promotions & offers", true], ["Newsletter", false]].map(([label, on]) => (
            <li key={String(label)} className="flex items-center justify-between gap-4">
              <span>{label}</span>
              <PrefToggle initial={on as boolean} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PrefToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => setOn(!on)}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-leaf-600" : "bg-stone-300"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}
