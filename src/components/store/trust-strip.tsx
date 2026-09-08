import { MapPin, PackageCheck, RefreshCcw } from "lucide-react";

const items = [
  {
    label: "Paiement à la livraison",
    detail: "Tu paies à la réception",
    icon: PackageCheck,
  },
  {
    label: "Livraison partout au Maroc",
    detail: "Tarif calculé selon ta ville",
    icon: MapPin,
  },
  {
    label: "Échange facile",
    detail: "Sous 7 jours après réception",
    icon: RefreshCcw,
  },
];

export function TrustStrip() {
  return (
    <section className="border-y border-border bg-surface" aria-label="Engagements Peakfit">
      <div className="page-shell grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
        {items.map(({ label, detail, icon: Icon }) => (
          <div key={label} className="flex items-center gap-4 py-6 md:px-8 md:first:pl-0">
            <Icon aria-hidden="true" className="size-7 shrink-0 text-accent-strong" />
            <div>
              <h2 className="text-sm font-extrabold">{label}</h2>
              <p className="mt-1 text-xs text-muted">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
