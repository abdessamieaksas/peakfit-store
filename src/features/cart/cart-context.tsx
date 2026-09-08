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

const STORAGE_KEY = "peakfit-cart-v1";

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  total: number;
  addLine: (line: Omit<CartLine, "quantity">) => void;
  removeLine: (productId: string, size: string, color: string) => void;
  setQuantity: (productId: string, size: string, color: string, quantity: number) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartLine[] {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return [];

    return (JSON.parse(value) as Array<CartLine & { color?: string }>).map(
      (line) => ({ ...line, color: line.color ?? "Noir" }),
    );
  } catch {
    return [];
  }
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
        (item) =>
          item.productId === line.productId &&
          item.size === line.size &&
          item.color === line.color,
      );

      if (!existing) return [...current, { ...line, quantity: 1 }];

      return current.map((item) =>
        item.productId === line.productId &&
        item.size === line.size &&
        item.color === line.color
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
    });
  }, []);

  const removeLine = useCallback((productId: string, size: string, color: string) => {
    setLines((current) =>
      current.filter(
        (item) =>
          item.productId !== productId ||
          item.size !== size ||
          item.color !== color,
      ),
    );
  }, []);

  const setQuantity = useCallback(
    (productId: string, size: string, color: string, quantity: number) => {
      if (quantity <= 0) {
        removeLine(productId, size, color);
        return;
      }

      setLines((current) =>
        current.map((item) =>
          item.productId === productId &&
          item.size === size &&
          item.color === color
            ? { ...item, quantity }
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
