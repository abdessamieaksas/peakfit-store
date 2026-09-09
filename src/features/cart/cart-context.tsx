"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "peakfit-cart-v2";

export type CartOption = {
  code: string;
  name: string;
  value: string;
  label: string;
};

export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  variantTitle: string;
  options: CartOption[];
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  total: number;
  addLine: (line: Omit<CartLine, "quantity">) => void;
  removeLine: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartLine[] {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return [];

    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isCartLine);
  } catch {
    return [];
  }
}

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;

  const line = value as Partial<CartLine>;
  return (
    typeof line.variantId === "string" &&
    typeof line.productId === "string" &&
    typeof line.slug === "string" &&
    typeof line.name === "string" &&
    typeof line.image === "string" &&
    Number.isInteger(line.price) &&
    Number(line.price) >= 0 &&
    typeof line.variantTitle === "string" &&
    Array.isArray(line.options) &&
    line.options.every(
      (option) =>
        option &&
        typeof option.code === "string" &&
        typeof option.name === "string" &&
        typeof option.value === "string" &&
        typeof option.label === "string",
    ) &&
    Number.isInteger(line.quantity) &&
    Number(line.quantity) >= 1 &&
    Number(line.quantity) <= 10
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setLines(readStoredCart());
      setHydrated(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Cart still works for the current session when storage is unavailable.
    }
  }, [hydrated, lines]);

  const addLine = useCallback((line: Omit<CartLine, "quantity">) => {
    setLines((current) => {
      const existing = current.find(
        (item) => item.variantId === line.variantId,
      );

      if (!existing) return [...current, { ...line, quantity: 1 }];

      return current.map((item) =>
        item.variantId === line.variantId
          ? { ...item, quantity: Math.min(item.quantity + 1, 10) }
          : item,
      );
    });
  }, []);

  const removeLine = useCallback((variantId: string) => {
    setLines((current) =>
      current.filter((item) => item.variantId !== variantId),
    );
  }, []);

  const setQuantity = useCallback(
    (variantId: string, quantity: number) => {
      if (quantity <= 0) {
        removeLine(variantId);
        return;
      }

      setLines((current) =>
        current.map((item) =>
          item.variantId === variantId
            ? { ...item, quantity: Math.min(quantity, 10) }
            : item,
        ),
      );
    },
    [removeLine],
  );

  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      total: lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
      addLine,
      removeLine,
      setQuantity,
    }),
    [addLine, lines, removeLine, setQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return context;
}
