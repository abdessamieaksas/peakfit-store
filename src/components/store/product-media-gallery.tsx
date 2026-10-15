"use client";

import Image from "next/image";
import { useState } from "react";

import type { CatalogProductImage } from "@/features/catalog/domain/types";

export function ProductMediaGallery({ images }: { images: CatalogProductImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = images[activeIndex] ?? images[0];
  if (!current) return null;

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-surface-raised">
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 58vw"
          className="object-cover"
        />
        {images.length > 1 ? <span className="absolute bottom-3 right-3 border border-border bg-background/90 px-2 py-1 text-xs font-bold tabular-nums">{activeIndex + 1} / {images.length}</span> : null}
      </div>
      {images.length > 1 ? <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Photos du produit">
        {images.map((image, index) => <button
          key={image.url}
          type="button"
          aria-label={`Voir la photo ${index + 1} sur ${images.length}`}
          aria-pressed={activeIndex === index}
          onClick={() => setActiveIndex(index)}
          className={`relative size-16 shrink-0 overflow-hidden border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${activeIndex === index ? "border-accent-strong" : "border-border hover:border-foreground"}`}
        >
          <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
        </button>)}
      </div> : null}
    </div>
  );
}
