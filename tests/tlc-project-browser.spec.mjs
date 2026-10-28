import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";
import { bookingURL } from "../booking.js";

const project = projects.find((entry) => entry.id === "tlcmassagewellness");
const route = "/work/tlc-massage-wellness/";

async function originalAppearance(image, frame) {
  await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
  await expect(image).toHaveAttribute("width", String(frame.width));
  await expect(image).toHaveAttribute("height", String(frame.height));
  await expect(image).toHaveCSS("object-fit", "contain");
  const appearance = await image.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const ancestors = [];
    for (let ancestor = element; ancestor?.closest("main"); ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      ancestors.push({ filter: style.filter, blend: style.mixBlendMode });
    }
    return { left: box.left, right: box.right, viewport: innerWidth,
      naturalRatio: element.naturalWidth / element.naturalHeight, ancestors };
  });
  expect(Math.abs(appearance.naturalRatio - frame.width / frame.height)).toBeLessThan(.01);
  expect(appearance.left).toBeGreaterThanOrEqual(-1);
  expect(appearance.right).toBeLessThanOrEqual(appearance.viewport + 1);
  for (const ancestor of appearance.ancestors) {
    expect(ancestor.filter).toBe("none");
    expect(ancestor.blend).toBe("normal");
  }
}

for (const javaScriptEnabled of [true, false]) {
  test.describe(`TLC client journey with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled });

    test("a mobile client can find TLC, inspect its complete visual story and book directly", async ({ page }) => {
      test.setTimeout(120_000);
      await page.context().route(bookingURL, (request) => request.fulfill({
        status: 200, contentType: "text/html",
        body: "<!doctype html><title>Booking handoff test</title><h1>Booking handoff test</h1>",
      }));
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 });
        await page.goto("/work/");
        const card = page.locator('.seo-project-card[data-project-id="tlcmassagewellness"]');
        await expect(card.locator(".seo-project-heading h3")).toHaveText(project.title);
        await expect(card.locator(".work-project-capabilities li")).toHaveCount(3);
        await expect(card.locator(".work-project-purpose")).toHaveText(project.purpose);
        await originalAppearance(card.locator(".seo-project-cover img"), project.gallery[0]);
        await card.getByRole("link", { name: `See how it works: ${project.title}`, exact: true }).click();
        await expect(page).toHaveURL(new RegExp(`${route}$`));
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(project.title);
        await expect(page.locator(".project-page-frame")).toHaveCount(21);
        await expect(page.locator("#overview .project-workflow-card")).toHaveCount(3);
        for (const [index, frame] of project.gallery.entries()) {
          const figure = page.locator(`.project-page-frame[data-view="${index}"]`);
          await originalAppearance(figure.locator("img").first(), frame);
          await expect(figure.locator("figcaption p")).toHaveText(frame.caption);
          const fullSize = figure.getByRole("link", { name: /Open full-size image/ });
          expect(new URL(await fullSize.getAttribute("href"), page.url()).pathname).toBe(frame.image.slice(1));
        }
        await expect(page.locator("main form, main iframe, main input[type=date], main input[type=time]")).toHaveCount(0);
        const booking = page.locator(".mobile-consultation [data-booking-link]");
        await expect(booking).toBeInViewport({ ratio: 1 });
        await expect(booking).toHaveAccessibleName(/^Book a consultation/);
        await expect(booking).toHaveAttribute("href", bookingURL);
        await expect(booking).toHaveAttribute("target", "_blank");
        await expect(booking).toHaveAttribute("rel", /noopener/);
        const box = await booking.boundingBox();
        expect(box.height).toBeGreaterThanOrEqual(44);
        const popupPromise = page.waitForEvent("popup");
        await booking.click();
        const popup = await popupPromise;
        await expect(popup).toHaveURL(bookingURL);
        await expect(popup.getByRole("heading", { name: "Booking handoff test" })).toBeVisible();
        await popup.close();
        await expect(page).toHaveURL(new RegExp(`${route}$`));
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    });
  });
}

test("TLC motion showcases load only on request, play, and expose readable captions", async ({ page, request }) => {
  await page.goto(route);
  await expect(page.locator("#project-promotion video")).toHaveCount(2);
  await expect(page.locator("#project-promotion")).not.toContainText(/fictional sample writing|PDF import|Mac drafts/);
  for (const video of await page.locator("#project-promotion video").all()) {
    await expect(video).toHaveAttribute("controls", "");
    await expect(video).toHaveAttribute("playsinline", "");
    await expect(video).toHaveAttribute("preload", "none");
    await expect(video).not.toHaveAttribute("autoplay");
    await video.scrollIntoViewIfNeeded();
    await video.evaluate((element) => { element.muted = true; element.load(); });
    await expect.poll(() => video.evaluate((element) => Number.isFinite(element.duration) ? Math.round(element.duration) : 0)).toBe(20);
    await video.evaluate((element) => element.play());
    await expect.poll(() => video.evaluate((element) => element.currentTime)).toBeGreaterThan(.1);
    await video.evaluate((element) => element.pause());
    const track = video.locator("track[kind=captions]");
    await expect(track).toHaveAttribute("srclang", "en");
    const response = await request.get(new URL(await track.getAttribute("src"), page.url()).href);
    expect(response.ok()).toBe(true);
    const captions = await response.text();
    expect(captions).toMatch(/^WEBVTT/);
    expect(captions).toMatch(/local demo|fictional|sample/i);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
