import { test, expect } from "@playwright/test";
import { clientTestimonials } from "../content/client-testimonials.js";

for (const javaScriptEnabled of [true, false]) {
  test.describe(`compact client reviews with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled, reducedMotion: "reduce" });
    test("three reviews introduce the feedback and a native disclosure preserves all nine original quotes", async ({ page }) => {
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/");
        const section = page.locator("#testimonials");
        await expect(section.locator(".testimonial-card:visible")).toHaveCount(3);
        await expect(section.locator(".testimonial-card")).toHaveCount(9);
        await expect(section.locator("blockquote p")).toHaveText(clientTestimonials.map((item) => item.quote));
        await expect(section.locator("figcaption strong")).toHaveText(clientTestimonials.map((item) => item.name));
        await expect(section.locator(".testimonial-location")).toHaveText(clientTestimonials.map((item) => item.location));
        const details = section.locator("details");
        await expect(details).toHaveCount(1);
        await expect(details).not.toHaveAttribute("open", "");
        await expect(details.locator(".testimonial-card")).toHaveCount(6);
        const summary = details.locator("summary");
        await expect(summary).toHaveText(/Read all 9 client reviews/);
        await summary.focus();
        await page.keyboard.press("Enter");
        await expect(details).toHaveAttribute("open", "");
        await expect(section.locator(".testimonial-card:visible")).toHaveCount(9);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await summary.focus();
        await page.keyboard.press("Enter");
        await expect(details).not.toHaveAttribute("open", "");
        await expect(summary).toBeFocused();
      }
    });
  });
}
