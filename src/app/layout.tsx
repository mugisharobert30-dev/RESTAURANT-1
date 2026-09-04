import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";
import { TableRequests } from "@/components/layout/table-requests";
import { PwaRegister } from "@/components/layout/pwa-register";
import "./globals.css";

const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display", weight: ["600", "700", "800"] });
const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600", "700", "800"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Luwombo Restaurant — Authentic Rwandan Cuisine in Kigali",
    template: "%s · Luwombo Restaurant",
  },
  description:
    "Experience authentic Rwandan cuisine and international favorites at Luwombo Restaurant, Kimihurura, Kigali. Order online for delivery or takeaway, reserve a table, and enjoy slow-cooked luwombo, charcoal brochettes and more.",
  keywords: [
    "Luwombo Restaurant", "restaurant in Kigali", "Rwandan food", "restaurants in Rwanda",
    "Kigali restaurant delivery", "brochettes Kigali", "table reservation Kigali", "luwombo dish",
  ],
  openGraph: {
    type: "website",
    locale: "en_RW",
    url: siteUrl,
    siteName: "Luwombo Restaurant",
    title: "Luwombo Restaurant — Authentic Rwandan Cuisine in Kigali",
    description: "Slow-cooked luwombo, charcoal-grilled brochettes and warm Rwandan hospitality. Order online or reserve your table.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Luwombo Restaurant — Kigali",
    description: "Authentic Flavors. Warm Moments. Order online or reserve a table.",
  },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#35702B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-cream font-sans text-cocoa antialiased">
        <Providers>
          {children}
          <SuspenseWrapper>
            <TableRequests />
          </SuspenseWrapper>
          <PwaRegister />
        </Providers>
      </body>
    </html>
  );
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
