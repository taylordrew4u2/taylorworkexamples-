import { test, expect } from "@playwright/test";
import { services } from "../seo-content.js";
import { bookingURL } from "../booking.js";
import { serviceHeadings } from "./service-page-fixtures.mjs";

const coreServiceSlugs = [
  "website-development", "web-app-development", "app-development", "custom-software-development",
];

async function linkTo(scope, page, pathname) {
  const links = scope.locator("a[href]");
  const index = await links.evaluateAll((elements, target) => elements.findIndex((element) =>
    new URL(element.getAttribute("href"), location.href).pathname === target), pathname);
  expect(index, `The visible content provides a real link to ${pathname}`).toBeGreaterThanOrEqual(0);
  return links.nth(index);
}

async function expectTapTarget(link) {
  await expect(link).toBeVisible();
  const box = await link.boundingBox();
  expect(box.width, "A primary action is wide enough to tap").toBeGreaterThanOrEqual(44);
  expect(box.height, "A primary action is tall enough to tap").toBeGreaterThanOrEqual(44);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual((link.page()).viewportSize().width + 1);
}

async function expectDirectBooking(link) {
  await expect(link).toHaveAttribute("href", bookingURL);
  await expect(link).toHaveAttribute("data-booking-link", "");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /\bnoopener\b/);
  await expect(link).toHaveAttribute("rel", /\bnoreferrer\b/);
  await expect(link).toContainText("Book a consultation");
  await expectTapTarget(link);
}

async function expectDockActions(page) {
  const dock = page.getByRole("complementary", { name: "Consultation booking", exact: true });
  const booking = dock.locator("[data-booking-link]");
  await expectDirectBooking(booking);
  await expect(booking).toBeInViewport({ ratio: 1 });
  await expect(dock.getByRole("link")).toHaveCount(1);
  await expect(page.locator(".planner-shortcut")).toHaveCount(0);
  expect(await booking.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return hit === element || element.contains(hit);
  }), "The persistent booking action can be tapped directly").toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    "Service and booking choices do not create horizontal scrolling").toBe(true);
}

