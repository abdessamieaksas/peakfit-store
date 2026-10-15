import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminProductForm, AdminVariantStockForm } from "@/components/admin/admin-product-form";

const routerMock = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }));
const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => routerMock }));
vi.mock("sonner", () => ({ toast: toastMock }));

const categories = [{ id: "0d89e83a-bd35-45ba-bab8-c8907ac84704", name: "Compression" }];
const images = ["/images/products/compression-core-black.webp"];
const productId = "5d3e3f9c-d091-4a0e-b063-53073dd81ed5";
const variant = { id: "7c95d33a-2b5e-4c25-8fca-32ce8338f011", sku: "PF-CORE-01-02", title: "Noir / M", stock: 12, reserved: 1, available: 11 };

afterEach(cleanup);

describe("admin product form", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.restoreAllMocks(); });

  it("keeps the operator on the form and focuses the first invalid field", () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(<AdminProductForm categories={categories} images={images} canUploadImages={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Créer le produit" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/nom doit contenir/i);
    expect(document.activeElement).toBe(document.getElementById("product-name"));
  });

  it("creates a product and returns to the product list after success", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { id: productId } }), { status: 201, headers: { "Content-Type": "application/json" } }));
    render(<AdminProductForm categories={categories} images={images} canUploadImages={false} />);
    fireEvent.change(screen.getByLabelText("Nom du produit"), { target: { value: "Core Compression" } });
    fireEvent.change(screen.getByLabelText("Résumé"), { target: { value: "Un haut technique, ajusté et respirant." } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Une pièce de performance pensée pour tes entraînements intenses." } });
    fireEvent.change(screen.getByLabelText("Texte alternatif"), { target: { value: "T-shirt de compression noir Peakfit" } });
    fireEvent.change(screen.getByLabelText("Prix (DH)"), { target: { value: "259" } });
    fireEvent.click(screen.getByRole("button", { name: "Créer le produit" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      slug: "core-compression", categoryId: categories[0]?.id, colors: ["Noir"], sizes: ["S", "M", "L", "XL"], priceDh: 259,
      images: [images[0]],
    });
    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith("/admin/produits"));
    expect(toastMock.success).toHaveBeenCalledWith("Produit créé.");
  });
});

describe("variant stock form", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.restoreAllMocks(); });

  it("posts a reasoned inventory delta and refreshes the current variant data", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { id: variant.id, stock: 16 } }), { status: 200, headers: { "Content-Type": "application/json" } }));
    render(<AdminVariantStockForm productId={productId} variant={variant} />);
    fireEvent.change(screen.getByLabelText("Quantité à ajouter ou retirer pour Noir / M"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("Motif du changement de stock pour Noir / M"), { target: { value: "Réassort fournisseur" } });
    fireEvent.click(screen.getByRole("button", { name: "Ajuster" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ delta: 4, reason: "Réassort fournisseur" });
    await waitFor(() => expect(routerMock.refresh).toHaveBeenCalledOnce());
    expect(toastMock.success).toHaveBeenCalledWith("Stock ajusté et enregistré dans l’historique.");
  });

  it("explains a stale or reserved-stock conflict without clearing the entered reason", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: { code: "STOCK_CONFLICT" } }), { status: 409, headers: { "Content-Type": "application/json" } }));
    render(<AdminVariantStockForm productId={productId} variant={variant} />);
    fireEvent.change(screen.getByLabelText("Quantité à ajouter ou retirer pour Noir / M"), { target: { value: "-12" } });
    fireEvent.change(screen.getByLabelText("Motif du changement de stock pour Noir / M"), { target: { value: "Correction inventaire" } });
    fireEvent.click(screen.getByRole("button", { name: "Ajuster" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/stock modifié en parallèle ou quantité réservée/i);
    expect(screen.getByLabelText("Motif du changement de stock pour Noir / M")).toHaveValue("Correction inventaire");
  });
});
