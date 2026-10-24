import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";

test("published apps and the development range are visible and usable without JavaScript", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: testInfo.project.use.viewport });
  try {
    const page = await context.newPage();
    await page.goto(testInfo.project.use.baseURL || "http://127.0.0.1:4173");
    await expect(page.locator(".hero-capabilities")).toHaveCount(0);
    await expect(page.locator(".intro-actions").getByRole("link", { name: /^View all projects/ }))
      .toHaveAttribute("href", "./work/");
    const platformProjects = ["BriefBooth.com", "micro-short-website", "usbmic"].map((id) => projects.find((entry) => entry.id === id));
    const platformPreviews = page.locator(".hero-platform-previews a.hero-platform-project");
    await expect(platformPreviews).toHaveCount(3);
    for (const project of platformProjects) {
      const preview = page.locator(`.hero-platform-previews a[href="${project.caseUrl}"]`);
      await expect(preview.locator(".hero-platform-screen")).toHaveAttribute("src", project.gallery[0].image);
      await expect(preview.locator(".hero-platform-caption")).toContainText(project.title);
      if (project.icon) await expect(preview.locator("img.project-icon")).toHaveAttribute("src", project.icon);
      else {
        await expect(preview.locator("img.project-icon")).toHaveCount(0);
        await expect(preview.locator(".project-initials")).toHaveText("MS");
      }
    }
    const opening = page.locator(".hero-range-proof");
    await expect(opening).toHaveAttribute("href", "./work/#app-store-proof");
    await expect(opening).toHaveText("3 apps published on the App Store ↗");
    // The genuine publication evidence stays reachable through an ordinary link.
    await opening.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/work\/#app-store-proof$/);
    const proof = page.locator("#range-proof");
    await expect(proof.getByRole("heading", { name: "On the App Store.", exact: true })).toBeVisible();
    const store = page.locator("#app-store-proof");
    await expect(store.locator(".range-apps > li")).toHaveCount(3);
    for (const [title, listing] of [
      ["The BitBinder", "https://apps.apple.com/us/app/the-bitbinder/id6756085897"],
      ["My Gig Calendar", "https://apps.apple.com/us/app/my-gig-calendar/id6760590068"],
      ["Open Micer Timer", "https://apps.apple.com/us/app/open-micer-timer/id6756205253"],
    ]) {
      await expect(store.getByRole("link", { name: `View ${title} on the App Store`, exact: true })).toHaveAttribute("href", listing);
    }
    for (const image of await store.locator("img").all()) {
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
      expect(await image.evaluate(el => getComputedStyle(el).filter)).toBe("none");
    }
    for (const project of projects.filter((entry) => entry.demoLabel === "App Store")) {
      const item = store.locator("li").filter({ has: page.getByRole("link", {
        name: `View ${project.title} on the App Store`, exact: true,
      }) });
      const icon = item.locator("img.project-icon");
      expect(new URL(await icon.getAttribute("src"), page.url()).pathname)
        .toBe(`/${project.icon.replace(/^\.\//, "")}`);
      await expect(icon).toHaveCSS("filter", "none");
      await expect(item.locator(".project-icon-frame")).toHaveCSS("filter", "none");
    }
    await expect(proof.locator(".range-card")).toHaveCount(4);
    expect(await proof.evaluate(el => el.closest("main") !== null)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    for (const link of await proof.locator("a").all()) {
      const fits = await link.evaluate(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.left >= 0 && r.right <= document.documentElement.clientWidth; });
      expect(fits).toBe(true);
    }
    await page.goto(testInfo.project.use.baseURL || "http://127.0.0.1:4173");
    const portfolio = page.locator(".intro-actions").getByRole("link", { name: /^View all projects/ });
    await portfolio.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/work\/$/);
    await expect(page.locator("#project-collection .seo-project-card:visible")).toHaveCount(projects.length);
    for (const project of platformProjects) {
      await page.goto(testInfo.project.use.baseURL || "http://127.0.0.1:4173");
      const preview = page.locator(`.hero-platform-previews a[href="${project.caseUrl}"]`);
      const panel = await preview.getAttribute("data-hero-panel");
      await page.locator(`.hero-project-choice`).filter({ has: page.locator(`input[value="${panel}"]`) }).click();
      const destination = new URL(project.caseUrl, page.url()).href;
      // Keyboard activation follows the real project URL without depending on JavaScript or pointer scrolling.
      await preview.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(destination);
      await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(project.title);
    }
  } finally { await context.close(); }
});
