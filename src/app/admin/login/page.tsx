"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { Button, Input } from "@/components/ui";

function AdminLoginForm() {
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactor, setTwoFactor] = useState("");
  const [needs2fa, setNeeds2fa] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const profile = await login(email, password);
      if (!profile) throw new Error("Invalid email or staff code.");
      if (!["superadmin", "admin", "manager", "kitchen", "waiter", "cashier", "delivery"].includes(profile.role)) {
        setError("This account does not have staff access.");
        setLoading(false);
        return;
      }
      if (!needs2fa && (profile.role === "admin" || profile.role === "superadmin")) {
        setNeeds2fa(true);
        setLoading(false);
        toast("Enter any 6 digits to simulate your 2FA app for this demo.", "info");
        return;
      }
      if (needs2fa && (profile.role === "admin" || profile.role === "superadmin") && !/^\d{6}$/.test(twoFactor)) {
        setError("Enter the 6-digit code from your authenticator app.");
        setLoading(false);
        return;
      }
      toast(`Karibu, ${profile.full_name.split(" ")[0]}!`);
      router.push(params.get("next") ?? "/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cocoa px-4" style={{ background: "linear-gradient(135deg,#241A12,#203C1D)" }}>
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl animate-fadeUp">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-leaf-700 text-white"><ShieldCheck className="h-6 w-6" /></span>
          <div>
            <h1 className="font-display text-2xl font-extrabold">Staff & Admin Login</h1>
            <p className="text-xs text-cocoa/50">Luwombo Restaurant management platform</p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="mt-7 space-y-4">
          <Input label="Work email" name="staffEmail" type="email" autoComplete="username" placeholder="you@luwombo.rw" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" name="staffPw" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {needs2fa && (
            <Input label="Two-factor code" name="tfa" inputMode="numeric" maxLength={6} placeholder="123456" hint="Simulated 2FA — enter any 6 digits." value={twoFactor} onChange={(e) => setTwoFactor(e.target.value.replace(/\D/g, ""))} />
          )}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}
          <Button type="submit" size="lg" loading={loading} className="w-full"><Lock className="h-5 w-5" /> Secure sign in</Button>
        </form>

        <details className="mt-6 rounded-xl bg-stone-50 p-3 text-xs text-cocoa/60 ring-1 ring-stone-200">
          <summary className="cursor-pointer font-bold">Demo staff accounts</summary>
          <ul className="mt-2 space-y-1">
            <li><strong>Super Admin:</strong> root@luwombo.rw / super1234</li>
            <li><strong>Admin:</strong> admin@luwombo.rw / admin1234</li>
            <li><strong>Manager:</strong> manager@luwombo.rw / staff1234</li>
            <li><strong>Kitchen:</strong> chef@luwombo.rw / staff1234</li>
            <li><strong>Waiter:</strong> waiter@luwombo.rw / staff1234</li>
            <li><strong>Cashier:</strong> cashier@luwombo.rw / staff1234</li>
          </ul>
        </details>

        <p className="mt-5 text-center text-xs text-cocoa/40">
          Customer? <Link href="/login" className="font-semibold text-brand-700 hover:underline">Log in here</Link>. Activity on this portal is audited.
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
