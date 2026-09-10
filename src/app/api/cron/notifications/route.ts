import { NextResponse } from "next/server";

import { dispatchNotifications } from "@/features/notifications/server/dispatcher";
import { ensureAdminOrderNotification } from "@/features/notifications/server/notification-repository";
import { getServerEnv } from "@/lib/config/env";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const env = getServerEnv();

  if (!env.CRON_SECRET) {
    return NextResponse.json(
      { error: { code: "SERVICE_UNAVAILABLE" } },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED" } },
      { status: 401 },
    );
  }

  await ensureAdminOrderNotification();
  const summary = await dispatchNotifications({ limit: 25 });
  return NextResponse.json({ ok: true, summary });
}
