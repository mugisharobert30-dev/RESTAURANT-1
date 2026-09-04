import type { CleanupTarget, ResetTarget } from "./types";

export interface PurgeSource {
  orders: Array<{ id: string; status: string; created_at: string }>;
  reservations: Array<{ id: string; status: string; created_at: string }>;
  reviews: Array<{ id: string; created_at: string }>;
  notifications: Array<{ id: string; read: boolean; created_at: string }>;
  auditLogs: Array<{ id: string; created_at: string }>;
  movements: Array<{ id: string; created_at: string }>;
  contactMessages: Array<{ id: string; handled: boolean; created_at: string }>;
  coupons?: Array<{ id: string; starts_at: string }>;
  promotions?: Array<{ id: string; starts_at: string }>;
}

export function cutoffFor(days: number): number {
  return days > 0 ? Date.now() - days * 86_400_000 : Number.POSITIVE_INFINITY;
}

function ts(iso: string | undefined): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

export function deletableIds(d: PurgeSource, target: CleanupTarget, cutoff: number): string[] {
  const old = (iso: string) => ts(iso) < cutoff;
  switch (target) {
    case "orders":
      return d.orders.filter((o) => (o.status === "completed" || o.status === "cancelled") && old(o.created_at)).map((o) => o.id);
    case "reservations":
      return d.reservations.filter((r) => ["completed", "cancelled", "no_show"].includes(r.status) && old(r.created_at)).map((r) => r.id);
    case "reviews":
      return d.reviews.filter((r) => old(r.created_at)).map((r) => r.id);
    case "notifications":
      return d.notifications.filter((n) => n.read && old(n.created_at)).map((n) => n.id);
    case "auditLogs":
      return d.auditLogs.filter((l) => old(l.created_at)).map((l) => l.id);
    case "movements":
      return d.movements.filter((m) => old(m.created_at)).map((m) => m.id);
    case "contactMessages":
      return d.contactMessages.filter((m) => m.handled && old(m.created_at)).map((m) => m.id);
  }
}

export function deletableIdsHard(d: PurgeSource, target: ResetTarget, cutoff: number): string[] {
  const old = (iso: string) => ts(iso) < cutoff;
  switch (target) {
    case "orders":
      return d.orders.filter((o) => old(o.created_at)).map((o) => o.id);
    case "reservations":
      return d.reservations.filter((r) => old(r.created_at)).map((r) => r.id);
    case "reviews":
      return d.reviews.filter((r) => old(r.created_at)).map((r) => r.id);
    case "notifications":
      return d.notifications.filter((n) => old(n.created_at)).map((n) => n.id);
    case "auditLogs":
      return d.auditLogs.filter((l) => old(l.created_at)).map((l) => l.id);
    case "movements":
      return d.movements.filter((m) => old(m.created_at)).map((m) => m.id);
    case "contactMessages":
      return d.contactMessages.filter((m) => old(m.created_at)).map((m) => m.id);
    case "coupons":
      return (d.coupons ?? []).filter((c) => old(c.starts_at)).map((c) => c.id);
    case "promotions":
      return (d.promotions ?? []).filter((p) => old(p.starts_at)).map((p) => p.id);
  }
}
