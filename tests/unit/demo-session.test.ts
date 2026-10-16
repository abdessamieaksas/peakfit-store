import { afterEach, describe, expect, it } from "vitest";
import { scryptSync } from "node:crypto";

import { verifyDemoCredentials } from "@/lib/demo/session";

const original = {
  email: process.env.DEMO_LOGIN_EMAIL,
  hash: process.env.DEMO_PASSWORD_HASH,
};

describe("demo credentials", () => {
  afterEach(() => {
    if (original.email === undefined) delete process.env.DEMO_LOGIN_EMAIL;
    else process.env.DEMO_LOGIN_EMAIL = original.email;
    if (original.hash === undefined) delete process.env.DEMO_PASSWORD_HASH;
    else process.env.DEMO_PASSWORD_HASH = original.hash;
  });

  it("accepts the configured email case-insensitively with the correct password", () => {
    const salt = "fixed-test-salt";
    const hash = scryptSync("correct horse battery staple", salt, 64).toString("hex");
    process.env.DEMO_LOGIN_EMAIL = "demo@peakfit.example";
    process.env.DEMO_PASSWORD_HASH = `scrypt-v1$${salt}$${hash}`;

    expect(verifyDemoCredentials(" DEMO@PEAKFIT.EXAMPLE ", "correct horse battery staple")).toBe(true);
  });

  it("rejects an incorrect password and an unconfigured credential", () => {
    const salt = "fixed-test-salt";
    const hash = scryptSync("correct horse battery staple", salt, 64).toString("hex");
    process.env.DEMO_LOGIN_EMAIL = "demo@peakfit.example";
    process.env.DEMO_PASSWORD_HASH = `scrypt-v1$${salt}$${hash}`;

    expect(verifyDemoCredentials("demo@peakfit.example", "wrong password")).toBe(false);
    delete process.env.DEMO_PASSWORD_HASH;
    expect(verifyDemoCredentials("demo@peakfit.example", "correct horse battery staple")).toBe(false);
  });
});
