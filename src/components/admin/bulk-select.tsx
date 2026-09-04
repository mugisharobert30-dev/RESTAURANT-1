"use client";

import { useRef, type ReactNode } from "react";
import { cx } from "@/lib/format";

export function BulkSelectBar({
  allSelected,
  someSelected,
  count,
  total,
  onToggleAll,
  children,
  label = "items",
}: {
  allSelected: boolean;
  someSelected: boolean;
  count: number;
  total: number;
  onToggleAll: () => void;
  children?: ReactNode;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  if (ref.current) ref.current.indeterminate = someSelected && !allSelected;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-cocoa/10 bg-white px-3 py-2 shadow-sm">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-cocoa/70">
        <input ref={ref} type="checkbox" checked={allSelected} onChange={onToggleAll} aria-label="Select all" className="h-4 w-4 rounded accent-brand-600" />
        Select all
      </label>
      <span className={cx("text-sm", count > 0 ? "font-bold text-brand-700" : "text-cocoa/45")}>
        {count > 0 ? `${count} of ${total} ${label} selected` : `${total} ${label}`}
      </span>
      {count > 0 && children && <div className="ml-auto flex items-center gap-2">{children}</div>}
    </div>
  );
}
