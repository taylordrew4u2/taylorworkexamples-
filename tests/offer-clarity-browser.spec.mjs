import { test, expect } from "@playwright/test";
import { launchOffer } from "../seo-offer.js";
import { services } from "../seo-content.js";
import { bookingURL } from "../booking.js";

const destinationNote = "Video consultation · Opens BriefBooth in a new tab. Requests are reviewed before confirmation.";

for (const javaScriptEnabled of [true, false]) {
  test.describe(`offer commitments and booking context with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled });

    test("clients see payment, timing, ownership, and running costs before the offer proof", async ({ page }) => {
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/offer/");
        const packages = page.locator(".offer-packages");
        const terms = page.locator("#offer-terms");
        await expect(packages.locator(".offer-package-grid > article")).toHaveCount(2);
        await expect(packages).toContainText("$1,500");
        await expect(packages).toContainText("$3,000");
        await expect(packages).toContainText("Three months of content changes after launch.");
        await expect(packages).toContainText(/first ten eligible New York City business projects agreed by November 30, 2026, subject to scope and capacity/i);
        await expect(packages).toContainText(/30-day money-back guarantee after the completed product launches/i);
        expect(await packages.evaluate((element) => element.nextElementSibling?.id),
          "The complete commitment terms follow the packages directly").toBe("offer-terms");
        expect(await terms.evaluate((element) => Boolean(
          element.compareDocumentPosition(document.querySelector("#offer-proof")) & Node.DOCUMENT_POSITION_FOLLOWING,
        )), "A client reaches the terms before the project image and review").toBe(true);

        const upfront = terms.locator(".offer-terms-grid");
        for (const [index, section] of launchOffer.sections.slice(2).entries()) {
          const card = upfront.locator("article").nth(index);
          await expect(card.getByRole("heading", { level: 3 })).toHaveText(section.heading);
          await expect(card.locator("p")).toBeVisible();
          await expect(card.locator("p")).toHaveText(section.text);
          await expect(page.locator("main").getByText(section.text, { exact: true })).toHaveCount(1);
        }
        await expect(upfront).toContainText(/consultation does not commit you to a paid project/i);
        await expect(upfront).toContainText(/scope, price, project start, and target launch date in writing/i);
        await expect(upfront).toContainText(/Half is paid at the start and half at launch/i);
        await expect(upfront).toContainText(/first design review, before any code is written, is not right, the deposit comes back/i);
        await expect(upfront).toContainText(/domain renews in your name for about \$20 a year/i);
        await expect(upfront).toContainText(/hosting runs \$0 to \$10 a month depending on traffic/i);
        await expect(upfront).toContainText(/no monthly builder fee and no percentage on bookings or orders/i);

        const details = terms.locator("details.offer-package-details");
        await expect(details).not.toHaveAttribute("open", "");
        const summary = details.locator("summary");
        await summary.scrollIntoViewIfNeeded();
        const box = await summary.boundingBox();
        expect(box.height, "The optional scope disclosure has a phone-sized tap target").toBeGreaterThanOrEqual(44);
        await summary.focus();
        await page.keyboard.press("Enter");
        await expect(details).toHaveAttribute("open", "");
        for (const [index, section] of launchOffer.sections.slice(0, 2).entries()) {
          const expanded = details.locator(".offer-expanded-scope > article").nth(index);
          await expect(expanded.getByRole("heading", { level: 3 })).toHaveText(section.heading);
          await expect(expanded.locator("p")).toBeVisible();
          await expect(expanded.locator("p")).toHaveText(section.text);
          await expect(page.locator("main").getByText(section.text, { exact: true })).toHaveCount(1);
        }
        await expect(details).toContainText(/school or program.*enrollment, tour booking, or a waitlist/i);
        await expect(details).toContainText(/offer-specific benefit is in addition to the 30-day money-back guarantee and reasonable changes/i);
        await summary.focus();
        await page.keyboard.press("Enter");
        await expect(details).not.toHaveAttribute("open", "");
        await expect(details.locator(".offer-expanded-scope")).not.toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          "Prices, terms, and expanded details fit the viewport").toBe(true);
      }
    });

    test("service, offer, and NYC openings explain the external request-based booking before leaving", async ({ page }) => {
      test.setTimeout(120_000);
      const routes = [...services.map(({ slug }) => `/services/${slug}/`), "/offer/", "/new-york-city/"];
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 });
        for (const route of routes) {
          await test.step(`${route} at ${width}px`, async () => {
            await page.goto(route);
            const opening = page.locator(".page-intro");
            const booking = opening.locator(".page-actions > [data-booking-link]");
            await expect(booking).toHaveCount(1);
            await expect(booking).toHaveAttribute("href", bookingURL);
            await expect(booking).toHaveAttribute("target", "_blank");
            await expect(booking).toHaveAttribute("rel", /\bnoopener\b/);
            await expect(booking).toHaveAttribute("rel", /\bnoreferrer\b/);
            await expect(booking).toHaveAccessibleName(/Book a consultation/);
            const note = opening.locator(":scope > .booking-destination-note");
            await expect(note).toHaveCount(1);
            await expect(note).toBeVisible();
            await expect(note).toHaveText(destinationNote);
            expect(await note.evaluate((element) => element.previousElementSibling?.classList.contains("page-actions")),
              "The destination and confirmation note belongs directly to the opening booking actions").toBe(true);
            await expect(opening.locator("form, iframe, input")).toHaveCount(0);
            const noteBox = await note.boundingBox();
            expect(noteBox.x).toBeGreaterThanOrEqual(-1);
            expect(noteBox.x + noteBox.width).toBeLessThanOrEqual(width + 1);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          });
        }
      }
    });
  });
}
