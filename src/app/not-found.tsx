import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-7xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-cocoa">This page slipped out of the basket</h1>
      <p className="mt-2 max-w-md text-cocoa/60">
        The page you are looking for was moved, renamed or never existed — but the brochettes are exactly where you left them.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="inline-flex h-11 items-center rounded-xl bg-brand-600 px-5 font-semibold text-white transition-colors hover:bg-brand-700">
          Back home
        </Link>
        <Link href="/menu" className="inline-flex h-11 items-center rounded-xl border border-cocoa/20 bg-white px-5 font-semibold text-cocoa transition-colors hover:border-brand-500 hover:text-brand-700">
          Browse the menu
        </Link>
      </div>
    </main>
  );
}
