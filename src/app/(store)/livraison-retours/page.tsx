import type { Metadata } from "next";

export const metadata: Metadata = { title: "Livraison et retours" };

export default function DeliveryReturnsPage() {
  return (
    <section className="page-shell py-14 sm:py-20">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">Service</p>
      <h1 className="display-title mt-3 text-[clamp(4rem,9vw,8rem)]">Livraison & retours</h1>
      <div className="mt-10 grid gap-8 border-y border-border py-10 md:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-extrabold">Partout au Maroc</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            Le tarif et le délai sont calculés selon la ville. Ils seront affichés avant l&apos;envoi définitif de la commande.
          </p>
        </div>
        <div>
          <h2 className="font-display text-3xl font-extrabold">Échange sous 7 jours</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            Les articles non portés et conservés dans leur état d&apos;origine peuvent être échangés. Les conditions finales seront publiées avant lancement.
          </p>
        </div>
      </div>
    </section>
  );
}
