"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/shop", label: "Nouveautés" },
  { href: "/shop?categorie=compression", label: "Compression" },
  { href: "/shop?categorie=graphique", label: "Graphique" },
  { href: "/shop?categorie=running", label: "Running" },
];

export function MobileMenu() {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "lg:hidden")}
        aria-label="Ouvrir le menu"
      >
        <Menu aria-hidden="true" className="size-6" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/55" style={{ zIndex: "var(--z-backdrop)" }} />
        <Dialog.Content
          className="fixed inset-y-0 left-0 w-[min(88vw,24rem)] border-r border-border bg-background p-6 shadow-2xl focus:outline-none"
          style={{ zIndex: "var(--z-sheet)" }}
        >
          <div className="flex items-center justify-between">
            <Dialog.Title className="font-display text-4xl font-extrabold tracking-[-0.04em]">
              PEAKFIT
            </Dialog.Title>
            <Dialog.Close
              className={buttonVariants({ variant: "ghost", size: "icon" })}
              aria-label="Fermer le menu"
            >
              <X aria-hidden="true" className="size-6" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-2 text-sm text-muted">
            Performance quotidienne, pensée pour bouger.
          </Dialog.Description>
          <nav aria-label="Navigation mobile" className="mt-10">
            <ul className="grid gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Dialog.Close asChild>
                    <Link
                      href={link.href}
                      className="flex min-h-12 items-center border-b border-border py-3 font-bold transition-colors hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      {link.label}
                    </Link>
                  </Dialog.Close>
                </li>
              ))}
            </ul>
          </nav>
          <div className="absolute inset-x-6 bottom-6 border-t border-border pt-5 text-sm text-muted">
            Paiement à la livraison · Partout au Maroc
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
