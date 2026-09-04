"use client";

import { useState } from "react";
import { KeyRound, Mail } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useToast } from "@/context/toast-context";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-cocoa/10 bg-white p-8 shadow-card">
        {!sent ? (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><KeyRound className="h-6 w-6" /></div>
            <h1 className="mt-4 font-display text-2xl font-extrabold">Reset your password</h1>
            <p className="mt-1 text-sm text-cocoa/60">Enter your account email and we will send you a secure reset link.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
                toast("Reset link sent! Check your inbox.");
              }}
              className="mt-6 space-y-4"
            >
              <Input label="Email address" name="resetEmail" type="email" required placeholder="you@example.rw" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button type="submit" size="lg" className="w-full">Send reset link</Button>
            </form>
          </>
        ) : (
          <div className="py-6 text-center animate-fadeUp">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-leaf-100 text-leaf-700"><Mail className="h-6 w-6" /></div>
            <h2 className="mt-4 font-display text-xl font-bold">Check your inbox</h2>
            <p className="mt-2 text-sm text-cocoa/60">
              If an account exists for <strong>{email}</strong>, a reset link is on its way. It expires in 30 minutes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
