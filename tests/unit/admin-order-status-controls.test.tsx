import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrderStatusControls } from "@/components/admin/order-status-controls";

const routerMock = vi.hoisted(() => ({ refresh: vi.fn(), replace: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => routerMock }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("admin order status controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("requires explicit confirmation before cancelling and allows backing out", () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: { status: "CANCELLED", version: 2 } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(
      <OrderStatusControls
        orderId="11111111-1111-4111-8111-111111111111"
        status="NEW"
        version={1}
        canManage
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Annulée" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/réservation de stock sera libérée/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Garder la commande" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("explains the inventory consequence before confirming a refusal after shipment", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: { status: "REFUSED", version: 2 } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(
      <OrderStatusControls
        orderId="11111111-1111-4111-8111-111111111111"
        status="SHIPPED"
        version={1}
        canManage
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Refusée" }));
    expect(
      screen.getByText(/seulement si le colis est effectivement revenu en stock/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirmer le refus" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      expectedVersion: 1,
      nextStatus: "REFUSED",
    });
    await waitFor(() => expect(routerMock.refresh).toHaveBeenCalledOnce());
  });
});
