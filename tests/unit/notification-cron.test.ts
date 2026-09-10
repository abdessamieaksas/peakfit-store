import { afterEach, describe, expect, it } from "vitest";

import { GET } from "@/app/api/cron/notifications/route";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("notification cron authorization", () => {
  it("stays unavailable until a cron secret is configured", async () => {
    delete process.env.CRON_SECRET;

    const response = await GET(
      new Request("http://localhost/api/cron/notifications"),
    );

    expect(response.status).toBe(503);
  });

  it("rejects requests without the matching bearer token", async () => {
    process.env.CRON_SECRET = "test-secret-at-least-16-characters";

    const response = await GET(
      new Request("http://localhost/api/cron/notifications", {
        headers: { authorization: "Bearer wrong-secret" },
      }),
    );

    expect(response.status).toBe(401);
  });
});
