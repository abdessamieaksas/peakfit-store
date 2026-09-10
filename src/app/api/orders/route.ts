import { randomUUID } from "node:crypto";

import { after, NextResponse } from "next/server";

import { createCodOrderInputSchema } from "@/features/checkout/domain/order";
import { createCodOrder } from "@/features/checkout/server/order-repository";
import { toPublicCodOrderError } from "@/features/checkout/server/public-error";
import { dispatchNotifications } from "@/features/notifications/server/dispatcher";
import { ensureAdminOrderNotification } from "@/features/notifications/server/notification-repository";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 32 * 1_024;

function invalidRequest(message = "Vérifie les informations de la commande.") {
  return NextResponse.json(
    { error: { code: "INVALID_REQUEST", message } },
    { status: 400 },
  );
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (contentLength > MAX_REQUEST_BYTES) {
    return invalidRequest("La commande contient trop d’informations.");
  }

  let body: unknown;

  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
      return invalidRequest("La commande contient trop d’informations.");
    }
    body = JSON.parse(rawBody);
  } catch {
    return invalidRequest("La commande envoyée est illisible.");
  }

  const parsed = createCodOrderInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "Vérifie les informations de la commande.",
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      },
      { status: 400 },
    );
  }

  try {
    const order = await createCodOrder(parsed.data);
    after(async () => {
      try {
        await ensureAdminOrderNotification(order.reference);
        await dispatchNotifications({
          orderReference: order.reference,
          limit: 5,
        });
      } catch (error) {
        console.error("Post-order notification dispatch failed", {
          requestId,
          orderReference: order.reference,
          errorName: error instanceof Error ? error.name : "UnknownError",
        });
      }
    });

    return NextResponse.json(
      { order },
      { status: order.duplicate ? 200 : 201 },
    );
  } catch (error) {
    const publicError = toPublicCodOrderError(error);

    console.error("COD order submission failed", {
      requestId,
      code: publicError.code,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      {
        error: {
          code: publicError.code,
          message: publicError.message,
          requestId,
        },
      },
      { status: publicError.status },
    );
  }
}
