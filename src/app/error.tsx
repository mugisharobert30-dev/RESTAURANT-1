"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl" aria-hidden>
        🍲
      </p>
      <h1 className="mt-4 font-display text-3xl font-bold text-cocoa">Something boiled over</h1>
      <p className="mt-2 max-w-md text-cocoa/60">
        An unexpected error occurred. Our kitchen has been notified — please try again.
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-flex h-11 items-center rounded-xl bg-brand-600 px-6 font-semibold text-white transition-colors hover:bg-brand-700"
      >
        Try again
      </button>
    </main>
  );
}
