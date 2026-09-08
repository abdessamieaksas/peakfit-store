import Link from "next/link";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/livraison-retours", label: "Livraison & retours" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter() {
  return (
    <footer className="bg-foreground text-background">
      <div className="page-shell grid gap-10 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="font-display text-5xl font-extrabold tracking-[-0.05em]">
            PEAKFIT
          </p>
          <p className="mt-3 max-w-sm text-sm text-background/70">
            Performance essentielle pour la salle, la course et tout ce qui vient entre les deux.
          </p>
        </div>
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent">
            Explorer
          </h2>
          <ul className="mt-4 grid gap-3 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <Link className="hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent">
            Paiement
          </h2>
          <p className="mt-4 text-sm text-background/70">
            Cash on Delivery, en dirhams marocains. Aucun paiement en ligne au lancement.
          </p>
        </div>
      </div>
      <div className="border-t border-background/20">
        <div className="page-shell flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-background/60">
          <span>© 2026 Peakfit</span>
          <span>Conçu pour bouger au Maroc.</span>
        </div>
      </div>
    </footer>
  );
}
