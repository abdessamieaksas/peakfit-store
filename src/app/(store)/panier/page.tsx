import type { Metadata } from "next";

import { CartView } from "@/components/store/cart-view";

export const metadata: Metadata = {
  title: "Panier",
  description: "Vérifie ta sélection Peakfit avant la commande.",
};

export default function CartPage() {
  return (
    <section className="page-shell py-12 sm:py-16">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">
        Ta sélection
      </p>
      <h1 className="display-title mt-3 text-[clamp(4rem,9vw,8rem)]">Panier</h1>
      <div className="mt-10">
        <CartView />
      </div>
    </section>
  );
}
