import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";
import { projectSlugs, services } from "../seo-content.js";
import { bookingURL } from "../booking.js";

const routes = ["/work/", "/services/", ...projects.map((project) => `/work/${projectSlugs[project.id]}/`),
  ...services.map((service) => `/services/${service.slug}/`)];

async function expectPhoneTarget(link, width) {
  await expect(link).toBeVisible();
  const box = await link.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
}

for (const javaScriptEnabled of [true, false]) {
  test.describe(`minimal inner-page client journey with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled, reducedMotion: "reduce" });

    for (const width of [320, 390]) {
      test(`all project and service pages have a clear mobile opening and optional detail at ${width}px`, async ({ page }) => {
        test.setTimeout(180_000);
        await page.setViewportSize({ width, height: 844 });
        expect(routes).toHaveLength(21);
        for (const route of routes) {
          await test.step(route, async () => {
            await page.goto(route);
            await page.evaluate(() => document.fonts.ready);
            await expect(page.locator("main")).toHaveCount(1);
            await expect(page.locator("h1")).toHaveCount(1);
            await expect(page.locator("h1")).toBeVisible();
            const opening = page.locator(".page-intro");
            const actions = opening.locator(".page-actions a");
            expect(await actions.count(), "The opening has at most two choices").toBeLessThanOrEqual(2);
            const booking = opening.locator("[data-booking-link]");
            await expect(booking).toHaveCount(1);
            await expect(booking).toHaveAttribute("href", bookingURL);
            await expect(booking).toHaveAttribute("target", "_blank");
            await expect(booking).toHaveAttribute("rel", /\bnoopener\b/);
            await expect(booking).toHaveAttribute("rel", /\bnoreferrer\b/);
            await expect(booking).toHaveAccessibleName(/^Book a consultation/);
            await expectPhoneTarget(booking, width);
            await expect(booking).toBeInViewport({ ratio: 1 });
            await expect(opening.locator('a[href^="mailto:"]')).toHaveCount(0);
            await expect(page.locator("main form, main iframe, main input[type=date], main input[type=time]"))
              .toHaveCount(0);
            await expect(page.locator(".planner-shortcut")).toHaveCount(0);

            const images = await page.locator("main img").evaluateAll((elements) => elements.map((element) => {
              const ancestors = [];
              for (let ancestor = element; ancestor?.closest("main"); ancestor = ancestor.parentElement) {
                const style = getComputedStyle(ancestor);
                ancestors.push({ filter: style.filter, blend: style.mixBlendMode });
              }
              return { src: element.getAttribute("src"), width: Number(element.getAttribute("width")),
                height: Number(element.getAttribute("height")), ancestors };
            }));
            for (const image of images) {
              expect(image.src).toBeTruthy();
              expect(image.width).toBeGreaterThan(0);
              expect(image.height).toBeGreaterThan(0);
              for (const ancestor of image.ancestors) {
                expect(ancestor.filter, "Project artwork keeps its original full color").toBe("none");
                expect(ancestor.blend).toBe("normal");
              }
            }

            const disclosure = page.locator("main details").first();
            if (await disclosure.count()) {
              await expect(disclosure).not.toHaveAttribute("open", "");
              const summary = disclosure.locator(":scope > summary");
              await expectPhoneTarget(summary, width);
              await summary.focus();
              await page.keyboard.press("Enter");
              await expect(disclosure).toHaveAttribute("open", "");
              await page.keyboard.press("Enter");
              await expect(disclosure).not.toHaveAttribute("open", "");
            }

            const links = await page.locator("main a[href]").evaluateAll((elements) => elements.flatMap((element) => {
              const url = new URL(element.getAttribute("href"), location.href);
              if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return [];
              return [{ href: element.getAttribute("href"), exists: Boolean(document.getElementById(decodeURIComponent(url.hash.slice(1)))) }];
            }));
            expect(links.filter((link) => !link.exists), "Every local jump has an actual destination").toEqual([]);
            const dock = page.locator(".mobile-consultation");
            await expect(dock.getByRole("link")).toHaveCount(1);
            await expect(dock.locator("[data-booking-link]")).toHaveAttribute("href", bookingURL);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
              "The complete document fits a narrow phone").toBe(true);
          });
        }
      });
    }

    test("an existing App Store proof link reveals optional publication evidence", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 844 });
      await page.goto("/work/#app-store-proof");
      const evidence = page.locator("details#range-proof");
      await expect(evidence).toHaveAttribute("open", "");
      await expect(page.locator("#app-store-proof")).toBeVisible();
      await expect(page.locator("#app-store-proof")).toBeInViewport({ ratio: 0.01 });
      for (const project of projects.filter((entry) => entry.demoLabel === "App Store")) {
        await expect(page.locator(`#app-store-proof a[href="${project.demoUrl}"]`)).toBeVisible();
      }
    });
  });
}
