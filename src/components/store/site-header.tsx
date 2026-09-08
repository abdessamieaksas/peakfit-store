import { Search } from "lucide-react";
import Link from "next/link";

import { CartLink } from "./cart-link";
import { MobileMenu } from "./mobile-menu";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/shop", label: "Nouveautés" },
  { href: "/shop?categorie=compression", label: "Compression" },
  { href: "/shop?categorie=graphique", label: "Graphique" },
  { href: "/shop?categorie=running", label: "Running" },
];

export function SiteHeader() {
  return (
    <>
      <div className="border-b border-border bg-surface text-[0.6875rem] font-bold uppercase tracking-[0.12em] sm:text-xs">
        <div className="page-shell flex min-h-9 items-center justify-center gap-3 text-center sm:justify-between">
          <span>Paiement à la livraison</span>
          <span className="hidden sm:inline">Livraison partout au Maroc</span>
          <span className="hidden lg:inline">Échange facile sous 7 jours</span>
        </div>
      </div>
      <header
        className="sticky top-0 border-b border-border bg-background/95 backdrop-blur-sm"
        style={{ zIndex: "var(--z-header)" }}
      >
        <div className="page-shell flex min-h-16 items-center gap-2 md:min-h-20">
          <MobileMenu />
          <Link
            href="/"
            className="font-display text-4xl font-extrabold tracking-[-0.055em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus md:text-5xl"
            aria-label="Peakfit, accueil"
          >
            PEAKFIT
          </Link>
          <nav aria-label="Navigation principale" className="ml-8 hidden lg:block">
            <ul className="flex items-center gap-6 text-sm font-bold">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <Link
              href="/shop"
              className="hidden size-11 items-center justify-center rounded-full transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:inline-flex"
              aria-label="Rechercher un produit"
            >
              <Search aria-hidden="true" className="size-5" />
            </Link>
            <ThemeToggle />
            <CartLink />
          </div>
        </div>
      </header>
    </>
  );
}
