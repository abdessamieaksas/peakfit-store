"use client";

import { Toaster } from "sonner";
import type { ReactNode } from "react";

import { CartProvider } from "@/features/cart/cart-context";

import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <CartProvider>
        {children}
        <Toaster
          position="top-right"
          closeButton
          toastOptions={{ duration: 5000 }}
        />
      </CartProvider>
    </ThemeProvider>
  );
}
