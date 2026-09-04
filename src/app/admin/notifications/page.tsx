"use client";

import { useMemo, useState } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { timeAgo, cx } from "@/lib/format";
import type { AppNotification } from "@/lib/types";
import { Badge, Button, ConfirmDialog, EmptyState } from "@/components/ui";
import { BulkSelectBar } from "@/components/admin/bulk-select";

type Kind = AppNotification["kind"];

const KIND_TONES: Record<Kind, "blue" | "green" | "amber" | "red" | "purple" | "neutral"> = {
  order: "blue",
  reservation: "purple",
  payment: "green",
  inventory: "amber",
  review: "blue",
  message: "neutral",
  table_request: "amber",
  promo: "green",
};

export default function AdminNotificationsPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const notifications = useStoreData((d) => d.notifications);
  const [showRead, setShowRead] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const scoped = useMemo(
    () =>
      notifications
        .filter((n) => n.target === "admin" || n.target === auth.profile?.id)
        .filter((n) => (showRead ? true : !n.read))
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [notifications, showRead, auth.profile?.id]
  );

  const allSelected = scoped.length > 0 && scoped.every((n) => selected.includes(n.id));
  const someSelected = scoped.some((n) => selected.includes(n.id));
  const toggleAll = () => setSelected(allSelected ? [] : scoped.map((n) => n.id));
  const toggleOne = (id: string) => setSelected((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  const markSelectedRead = () => {
    store.mutate((d) => {
      d.notifications.forEach((n) => {
        if (selected.includes(n.id)) n.read = true;
      });
    });
    toast(`Marked ${selected.length} notification${selected.length === 1 ? "" : "s"} read.`);
    setSelected([]);
  };

  const removeSelected = () => {
    store.mutate((d) => {
      d.notifications = d.notifications.filter((n) => !selected.includes(n.id));
    });
    toast(`Deleted ${selected.length} notification${selected.length === 1 ? "" : "s"}.`);
    setSelected([]);
    setConfirmDelete(false);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold"><Bell className="h-7 w-7 text-brand-600" /> Notifications</h1>
          <p className="mt-1 text-sm text-cocoa/55">Order events, stock alerts and system messages for the team.</p>
        </div>
        <Button variant="outline" onClick={() => {
          store.mutate((d) => {
            d.notifications.forEach((n) => {
              if (n.target === "admin") n.read = true;
            });
          });
          toast("All caught up.");
        }}>
          <CheckCheck className="h-4 w-4" /> Mark all read
        </Button>
      </header>

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={!showRead} onChange={(e) => setShowRead(!e.target.checked)} className="h-4 w-4 rounded accent-leaf-600" />
        Hide already-read
      </label>

      {scoped.length === 0 ? (
        <EmptyState icon={<Bell className="h-5 w-5" />} title="Inbox zero." message="New order and kitchen alerts will land here." />
      ) : (
        <>
          <BulkSelectBar allSelected={allSelected} someSelected={someSelected} count={selected.length} total={scoped.length} onToggleAll={toggleAll} label="notifications">
            <Button variant="outline" size="sm" onClick={markSelectedRead} disabled={selected.length === 0}>
              <CheckCheck className="h-3.5 w-3.5" /> Mark read ({selected.length})
            </Button>
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)} disabled={selected.length === 0}>
              <Trash2 className="h-3.5 w-3.5" /> Delete ({selected.length})
            </Button>
          </BulkSelectBar>
          <ul className="space-y-2">
            {scoped.map((n) => (
              <li key={n.id} className={cx("flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-card transition-colors", n.read ? "border-cocoa/8 opacity-70" : "border-brand-200", selected.includes(n.id) && "ring-1 ring-brand-500")}>
                <input type="checkbox" checked={selected.includes(n.id)} onChange={() => toggleOne(n.id)} aria-label={`Select ${n.title}`} className="mt-0.5 h-4 w-4 rounded accent-brand-600" />
                <span className={cx("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", n.read ? "bg-cocoa/20" : "bg-brand-500")} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 text-sm font-bold">{n.title} <Badge tone={KIND_TONES[n.kind]}>{n.kind}</Badge></p>
                  <p className="text-sm text-cocoa/60">{n.body}</p>
                  <p className="mt-1 text-xs text-cocoa/35">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read && (
                  <button onClick={() => store.mutate((d) => {
                    const nn = d.notifications.find((x) => x.id === n.id);
                    if (nn) nn.read = true;
                  })} className="rounded-lg px-2 py-1 text-xs font-bold text-brand-700 hover:bg-brand-50">Mark read</button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${selected.length} notification${selected.length === 1 ? "" : "s"}?`}
        message="The selected alerts will be permanently removed."
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={removeSelected}
      />
    </div>
  );
}
