"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="relative rounded-full border border-border bg-surface/85"
      aria-label={isDark ? "Activer Peakfit Day" : "Activer Peakfit Night"}
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <Moon aria-hidden="true" className="size-5 text-accent" />
      ) : (
        <Sun aria-hidden="true" className="size-5 text-accent-strong" />
      )}
    </Button>
  );
}
