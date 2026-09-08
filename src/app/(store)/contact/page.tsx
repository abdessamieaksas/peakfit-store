import { MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { publicEnv } from "@/lib/config/env";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  const message = encodeURIComponent("Salam Peakfit, j'ai une question sur vos produits.");
  const whatsappUrl = `https://wa.me/${publicEnv.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${message}`;

  return (
    <section className="page-shell py-14 sm:py-20">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-accent-strong">Une question ?</p>
      <h1 className="display-title mt-3 text-[clamp(4rem,9vw,8rem)]">Parlons</h1>
      <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
        Besoin d&apos;aide pour la taille, la livraison ou une commande ? Écris-nous directement sur WhatsApp.
      </p>
      <Link
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className={cn(buttonVariants({ variant: "accent", size: "lg" }), "mt-8")}
      >
        <MessageCircle aria-hidden="true" className="size-5" />
        Ouvrir WhatsApp
      </Link>
    </section>
  );
}
