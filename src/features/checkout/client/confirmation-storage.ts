import {
  codOrderResultSchema,
  type CodOrderResult,
} from "@/features/checkout/domain/order";

const STORAGE_KEY = "peakfit-last-order-v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1_000;

type StoredConfirmation = {
  savedAt: number;
  order: CodOrderResult;
};

let memoryConfirmation: StoredConfirmation | null = null;

export function saveOrderConfirmation(order: CodOrderResult) {
  const value: StoredConfirmation = { savedAt: Date.now(), order };
  memoryConfirmation = value;

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // The in-memory copy still supports the immediate client-side navigation.
  }
}

export function loadOrderConfirmation(): CodOrderResult | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return memoryConfirmation?.order ?? null;

    const value = JSON.parse(raw) as Partial<StoredConfirmation>;
    if (
      typeof value.savedAt !== "number" ||
      Date.now() - value.savedAt > MAX_AGE_MS
    ) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    const parsed = codOrderResultSchema.safeParse(value.order);
    return parsed.success ? parsed.data : null;
  } catch {
    return memoryConfirmation?.order ?? null;
  }
}
