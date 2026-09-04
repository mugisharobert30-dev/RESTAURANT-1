"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { Button, Input } from "@/components/ui";

export default function RegisterPage() {
  const { register } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = "We would love to know your name.";
    if (!/^(\+?\d[\d\s-]{7,})$/.test(form.phone.trim())) e.phone = "Enter a valid phone number.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (form.password.length < 8) e.password = "At least 8 characters, please.";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await register(form);
      toast("Murakaza neza! Your account is ready.");
      router.push("/account");
    } catch (err) {
      setErrors({ email: err instanceof Error ? err.message : "Could not create account." });
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-cocoa/10 bg-white p-8 shadow-card animate-fadeUp">
        <h1 className="font-display text-3xl font-extrabold">Create your account</h1>
        <p className="mt-1 text-sm text-cocoa/60">Save your details, earn birthday treats and reorder in one tap.</p>

        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="mt-6 space-y-4" noValidate>
          <Input label="Full name *" name="fullName" autoComplete="name" placeholder="Chantal Uwase" value={form.full_name} onChange={(ev) => setForm({ ...form, full_name: ev.target.value })} error={errors.full_name} />
          <Input label="Phone *" name="phone" type="tel" autoComplete="tel" placeholder="+250 788 123 456" value={form.phone} onChange={(ev) => setForm({ ...form, phone: ev.target.value })} error={errors.phone} />
          <Input label="Email *" name="email" type="email" autoComplete="email" placeholder="you@example.rw" value={form.email} onChange={(ev) => setForm({ ...form, email: ev.target.value })} error={errors.email} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Password *" name="password" type="password" autoComplete="new-password" placeholder="Min. 8 characters" value={form.password} onChange={(ev) => setForm({ ...form, password: ev.target.value })} error={errors.password} />
            <Input label="Confirm password *" name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={(ev) => setForm({ ...form, confirm: ev.target.value })} error={errors.confirm} />
          </div>
          <Button type="submit" size="lg" loading={loading} className="w-full"><UserPlus className="h-5 w-5" /> Create account</Button>
        </form>

        <p className="mt-6 text-center text-sm text-cocoa/60">
          Already have an account? <Link href="/login" className="font-bold text-brand-700 hover:underline">Log in</Link>
        </p>
        <p className="mt-3 text-center text-xs leading-relaxed text-cocoa/40">
          By creating an account you agree to our terms and privacy policy. We never share your data.
        </p>
      </div>
    </div>
  );
}
