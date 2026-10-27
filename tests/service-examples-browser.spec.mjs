import { test, expect } from "@playwright/test";

for (const javaScriptEnabled of [true, false]) {
  test.describe(`homepage service links with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled });
    test("service details and original examples live on their dedicated pages", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 844 });
      for (const slug of ["website-development", "web-app-development", "app-development", "custom-software-development"]) {
        await page.goto("/");
        await expect(page.locator("#services details, #services img, #services button")).toHaveCount(0);
        const link = page.locator(`#services a[href="./services/${slug}/"]`);
        await link.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(new RegExp(`/services/${slug}/$`));
        await expect(page.locator("#examples")).toHaveCount(1);
        await expect(page.locator("#examples a[href*='/work/']")).not.toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    });
  });
}
