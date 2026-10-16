import { test, expect } from "@playwright/test";

test("published apps and the development range are visible and usable without JavaScript", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: testInfo.project.use.viewport });
  try {
    const page = await context.newPage();
    await page.goto(testInfo.project.use.baseURL || "http://127.0.0.1:4173");
    const opening = page.locator(".hero-range-proof");
    await expect(opening).toHaveAttribute("href", "#app-store-proof");
    await expect(opening).toContainText("App Store");
    await opening.click();
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
    await expect(proof.locator(".range-card")).toHaveCount(4);
    expect(await proof.evaluate(el => el.closest("#work") !== null)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    for (const link of await proof.locator("a").all()) {
      const fits = await link.evaluate(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.left >= 0 && r.right <= document.documentElement.clientWidth; });
      expect(fits).toBe(true);
    }
  } finally { await context.close(); }
});
