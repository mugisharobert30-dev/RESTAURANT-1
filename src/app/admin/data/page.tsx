"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestore, CalendarClock, DatabaseBackup, ShieldAlert, Trash2 } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { logAudit } from "@/lib/db";
import { cutoffFor, deletableIds, deletableIdsHard } from "@/lib/cleanup";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  CLEANUP_TARGETS,
  RESET_TARGETS,
  type AutoCleanupConfig,
  type AutoResetConfig,
  type CleanupTarget,
  type ResetTarget,
} from "@/lib/types";
import { Badge, Button, ConfirmDialog, Select } from "@/components/ui";

const AGE_OPTIONS = [
  { value: 7, label: "Older than 7 days" },
  { value: 30, label: "Older than 30 days" },
  { value: 60, label: "Older than 60 days" },
  { value: 90, label: "Older than 90 days" },
  { value: 180, label: "Older than 6 months" },
  { value: 365, label: "Older than 1 year" },
  { value: 0, label: "All time" },
];

function ageLabel(days: number): string {
  return AGE_OPTIONS.find((a) => a.value === days)?.label ?? `Older than ${days} days`;
}

export default function AdminDataPage() {
  const auth = useAuth();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold"><DatabaseBackup className="h-6 w-6 text-brand-600" /> Data &amp; Reset</h1>
        <p className="mt-0.5 text-xs text-cocoa/50">Keep the dashboard light: delete old records by hand or on a schedule, and reset analytics when needed.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <ManualCleanupCard />
        <AutoCleanupCard />
        <ResetNowCard />
        <ScheduledResetCard />
      </div>

      {auth.isSuperAdmin && <FactoryResetCard />}
    </div>
  );
}

function usePurgeSource() {
  const orders = useStoreData((d) => d.orders);
  const reservations = useStoreData((d) => d.reservations);
  const reviews = useStoreData((d) => d.reviews);
  const notifications = useStoreData((d) => d.notifications);
  const auditLogs = useStoreData((d) => d.auditLogs);
  const movements = useStoreData((d) => d.movements);
  const contactMessages = useStoreData((d) => d.contactMessages);
  const coupons = useStoreData((d) => d.coupons);
  const promotions = useStoreData((d) => d.promotions);
  return useMemo(
    () => ({ orders, reservations, reviews, notifications, auditLogs, movements, contactMessages, coupons, promotions }),
    [orders, reservations, reviews, notifications, auditLogs, movements, contactMessages, coupons, promotions]
  );
}

