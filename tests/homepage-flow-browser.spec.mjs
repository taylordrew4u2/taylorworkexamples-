import { test, expect } from "@playwright/test";
import { services } from "../seo-content.js";
import { clientTestimonials } from "../content/client-testimonials.js";
import { bookingURL } from "../booking.js";

async function expectTapTarget(link, width) {
  await expect(link).toBeVisible();
  const box = await link.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
}

async function expectDirectBooking(link) {
  await expect(link).toHaveAttribute("href", bookingURL);
  await expect(link).toHaveAttribute("data-booking-link", "");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /\bnoopener\b/);
  await expect(link).toHaveAttribute("rel", /\bnoreferrer\b/);
  await expect(link).toContainText("Book a consultation");
}

for (const javaScriptEnabled of [true, false]) {
  test.describe(`a clear homepage client journey with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled });

    test("the mobile opening explains the offer and direct developer relationship before project exploration", async ({ page }) => {
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 });
        await page.goto("/");
        await page.evaluate(() => document.fonts.ready);
        const summary = page.locator(".intro-summary");
        const description = summary.locator(".intro-description");
        await expect(description).toContainText(/work directly.*developer.*designing.*coding.*launching/i);
        const actions = summary.locator(".intro-actions");
        const booking = actions.locator("[data-booking-link]");
        await expectDirectBooking(booking);
        await expect(actions.locator("a").first()).toHaveAttribute("data-booking-link", "");
        await expectTapTarget(booking, width);
        if (javaScriptEnabled) {
          await expect(booking).toBeInViewport({ ratio: 1 });
          const primaryBox = await booking.boundingBox();
          const dockBox = await page.locator(".mobile-consultation").boundingBox();
          expect(primaryBox.y + primaryBox.height).toBeLessThanOrEqual(dockBox.y);
        } else {
          // The fallback shows the full navigation; booking remains immediately available in the dock.
          await expect(page.locator(".mobile-consultation [data-booking-link]")).toBeInViewport({ ratio: 1 });
        }
        const projects = actions.getByRole("link", { name: /^View all projects/ });
        await expect(projects).toHaveAttribute("href", "./work/");
        await expect(projects).not.toHaveClass(/\bbutton-dark\b/);
        await expectTapTarget(projects, width);
        const offer = summary.locator(".hero-website-offer");
        await expect(offer).toContainText(/business website/i);
        await expect(offer.locator('a[href="./offer/"]')).toBeVisible();
        expect(await summary.evaluate((element) => {
          const description = element.querySelector(".intro-description");
          const booking = element.querySelector(".intro-actions [data-booking-link]");
          const offer = element.querySelector(".hero-website-offer");
          const stage = document.querySelector(".hero-stage");
          return Boolean(description.compareDocumentPosition(booking) & Node.DOCUMENT_POSITION_FOLLOWING) &&
            Boolean(booking.compareDocumentPosition(stage) & Node.DOCUMENT_POSITION_FOLLOWING) &&
            Boolean(offer.compareDocumentPosition(stage) & Node.DOCUMENT_POSITION_FOLLOWING) &&
            description.getBoundingClientRect().bottom <= booking.getBoundingClientRect().top + 1 &&
            element.getBoundingClientRect().bottom <= stage.getBoundingClientRect().top + 1;
        }), "The person, offer, and primary next step appear before the project imagery on a phone").toBe(true);
        await expect(page.locator(".hero-opening-notes, .hero-capabilities")).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await projects.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/\/work\/$/);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      }
    });

    test("four business needs lead to their service pages and the process comes before all nine client reviews", async ({ page }) => {
      const serviceChoices = [
        ["website", "website-development"], ["web-app", "web-app-development"],
        ["software", "app-development"], ["custom-software", "custom-software-development"],
      ];
      await page.setViewportSize({ width: 320, height: 900 });
      for (const [choice, slug] of serviceChoices) {
        await page.goto("/");
        await expect(page.locator("#services .services-grid > article.service-item")).toHaveCount(4);
        const card = page.locator(`#services .service-item[data-service="${choice}"]`);
        await expect(card.getByRole("heading", { level: 3 })).toContainText(/I need/i);
        const link = card.locator(`a.service-inquiry[href="./services/${slug}/"]`);
        await expectTapTarget(link, 320);
        await link.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(new RegExp(`/services/${slug}/$`));
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(services.find((service) => service.slug === slug).heading);
        await expectDirectBooking(page.locator(".page-intro [data-booking-link]"));
      }
      await page.goto("/");
      const process = page.locator("#process");
      await expect(process.getByRole("heading", { level: 2 })).toHaveText("One developer. From idea to launch.");
      await expect(process.locator(".process-steps > li")).toHaveCount(3);
      expect(await process.evaluate((element) => Boolean(
        element.compareDocumentPosition(document.querySelector("#testimonials")) & Node.DOCUMENT_POSITION_FOLLOWING,
      )), "Clients understand how the collaboration works before reading the reviews").toBe(true);
      const reviews = page.locator("#testimonials");
      await expect(reviews.locator(".testimonial-card:visible")).toHaveCount(clientTestimonials.length);
      await expect(reviews.locator("blockquote p")).toHaveText(clientTestimonials.map((review) => review.quote));
      await expect(reviews.locator("figcaption strong")).toHaveText(clientTestimonials.map((review) => review.name));
      await expect(reviews.locator("details, summary, [data-feedback-next], [data-feedback-prev]")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });

    test("the footer makes booking primary and sends clients directly to BriefBooth without a planner prerequisite", async ({ page }) => {
      await page.context().route(bookingURL, (route) => route.fulfill({
        status: 200, contentType: "text/html",
        body: "<!doctype html><title>Booking handoff test</title><h1>Booking handoff test</h1>",
      }));
      for (const width of [320, 390, 768, 800]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/");
        const footer = page.locator(".footer-contact");
        const booking = footer.locator("[data-booking-link]");
        await expectDirectBooking(booking);
        await expect(footer.locator("a").first()).toHaveAttribute("data-booking-link", "");
        await expectTapTarget(booking, width);
        const inquiryBox = await footer.locator(".footer-inquiry").boundingBox();
        const primaryBox = await booking.boundingBox();
        expect(Math.abs(inquiryBox.x - primaryBox.x), "Footer actions share one clear column on phones and small tablets").toBeLessThanOrEqual(1);
        await expect(footer.locator("form, input, select, textarea, a[href*='project-brief']")).toHaveCount(0);
        const emails = footer.locator('a[href^="mailto:"]');
        await expect(emails).not.toHaveCount(0);
        for (const email of await emails.all()) {
          await expect(email).toHaveAttribute("href", /^mailto:admin@customtechbuilt4u\.com(?:\?|$)/);
        }
        const dock = page.locator(".mobile-consultation [data-booking-link]");
        const planner = page.locator(".planner-shortcut");
        await expectDirectBooking(dock);
        await expectTapTarget(dock, width);
        await expectTapTarget(planner, width);
        const plannerBox = await planner.boundingBox();
        const bookingBox = await dock.boundingBox();
        expect(plannerBox.x + plannerBox.width).toBeLessThanOrEqual(bookingBox.x);
        await booking.focus();
        await expect(booking).toBeInViewport({ ratio: 1 });
        const pendingPopup = page.waitForEvent("popup");
        await page.keyboard.press("Enter");
        const popup = await pendingPopup;
        try {
          await expect(popup).toHaveURL(bookingURL);
          await expect(popup.getByRole("heading", { level: 1 })).toHaveText("Booking handoff test");
          await expect(page).toHaveURL(/\/$/);
        } finally {
          await popup.close();
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    });
  });
}
