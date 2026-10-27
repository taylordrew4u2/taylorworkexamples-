import { test, expect } from "@playwright/test";

const cases = [
  { route: "/work/briefbooth/", image: "/assets/briefbooth/booking-mobile.png" },
  { route: "/work/pins-and-needles-comedy/", image: "/assets/pinsandneedles-audience-current.webp" },
];

for (const { route, image } of cases) {
  test(`a delayed portrait image keeps the focused footer stable on ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    let releaseImage;
    let requested = false;
    const imageGate = new Promise((resolve) => { releaseImage = resolve; });
    await page.route(`**${image}`, async (request) => {
      requested = true;
      await imageGate;
      await request.continue();
    });
    try {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      const portrait = page.locator(`.project-page-frame img[src$="${image}"]`);
      await expect(portrait).toHaveAttribute("loading", "lazy");
      await expect(portrait).toHaveCSS("object-fit", "contain");
      await expect(portrait).toHaveCSS("filter", "none");
      await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
      const lastFooterLink = page.locator("footer a:visible").last();
      await lastFooterLink.focus();
      await expect(lastFooterLink).toBeFocused();
      await expect(lastFooterLink).toBeInViewport({ ratio: 1 });
      await expect.poll(() => requested, "The real lazy source image is still waiting for its response").toBe(true);
      const before = await portrait.evaluate((element) => ({
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height,
        documentHeight: document.documentElement.scrollHeight,
        scrollY,
      }));
      expect(before.width, "The image reserves width before it has loaded").toBeGreaterThan(0);
      expect(before.height, "The image reserves height before it has loaded").toBeGreaterThan(0);
      releaseImage();
      await expect.poll(() => portrait.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
      const after = await page.evaluate(() => ({ documentHeight: document.documentElement.scrollHeight, scrollY }));
      expect(after.documentHeight, "Decoding the portrait does not move later page content").toBe(before.documentHeight);
      expect(after.scrollY, "The browser does not need to compensate for a gallery layout shift").toBe(before.scrollY);
      await expect(lastFooterLink).toBeFocused();
      await expect(lastFooterLink).toBeInViewport({ ratio: 1 });
    } finally {
      releaseImage();
    }
  });
}
