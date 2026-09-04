"use client";

import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X, Ban } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { fmtRWF } from "@/lib/format";
import { Button, ConfirmDialog } from "@/components/ui";

export function CartDrawer() {
  const cart = useCart();
  const [confirmClear, setConfirmClear] = useState(false);
  if (!cart.open) return null;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div className="absolute inset-0 bg-cocoa/50 animate-fadeIn" onClick={() => cart.setOpen(false)} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-xl animate-slideIn">
        <div className="flex items-center justify-between border-b border-cocoa/8 px-5 py-4">
          <h2 className="font-display text-lg font-bold">Your Cart</h2>
          <button onClick={() => cart.setOpen(false)} aria-label="Close cart" className="rounded-lg p-1.5 hover:bg-cocoa/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        {cart.lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <p className="font-display text-xl font-bold text-cocoa">{cart.tableLabel ? `Table ${cart.tableLabel} · Your cart is empty` : "Your cart is empty"}</p>
            <p className="max-w-xs text-sm text-cocoa/60">Browse the menu and add something delicious — the grill is already warm.</p>
            <Link href="/menu" onClick={() => cart.setOpen(false)} className="mt-2 inline-flex h-11 items-center rounded-xl bg-brand-600 px-6 font-bold text-white hover:bg-brand-700">
              Explore Menu
            </Link>
          </div>
        ) : (
          <>
            {cart.tableLabel && (
              <p className="border-b border-cocoa/8 bg-leaf-50 px-5 py-2.5 text-sm font-medium text-leaf-800">
                Ordering for <strong>Table {cart.tableLabel}</strong> — we will bring it to you.
              </p>
            )}
            <ul className="flex-1 divide-y divide-cocoa/6 overflow-y-auto px-5">
              {cart.lines.map((l) => (
                <li key={l.key} className="flex gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/menu/${l.slug}`} onClick={() => cart.setOpen(false)} className="truncate font-semibold text-cocoa hover:text-brand-700">
                        {l.name}
                      </Link>
                      <button onClick={() => cart.removeLine(l.key)} aria-label={`Remove ${l.name}`} className="shrink-0 rounded-md p-1 text-cocoa/40 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {l.options.length > 0 && <p className="mt-0.5 truncate text-xs text-cocoa/50">{l.options.join(" · ")}</p>}
                    {l.special_instructions && <p className="mt-0.5 italic text-xs text-cocoa/50">"{l.special_instructions}"</p>}
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-cocoa/15">
                        <button onClick={() => cart.setQuantity(l.key, l.quantity - 1)} className="flex h-7 w-7 items-center justify-center text-cocoa/60 hover:text-cocoa" aria-label={`Decrease ${l.name} quantity`}>
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{l.quantity}</span>
                        <button onClick={() => cart.setQuantity(l.key, l.quantity + 1)} className="flex h-7 w-7 items-center justify-center text-cocoa/60 hover:text-cocoa" aria-label={`Increase ${l.name} quantity`}>
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-cocoa">{fmtRWF(l.unit_price * l.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-cocoa/8 bg-stone-50 px-5 py-4">
              <div className="mb-3 flex justify-between text-sm">
                <span className="text-cocoa/60">Subtotal</span>
                <span className="font-bold text-cocoa">{fmtRWF(cart.subtotal)}</span>
              </div>
              <div className="space-y-2">
                <Link
                  href="/checkout"
                  onClick={() => cart.setOpen(false)}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-brand-600 font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
                >
                  Proceed to Checkout
                </Link>
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1" onClick={() => cart.setOpen(false)}>
                    Continue Shopping
                  </Button>
                  <Button variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setConfirmClear(true)}>
                    <Ban className="h-4 w-4" /> Cancel all
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </aside>

      <ConfirmDialog
        open={confirmClear}
        title="Cancel the whole order?"
        message={`Remove all ${cart.count} item${cart.count === 1 ? "" : "s"} from your cart? This cannot be undone.`}
        confirmLabel="Yes, cancel all"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          cart.clear();
          setConfirmClear(false);
        }}
      />
    </div>
  );
}
