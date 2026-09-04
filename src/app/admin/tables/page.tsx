"use client";

import { QRCodeSVG } from "qrcode.react";
import { Printer, QrCode } from "lucide-react";
import { useStoreData } from "@/hooks/use-store";
import { store } from "@/lib/store";
import { TABLE_AREA_LABELS, type TableArea } from "@/lib/types";
import { Badge, Button, Card } from "@/components/ui";

export default function AdminTablesPage() {
  const tables = useStoreData((d) => d.tables);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold"><QrCode className="h-7 w-7 text-brand-600" /> Tables & QR codes</h1>
          <p className="mt-1 max-w-xl text-sm text-cocoa/55">
            Print each code and place it on the table. Guests scan → browse the menu → order and pay without waiting. The link opens this site with the table pre-selected.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print all</Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.map((t) => {
          const url = typeof window !== "undefined" ? `${window.location.origin}/menu?table=${t.qr_token}` : `/menu?table=${t.qr_token}`;
          return (
            <Card key={t.id} className="flex flex-col items-center p-5 text-center print:break-inside-avoid">
              <div className="flex w-full items-center justify-between">
                <Badge tone={t.area === "private" ? "purple" : t.area === "garden" ? "green" : t.area === "terrace" ? "amber" : "blue"}>
                  {TABLE_AREA_LABELS[t.area as TableArea]}
                </Badge>
                {!t.active && <Badge tone="red">Off</Badge>}
              </div>
              <p className="mt-2 font-display text-2xl font-extrabold">{t.label}</p>
              <p className="text-xs text-cocoa/45">{t.seats} seats</p>
              <div className="my-3 rounded-2xl bg-white p-2 ring-1 ring-cocoa/10">
                <QRCodeSVG value={url} size={132} bgColor="#ffffff" fgColor="#241A12" level="M" />
              </div>
              <p className="text-[11px] leading-snug text-cocoa/40">Scan to order at {t.label}<br /><span className="font-mono">/menu?table={t.qr_token}</span></p>
              <button
                onClick={() => store.mutate((d) => {
                  const tt = d.tables.find((x) => x.id === t.id);
                  if (tt) tt.active = !tt.active;
                })}
                className="mt-3 rounded-lg px-3 py-1.5 text-xs font-bold text-cocoa/60 ring-1 ring-cocoa/15 hover:text-cocoa"
              >
                {t.active ? "Deactivate table" : "Activate table"}
              </button>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <h2 className="font-display text-lg font-bold">How guests experience it</h2>
        <ol className="mt-3 grid gap-3 text-sm text-cocoa/65 sm:grid-cols-4">
          {["Scan the code on the table", "Menu opens instantly — no app needed", "Order and track from the phone", "Call a waiter or request the bill with one tap"].map((s, i) => (
            <li key={i} className="rounded-xl bg-stone-50 p-3"><span className="mr-1.5 font-display font-extrabold text-brand-600">{i + 1}.</span>{s}</li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
