import { createHash } from "node:crypto";

import type { CreateCodOrderCommand } from "@/features/checkout/domain/order";

function canonicalOrderIntent(command: CreateCodOrderCommand) {
  return {
    customer: command.customer,
    delivery: command.delivery,
    items: [...command.items].sort((left, right) =>
      left.variantId.localeCompare(right.variantId),
    ),
    attribution: command.attribution ?? {},
  };
}

export function fingerprintCodOrder(command: CreateCodOrderCommand) {
  return createHash("sha256")
    .update(JSON.stringify(canonicalOrderIntent(command)))
    .digest("hex");
}
