"use client";

import { useMemo, useState } from "react";
import { History, Search } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { fmtDateTime } from "@/lib/format";
import { Badge } from "@/components/ui";

export default function AdminAuditLogsPage() {
  const auditLogs = useStoreData((d) => d.auditLogs);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() =>
    auditLogs
      .filter((l) => !query || `${l.actor} ${l.action} ${l.entity} ${l.entity_id}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [auditLogs, query]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold"><History className="h-7 w-7 text-brand-600" /> Audit Logs</h1>
          <p className="mt-1 text-sm text-cocoa/55">Every sensitive action is recorded — who did what, when.</p>
        </div>
        <label className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search actor or action…" type="search" className="h-10 w-full rounded-xl border border-cocoa/15 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
        </label>
      </header>

      <div className="overflow-hidden rounded-2xl border border-cocoa/10 bg-white shadow-card">
        <ol className="divide-y divide-cocoa/6">
          {filtered.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm hover:bg-stone-50/70">
              <Badge tone="purple">{l.entity}</Badge>
              <span><strong>{l.actor}</strong> · {l.action}{l.details ? <span className="text-cocoa/45"> — {l.details}</span> : null}</span>
              <span className="ml-auto font-mono text-xs text-cocoa/40">{fmtDateTime(l.created_at)}</span>
            </li>
          ))}
        </ol>
        {filtered.length === 0 && <p className="p-12 text-center text-sm text-cocoa/45">No matching log entries.</p>}
      </div>
    </div>
  );
}
