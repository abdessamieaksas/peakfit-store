"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";

export function CatalogSearch({ initialValue = "" }: { initialValue?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialValue);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(window.location.search);

    if (query.trim()) params.set("recherche", query.trim());
    else params.delete("recherche");

    router.push(`/shop${params.size ? `?${params.toString()}` : ""}`);
  }

  function guardImeSubmit(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && event.nativeEvent.isComposing) {
      event.preventDefault();
    }
  }

  function clearSearch() {
    setQuery("");
    const params = new URLSearchParams(window.location.search);
    params.delete("recherche");
    router.push(`/shop${params.size ? `?${params.toString()}` : ""}`);
    inputRef.current?.focus();
  }

  return (
    <form className="relative w-full max-w-xl" onSubmit={submitSearch} noValidate>
      <label htmlFor="catalog-search" className="sr-only">
        Rechercher un produit
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted"
      />
      <input
        ref={inputRef}
        id="catalog-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={guardImeSubmit}
        placeholder="Rechercher compression, running…"
        className="min-h-13 w-full rounded-md border border-border bg-surface pl-12 pr-28 text-sm outline-none transition-colors placeholder:text-muted focus:border-focus focus:ring-2 focus:ring-focus/30"
      />
      {query ? (
        <button
          type="button"
          className="absolute right-13 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          aria-label="Effacer la recherche"
          onClick={clearSearch}
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      ) : null}
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="absolute right-1.5 top-1/2 -translate-y-1/2"
        aria-label="Lancer la recherche"
      >
        <Search aria-hidden="true" className="size-4" />
      </Button>
    </form>
  );
}