for (const javaScriptEnabled of [true, false]) {
  test.describe(`whole-site client paths with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled });

    test("clients choose a business need and reach the corresponding service without completing a form", async ({ page }) => {
      await page.goto("/services/");
      const choices = page.locator("#service-choices");
      await expect(choices.getByRole("heading", { level: 2 })).toBeVisible();
      await expect(choices.locator("a")).toHaveCount(coreServiceSlugs.length);
      await expect(choices.locator("form, input, textarea, select")).toHaveCount(0);
      for (const slug of coreServiceSlugs) {
        const service = services.find((entry) => entry.slug === slug);
        const choice = await linkTo(choices, page, `/services/${slug}/`);
        await expect(choice).toHaveAccessibleName(/^I need\b/);
        await expectTapTarget(choice);
        await choice.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(new RegExp(`/services/${slug}/$`));
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(serviceHeadings[service.slug]);
        await expectDirectBooking(page.locator(".page-intro [data-booking-link]"));
        await page.goto("/services/");
      }
    });

    test("the service directory keeps the website offer discoverable after the business-need choices", async ({ page }) => {
      await page.goto("/services/");
      const offer = page.locator("main .service-website-offer");
      const link = await linkTo(offer, page, "/offer/");
      await expect(link).toBeVisible();
      await expect(offer).toContainText("$1,200");
      await expect(offer).toContainText("$1,900");
      expect(await offer.evaluate((element) => Boolean(
        document.querySelector("#service-choices").compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING,
      )), "Clients can choose a business need before seeing the website-specific promotion").toBe(true);
      await link.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/offer\/$/);
      await expect(page.locator("main")).toContainText("$1,200");
      await expectDirectBooking(page.locator(".page-intro [data-booking-link]"));
    });

    test("conversion pages finish with a direct consultation action and preserve the page during the handoff", async ({ page }) => {
      // Stub only the external handoff. No real appointment or message is sent.
      await page.context().route(bookingURL, (route) => route.fulfill({
        status: 200, contentType: "text/html",
        body: "<!doctype html><title>Booking handoff test</title><h1>Booking handoff test</h1>",
      }));
      for (const pathname of ["/services/", "/guides/website-or-app/", "/work/", "/about/"]) {
        await page.goto(pathname);
        const closing = page.locator("main .page-callout").last();
        const booking = closing.locator("[data-booking-link]");
        await expectDirectBooking(booking);
        await expect(closing.locator("a").first()).toHaveAttribute("data-booking-link", "");
        await expect(page.locator("main form, main iframe, main input[type='date'], main input[type='time'], main input[type='datetime-local']"))
          .toHaveCount(0);
        const originalURL = page.url();
        await booking.focus();
        const pendingPopup = page.waitForEvent("popup");
        await page.keyboard.press("Enter");
        const popup = await pendingPopup;
        try {
          await expect(popup).toHaveURL(bookingURL);
          await expect(popup.getByRole("heading", { level: 1 })).toHaveText("Booking handoff test");
          await expect(page).toHaveURL(originalURL);
        } finally {
          await popup.close();
        }
      }
    });

    test("short after-launch answers explain the existing guarantee and make the full terms reachable", async ({ page }) => {
      await page.goto("/");
      const commitments = page.locator("#client-care details");
      await commitments.locator("summary").focus();
      await page.keyboard.press("Enter");
      for (const term of [/30.days?/i, /full refund/i, /reasonable changes/i, /six.month/i, /50%/]) {
        await expect(commitments).toContainText(term);
      }
      await expect(page.locator('#client-care a[href="./guarantee/"]')).toBeVisible();
      for (const [pathname, summary] of [
        ["/services/website-development/", "Can I change the website after launch?"],
      ]) {
        await page.goto(pathname);
        const faq = page.locator("details").filter({ has: page.locator("summary", { hasText: summary }) });
        const trigger = faq.locator("summary");
        await trigger.focus();
        await page.keyboard.press("Enter");
        await expect(faq).toHaveAttribute("open", "");
        for (const term of [/30.days?/i, /full refund/i, /reasonable changes/i, /six.month/i, /50%/]) {
          await expect(faq).toContainText(term);
        }
        const careLink = await linkTo(faq, page, pathname);
        await expect(careLink).toHaveAttribute("href", "#client-care");
        await careLink.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(new RegExp(`${pathname}#client-care$`));
        await expect(page.locator("#client-care-title")).toBeInViewport();
        await expect(page.locator('#client-care [data-client-care="handover"]')).toContainText(/code.*deployment handover/i);
      }
    });

    for (const width of [320, 390]) {
      test(`the service and comparison journeys keep booking reachable and planner links in the footer at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        for (const pathname of ["/services/", "/guides/website-or-app/", "/work/"]) {
          await page.goto(pathname);
          await page.evaluate(() => document.fonts.ready);
          await expectDockActions(page);
          if (pathname === "/services/") {
            for (const choice of await page.locator("#service-choices a").all()) {
              await choice.focus();
              await expect(choice).toBeInViewport({ ratio: 1 });
              await expectTapTarget(choice);
              const box = await choice.boundingBox();
              const dock = await page.locator(".mobile-consultation").boundingBox();
              expect(box.y + box.height, "Focusing a service choice leaves it above the persistent dock")
                .toBeLessThanOrEqual(dock.y + 1);
            }
          }
          await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
          await expectDockActions(page);
          const footer = await page.locator("footer").boundingBox();
          const dock = await page.locator(".mobile-consultation").boundingBox();
          expect(footer.y + footer.height, "The footer is not trapped under the consultation dock")
            .toBeLessThanOrEqual(dock.y + 1);
        }
      });
    }
  });
}
