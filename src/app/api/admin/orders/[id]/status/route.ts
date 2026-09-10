import { after, NextResponse } from "next/server";
import { z } from "zod";

import { dispatchNotifications } from "@/features/notifications/server/dispatcher";
import { ORDER_STATUSES } from "@/features/orders/domain/status";
import { transitionAdminOrder } from "@/features/orders/server/admin-order-repository";
import { readTransitionErrorCode } from "@/features/orders/server/transition-error";
import { canManageOrders, getAdminAccess } from "@/lib/auth/access";

export const runtime = "nodejs";

const inputSchema = z.object({
  expectedVersion: z.number().int().positive(),
  nextStatus: z.enum(ORDER_STATUSES),
  reason: z.string().trim().max(500).optional(),
});

const errorStatuses = {
  ORDER_NOT_FOUND: 404,
  VERSION_CONFLICT: 409,
  INVALID_TRANSITION: 409,
  RESERVATION_EXPIRED: 409,
} as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await getAdminAccess();
  if (!access) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }
  if (!canManageOrders(access.role)) {
    return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  }

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: { code: "INVALID_ORDER" } }, { status: 400 });
  }

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "INVALID_REQUEST" } }, { status: 400 });
  }

  try {
    const transition = await transitionAdminOrder({
      orderId: id,
      actorAdminId: access.userId,
      ...parsed.data,
    });
    after(() => dispatchNotifications({ limit: 10 }));
    return NextResponse.json({ data: transition });
  } catch (error) {
    const code = readTransitionErrorCode(error);
    if (code) {
      return NextResponse.json({ error: { code } }, { status: errorStatuses[code] });
    }
    console.error("Order status transition failed", error);
    return NextResponse.json({ error: { code: "SERVICE_UNAVAILABLE" } }, { status: 503 });
  }
}
