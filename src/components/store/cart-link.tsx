"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";

import { useCart } from "@/features/cart/cart-context";

export function CartLink() {
  const { count } = useCart();

  return (
    <Link
      href="/panier"
      className="relative inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      aria-label={`Panier, ${count} article${count === 1 ? "" : "s"}`}
    >
      <ShoppingBag aria-hidden="true" className="size-5" />
      <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-accent px-1 text-center text-[0.6875rem] font-extrabold leading-5 text-on-accent tabular-nums">
        {count}
      </span>
    </Link>
  );
}
