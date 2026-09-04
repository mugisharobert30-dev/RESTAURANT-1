"use client";

import { useState } from "react";
import { ClipboardList, Plus, ShieldCheck, Trash2, UserCheck } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { logAudit } from "@/lib/db";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { fmtDate, initials } from "@/lib/format";
import { ROLE_LABELS, STAFF_ROLES, type Role } from "@/lib/types";
import { Badge, Button, ConfirmDialog, Modal, Select } from "@/components/ui";

export default function AdminStaffPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const profiles = useStoreData((d) => d.profiles);
  const auditLogs = useStoreData((d) => d.auditLogs);
  const staff = profiles.filter((p) => STAFF_ROLES.includes(p.role));
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", role: "waiter" as Role });
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const isSuper = auth.profile?.role === "superadmin";
  const assignable: Role[] = isSuper
    ? ["admin", "manager", "waiter", "kitchen", "cashier", "delivery"]
    : ["manager", "waiter", "kitchen", "cashier", "delivery"];
  const badgeTone = (r: Role): "neutral" | "green" | "amber" | "blue" | "red" | "purple" =>
    r === "superadmin" ? "red" : r === "admin" ? "purple" : r === "manager" ? "blue" : "green";

  const canRemove = (s: { id: string; role: Role }) =>
    s.id !== auth.profile?.id && (isSuper || (s.role !== "superadmin" && s.role !== "admin"));
  const selectable = staff.filter(canRemove);
  const selectedSet = new Set(selected);
  const allSelected = selectable.length > 0 && selectable.every((s) => selectedSet.has(s.id));
  const someSelected = selectable.some((s) => selectedSet.has(s.id));

  const toggleAll = () => {
    setSelected(allSelected ? selected.filter((id) => !selectable.some((s) => s.id === id)) : [...selected, ...selectable.map((s) => s.id)].filter((id, i, a) => a.indexOf(id) === i));
  };
  const toggleOne = (id: string) => setSelected((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  const revokeSelected = () => {
    store.mutate((d) => {
      d.profiles = d.profiles.filter((p) => !selected.includes(p.id));
    });
    logAudit(auth.profile!.full_name, "Revoked staff access", "Profile", "", `${selected.length} account(s)`);
    toast(`Revoked access for ${selected.length} staff member${selected.length === 1 ? "" : "s"}.`);
    setSelected([]);
    setConfirmBulk(false);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold"><UserCheck className="h-7 w-7 text-brand-600" /> Staff</h1>
          <p className="mt-1 text-sm text-cocoa/55">{staff.length} team members with portal access. Roles limit what each person sees.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="danger" onClick={() => selected.length > 0 && setConfirmBulk(true)} disabled={selected.length === 0}>
            <Trash2 className="h-4 w-4" /> Revoke ({selected.length})
          </Button>
          <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add staff member</Button>
        </div>
      </header>

      <div className="flex items-center gap-3 pb-1">
        <input type="checkbox" checked={allSelected} ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }} onChange={toggleAll} aria-label="Select all staff" className="h-4 w-4 rounded accent-brand-600" />
        <span className="text-sm text-cocoa/55">{selected.length > 0 ? `${selected.length} selected` : "Select to revoke access in bulk"}</span>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {staff.map((s) => (
          <li key={s.id} className={`rounded-2xl border border-cocoa/10 bg-white p-5 shadow-card ${selected.includes(s.id) ? "ring-1 ring-brand-500/50" : ""}`}>
            <div className="flex items-center gap-3">
              {canRemove(s) && (
                <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleOne(s.id)} aria-label={`Select ${s.full_name}`} className="h-4 w-4 rounded accent-brand-600" />
              )}
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">{initials(s.full_name)}</span>
              <div className="min-w-0">
                <p className="truncate font-bold">{s.full_name}</p>
                <p className="truncate text-xs text-cocoa/50">{s.email}</p>
              </div>
              <Badge tone={badgeTone(s.role)}>{ROLE_LABELS[s.role]}</Badge>
            </div>
            <p className="mt-3 text-sm text-cocoa/60">{s.phone}</p>
            <div className="mt-3 flex items-center justify-between border-t border-cocoa/8 pt-3">
              <Select value={s.role} onChange={(e) => {
                const role = e.target.value as Role;
                store.mutate((d) => {
                  const ss = d.profiles.find((x) => x.id === s.id);
                  if (ss) ss.role = role;
                });
                logAudit(auth.profile!.full_name, "Changed role", "Profile", s.full_name, `→ ${ROLE_LABELS[role]}`);
                toast(`${s.full_name.split(" ")[0]} is now ${ROLE_LABELS[role]}.`);
              }} disabled={!isSuper && (s.role === "superadmin" || s.role === "admin")} aria-label={`Role for ${s.full_name}`} className="!w-auto !text-xs">
                {(assignable.includes(s.role) ? assignable : [...assignable, s.role].sort((a, b) => STAFF_ROLES.indexOf(a) - STAFF_ROLES.indexOf(b))).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </Select>
              <button onClick={() => setRemoveTarget(s.id)} disabled={!canRemove(s)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30" aria-label={`Remove ${s.full_name}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <section className="rounded-2xl border border-cocoa/10 bg-white p-5 shadow-card">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold"><ShieldCheck className="h-5 w-5 text-brand-600" /> Recent staff activity</h2>
        <ul className="mt-3 divide-y divide-cocoa/6 text-sm">
          {auditLogs.slice(0, 6).map((l) => (
            <li key={l.id} className="py-2">
              <span className="font-bold">{l.actor}</span> — {l.action} on <span className="font-mono text-xs text-cocoa/50">{l.entity_id || l.entity}</span>
              <span className="ml-2 text-xs text-cocoa/40">{fmtDate(l.created_at)}</span>
            </li>
          ))}
        </ul>
      </section>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add staff member">
        <div className="space-y-4">
          <input placeholder="Full name" aria-label="Full name" className="h-10 w-full rounded-xl border border-cocoa/15 px-3 text-sm" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <input placeholder="Work email" aria-label="Work email" type="email" className="h-10 w-full rounded-xl border border-cocoa/15 px-3 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Phone (+250 …)" aria-label="Phone" className="h-10 w-full rounded-xl border border-cocoa/15 px-3 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Select label="Role" name="staffRole" value={assignable.includes(form.role) ? form.role : "waiter"} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            {assignable.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </Select>
          <p className="text-xs text-cocoa/45">
            {isSuper
              ? <>As Super Admin you can create Administrator accounts. New staff log in with password <strong>admin1234</strong> (admins) or <strong>staff1234</strong> (others).</>
              : <>Demo note: new staff log in with the shared password <strong>staff1234</strong>. Only a Super Admin can create Administrator accounts.</>}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!form.full_name.trim() || !form.email.trim()) return toast("Name and email are required.", "error");
              store.mutate((d) => {
                d.profiles.push({
                  id: `usr-${Date.now()}`,
                  full_name: form.full_name.trim(),
                  email: form.email.trim().toLowerCase(),
                  phone: form.phone.trim() || "+250 700 000 000",
                  role: form.role,
                  active: true,
                  created_at: new Date().toISOString(),
                });
              });
              logAudit(auth.profile!.full_name, "Added staff", "Profile", form.email, ROLE_LABELS[form.role]);
              toast(`${form.full_name.split(" ")[0]} joined the team.`);
              setAdding(false);
              setForm({ full_name: "", email: "", phone: "", role: "waiter" });
            }}>
              <ClipboardList className="h-4 w-4" /> Create account
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!removeTarget}
        title="Revoke portal access?"
        message="The person will no longer be able to log into the management platform."
        confirmLabel="Revoke access"
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (!removeTarget) return;
          store.mutate((d) => {
            d.profiles = d.profiles.filter((p) => p.id !== removeTarget);
          });
          toast("Access revoked.");
          setRemoveTarget(null);
        }}
      />

      <ConfirmDialog
        open={confirmBulk}
        title={`Revoke access for ${selected.length} staff member${selected.length === 1 ? "" : "s"}?`}
        message="None of the selected people will be able to log into the management platform."
        confirmLabel="Revoke access"
        onCancel={() => setConfirmBulk(false)}
        onConfirm={revokeSelected}
      />
    </div>
  );
}
