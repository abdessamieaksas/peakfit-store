import { expect, test } from "@playwright/test";

const cartLine = {
  variantId: "11111111-1111-4111-8111-111111111111",
  productId: "22222222-2222-4222-8222-222222222222",
  slug: "compression-core-noir",
  name: "Compression Core Noir",
  image: "/images/products/compression-core-black.svg",
  price: 34900,
  variantTitle: "Noir / M",
  options: [
    { code: "color", name: "Couleur", value: "black", label: "Noir" },
    { code: "size", name: "Taille", value: "m", label: "M" },
  ],
  quantity: 1,
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((line) => {
    window.localStorage.setItem("peakfit-cart-v2", JSON.stringify([line]));
  }, cartLine);
});

test("submits a COD order without making the shopper send a message", async ({ page }) => {
  await page.route("**/api/orders", async (route) => {
    const request = route.request();
    const body = request.postDataJSON();
    expect(body.items).toEqual([{ variantId: cartLine.variantId, quantity: 1 }]);
    expect(body.contactConsent).toBe(true);

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        order: {
          reference: "PF-260910-TEST1234",
          status: "NEW",
          currency: "MAD",
          subtotal: 34900,
          shippingFee: 3500,
          total: 38400,
          estimatedDaysMin: 1,
          estimatedDaysMax: 3,
          reservationExpiresAt: "2026-09-11T14:00:00.000Z",
          duplicate: false,
        },
      }),
    });
  });

  await page.goto("/commande");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("peakfit-cart-v2"))).toContain(cartLine.variantId);
  await expect(page.getByText("aucun message à envoyer toi-même", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: /Confirmer — 349/ })).toBeVisible();

  await page.getByLabel("Nom complet").fill("Samir Test");
  await page.getByLabel("Téléphone", { exact: true }).fill("06 12 34 56 78");
  await page.locator("#checkout-email").fill("samir@example.com");
  await page.getByLabel("Ville").fill("Casablanca");
  await page.getByLabel("Adresse de livraison").fill("12 rue Atlas");
  await page.getByLabel(/J’accepte/).check();
  await page.getByRole("button", { name: /^Confirmer/ }).click();

  await expect(page).toHaveURL(/\/commande\/merci$/);
  await expect(page.getByText("PF-260910-TEST1234")).toBeVisible();
  await expect(page.getByText("384 MAD")).toBeVisible();
  await expect(page.getByText("Tu n’as aucun message à envoyer.")).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("peakfit-cart-v2"))).toBe("[]");
});

test("keeps the checkout form and focuses the first invalid field", async ({ page }) => {
  await page.goto("/commande");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("peakfit-cart-v2"))).toContain(cartLine.variantId);
  await expect(page.getByRole("button", { name: /Confirmer — 349/ })).toBeVisible();
  await page.getByRole("button", { name: /^Confirmer/ }).click();

  await expect(page.getByText("Vérifie les champs indiqués.")).toBeVisible();
  await expect(page.getByLabel("Nom complet")).toBeFocused();
  await expect(page).toHaveURL(/\/commande$/);
});

test("carries a city delivery estimate into checkout until the city changes", async ({
  page,
}) => {
  await page.route("**/api/shipping/estimate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        quote: {
          zoneCode: "casa-rabat",
          zoneName: "Axe Casablanca–Rabat",
          city: "Casablanca",
          fee: 3500,
          estimatedDaysMin: 1,
          estimatedDaysMax: 2,
          isFree: false,
        },
      }),
    });
  });

  await page.goto("/panier");
  await page.getByLabel("Estimer la livraison").fill("Casablanca");
  await page.getByRole("button", { name: "Calculer" }).click();
  await expect(page.getByText("Total estimé")).toBeVisible();
  await expect(page.getByText("384 MAD")).toBeVisible();

  await page.getByRole("link", { name: "Passer la commande" }).click();
  await expect(page.getByLabel("Ville")).toHaveValue("Casablanca");
  await expect(
    page.getByRole("button", { name: /Confirmer — 384/ }),
  ).toBeVisible();

  await page.getByLabel("Ville").fill("Rabat");
  await expect(
    page.getByRole("button", { name: /Confirmer — 349/ }),
  ).toBeVisible();
});
