"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LogIn } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { Button, Input } from "@/components/ui";

function LoginForm() {
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const profile = await login(email, password);
      if (!profile) throw new Error("Invalid email/phone or password.");
      toast(`Welcome back, ${profile.full_name.split(" ")[0]}!`);
      router.push(profile.role === "customer" ? next : "/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-cocoa/10 bg-white p-8 shadow-card animate-fadeUp">
        <h1 className="font-display text-3xl font-extrabold">Welcome back</h1>
        <p className="mt-1 text-sm text-cocoa/60">Log in to order faster, track orders and manage reservations.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="mt-6 space-y-4"
        >
          <Input label="Email or phone" name="email" type="text" autoComplete="username" placeholder="chantal@example.rw" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required error={error || undefined} />
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs font-semibold text-brand-700 hover:underline">Forgot password?</Link>
          </div>
          <Button type="submit" size="lg" loading={loading} className="w-full"><LogIn className="h-5 w-5" /> Log in</Button>
        </form>

        <p className="mt-6 text-center text-sm text-cocoa/60">
          New to Luwombo? <Link href="/register" className="font-bold text-brand-700 hover:underline">Create an account</Link>
        </p>

        <p className="mt-4 text-center text-xs text-cocoa/40">
          Restaurant staff? Use the dedicated{" "}
          <Link href="/admin/login" className="font-semibold text-brand-700 hover:underline">Admin Login</Link>.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
