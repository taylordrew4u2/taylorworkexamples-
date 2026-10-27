import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";

for (const javaScriptEnabled of [true, false]) {
  test.describe(`ordinary homepage project links with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled });
    test("three selected projects open their full case pages and the complete collection stays reachable", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 900 });
      for (const id of ["micro-short-website", "BriefBooth.com", "The-Bit-Binder"]) {
        const project = projects.find((entry) => entry.id === id);
        await page.goto("/");
        const link = page.locator(`.simple-project[href="${project.caseUrl}"]`);
        await expect(page.locator(".simple-project")).toHaveCount(3);
        await expect(link).toHaveAccessibleName(`View project: ${project.title}`);
        await expect(link).not.toHaveAttribute("aria-haspopup", "dialog");
        await link.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(new RegExp(`${project.caseUrl.replace(/^\./, "")}$`));
        await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(project.title);
        await expect(page.locator(".project-page-frame")).toHaveCount(project.gallery.length);
      }
      await page.goto("/");
      const all = page.locator("#work").getByRole("link", { name: /^View all projects/ });
      await all.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/work\/$/);
      await expect(page.locator(".work-page-grid .seo-project-card")).toHaveCount(projects.length);
    });
  });
}
