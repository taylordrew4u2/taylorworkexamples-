import { test, expect } from "@playwright/test";
import { clientTestimonials } from "../content/client-testimonials.js";

async function openMobileFeedback(page, width = 390) {
  await page.setViewportSize({ width, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#testimonials");
  const section = page.locator("#testimonials");
  await expect(section).toHaveClass(/\bfeedback-ready\b/);
  await section.locator(".feedback-controls").scrollIntoViewIfNeeded();
  return section;
}

test("mobile feedback can be explored manually by buttons, keyboard, and native scrolling", async ({ page }) => {
  const section = await openMobileFeedback(page);
  const rail = section.getByRole("region", { name: "Client testimonials", exact: true });
  const previous = section.getByRole("button", { name: "Previous testimonial", exact: true });
  const next = section.getByRole("button", { name: "Next testimonial", exact: true });
  const position = section.locator(".feedback-position");
  await expect(position).toHaveText("1 of 3");
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  await next.click();
  await expect(position).toHaveText("2 of 3");
  await expect(next).toBeFocused();
  await expect(previous).toBeEnabled();
  await next.click();
  await expect(position).toHaveText("3 of 3");
  await expect(next).toBeDisabled();
  await previous.click();
  await expect(position).toHaveText("2 of 3");
  await rail.focus();
  await page.keyboard.press("Home");
  await expect(position).toHaveText("1 of 3");
  await page.keyboard.press("ArrowRight");
  await expect(position).toHaveText("2 of 3");
  await expect(rail).toBeFocused();
  await page.keyboard.press("End");
  await expect(position).toHaveText("3 of 3");
  // A real native scroll event also updates the controls, independently of the
  // previous/next handlers (the same path used by a touch swipe or trackpad).
  await rail.evaluate((element) => element.scrollTo({ left: 0, behavior: "instant" }));
  await expect(position).toHaveText("1 of 3");
  await expect(previous).toBeDisabled();
  await expect(rail.locator(":scope > .testimonial-card")).toHaveCount(3);
  await expect(section.locator(".testimonial-more")).not.toHaveAttribute("open", "");
});

test("read all feedback opens the native disclosure and preserves every client quote", async ({ page }) => {
  const section = await openMobileFeedback(page);
  await section.getByRole("button", { name: "Read all feedback", exact: true }).click();
  const disclosure = section.locator(".testimonial-more");
  const summary = disclosure.locator("summary");
  await expect(disclosure).toHaveAttribute("open", "");
  await expect(summary).toBeFocused();
  await expect(summary).toContainText("Read six more testimonials");
  await expect(section.locator("blockquote p")).toHaveText(clientTestimonials.map((item) => item.quote));
  await expect(section.locator("figcaption strong")).toHaveText(clientTestimonials.map((item) => item.name));
  await page.keyboard.press("Enter");
  await expect(disclosure).not.toHaveAttribute("open", "");
  await expect(summary).toBeFocused();
});

test("narrow mobile feedback fits without overflow or blocking consultation", async ({ page }) => {
  const section = await openMobileFeedback(page, 320);
  const controls = section.locator(".feedback-controls");
  await expect(page.locator(".mobile-consultation")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const button of await controls.getByRole("button").all()) {
    const box = await button.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
    expect(await button.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2));
    }), "The booking dock does not cover feedback controls").toBe(true);
  }
  const next = section.getByRole("button", { name: "Next testimonial", exact: true });
  await next.click();
  await expect(section.locator(".feedback-position")).toHaveText("2 of 3");
  const card = section.locator(":scope > .testimonial-grid > .testimonial-card").nth(1);
  expect(await card.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return box.left >= -1 && box.right <= innerWidth + 1;
  })).toBe(true);
  const booking = page.locator(".mobile-consultation [data-booking-link]");
  await expect(booking).toHaveAttribute("href", "https://briefbooth.com/book/4u-digital");
  await expect(booking).toHaveAttribute("target", "_blank");
});

test("desktop shows all three featured quotes and adapts after mobile browsing", async ({ page }) => {
  const section = await openMobileFeedback(page);
  const rail = section.getByRole("region", { name: "Client testimonials", exact: true });
  await rail.focus();
  await page.keyboard.press("End");
  await expect(section.locator(".feedback-position")).toHaveText("3 of 3");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(section.locator(".feedback-controls")).toBeHidden();
  await expect(section.locator(":scope > .testimonial-grid")).not.toHaveAttribute("tabindex", "0");
  const boxes = await section.locator(":scope > .testimonial-grid > .testimonial-card").evaluateAll((cards) =>
    cards.map((card) => { const box = card.getBoundingClientRect(); return { left: box.left, right: box.right, top: box.top }; }));
  expect(boxes.every((box) => box.left >= 0 && box.right <= 1440)).toBe(true);
  expect(new Set(boxes.map((box) => Math.round(box.top))).size).toBe(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(section.locator(".feedback-controls")).toBeVisible();
  await section.getByRole("region", { name: "Client testimonials", exact: true }).focus();
  await page.keyboard.press("Home");
  await expect(section.locator(".feedback-position")).toHaveText("1 of 3");
});

test.describe("feedback without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the first three quotes and six-more disclosure remain readable at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto("/#testimonials");
    const section = page.locator("#testimonials");
    await expect(section.locator(".feedback-controls")).toBeHidden();
    await expect(section.locator(".testimonial-card:visible")).toHaveCount(3);
    await section.locator(".testimonial-more > summary").focus();
    await page.keyboard.press("Enter");
    await expect(section.locator(".testimonial-card:visible")).toHaveCount(9);
    await expect(section.locator("blockquote p")).toHaveText(clientTestimonials.map((item) => item.quote));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await section.locator(".testimonial-card").evaluateAll((cards) => cards.every((card) => {
      const box = card.getBoundingClientRect(); return box.left >= 0 && box.right <= innerWidth;
    }))).toBe(true);
  });
});
