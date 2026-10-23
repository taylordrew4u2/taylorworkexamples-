import { test, expect } from "@playwright/test";

for (const javaScriptEnabled of [true, false]) {
  test(`service examples open in place with original artwork ${javaScriptEnabled ? "with" : "without"} JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled, viewport: { width: 320, height: 844 }, reducedMotion: "reduce" });
    try {
      const page = await context.newPage();
      await page.goto("http://127.0.0.1:4173/#services");
      const cards = page.locator("#services .service-item");
      await expect(cards).toHaveCount(3);
      const examples = [
        ["website", "./assets/micro-short/home.jpg", "./work/micro-short-film-website/", "Micro-short Film Website · Repository website capture", "website-development"],
        ["web-app", "./assets/briefbooth/home-desktop.png", "./work/briefbooth/", "Live website capture", "web-app-development"],
        ["software", "./assets/my-gig-calendar/banner-1920x1080.png", "./work/my-gig-calendar/", "Supplied product artwork", "app-development"],
      ];
      for (const [type, source, destination, caption, serviceSlug] of examples) {
        const card = page.locator(`.service-item[data-service="${type}"]`);
        const example = card.locator("details.service-example");
        const summary = example.locator("summary");
        await expect(example).not.toHaveAttribute("open", "");
        await summary.focus();
        await page.keyboard.press("Enter");
        await expect(example).toHaveAttribute("open", "");
        await expect(example.locator(".service-example-flow > li")).toHaveCount(3);
        const image = example.locator("img");
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
        await expect(image).toHaveAttribute("src", source);
        await expect(image).toHaveAttribute("srcset", /\S/);
        await expect(image).toHaveCSS("filter", "none");
        await expect(image).toHaveCSS("object-fit", "contain");
        await expect(example.locator("figcaption")).toContainText(caption);
        await expect(example.getByRole("link")).toHaveAttribute("href", destination);
        expect(await image.evaluate(el => {
          const box = el.getBoundingClientRect();
          return box.left >= 0 && box.right <= innerWidth && Math.abs(box.width / box.height - Number(el.getAttribute("width")) / Number(el.getAttribute("height"))) < .02;
        })).toBe(true);
        const serviceLink = card.locator(`.service-inquiry[href="./services/${serviceSlug}/"]`);
        await expect(serviceLink).toHaveCount(1);
        await expect(serviceLink).toBeVisible();
        if (type === "website") {
          const offer = card.getByRole("link", { name: /^Website offer for NYC businesses/ });
          await expect(offer).toBeVisible();
          await expect(offer).toHaveAttribute("href", "./offer/");
        }
        await expect(page.locator(".mobile-consultation [data-booking-link]")).toHaveAttribute("href", "https://briefbooth.com/book/4u-digital");
        await summary.focus();
        await page.keyboard.press("Enter");
        await expect(example).not.toHaveAttribute("open", "");
        await expect(summary).toBeFocused();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } finally { await context.close(); }
  });
}
