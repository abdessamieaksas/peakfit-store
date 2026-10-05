import { Camera, MessageCircle } from "lucide-react";
import Link from "next/link";

import { publicEnv } from "@/lib/config/env";

const instagramUrl = "https://www.instagram.com/peakfit__store/";
const whatsappNumber = publicEnv.NEXT_PUBLIC_WHATSAPP_NUMBER;
const whatsappDisplayNumber = whatsappNumber.startsWith("212") && whatsappNumber.length === 12
  ? `+212 ${whatsappNumber.slice(3, 6)} ${whatsappNumber.slice(6, 9)} ${whatsappNumber.slice(9)}`
  : `+${whatsappNumber}`;

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
            Suivre & contacter Peakfit
          </h2>
          <ul className="mt-4 grid gap-3 text-sm">
            <li>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-background/80 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Camera aria-hidden="true" className="size-4" />
                Instagram · @peakfit__store
              </a>
            </li>
            <li>
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-background/80 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                WhatsApp · {whatsappDisplayNumber}
              </a>
            </li>
          </ul>
          <p className="mt-5 text-xs leading-relaxed text-background/60">
            Paiement à la livraison, en dirhams marocains.
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
