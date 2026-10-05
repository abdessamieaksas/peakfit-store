import { expect, test } from "@playwright/test";

test("shows Peakfit's Instagram and WhatsApp Business links in the footer", async ({ page }) => {
  await page.goto("/");

  const instagram = page.getByRole("link", { name: "Instagram · @peakfit__store" });
  await expect(instagram).toHaveAttribute("href", "https://www.instagram.com/peakfit__store/");
  await expect(instagram).toHaveAttribute("target", "_blank");

  const whatsapp = page.getByRole("link", { name: "WhatsApp · +212 719 427 447" });
  await expect(whatsapp).toHaveAttribute("href", "https://wa.me/212719427447");
  await expect(whatsapp).toHaveAttribute("target", "_blank");
});
