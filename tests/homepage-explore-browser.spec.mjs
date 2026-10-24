import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";
import { bookingURL } from "../booking.js";

for (const javaScriptEnabled of [true, false]) {
  test.describe(`homepage project discovery with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled });

    test("Projects navigation and the compact portfolio action open the dedicated work page", async ({ page }) => {
      await page.goto("/");
      const menu = page.locator(".menu-toggle");
      if (javaScriptEnabled && await menu.isVisible()) await menu.click();
      const navigation = page.getByRole("navigation", { name: "Main navigation", exact: true });
      const projectsLink = navigation.getByRole("link", { name: "Projects", exact: true });
      await expect(projectsLink).toHaveAttribute("href", "./work/");
      await projectsLink.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/work\/$/);
      await expect(page.locator(".work-page-grid .seo-project-card")).toHaveCount(projects.length);

      await page.goto("/");
      const discovery = page.locator("#work");
      const allProjects = discovery.getByRole("link", { name: /^View all projects/ });
      await expect(allProjects).toHaveAttribute("href", "./work/");
      await expect(page.locator("#featured-projects, #archive-projects, #project-archive, #range-proof, .project-card, .archive-card"))
        .toHaveCount(0);
      await expect(discovery.locator("input, button[data-project], details.gallery-disclosure")).toHaveCount(0);
      await allProjects.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/work\/$/);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator(".work-page-grid .seo-project-card:visible")).toHaveCount(projects.length);
    });

    test("small-phone portfolio discovery stays clear of booking and does not repeat the project catalog", async ({ page }) => {
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/");
        await page.evaluate(() => document.fonts.ready);
        const discovery = page.locator("#work");
        const allProjects = discovery.getByRole("link", { name: /^View all projects/ });
        await allProjects.focus();
        await expect(allProjects).toBeInViewport({ ratio: 1 });
        const action = await allProjects.boundingBox();
        const dock = page.locator(".mobile-consultation");
        await expect(dock).toBeVisible();
        const dockBox = await dock.boundingBox();
        expect(action.width).toBeGreaterThanOrEqual(44);
        expect(action.height).toBeGreaterThanOrEqual(44);
        expect(action.x).toBeGreaterThanOrEqual(0);
        expect(action.x + action.width).toBeLessThanOrEqual(width);
        expect(action.y + action.height, "The portfolio action remains above the mobile booking dock")
          .toBeLessThanOrEqual(dockBox.y + 1);
        await expect(dock.locator("[data-booking-link]")).toHaveAttribute("href", bookingURL);
        await expect(page.locator(".planner-shortcut")).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(await discovery.evaluate((element) => Boolean(
          element.compareDocumentPosition(document.querySelector("#process")) & Node.DOCUMENT_POSITION_FOLLOWING,
        )), "The working process follows the compact portfolio introduction").toBe(true);
      }
    });
  });
}
