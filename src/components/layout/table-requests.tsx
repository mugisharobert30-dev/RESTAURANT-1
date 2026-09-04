"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BellRing, ReceiptText } from "lucide-react";
import { store } from "@/lib/store";
import { useCart } from "@/context/cart-context";
import { useStoreData } from "@/hooks/use-store";
import { useToast } from "@/context/toast-context";

export function TableRequests() {
  const params = useSearchParams();
  const token = params.get("table");
  const tables = useStoreData((d) => d.tables);
  const { tableLabel, setTableLabel } = useCart();
  const { toast } = useToast();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!token) return;
    const t = tables.find((tb) => tb.qr_token === token);
    if (t) {
      setVisible(true);
      if (t.label !== tableLabel) setTableLabel(t.label);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tables]);

  if (!token || !visible) return null;

  const request = (kind: "waiter" | "bill") => {
    store.mutate((d) => {
      d.notifications.unshift({
        id: `ntf-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
        target: "admin",
        title: kind === "waiter" ? `Table ${tableLabel} calls a waiter` : `Table ${tableLabel} requests the bill`,
        body: kind === "waiter" ? "Guest assistance requested via QR code." : "Guest would like to pay.",
        kind: "table_request",
        read: false,
        created_at: new Date().toISOString(),
      });
    });
    toast(kind === "waiter" ? "A waiter is on the way to your table." : "Your bill request was sent. Murakoze!");
  };

  return (
    <div className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 gap-2 md:bottom-6">
      <button onClick={() => request("waiter")} className="flex items-center gap-2 rounded-full bg-leaf-700 px-5 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:bg-leaf-800 active:scale-95">
        <BellRing className="h-4 w-4" /> Call waiter
      </button>
      <button onClick={() => request("bill")} className="flex items-center gap-2 rounded-full bg-cocoa px-5 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:bg-black active:scale-95">
        <ReceiptText className="h-4 w-4" /> Request bill
      </button>
    </div>
  );
}
