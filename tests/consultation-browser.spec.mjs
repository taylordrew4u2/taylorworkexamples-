import { test, expect } from "@playwright/test";
import { bookingURL } from "../booking.js";

for (const javaScriptEnabled of [true, false]) {
  test.describe(`simple consultation handoff with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled });
    test("clients book directly with BriefBooth from the opening and end of the page", async ({ page }) => {
      await page.context().route(bookingURL, (route) => route.fulfill({
        status: 200, contentType: "text/html", body: "<title>Booking destination test</title><h1>Booking destination test</h1>",
      }));
      await page.goto("/");
      for (const link of [page.locator(".simple-actions [data-booking-link]"), page.locator("#consultation [data-booking-link]")]) {
        await expect(link).toHaveAttribute("href", bookingURL);
        await expect(link).toHaveAttribute("target", "_blank");
        await expect(link).toHaveAttribute("rel", /noopener/);
        await expect(link).toHaveAttribute("rel", /noreferrer/);
        const originalURL = page.url();
        await link.focus();
        const pendingPopup = page.waitForEvent("popup");
        await page.keyboard.press("Enter");
        const popup = await pendingPopup;
        try {
          await expect(popup).toHaveURL(bookingURL);
          await expect(popup.getByRole("heading", { level: 1 })).toHaveText("Booking destination test");
          await expect(page).toHaveURL(originalURL);
        } finally { await popup.close(); }
      }
      await expect(page.locator("#consultation")).toContainText(/BriefBooth.*new tab.*reviewed before confirmation/i);
      await expect(page.locator("#project-faq")).toContainText(/First consultations are online/);
      await expect(page.locator("#project-faq")).toContainText(/physical space or workflow/);
      await expect(page.locator("#project-faq")).toContainText(/Manhattan, Brooklyn, and parts of Queens/);
      await expect(page.locator("main form, main iframe, main input[type='date'], main input[type='time']")).toHaveCount(0);
      await expect(page.locator("footer a[href^='mailto:']")).toHaveAttribute("href", /^mailto:admin@customtechbuilt4u\.com/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  });
}
