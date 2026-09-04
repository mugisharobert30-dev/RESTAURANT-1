"use client";

import Link from "next/link";
import { BellOff, CheckCheck } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useStoreData } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { timeAgo, cx } from "@/lib/format";
import { Button, EmptyState } from "@/components/ui";

const KIND_STYLE: Record<string, string> = {
  order: "bg-brand-50 text-brand-700",
  reservation: "bg-sky-50 text-sky-700",
  payment: "bg-green-50 text-green-700",
  promo: "bg-purple-50 text-purple-700",
};

export default function NotificationsPage() {
  const auth = useAuth();
  const notifications = useStoreData((d) => d.notifications);
  const mine = notifications.filter((n) => n.target === "customer" && n.user_id === auth.profile?.id);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Notifications</h1>
          <p className="mt-1 text-sm text-cocoa/60">Order updates, reservation reminders and offers.</p>
        </div>
        {mine.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => store.mutate((d) => d.notifications.forEach((n) => { if (n.user_id === auth.profile?.id && n.target === "customer") n.read = true; }))}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </header>

      {mine.length === 0 ? (
        <EmptyState icon={<BellOff className="h-5 w-5" />} title="Nothing here yet." message="Order something delicious and updates will land here." action={<Link href="/menu"><Button>Explore Menu</Button></Link>} />
      ) : (
        <ul className="space-y-2">
          {mine.map((n) => (
            <li key={n.id}>
              <Link
                href={n.link ?? "/account"}
                onClick={() => store.mutate((d) => {
                  const t = d.notifications.find((x) => x.id === n.id);
                  if (t) t.read = true;
                })}
                className={cx("block rounded-2xl border p-4 shadow-card transition-colors", n.read ? "border-cocoa/8 bg-white opacity-75 hover:bg-stone-50" : "border-brand-200 bg-brand-50/60 hover:bg-brand-50")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{n.title}</p>
                    <p className="mt-0.5 text-sm text-cocoa/65">{n.body}</p>
                  </div>
                  {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" aria-label="Unread" />}
                </div>
                <p className={cx("mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", KIND_STYLE[n.kind] ?? "bg-stone-100 text-stone-600")}>
                  {timeAgo(n.created_at)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
