import "server-only";

import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "peakfit_demo_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function sessionSecret() {
  return process.env.DEMO_SESSION_SECRET;
}

function signature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

export function demoCredentialsConfigured() {
  return Boolean(
    sessionSecret() &&
      process.env.DEMO_LOGIN_EMAIL &&
      process.env.DEMO_PASSWORD_HASH,
  );
}

export function verifyDemoCredentials(email: string, password: string) {
  const expectedEmail = process.env.DEMO_LOGIN_EMAIL?.trim().toLowerCase();
  const encodedHash = process.env.DEMO_PASSWORD_HASH;
  if (!expectedEmail || !encodedHash) return false;

  const normalizedEmail = email.trim().toLowerCase();
  const emailMatches = safeEqual(normalizedEmail, expectedEmail);
  const [version, salt, expectedHash] = encodedHash.split("$");
  if (version !== "scrypt-v1" || !salt || !expectedHash) return false;

  const actualHash = scryptSync(password, salt, 64).toString("hex");
  return emailMatches && safeEqual(actualHash, expectedHash);
}

export async function createDemoSession() {
  const secret = sessionSecret();
  if (!secret) throw new Error("Demo authentication is not configured.");
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ exp: expiresAt, scope: "peakfit-demo" })).toString("base64url");
  const value = `${payload}.${signature(payload, secret)}`;
  const jar = await cookies();
  jar.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/demo",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearDemoSession() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/demo",
    maxAge: 0,
  });
}

export async function hasDemoSession() {
  const secret = sessionSecret();
  if (!secret) return false;
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return false;
  const [payload, providedSignature, extra] = value.split(".");
  if (!payload || !providedSignature || extra) return false;
  if (!safeEqual(signature(payload, secret), providedSignature)) return false;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: number;
      scope?: string;
    };
    return decoded.scope === "peakfit-demo" && Number(decoded.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
