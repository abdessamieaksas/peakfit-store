import { expect, test, type Page } from "@playwright/test";

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

test("saves a COD order before opening its customer-assisted WhatsApp draft", async ({ page }) => {
  await page.context().route("https://wa.me/**", async (route) =>
    route.fulfill({ status: 200, body: "WhatsApp draft intercepted for test" }),
  );
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
          shippingFee: 0,
          total: 34900,
          estimatedDaysMin: 1,
          estimatedDaysMax: 3,
          reservationExpiresAt: "2026-09-11T14:00:00.000Z",
          duplicate: false,
          whatsappUrl:
            "https://wa.me/212719427447?text=PF-260910-TEST1234%20Compression%20Core%20Noir",
        },
      }),
    });
  });

  await page.goto("/commande");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("peakfit-cart-v2"))).toContain(cartLine.variantId);
  await expect(page.getByText("appuyer toi-même sur « Envoyer »", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: /Confirmer — 349/ })).toBeVisible();

  await page.getByLabel("Nom complet").fill("Samir Test");
  await page.getByLabel("Téléphone", { exact: true }).fill("06 12 34 56 78");
  await page.locator("#checkout-email").fill("samir@example.com");
  await page.getByLabel("Ville").fill("Casablanca");
  await page.getByLabel("Adresse de livraison").fill("12 rue Atlas");
  await page.getByLabel(/J’accepte/).check();
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: /^Confirmer/ }).click();
  const whatsapp = await popupPromise;

  await expect(whatsapp).toHaveURL(/https:\/\/wa\.me\/212719427447\?text=/);
  await expect(page).toHaveURL(/\/commande\/merci$/);
  await expect(page.getByText("PF-260910-TEST1234")).toBeVisible();
  await expect(page.getByText("349 MAD")).toBeVisible();
  await expect(page.getByText("Aucun message n’est envoyé automatiquement.")).toBeVisible();
  const continueLink = page.getByRole("link", { name: "Continuer vers WhatsApp" });
  await expect(continueLink).toHaveAttribute("href", /wa\.me\/212719427447/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("peakfit-cart-v2"))).toBe("[]");
});

test("keeps checkout recoverable and does not open WhatsApp when saving fails", async ({ page }) => {
  await page.route("**/api/orders", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "SERVICE_UNAVAILABLE", message: "Réessaie dans un instant." },
      }),
    }),
  );
  await page.goto("/commande");
  await page.getByLabel("Nom complet").fill("Samir Test");
  await page.getByLabel("Téléphone", { exact: true }).fill("06 12 34 56 78");
  await page.getByLabel("Ville").fill("Casablanca");
  await page.getByLabel("Adresse de livraison").fill("12 rue Atlas");
  await page.getByLabel(/J’accepte/).check();

  const popups: Page[] = [];
  page.on("popup", (popup) => popups.push(popup));
  await page.getByRole("button", { name: /^Confirmer/ }).click();

  await expect(page.getByText("Réessaie dans un instant.")).toBeVisible();
  await expect(page.getByLabel("Nom complet")).toHaveValue("Samir Test");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("peakfit-cart-v2"))).toContain(cartLine.variantId);
  expect(popups).toHaveLength(1);
  await expect.poll(() => popups[0]?.isClosed()).toBe(true);
  await expect(page).toHaveURL(/\/commande$/);
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

test("shows free delivery without a city estimator and keeps the product total", async ({ page }) => {
  await page.goto("/panier");
  await expect(page.getByText("Offerte", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("definition").filter({ hasText: "349 MAD" }),
  ).toBeVisible();
  await expect(page.getByLabel("Estimer la livraison")).toHaveCount(0);

  await page.getByRole("link", { name: "Passer la commande" }).click();
  await expect(page.getByText("Offerte partout au Maroc")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Confirmer — 384/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Confirmer — 349/ }),
  ).toBeVisible();

  await page.getByLabel("Ville").fill("Oujda");
  await expect(
    page.getByRole("button", { name: /Confirmer — 349/ }),
  ).toBeVisible();
});
