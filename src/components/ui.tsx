"use client";

import { Children, forwardRef, isValidElement, useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type ChangeEvent, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cx } from "@/lib/format";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  loading,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm active:scale-[.98]",
    secondary: "bg-leaf-700 text-white hover:bg-leaf-800 shadow-sm active:scale-[.98]",
    outline: "border border-cocoa/20 bg-white text-cocoa hover:border-brand-500 hover:text-brand-700",
    ghost: "text-cocoa/80 hover:bg-cocoa/5",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-leaf-600 text-white hover:bg-leaf-700",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-9 w-9",
  };
  return (
    <button className={cx(base, variants[variant], sizes[size], className)} disabled={loading || props.disabled} {...props}>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string }>(
  function Input({ label, error, hint, id, className, ...props }, ref) {
    const inputId = id ?? props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-cocoa">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cx(
            "h-10 w-full rounded-xl border bg-white px-3 text-sm text-cocoa placeholder:text-cocoa/40 focus:outline-none focus:ring-2 focus:ring-brand-500/60",
            error ? "border-red-400" : "border-cocoa/15",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
        {!error && hint && <p className="mt-1 text-xs text-cocoa/50">{hint}</p>}
      </div>
    );
  }
);

export function Select({
  label,
  error,
  id,
  className,
  value,
  onChange,
  options,
  name,
  children,
  disabled,
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, "options"> & {
  label?: string;
  error?: string;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const opts = useMemo(() => {
    if (options) return options;
    const parsed: Array<{ value: string; label: string }> = [];
    Children.forEach(children, (child) => {
      if (isValidElement(child) && child.type === "option") {
        const v = (child.props as { value?: unknown }).value;
        parsed.push({ value: String(v ?? ""), label: String((child.props as { children?: ReactNode }).children ?? "") });
      }
    });
    return parsed;
  }, [options, children]);

  const selected = opts.find((o) => String(o.value) === String(value));

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full">
      {label && (
        <label id={`${id ?? name}-label`} className="mb-1.5 block text-sm font-medium text-cocoa">
          {label}
        </label>
      )}
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        aria-labelledby={label ? `${id ?? name}-label` : undefined}
        onClick={() => setOpen((o) => !o)}
        className={cx(
          "relative flex h-10 w-full items-center justify-between rounded-xl border bg-white pl-3 pr-9 text-left text-sm text-cocoa transition-all",
          error
            ? "border-red-400"
            : "border-cocoa/15 hover:border-brand-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
          open ? "border-brand-500 ring-2 ring-brand-500/20" : "",
          disabled && "cursor-not-allowed opacity-50 hover:border-cocoa/15",
          className
        )}
      >
        <span className={selected ? "" : "text-cocoa/40"}>{selected?.label ?? ""}</span>
        <ChevronDown className={cx("pointer-events-none absolute right-3 h-4 w-4 text-cocoa/40 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-full min-w-max max-w-xs">
          <ul
            role="listbox"
            aria-labelledby={label ? `${id ?? name}-label` : undefined}
            className="max-h-52 overflow-auto rounded-xl border border-cocoa/10 bg-white p-1 shadow-xl animate-fadeIn"
          >
            {opts.map((o) => {
              const isSel = String(o.value) === String(value);
              return (
                <li key={o.value} role="option" aria-selected={isSel}>
                  <button
                    type="button"
                    onClick={() => {
                      const e = { target: { value: o.value } } as unknown as ChangeEvent<HTMLSelectElement>;
                      onChange?.(e);
                      setOpen(false);
                    }}
                    className={cx(
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors",
                      isSel ? "bg-brand-600 font-semibold text-white" : "text-cocoa hover:bg-brand-50 hover:text-brand-800 hover:font-medium"
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{o.label}</span>
                    {isSel && <Check className="h-3.5 w-3.5 shrink-0 text-brand-600" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, id, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id ?? props.name} className="mb-1.5 block text-sm font-medium text-cocoa">
          {label}
        </label>
      )}
      <textarea
        id={id ?? props.name}
        rows={3}
        className={cx(
          "w-full rounded-xl border border-cocoa/15 bg-white px-3 py-2 text-sm text-cocoa placeholder:text-cocoa/40 focus:outline-none focus:ring-2 focus:ring-brand-500/60",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

const badgeTones = {
  neutral: "bg-stone-100 text-stone-700 ring-stone-200",
  green: "bg-leaf-100 text-leaf-800 ring-leaf-200",
  amber: "bg-brand-100 text-brand-800 ring-brand-200",
  blue: "bg-sky-100 text-sky-800 ring-sky-200",
  red: "bg-red-100 text-red-800 ring-red-200",
  purple: "bg-purple-100 text-purple-800 ring-purple-200",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof badgeTones; children: ReactNode }) {
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1", badgeTones[tone])}>{children}</span>;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-2xl border border-cocoa/8 bg-white shadow-card", className)}>{children}</div>;
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center p-0 sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-cocoa/60 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div className={cx("relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-xl animate-fadeUp", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-cocoa/8 bg-white px-5 py-4">
          <h2 className="font-display text-lg font-bold text-cocoa">{title}</h2>
          <button onClick={onClose} aria-label="Close dialog" className="rounded-lg p-1.5 text-cocoa/60 hover:bg-cocoa/5 hover:text-cocoa">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-cocoa/70">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function EmptyState({ icon, title, message, action }: { icon?: ReactNode; title: string; message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cocoa/15 bg-white px-6 py-14 text-center">
      {icon && <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">{icon}</div>}
      <h3 className="font-display text-lg font-bold text-cocoa">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-cocoa/60">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cx("relative overflow-hidden rounded-xl bg-stone-200/70", className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cx("animate-spin", className ?? "h-5 w-5")} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="h-8 w-8 text-brand-500" />
    </div>
  );
}

export function StatCard({ label, value, sub, icon, tone = "brand" }: { label: string; value: ReactNode; sub?: string; icon?: ReactNode; tone?: "brand" | "leaf" | "sky" | "red" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    leaf: "bg-leaf-100 text-leaf-700",
    sky: "bg-sky-100 text-sky-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-cocoa/50">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-cocoa">{value}</p>
          {sub && <p className="mt-1 text-xs text-cocoa/50">{sub}</p>}
        </div>
        {icon && <div className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tones[tone])}>{icon}</div>}
      </div>
    </Card>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, center }: { eyebrow?: string; title: string; subtitle?: string; center?: boolean }) {
  return (
    <div className={cx("max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">{eyebrow}</p>}
      <h2 className="mt-2 font-display text-3xl font-bold text-cocoa md:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-cocoa/60 md:text-lg">{subtitle}</p>}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, active, onChange }: { tabs: Array<{ value: T; label: string; count?: number }>; active: T; onChange: (t: T) => void }) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1.5 rounded-xl bg-stone-100 p-1">
      {tabs.map((tb) => (
        <button
          key={tb.value}
          role="tab"
          aria-selected={active === tb.value}
          onClick={() => onChange(tb.value)}
          className={cx(
            "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
            active === tb.value ? "bg-white text-cocoa shadow-sm" : "text-cocoa/60 hover:text-cocoa"
          )}
        >
          {tb.label}
          {typeof tb.count === "number" && <span className="ml-1.5 text-xs text-cocoa/50">{tb.count}</span>}
        </button>
      ))}
    </div>
  );
}
