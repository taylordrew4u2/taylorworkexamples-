import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";

// Native background-tab behavior uses full Chromium's new headless mode.
// Keep narrow layouts with desktop mouse/keyboard input in both test projects.
// https://playwright.dev/docs/browsers#chromium-new-headless-mode
test.use({ channel: "chromium", isMobile: false, hasTouch: false });

test.describe("native modified app-banner gestures", () => {
  for (const width of [320, 390]) {
    for (const gesture of [
      { name: "modifier click", options: { modifiers: ["ControlOrMeta"] } },
      { name: "middle click", options: { button: "middle" } },
    ]) {
      test(`${width}px ${gesture.name} opens the case page in a new tab instead of opening the preview`, async ({ page }) => {
        const project = projects.find((entry) => entry.id === "The-Bit-Binder");
        await page.setViewportSize({ width, height: 844 });
        await page.goto("/");
        const originalURL = page.url();
        const destination = new URL(project.caseUrl, originalURL).href;
        const link = page.locator(`a.hero-project[data-project="${project.id}"]`);
        await expect(link).toHaveAttribute("aria-haspopup", "dialog");
        // Each gesture gets a fresh page and context. Activate its source tab
        // explicitly before relying on the browser's native background-tab action.
        await page.bringToFront();
        // Native background tabs are observable at the browser-context level;
        // they need not be reported as an opener-created popup.
        const pendingPage = page.context().waitForEvent("page");
        await link.click(gesture.options);
        const popup = await pendingPage;
        try {
          expect(popup, "The native gesture opens a separate browser tab").not.toBe(page);
          await popup.bringToFront();
          await popup.waitForLoadState("domcontentloaded");
          await expect(popup).toHaveURL(destination);
          await expect(popup.getByRole("heading", { level: 1 })).toHaveText(project.title);
          await expect(page).toHaveURL(originalURL);
          await expect(page.getByRole("dialog")).toBeHidden();
        } finally {
          await popup.close();
        }
      });
    }
  }
});
