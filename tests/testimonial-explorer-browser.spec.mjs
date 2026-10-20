import { test, expect } from "@playwright/test";
import { clientTestimonials } from "../content/client-testimonials.js";

async function expectEveryReview(page) {
  const section = page.locator("#testimonials");
  await expect(section.getByRole("heading", { name: "In their own words.", exact: true })).toBeVisible();
  await expect(section.locator(":scope > .testimonial-grid")).toHaveCount(1);
  await expect(section.locator(".testimonial-card:visible")).toHaveCount(9);
  await expect(section.locator("details, summary, .feedback-controls, [data-feedback-prev], [data-feedback-next]")).toHaveCount(0);
  await expect(section.locator("blockquote p")).toHaveText(clientTestimonials.map((item) => item.quote));
  await expect(section.locator("figcaption strong")).toHaveText(clientTestimonials.map((item) => item.name));
  await expect(section.locator("figcaption > span:not(.testimonial-location)")).toHaveText(clientTestimonials.map((item) => item.role || item.business));
  await expect(section.locator(".testimonial-location")).toHaveText(clientTestimonials.map((item) => item.location));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await section.locator(".testimonial-card").evaluateAll((cards) => cards.every((card) => {
    const box = card.getBoundingClientRect(); return box.left >= 0 && box.right <= innerWidth;
  })), "Every review fits the page without a horizontal rail").toBe(true);
}

for (const javaScriptEnabled of [true, false]) {
  test.describe(`all client reviews with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled });

    test("all nine original quotes and credits are visible on desktop and narrow mobile without expansion", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/#testimonials");
      for (const width of [1440, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await expectEveryReview(page);
      }
    });
  });
}

test("the Reviews header link opens all nine testimonials on desktop and mobile", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const menu = page.getByRole("button", { name: "Open navigation", exact: true });
    if (await menu.isVisible()) await menu.click();
    const reviews = page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link", { name: "Reviews", exact: true });
    await expect(reviews).toHaveAttribute("href", "#testimonials");
    await reviews.click();
    await expect(page).toHaveURL(/\/#testimonials$/);
    await expect(page.locator("#testimonials-title")).toBeInViewport();
    await expectEveryReview(page);
    if (width <= 900) await expect(page.locator(".menu-toggle")).toHaveAttribute("aria-expanded", "false");
  }
});
