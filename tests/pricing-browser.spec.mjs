import { test, expect } from "@playwright/test";
import { pricing } from "../content/pricing.js";
import { bookingURL } from "../booking.js";

async function expectTapTarget(locator, width) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
}

for (const javaScriptEnabled of [true, false]) {
  test.describe(`clear scoped pricing with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled });

    for (const width of [320, 390, 1440]) {
      test(`the six prices, full commitments, and native booking path work at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: width <= 390 ? 844 : 1000 });
        await page.goto("/");
        const costs = page.locator("details").filter({ has: page.getByText("How much will my project cost?", { exact: true }) });
        await costs.locator("summary").focus();
        await page.keyboard.press("Enter");
        const costPricing = costs.getByRole("link", { name: "See project starting prices", exact: true });
        await costPricing.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/\/pricing\/$/);
        await page.goto("/services/");
        const servicePricing = page.locator('.service-pricing-link a[href$="pricing/"]');
        await expectTapTarget(servicePricing, width);
        await servicePricing.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/\/pricing\/$/);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(pricing.heading);
        await expect(page.locator(".pricing-card")).toHaveCount(6);
        await expect(page.locator(".pricing-amount").first()).toBeInViewport({ ratio: 1 });
        const amounts = [/^\$190$/, /^\$475$/, /^From\s+\$575$/, /^From\s+\$950$/, /^From\s+\$575$/, /^\$9\.50\s*\/hour$/];
        for (const [index, entry] of pricing.entries.entries()) {
          const card = page.locator(`[data-pricing-id="${entry.id}"]`);
          await expect(card.locator("h2")).toHaveText(entry.title);
          await expect(card.locator(".pricing-amount")).toHaveText(amounts[index]);
          await expect(card.locator("li")).toHaveText(entry.includes);
          const box = await card.boundingBox();
          expect(box.x).toBeGreaterThanOrEqual(-1);
          expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
        }
        await expect(page.locator(".pricing-eligibility")).toContainText(pricing.websiteOffer.compactEligibility);
        await expect(page.locator(".pricing-eligibility")).toContainText(pricing.websiteOffer.outsideOffer);
        await expect(page.locator(".pricing-eligibility-full")).toHaveText(pricing.websiteOffer.eligibility);
        await expect(page.locator(".pricing-budget-note")).toHaveText(pricing.budgetNote);
        await expect(page.locator("main")).toContainText(pricing.runningCosts);
        for (const selector of [".pricing-offer-details", ".pricing-commitments"]) {
          const detail = page.locator(selector);
          await expect(detail).not.toHaveAttribute("open");
          await expectTapTarget(detail.locator(":scope > summary"), width);
          await detail.locator(":scope > summary").focus();
          await page.keyboard.press("Enter");
          await expect(detail).toHaveAttribute("open", "");
        }
        for (const section of pricing.websiteOffer.sections) await expect(page.locator(".pricing-offer-details")).toContainText(section.text);
        for (const section of pricing.care.sections) {
          const commitment = page.locator(`.pricing-commitments [data-client-care="${section.id}"]`);
          await expect(commitment.locator("h3")).toHaveText(section.title);
          await expect(commitment.locator("p")).toHaveText(section.text);
        }
        await expect(page.locator(".pricing-support-example")).toHaveText(pricing.hourlySupportExample);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await expect(page.locator("main form, main iframe, main input, main select, main textarea, main a[href^='mailto:']")).toHaveCount(0);

        await page.goto("/work/briefbooth/");
        const footerPricing = page.locator("footer").getByRole("link", { name: "Pricing", exact: true });
        await expectTapTarget(footerPricing, width);
        await footerPricing.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/\/pricing\/$/);
        const booking = page.locator("main [data-booking-link]");
        await expect(booking).toHaveCount(1);
        await expectTapTarget(booking, width);
        await expect(booking).toHaveAttribute("href", bookingURL);
        await expect(booking).toHaveAttribute("target", "_blank");
        await expect(booking).toHaveAttribute("rel", /\bnoopener\b/);
        await expect(booking).toHaveAttribute("rel", /\bnoreferrer\b/);
        await expect(page.locator(".pricing-closing .booking-destination")).toContainText("Requests are reviewed before confirmation.");
        // Stub the external destination; never submit a real consultation request.
        await page.context().route(bookingURL, route => route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Booking handoff test</title><h1>Booking handoff test</h1>" }));
        await booking.focus();
        const pendingPopup = page.waitForEvent("popup");
        await page.keyboard.press("Enter");
        const popup = await pendingPopup;
        try {
          await expect(popup).toHaveURL(bookingURL);
          await expect(page).toHaveURL(/\/pricing\/$/);
        } finally {
          await popup.close();
        }
      });
    }
  });
}
