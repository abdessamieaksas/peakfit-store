import { PackageCheck } from "lucide-react";
import type { Metadata } from "next";

import { CheckoutFoundation } from "@/components/store/checkout-foundation";

export const metadata: Metadata = {
  title: "Commande",
  description: "Commande Peakfit avec paiement à la livraison.",
};

export default function CheckoutPage() {
  return (
    <section className="page-shell py-12 sm:py-16">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">Paiement à la livraison</p>
          <h1 className="display-title mt-3 text-[clamp(4rem,9vw,8rem)]">Finaliser</h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            Laisse les informations nécessaires à la livraison. Ta commande sera
            enregistrée immédiatement, puis l&apos;équipe Peakfit te contactera pour
            la confirmer.
          </p>
          <div className="mt-9 max-w-xl">
            <CheckoutFoundation />
          </div>
        </div>
        <aside className="h-fit border border-border bg-surface p-6 lg:sticky lg:top-28">
          <PackageCheck aria-hidden="true" className="size-8 text-accent-strong" />
          <h2 className="mt-4 font-display text-3xl font-extrabold">Commande protégée</h2>
          <ul className="mt-5 grid gap-3 text-sm text-muted">
            <li>Tu ne paies rien maintenant.</li>
            <li>La commande apparaît directement dans notre espace de suivi.</li>
            <li>Nous confirmons ensuite la taille et la disponibilité avec toi.</li>
            <li>Le règlement se fait à la réception de ton colis.</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
