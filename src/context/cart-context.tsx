"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { MenuItem } from "@/lib/types";

export interface CartLine {
  key: string;
  menu_item_id: string;
  slug: string;
  name: string;
  unit_price: number;
  quantity: number;
  options: string[];
  special_instructions?: string;
}

interface CartCtx {
  lines: CartLine[];
  count: number;
  subtotal: number;
  add: (item: MenuItem, quantity?: number, options?: string[], specialInstructions?: string) => void;
  setQuantity: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (o: boolean) => void;
  tableLabel: string | null;
  setTableLabel: (t: string | null) => void;
}

const Ctx = createContext<CartCtx>({
  lines: [],
  count: 0,
  subtotal: 0,
  add: () => {},
  setQuantity: () => {},
  removeLine: () => {},
  clear: () => {},
  open: false,
  setOpen: () => {},
  tableLabel: null,
  setTableLabel: () => {},
});

const CART_KEY = "luwombo_cart_v1";
const TABLE_KEY = "luwombo_table_v1";

function loadCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]") as CartLine[];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [tableLabel, setTableLabelState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(loadCart());
    const t = window.localStorage.getItem(TABLE_KEY);
    setTableLabelState(t);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CART_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const setTableLabel = (t: string | null) => {
    setTableLabelState(t);
    if (t) window.localStorage.setItem(TABLE_KEY, t);
    else window.localStorage.removeItem(TABLE_KEY);
  };

  const add: CartCtx["add"] = (item, quantity = 1, options = [], specialInstructions) => {
    const optionTotal = options.reduce((sum, o) => {
      const opt = item.customization_groups.flatMap((g) => g.options).find((op) => op.name === o);
      return sum + (opt?.price ?? 0);
    }, 0);
    const priceWithOptions = item.price + optionTotal;
    setLines((ls) => {
      const signature = `${item.id}|${options.join(",")}|${specialInstructions ?? ""}`;
      const existingIdx = ls.findIndex((l) => l.key === signature);
      if (existingIdx >= 0) {
        const copy = [...ls];
        copy[existingIdx] = { ...copy[existingIdx], quantity: copy[existingIdx].quantity + quantity };
        return copy;
      }
      return [
        ...ls,
        {
          key: signature,
          menu_item_id: item.id,
          slug: item.slug,
          name: item.name,
          unit_price: priceWithOptions,
          quantity,
          options,
          special_instructions: specialInstructions,
        },
      ];
    });
  };

  const setQuantity = (key: string, qty: number) =>
    setLines((ls) => (qty <= 0 ? ls.filter((l) => l.key !== key) : ls.map((l) => (l.key === key ? { ...l, quantity: qty } : l))));

  const removeLine = (key: string) => setLines((ls) => ls.filter((l) => l.key !== key));
  const clear = () => setLines([]);

  const value = useMemo<CartCtx>(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      subtotal: lines.reduce((s, l) => s + l.unit_price * l.quantity, 0),
      add,
      setQuantity,
      removeLine,
      clear,
      open,
      setOpen,
      tableLabel,
      setTableLabel,
    }),
    [lines, open, tableLabel]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCart = () => useContext(Ctx);
