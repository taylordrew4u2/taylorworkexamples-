import { test, expect } from "@playwright/test";
import { services } from "../seo-content.js";
import { bookingURL } from "../booking.js";

async function expectTapTarget(link, width) {
  await expect(link).toBeVisible();
  const box = await link.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
}

for (const javaScriptEnabled of [true, false]) {
  test.describe(`minimal homepage journey with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled, reducedMotion: "reduce" });

    test("clients can book or browse directly from a short opening at 320px and 390px", async ({ page }) => {
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 });
        await page.goto("/");
        const hero = page.locator(".simple-hero");
        await expect(hero.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(hero).toContainText(/one developer/i);
        const actions = hero.locator(".simple-actions");
        await expect(actions.getByRole("link")).toHaveCount(2);
        const booking = actions.locator("[data-booking-link]");
        await expect(booking).toHaveAttribute("href", bookingURL);
        await expect(booking).toHaveAttribute("target", "_blank");
        await expect(booking).toHaveAttribute("rel", /noopener/);
        await expect(booking).toHaveAttribute("rel", /noreferrer/);
        await expectTapTarget(booking, width);
        const browse = actions.getByRole("link", { name: /^View projects/ });
        await expect(browse).toHaveAttribute("href", "./work/");
        await expectTapTarget(browse, width);
        await expect(hero).toContainText(/BriefBooth.*new tab/i);
        await expect(hero).toContainText(/reviewed before confirmation/i);
        await expect(hero.locator("form, input, select, textarea, [role='tablist']")).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await browse.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/\/work\/$/);
      }
    });

    test("four short service choices lead to complete service pages without inline galleries", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 900 });
      for (const slug of ["website-development", "web-app-development", "app-development", "custom-software-development"]) {
        await page.goto("/");
        const choices = page.locator("#services .simple-service");
        await expect(choices).toHaveCount(4);
        await expect(page.locator("#services details, #services img, #services form")).toHaveCount(0);
        const choice = page.locator(`#services a[href="./services/${slug}/"]`);
        await expect(choice.getByRole("heading", { level: 3 })).toBeVisible();
        await expectTapTarget(choice, 320);
        await choice.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(new RegExp(`/services/${slug}/$`));
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(services.find((service) => service.slug === slug).heading);
        await expect(page.locator(".page-intro [data-booking-link]")).toHaveAttribute("href", bookingURL);
      }
    });
  });
}
