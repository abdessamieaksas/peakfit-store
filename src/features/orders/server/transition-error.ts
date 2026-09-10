const transitionCodes = [
  "ORDER_NOT_FOUND",
  "VERSION_CONFLICT",
  "INVALID_TRANSITION",
  "RESERVATION_EXPIRED",
] as const;

export type TransitionErrorCode = (typeof transitionCodes)[number];

export function readTransitionErrorCode(error: unknown): TransitionErrorCode | null {
  const message =
    error instanceof Error
      ? `${error.message} ${error.cause instanceof Error ? error.cause.message : ""}`
      : String(error);
  return transitionCodes.find((code) => message.includes(code)) ?? null;
}
