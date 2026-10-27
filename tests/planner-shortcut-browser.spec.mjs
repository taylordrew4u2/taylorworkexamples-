import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";

const example = projects.find((project) => project.id === "The-Bit-Binder");
const routes = ["/", "/services/salon-booking-app-development/", "/contact/", example.caseUrl, "/project-brief/", "/privacy/"];

async function expectPlainPlannerLink(page, width) {
  await expect(page.locator(".planner-shortcut")).toHaveCount(0);
  const footer = page.locator("footer");
  const planner = footer.getByRole("link", { name: "Project planner", exact: true });
  await expect(planner).toHaveCount(1);
  const href = await planner.getAttribute("href");
  expect(href, "The ordinary planner link works on either deployment base").not.toMatch(/^(?:https?:)?\/\//);
  expect(new URL(href, page.url()).pathname).toBe("/project-brief/");
  await expect(planner).not.toHaveAttribute("target", "_blank");
  await planner.focus();
  await expect(planner).toBeFocused();
  await expect(planner).toBeInViewport({ ratio: 1 });
  await expect(planner).not.toHaveCSS("position", "fixed");
  const bounds = await planner.boundingBox();
  expect(bounds.width, "Planner remains easy to tap").toBeGreaterThanOrEqual(44);
  expect(bounds.height).toBeGreaterThanOrEqual(44);
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
  expect(await planner.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return hit === element || element.contains(hit);
  }), "The planner footer link is not covered by booking").toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  return planner;
}

for (const javaScriptEnabled of [true, false]) {
  test.describe(`ordinary optional planner access with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled });

    for (const width of [320, 390, 1440]) {
      test(`the footer keeps the planner accessible without a floating second action at ${width}px`, async ({ page }) => {
        test.setTimeout(60_000);
        await page.setViewportSize({ width, height: 1000 });
        for (const route of routes) {
          await page.goto(route);
          const planner = await expectPlainPlannerLink(page, width);
          const dock = page.locator(".mobile-consultation");
          if (route === "/project-brief/") {
            await expect(dock).toHaveCount(0);
          } else {
            await expect(dock.locator("a")).toHaveCount(1);
            await expect(dock.locator("a")).toHaveAttribute("href", "https://briefbooth.com/book/4u-digital");
            if (width <= 900) {
              await expect(dock.getByRole("link")).toHaveAccessibleName(/^Book a consultation/);
            } else {
              await expect(dock).toBeHidden();
            }
          }
          await planner.focus();
          await page.keyboard.press("Enter");
          await expect(page).toHaveURL(/\/project-brief\/$/);
          await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your project planner.");
          await expect(page.locator(".page-intro")).toContainText("No account or consultation booking is needed.");
          await expect(page.locator(".page-intro")).toContainText("It doesn’t book a meeting.");
          await expect(page.locator(".planner-shortcut")).toHaveCount(0);
        }
      });
    }
  });
}
