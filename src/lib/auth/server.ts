import "server-only";

import { createNeonAuth, type NeonAuth } from "@neondatabase/auth/next/server";

let cachedAuth: NeonAuth | undefined;

export class AuthConfigurationError extends Error {
  constructor() {
    super("Neon Auth is not configured.");
    this.name = "AuthConfigurationError";
  }
}

export function getNeonAuth() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;

  if (!baseUrl || !secret || secret.length < 32) {
    throw new AuthConfigurationError();
  }

  cachedAuth ??= createNeonAuth({
    baseUrl,
    cookies: { secret, sessionDataTtl: 300 },
    logLevel: "warn",
  });
  return cachedAuth;
}