function ManualCleanupCard() {
  const auth = useAuth();
  const { toast } = useToast();
  const source = usePurgeSource();
  const [days, setDays] = useState(90);
  const [targets, setTargets] = useState<CleanupTarget[]>([]);
  const [confirm, setConfirm] = useState(false);

  const counts = useMemo(() => {
    const cutoff = cutoffFor(days);
    return Object.fromEntries(CLEANUP_TARGETS.map((t) => [t.key, deletableIds(source, t.key, cutoff).length]));
  }, [source, days]);
  const total = targets.reduce((s, t) => s + (counts[t] ?? 0), 0);

  const toggle = (key: CleanupTarget) => setTargets((l) => (l.includes(key) ? l.filter((x) => x !== key) : [...l, key]));

  const run = () => {
    if (total === 0) return;
    store.purge(targets, days);
    logAudit(auth.profile!.full_name, "Deleted old data", "System", "cleanup", `${ageLabel(days)}: ${total} record(s)`);
    toast(`Deleted ${total} record${total === 1 ? "" : "s"}.`);
    setConfirm(false);
    setTargets([]);
  };

  return (
    <CompactCard
      icon={<Trash2 className="h-3.5 w-3.5" />}
      title="Delete old data"
      tone="amber"
    >
      <p className="text-[11px] text-cocoa/45 mb-2">Safe mode — active orders &amp; pending messages never touched.</p>
      <TargetList info={CLEANUP_TARGETS} selected={targets} onToggle={toggle} counts={counts} />
      <div className="mt-2 flex flex-wrap items-end gap-2 border-t border-cocoa/6 pt-2">
        <div className="w-44">
          <Select name="cleanupAge" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {AGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
        <Badge tone={total > 0 ? "amber" : "neutral"}>{total} match{total === 1 ? "" : "es"}</Badge>
        <Button variant="danger" size="sm" className="ml-auto" disabled={total === 0} onClick={() => setConfirm(true)}>
          <Trash2 className="h-3 w-3" /> Delete
        </Button>
      </div>
      <ConfirmDialog
        open={confirm}
        title="Delete selected records?"
        message={`This permanently removes ${total} record${total === 1 ? "" : "s"} (${ageLabel(days)}). This cannot be undone.`}
        confirmLabel={`Delete ${total}`}
        onCancel={() => setConfirm(false)}
        onConfirm={run}
      />
    </CompactCard>
  );
}

function AutoCleanupCard() {
  const auth = useAuth();
  const { toast } = useToast();
  const settings = useStoreData((d) => d.settings);
  const source = usePurgeSource();
  const cfg = settings.auto_cleanup;
  const [enabled, setEnabled] = useState(cfg?.enabled ?? false);
  const [days, setDays] = useState(cfg?.older_than_days ?? 90);
  const [targets, setTargets] = useState<CleanupTarget[]>(cfg?.targets ?? []);

  const counts = useMemo(() => {
    const cutoff = cutoffFor(days);
    return Object.fromEntries(CLEANUP_TARGETS.map((t) => [t.key, deletableIds(source, t.key, cutoff).length]));
  }, [source, days]);

  const toggle = (key: CleanupTarget) => setTargets((l) => (l.includes(key) ? l.filter((x) => x !== key) : [...l, key]));

  const save = () => {
    if (enabled && targets.length === 0) return toast("Pick at least one data type.", "error");
    const next: AutoCleanupConfig = { enabled, older_than_days: days, targets };
    store.mutate((d) => {
      d.settings.auto_cleanup = next;
    });
    logAudit(auth.profile!.full_name, "Configured auto-cleanup", "System", "auto-cleanup", enabled ? `${ageLabel(days)}: ${targets.join(", ")}` : "Disabled");
    toast(enabled ? "Automatic cleanup saved." : "Automatic cleanup turned off.");
  };

  return (
    <CompactCard
      icon={<CalendarClock className="h-3.5 w-3.5" />}
      title="Automatic cleanup"
      tone="green"
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-cocoa/70">
        Status
        <Badge tone={enabled ? "green" : "neutral"}>{enabled ? "ON" : "OFF"}</Badge>
      </div>
      <label className="flex cursor-pointer items-center gap-1.5 pb-1.5 text-xs font-semibold text-cocoa/70">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-3.5 w-3.5 rounded accent-leaf-600" />
        Enabled
      </label>
      <TargetList info={CLEANUP_TARGETS} selected={targets} onToggle={toggle} counts={counts} />
      <div className="mt-2 flex flex-wrap items-end gap-2 border-t border-cocoa/6 pt-2">
        <div className="w-44">
          <Select name="autoCleanupAge" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {AGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
        <Button size="sm" className="ml-auto" onClick={save}>{enabled ? "Save schedule" : "Save (off)"}</Button>
      </div>
    </CompactCard>
  );
}

function ResetNowCard() {
  const auth = useAuth();
  const { toast } = useToast();
  const source = usePurgeSource();
  const [days, setDays] = useState(90);
  const [targets, setTargets] = useState<ResetTarget[]>([]);
  const [confirm, setConfirm] = useState(false);

  const counts = useMemo(() => {
    const cutoff = cutoffFor(days);
    return Object.fromEntries(RESET_TARGETS.map((t) => [t.key, deletableIdsHard(source, t.key, cutoff).length]));
  }, [source, days]);
  const total = targets.reduce((s, t) => s + (counts[t] ?? 0), 0);

  const toggle = (key: ResetTarget) => setTargets((l) => (l.includes(key) ? l.filter((x) => x !== key) : [...l, key]));

  const run = () => {
    if (total === 0) return;
    store.purgeHard(targets, days);
    logAudit(auth.profile!.full_name, "Reset data", "System", "reset", `${ageLabel(days)}: ${total} record(s)`);
    toast(`Reset ${total} record${total === 1 ? "" : "s"}.`);
    setConfirm(false);
    setTargets([]);
  };

  return (
    <CompactCard
      icon={<ArchiveRestore className="h-3.5 w-3.5" />}
      title="Reset data now"
      tone="blue"
    >
      <p className="text-[11px] text-cocoa/45 mb-2">No status filters — anything within the timeframe goes.</p>
      <TargetList info={RESET_TARGETS} selected={targets} onToggle={toggle} counts={counts} />
      <div className="mt-2 flex flex-wrap items-end gap-2 border-t border-cocoa/6 pt-2">
        <div className="w-44">
          <Select name="resetAge" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {AGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
        <Badge tone={total > 0 ? "amber" : "neutral"}>{total} match{total === 1 ? "" : "es"}</Badge>
        <Button variant="danger" size="sm" className="ml-auto" disabled={total === 0} onClick={() => setConfirm(true)}>
          Reset now
        </Button>
      </div>
      <ConfirmDialog
        open={confirm}
        title="Reset selected data?"
        message={`This permanently removes ${total} record${total === 1 ? "" : "s"} (${ageLabel(days)}), including active ones. This cannot be undone.`}
        confirmLabel={`Reset ${total}`}
        onCancel={() => setConfirm(false)}
        onConfirm={run}
      />
    </CompactCard>
  );
}

function ScheduledResetCard() {
  const auth = useAuth();
  const { toast } = useToast();
  const settings = useStoreData((d) => d.settings);
  const source = usePurgeSource();
  const cfg = settings.auto_reset;
  const [enabled, setEnabled] = useState(cfg?.enabled ?? false);
  const [days, setDays] = useState(cfg?.older_than_days ?? 180);
  const [targets, setTargets] = useState<ResetTarget[]>(cfg?.targets ?? []);

  const counts = useMemo(() => {
    const cutoff = cutoffFor(days);
    return Object.fromEntries(RESET_TARGETS.map((t) => [t.key, deletableIdsHard(source, t.key, cutoff).length]));
  }, [source, days]);

  const toggle = (key: ResetTarget) => setTargets((l) => (l.includes(key) ? l.filter((x) => x !== key) : [...l, key]));

  const save = () => {
    if (enabled && targets.length === 0) return toast("Pick at least one data type.", "error");
    const next: AutoResetConfig = { enabled, older_than_days: days, targets };
    store.mutate((d) => {
      d.settings.auto_reset = next;
    });
    logAudit(auth.profile!.full_name, "Configured scheduled reset", "System", "auto-reset", enabled ? `${ageLabel(days)}: ${targets.join(", ")}` : "Disabled");
    toast(enabled ? "Scheduled reset saved." : "Scheduled reset turned off.");
  };

  return (
    <CompactCard
      icon={<CalendarClock className="h-3.5 w-3.5" />}
      title="Scheduled reset"
      tone="purple"
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-cocoa/70">
        Status
        <Badge tone={enabled ? "green" : "neutral"}>{enabled ? "ON" : "OFF"}</Badge>
      </div>
      <label className="flex cursor-pointer items-center gap-1.5 pb-1.5 text-xs font-semibold text-cocoa/70">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-3.5 w-3.5 rounded accent-leaf-600" />
        Enabled
      </label>
      <TargetList info={RESET_TARGETS} selected={targets} onToggle={toggle} counts={counts} />
      <div className="mt-2 flex flex-wrap items-end gap-2 border-t border-cocoa/6 pt-2">
        <div className="w-44">
          <Select name="autoResetAge" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {AGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
        <Button size="sm" className="ml-auto" onClick={save}>{enabled ? "Save schedule" : "Save (off)"}</Button>
      </div>
    </CompactCard>
  );
}

function FactoryResetCard() {
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [includeSettings, setIncludeSettings] = useState(false);

  const run = () => {
    setConfirm(false);
    store.reset(!includeSettings);
    toast("Whole system restored to its initial state.");
    router.replace("/admin/login");
  };

  return (
    <section className="rounded-2xl border border-red-200/70 bg-gradient-to-br from-red-50 to-red-50/40 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-sm font-bold text-red-800">Factory reset — whole system</h2>
          <p className="mt-0.5 text-[11px] leading-relaxed text-red-900/60">
            Wipes menu, orders, reviews and analytics back to the original demo dataset. Client and staff accounts are kept. You will be logged out. This cannot be undone.
          </p>
          <label className="mt-2 flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-red-800/70">
            <input
              type="checkbox"
              checked={includeSettings}
              onChange={(e) => setIncludeSettings(e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-red-600"
            />
            Include website settings
          </label>
          <p className="text-[10px] text-red-900/40 ml-5">If unchecked, your name, address, hours and socials are kept.</p>
          <Button variant="danger" size="sm" className="mt-3" onClick={() => setConfirm(true)}>
            <DatabaseBackup className="h-3.5 w-3.5" /> Factory reset everything
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={confirm}
        title="Factory reset the entire system?"
        message={includeSettings
          ? "Everything returns to the original demo state (menu, orders, reviews, analytics, website settings), except client and staff accounts, which are kept. You will be logged out. This cannot be undone."
          : "Everything returns to the original demo state (menu, orders, reviews, analytics) except website settings and client/staff accounts, which are kept. You will be logged out. This cannot be undone."}
        confirmLabel="Wipe everything"
        onCancel={() => setConfirm(false)}
        onConfirm={run}
      />
    </section>
  );
}

const TONE_MAP: Record<string, string> = {
  amber: "bg-amber-50 text-amber-700",
  green: "bg-emerald-50 text-emerald-700",
  blue: "bg-sky-50 text-sky-700",
  purple: "bg-purple-50 text-purple-700",
};

function CompactCard({ icon, title, tone = "amber", children }: { icon: ReactNode; title: string; tone?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col rounded-2xl border border-cocoa/8 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`flex h-6 w-6 items-center justify-center rounded-md ${TONE_MAP[tone] ?? TONE_MAP.amber}`}>{icon}</span>
        <h2 className="font-display text-sm font-bold text-cocoa">{title}</h2>
      </div>
      <div className="mt-2 flex flex-col">{children}</div>
    </section>
  );
}

function TargetList<T extends string>({
  info,
  selected,
  onToggle,
  counts,
}: {
  info: ReadonlyArray<{ key: T; label: string; rule?: string }>;
  selected: T[];
  onToggle: (key: T) => void;
  counts: Record<string, number>;
}) {
  return (
    <ul className="grid gap-1 sm:grid-cols-2">
      {info.map((t) => (
        <li key={t.key}>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-cocoa/8 px-2 py-1.5 text-xs hover:bg-stone-50 transition-colors">
            <input type="checkbox" checked={selected.includes(t.key)} onChange={() => onToggle(t.key)} className="h-3 w-3 shrink-0 rounded accent-leaf-600" />
            <span className="min-w-0 truncate font-medium text-cocoa/80">{t.label}</span>
            <span className="ml-auto shrink-0">
              <Badge tone={(counts[t.key] ?? 0) > 0 ? "amber" : "neutral"}>{counts[t.key] ?? 0}</Badge>
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
