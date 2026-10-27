import { test, expect } from "@playwright/test";

for (const javaScriptEnabled of [true, false]) {
  test.describe(`simple homepage controls with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled, reducedMotion: "reduce" });
    test("essential choices fit phones without extra choosers or overlapping controls", async ({ page }) => {
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/");
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator(".simple-actions a")).toHaveCount(2);
        await expect(page.locator(".simple-service")).toHaveCount(4);
        await expect(page.locator(".simple-project")).toHaveCount(3);
        await expect(page.locator("#project-dialog, .hero-explorer, .hero-project-types, .planner-shortcut, #business-guides")).toHaveCount(0);
        const targets = await page.locator(".simple-actions a, .simple-service, .simple-project, #website-offer a").evaluateAll((elements) =>
          elements.map((element) => {
            element.focus();
            const box = element.getBoundingClientRect();
            const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
            return { label: element.textContent.trim(), width: box.width, height: box.height,
              left: box.left, right: box.right, top: box.top, bottom: box.bottom,
              directlyTappable: hit === element || element.contains(hit) };
          }));
        for (const target of targets) {
          const label = `${width}px ${target.label}`;
          expect(target.width, label).toBeGreaterThanOrEqual(44);
          expect(target.height, label).toBeGreaterThanOrEqual(44);
          expect(target.left, label).toBeGreaterThanOrEqual(-1);
          expect(target.right, label).toBeLessThanOrEqual(width + 1);
          expect(target.top, label).toBeGreaterThanOrEqual(-1);
          expect(target.bottom, label).toBeLessThanOrEqual(901);
          expect(target.directlyTappable, `${label}: visible choices receive taps directly`).toBe(true);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    });
  });
}
