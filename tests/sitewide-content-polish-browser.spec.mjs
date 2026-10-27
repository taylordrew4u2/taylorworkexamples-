import { test, expect } from "@playwright/test";
import { services, guide } from "../seo-content.js";
import { articles } from "../seo-articles.js";
import { bookingURL } from "../booking.js";

async function expectTapTarget(link, width) {
  await expect(link).toBeVisible();
  const box = await link.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
}

async function expectBooking(link) {
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", bookingURL);
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /\bnoopener\b/);
  await expect(link).toHaveAttribute("rel", /\bnoreferrer\b/);
  await expect(link).toContainText("Book a consultation");
}

test("the service directory helps phone visitors choose a need before presenting its website promotion", async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/services/");
    for (const brand of await page.locator('.site-header .wordmark, .page-footer .brand-signature').all()) {
      await expectTapTarget(brand, width);
    }
    const choices = page.locator("#service-choices");
    await expect(choices.locator("[data-service-choice]")).toHaveCount(4);
    for (const choice of await choices.locator("[data-service-choice]").all()) {
      await expect(choice.getByRole("heading")).toContainText(/I need/i);
      await expectTapTarget(choice.getByRole("link"), width);
    }
    const promotion = page.locator("#services-website-offer");
    await expect(promotion).toContainText("$1,500");
    await expect(promotion).toContainText("$3,000");
    await expect(promotion).toContainText(/New York City|NYC/i);
    expect(await promotion.evaluate((element) => Boolean(
      document.querySelector("#service-choices").compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING,
    )), "The four general business needs come before the website-specific promotion").toBe(true);
    const offer = promotion.locator('a[href$="offer/"]');
    const comparison = page.locator('.service-pricing-link a[href$="guides/website-or-app/"]');
    await expectTapTarget(comparison, width);
    expect(await comparison.evaluate((element) => Boolean(
      element.compareDocumentPosition(document.querySelector("#services-website-offer")) & Node.DOCUMENT_POSITION_FOLLOWING,
    )), "Comparison help appears beside service choices, before the offer").toBe(true);
    await expectTapTarget(offer, width);
    await offer.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/offer\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("all six service openings lead to booking or examples and keep longer planning optional", async ({ page }) => {
  test.setTimeout(120_000);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const service of services) {
      await test.step(`${service.slug} at ${width}px`, async () => {
        await page.goto(`/services/${service.slug}/`);
        const opening = page.locator(".page-intro");
        const actions = opening.locator(".page-actions");
        const booking = actions.locator("[data-booking-link]");
        await expectBooking(booking);
        await expectTapTarget(booking, width);
        await expect(actions.locator("a").first()).toHaveAttribute("data-booking-link", "");
        await expect(page.locator('main a[href^="mailto:"]')).toHaveCount(0);
        await expect(actions.locator("a")).toHaveCount(2);
        await expect(opening.locator(".service-capabilities > li")).toHaveCount(3);
        const examples = opening.locator('a[href="#examples"]');
        await expect(examples).toHaveCount(1);
        await expectTapTarget(examples, width);
        await examples.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(new RegExp(`/services/${service.slug}/#examples$`));
        await expect(page.locator("#examples").getByRole("heading", { level: 2 })).toHaveText("Explore related projects.");
        await expect(page.locator(".service-example")).toHaveCount(2);
        for (const example of await page.locator(".service-example-link").all()) {
          await expectTapTarget(example, width);
          await expect(example.locator("img").last()).toHaveCSS("object-fit", "contain");
          await expect(example.locator("img").last()).toHaveCSS("filter", "none");
        }
        for (const id of ["service-fit", "service-scope"]) {
          const detail = page.locator(`#${id}`);
          await expect(detail).not.toHaveAttribute("open");
          await expectTapTarget(detail.locator(":scope > summary"), width);
          await detail.locator(":scope > summary").focus();
          await page.keyboard.press("Enter");
          await expect(detail).toHaveAttribute("open", "");
          await expect(detail.locator("article")).toHaveCount(3);
          await detail.locator(":scope > summary").press("Enter");
        }
        const pricing = page.locator('.service-planning a[href$="pricing/"]');
        await expectTapTarget(pricing, width);
        const closing = page.locator("main .service-closing");
        await expect(closing.locator("a")).toHaveCount(1);
        await expectBooking(closing.locator("[data-booking-link]"));
        if (service.slug === "app-development") {
          const proof = page.locator(".service-opening-proof");
          await expect(proof).toContainText(/App Store/i);
          const proofLink = proof.locator('a[href$="#app-store-proof"]');
          await expectTapTarget(proofLink, width);
          expect(new URL(await proofLink.getAttribute("href"), page.url()).pathname).toBe("/work/");
          await proofLink.focus();
          await page.keyboard.press("Enter");
          await expect(page).toHaveURL(/\/work\/#app-store-proof$/);
          await expect(page.locator("#app-store-proof .range-apps > li")).toHaveCount(3);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      });
    }
  }
});

test("the comparison offers four readable choices on phones and retains its comparison table on desktop", async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/guides/website-or-app/");
    const grid = page.locator(".guide-choice-grid");
    await expect(grid).toBeVisible();
    await expect(grid.locator(".guide-choice-card")).toHaveCount(4);
    for (const [index, row] of guide.rows.entries()) {
      const card = grid.locator(".guide-choice-card").nth(index);
      await expect(card).toContainText(row.type);
      await expect(card).toContainText(row.when);
      const service = card.locator(`a[href$="services/${row.serviceSlug}/"]`);
      await expectTapTarget(service, width);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  const table = page.locator(".table-scroll table");
  await expect(table).toBeVisible();
  await expect(table.locator("tbody tr")).toHaveCount(4);
  for (const [index, row] of guide.rows.entries()) {
    await expect(table.locator("tbody tr").nth(index)).toContainText(row.type);
    await expect(table.locator("tbody tr").nth(index)).toContainText(row.example);
  }
});

test("all nineteen articles have a short opening, preserve their full introduction, and link directly to their examples", async ({ page }) => {
  test.setTimeout(180_000);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const article of articles) {
      await test.step(`${article.slug} at ${width}px`, async () => {
        await page.goto(`/insights/${article.slug}/`);
        const opening = page.locator(".page-intro");
        await expect(opening.locator(".page-lead")).toHaveText(article.summary);
        await expect(page.locator(".article-opening")).toHaveText(article.intro);
        const actions = page.locator(".article-intro-actions");
        const booking = actions.locator("[data-booking-link]");
        await expectBooking(booking);
        await expectTapTarget(booking, width);
        await expect(actions.locator("a").first()).toHaveAttribute("data-booking-link", "");
        const examples = actions.locator('a[href="#related-work"]');
        await expect(examples).toHaveCount(1);
        await expectTapTarget(examples, width);
        await examples.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(new RegExp(`/insights/${article.slug}/#related-work$`));
        await expect(page.locator("#related-work")).toBeInViewport();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      });
    }
  }
});
