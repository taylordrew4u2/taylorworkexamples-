import { test, expect } from "@playwright/test";

for (const javaScriptEnabled of [true, false]) {
  test.describe(`simple homepage controls with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled, reducedMotion: "reduce" });
    test("essential choices fit phones without extra choosers or overlapping controls", async ({ page }) => {
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/");
        await expect(page.locator(".simple-actions a")).toHaveCount(2);
        await expect(page.locator(".simple-service")).toHaveCount(4);
        await expect(page.locator(".simple-project")).toHaveCount(3);
        await expect(page.locator("#project-dialog, .hero-explorer, .hero-project-types, .planner-shortcut, #business-guides")).toHaveCount(0);
        for (const link of await page.locator(".simple-actions a, .simple-service, .simple-project, #website-offer a").all()) {
          await link.focus();
          await expect(link).toBeInViewport({ ratio: 1 });
          const box = await link.boundingBox();
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.x).toBeGreaterThanOrEqual(-1);
          expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
          expect(await link.evaluate((element) => {
            const box = element.getBoundingClientRect();
            const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
            return hit === element || element.contains(hit);
          }), "Visible choices receive taps directly").toBe(true);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    });
  });
}
