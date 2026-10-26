import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";
import { bookingURL } from "../booking.js";

const project = projects.find((entry) => entry.id === "nycstandupopenmicmaster");
const route = "/work/nyc-open-mic-master-list/";

async function expectOriginalAppearance(image, frame, { allowLetterbox = false } = {}) {
  await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
  expect(new URL(await image.getAttribute("src"), image.page().url()).pathname)
    .toBe(frame.image.slice(1));
  await expect(image).toHaveAttribute("width", String(frame.width));
  await expect(image).toHaveAttribute("height", String(frame.height));
  await expect(image).toHaveCSS("filter", "none");
  await expect(image).toHaveCSS("mix-blend-mode", "normal");
  await expect(image).toHaveCSS("object-fit", "contain");
  const dimensions = await image.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return { left: box.left, right: box.right, width: box.width, height: box.height, viewport: innerWidth };
  });
  expect(dimensions.left).toBeGreaterThanOrEqual(-1);
  expect(dimensions.right).toBeLessThanOrEqual(dimensions.viewport + 1);
  if (!allowLetterbox) {
    expect(Math.abs(dimensions.height - dimensions.width * frame.height / frame.width),
      "Supplied artwork and app captures retain their own complete proportions").toBeLessThanOrEqual(2);
  }
}

test("the dedicated portfolio opens NYC directory artwork and genuine README app views", async ({ page }) => {
  await page.goto("/work/");
  const card = page.locator(`.work-page-grid .seo-project-card[data-project-id="${project.id}"]`);
  await expect(card.getByRole("heading", { level: 3 })).toHaveText(project.title);
  await expect(card.locator(".work-project-header .seo-project-heading h3")).toHaveText(project.title);
  await expect(card.locator(".work-index-image-label")).toHaveText(project.imageLabel);
  await expect(card.locator(".work-project-business-use")).toContainText("A similar business need");
  await expectOriginalAppearance(card.locator(".seo-project-cover img"), project.gallery[0], { allowLetterbox: true });
  const caseLink = card.getByRole("link", { name: `See how it works: ${project.title}`, exact: true });
  await expect(caseLink).toHaveText(/See how it works/);
  await caseLink.click();
  await expect(page).toHaveURL(new RegExp(`${route}$`));
  await expectOriginalAppearance(page.locator("#project-cover img"), project.gallery[0]);
  await expect(page.locator("#project-cover figcaption p")).toHaveText(project.gallery[0].caption);
  const capture = page.locator('.project-page-frame[data-view="1"]');
  await expectOriginalAppearance(capture.locator("img"), project.gallery[1]);
  await expect(capture.locator("figcaption p")).toHaveText(project.gallery[1].caption);
});

test.describe("NYC project without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("mobile clients can read every app view and book directly without an on-site booking form", async ({ page }) => {
    await page.context().route(bookingURL, (request) => request.fulfill({
      status: 200, contentType: "text/html",
      body: "<!doctype html><title>Booking handoff test</title><h1>Booking handoff test</h1>",
    }));
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.getByRole("heading", { level: 1, name: project.title, exact: true })).toBeVisible();
      await expect(page.locator(".project-page-frame")).toHaveCount(project.gallery.length);
      for (const [index, frame] of project.gallery.entries()) {
        const figure = page.locator(`.project-page-frame[data-view="${index}"]`);
        await expectOriginalAppearance(figure.locator("img").first(), frame);
        await expect(figure.locator("figcaption p")).toHaveText(frame.caption);
      }
      await expect(page.locator("main")).toContainText(/custom code.*100% yours/i);
      await expect(page.locator("main")).toContainText(/without your permission|unless you give permission/i);
      await expect(page.locator("main form, main iframe, main input[type='date'], main input[type='time']")).toHaveCount(0);
      const booking = page.locator(".mobile-consultation [data-booking-link]");
      await expect(booking).toBeInViewport({ ratio: 1 });
      await expect(booking).toHaveAttribute("href", bookingURL);
      await expect(booking).toHaveAttribute("target", "_blank");
      await expect(booking).toHaveAttribute("rel", /noopener/);
      const box = await booking.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(await booking.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return hit === element || element.contains(hit);
      }), "The booking target is directly tappable on mobile").toBe(true);
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
