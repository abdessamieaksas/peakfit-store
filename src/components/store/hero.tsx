import { ArrowRight, Dumbbell, Gauge, Wind } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const benefits = [
  { label: "Training", detail: "plus fort", icon: Dumbbell },
  { label: "Running", detail: "plus loin", icon: Wind },
  { label: "Performance", detail: "au quotidien", icon: Gauge },
];

export function Hero() {
  return (
    <section className="relative isolate min-h-[26rem] overflow-hidden border-b border-border sm:min-h-[42rem] lg:min-h-[46rem]">
      <Image
        src="/images/hero/peakfit-day.png"
        alt="Athlète Peakfit en tenue noire dans un studio lumineux"
        fill
        priority
        sizes="100vw"
        className="hero-image-day object-cover object-[64%_center] transition-opacity duration-300"
      />
      <Image
        src="/images/hero/peakfit-night.png"
        alt="Athlète Peakfit courant en tenue noire dans un tunnel de nuit"
        fill
        priority
        sizes="100vw"
        className="hero-image-night object-cover object-[64%_center] transition-opacity duration-300"
      />
      <div className="hero-scrim absolute inset-0" aria-hidden="true" />
      <div className="page-shell relative flex min-h-[26rem] items-center py-8 sm:min-h-[42rem] sm:py-14 lg:min-h-[46rem]">
        <div className="w-full max-w-[42rem]">
          <p className="mb-5 hidden rounded-full border border-foreground/20 bg-background/80 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] backdrop-blur-sm sm:inline-flex">
            Collection 01 · Performance essentielle
          </p>
          <h1 className="display-title balance text-[3.75rem] sm:text-[clamp(4.75rem,11vw,10rem)]">
            Fait pour
            <span className="block text-accent-strong">bouger</span>
          </h1>
          <p className="mt-4 max-w-[31rem] text-sm font-medium leading-relaxed text-foreground/80 sm:mt-6 sm:text-xl">
            Des vêtements de performance pensés pour ton quotidien.
            Entraîne-toi. Avance. <strong className="text-foreground">Peakfit.</strong>
          </p>
          <Link
            href="/shop"
            className={cn(
              buttonVariants({ variant: "primary", size: "lg" }),
              "mt-5 min-w-[15rem] justify-between rounded-full text-base sm:mt-8",
            )}
          >
            Explorer le shop
            <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
          <ul className="mt-6 grid max-w-[34rem] grid-cols-3 divide-x divide-foreground/20 border-t border-foreground/20 pt-4 sm:mt-10 sm:pt-6">
            {benefits.map(({ label, detail, icon: Icon }) => (
              <li key={label} className="px-3 first:pl-0">
                <Icon aria-hidden="true" className="mb-2 size-5" />
                <span className="block text-[0.6875rem] font-extrabold uppercase tracking-[0.08em] sm:text-xs">
                  {label}
                </span>
                <span className="hidden text-xs text-foreground/70 sm:block">
                  {detail}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
