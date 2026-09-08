import { Activity, Layers3, Shirt, Sparkles } from "lucide-react";
import Link from "next/link";

import { catalogCategories } from "@/features/catalog/data/sample-catalog";
import type { CatalogCategory } from "@/features/catalog/domain/types";

const icons = {
  tous: Sparkles,
  compression: Activity,
  graphique: Shirt,
  running: Layers3,
} as const;

export function CategoryRail({
  active = "tous",
  categories = catalogCategories,
}: {
  active?: string;
  categories?: CatalogCategory[];
}) {
  return (
    <nav aria-label="Catégories produits" className="border-b border-border">
      <div className="page-shell overflow-x-auto py-7">
        <ul className="flex min-w-max items-start justify-start gap-7 md:min-w-0 md:justify-center md:gap-14">
          {categories.map((category) => {
            const Icon = icons[category.slug as keyof typeof icons] ?? Shirt;
            const isActive = category.slug === active;
            const href =
              category.slug === "tous"
                ? "/shop"
                : `/shop?categorie=${category.slug}`;

            return (
              <li key={category.slug}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className="group flex min-w-20 flex-col items-center gap-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <span
                    className={`flex size-14 items-center justify-center rounded-full border transition-colors md:size-16 ${
                      isActive
                        ? "border-accent-strong bg-accent text-on-accent"
                        : "border-border bg-surface group-hover:border-foreground"
                    }`}
                  >
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                  <span
                    className={`text-xs font-bold md:text-sm ${isActive ? "text-accent-strong" : "text-foreground"}`}
                  >
                    {category.shortLabel}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
