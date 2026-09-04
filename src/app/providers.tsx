"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import { LanguageProvider } from "@/context/language-context";
import { ToastProvider } from "@/context/toast-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CartDrawer } from "@/components/layout/cart-drawer";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <Header />
            <main className="min-h-[60vh] pb-20 md:pb-0">{children}</main>
            <Footer />
            <MobileNav />
            <CartDrawer />
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
