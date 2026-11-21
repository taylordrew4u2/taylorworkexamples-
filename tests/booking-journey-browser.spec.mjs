import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";

const bookingURL = "https://briefbooth.com/book/4u-digital";
const serviceRoute = "/services/salon-booking-app-development/";
const example = projects.find((project) => project.id === "The-Bit-Binder");
const mobileBookingRoutes = ["/", serviceRoute, example.caseUrl, "/insights/salon-business-website/"];

async function expectDirectBooking(link) {
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", bookingURL);
  await expect(link).toHaveAttribute("data-booking-link", "");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /\bnoopener\b/);
  await expect(link).toHaveAttribute("rel", /\bnoreferrer\b/);
  await expect(link).toContainText("Book a consultation");
}

async function expectExternalOnlyBooking(page) {
  await expect(page.locator([
    ".booking-steps", "#consultation-form", "#consultation-email", "[data-consultation-format]",
    'form[action*="briefbooth"]', 'input[type="date"]', 'input[type="time"]',
    'input[type="datetime-local"]',
  ].join(", "))).toHaveCount(0);
}

async function openStubbedBooking(page, link) {
  // Intercept at the context level so even the new tab's first request stays local.
  // These tests never load the real scheduler or create a consultation request.
  await page.context().route(bookingURL, (route) => route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<!doctype html><title>Booking handoff test</title><h1>Booking handoff test</h1>",
  }));
  const originalURL = page.url();
  await link.focus();
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

function expectBusinessEmail(href) {
  const draft = new URL(href);
  expect(draft.protocol).toBe("mailto:");
  expect(draft.pathname).toBe("admin@customtechbuilt4u.com");
  return draft;
}

for (const javaScriptEnabled of [true, false]) {
  test.describe(`in-page consultation links with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled });

    test("the homepage keeps booking in contact and the footer provides business email and optional resources", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/");
      const footer = page.locator("footer");
      await expect(footer.locator("[data-booking-link]")).toHaveCount(0);
      const email = footer.locator('a[href^="mailto:"]');
      await expect(email).toHaveCount(1);
      await expect(email).not.toHaveClass(/\bbutton\b/);
      expectBusinessEmail(await email.getAttribute("href"));
      await expect(footer.locator(".compact-footer-links > a")).toHaveText(["Projects", "Services", "Pricing", "Project planner"]);
      const more = footer.locator("details.footer-more");
      await expect(more).not.toHaveAttribute("open", "");
      await more.locator("summary").focus();
      await page.keyboard.press("Enter");
      await expect(more.locator("a")).toHaveText(["About", "Contact", "Guides", "Website offer", "GitHub ↗"]);
      await expectExternalOnlyBooking(page);
      const booking = page.locator("#consultation [data-booking-link]");
      await expectDirectBooking(booking);
      await openStubbedBooking(page, booking);
    });

    for (const route of mobileBookingRoutes) {
      test(`booking on ${route} uses an ordinary page link without covering controls`, async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(route);
        await expect(page.locator(".mobile-consultation, .planner-shortcut")).toHaveCount(0);
        const booking = page.locator("main [data-booking-link]").last();
        await expectDirectBooking(booking);
        await expectExternalOnlyBooking(page);
        await booking.focus();
        await expect(booking).toBeInViewport({ ratio: 1 });
        const bookingBounds = await booking.boundingBox();
        expect(bookingBounds.height).toBeGreaterThanOrEqual(44);
        expect(bookingBounds.width).toBeGreaterThanOrEqual(44);
        await openStubbedBooking(page, booking);
        const lastFooterLink = page.locator("footer a:visible").last();
        await lastFooterLink.focus();
        await expect(lastFooterLink).toBeFocused();
        await expect(lastFooterLink).toBeInViewport({ ratio: 1 });
        expect(await lastFooterLink.evaluate((element) => {
          const box = element.getBoundingClientRect();
          const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
          return hit === element || element.contains(hit);
        }), "The footer link remains directly reachable").toBe(true);
        for (const [width, height] of [[900, 900], [901, 900], [844, 450]]) {
          await page.setViewportSize({ width, height });
          await expect(page.locator(".mobile-consultation")).toHaveCount(0);
        }
      });
    }
  });
}

test("the project search remains unobstructed and retains results when focus moves", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/work/");
  await page.locator("#project-browser-controls > summary").click();
  const search = page.getByRole("searchbox", { name: /Search projects/ });
  await search.fill("calendar");
  await expect(search).toBeFocused();
  await expect(search).toBeInViewport({ ratio: 1 });
  await expect(page.locator(".mobile-consultation, .planner-shortcut")).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(search).toHaveValue("calendar");
  await expect(page.locator('.seo-project-card[data-project-id="MyGigCalendar"]')).toBeVisible();
});

test("a service visitor can book directly from the opening and return to the same page", async ({ page }) => {
  await page.goto(serviceRoute);
  const opening = page.locator(".page-intro");
  const booking = opening.locator(".page-actions [data-booking-link]");
  await expectDirectBooking(booking);
  await expectExternalOnlyBooking(page);
  await expect(opening.locator("form, input, textarea, select")).toHaveCount(0);
  await expect(opening.locator('a[href^="mailto:"]')).toHaveCount(0);
  const email = page.locator('footer a[href^="mailto:"]');
  await expect(email).toBeVisible();
  const draft = expectBusinessEmail(await email.getAttribute("href"));
  expect(draft.searchParams.get("body")).toContain(`Source page: https://customtechbuilt4u.com${serviceRoute}`);
  await openStubbedBooking(page, booking);
  await expect(opening.getByRole("heading", { level: 1 })).toBeVisible();
});

test("phone clients open the full project through an ordinary homepage link and book after reading it", async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const story = page.locator(`main a[href="${example.caseUrl}"]`).first();
    await expect(story).toBeVisible();
    await expect(story).not.toHaveAttribute("aria-haspopup", "dialog");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await story.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new URL(example.caseUrl, "http://127.0.0.1:4173/").href);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(example.title);
    await expect(page.locator("#your-business")).toContainText("Your custom code is 100% yours.");
    await openStubbedBooking(page, page.locator("#your-business [data-booking-link]"));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(example.title);
  }
});

test("a project story leads with its real product links and keeps one content-level booking path", async ({ page }) => {
  await page.goto(example.caseUrl);
  const opening = page.locator(".project-story-hero .page-intro");
  await expect(opening.locator("[data-booking-link]")).toHaveCount(0);
  await expect(opening.locator(`a[href="${example.demoUrl}"]`)).toBeVisible();
  await expect(opening.locator(`a[href="${example.repoUrl}"]`)).toBeVisible();
  await expectExternalOnlyBooking(page);
  await expect(opening.locator("form, input, textarea, select")).toHaveCount(0);
  await expect(page.locator("main [data-booking-link]")).toHaveCount(1);
  await expect(page.locator("main a[href^='mailto:']")).toHaveCount(0);
  const booking = page.locator("#your-business [data-booking-link]");
  await expectDirectBooking(booking);
  await openStubbedBooking(page, booking);
});

test("booking targets remain usable without horizontal scrolling from narrow phones through desktop", async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/work/", serviceRoute, example.caseUrl]) {
      await page.goto(route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `${route} fits a ${width}px viewport`).toBe(true);
      const targets = await page.locator("[data-booking-link]").evaluateAll((elements) => elements
        .filter((element) => element.getClientRects().length > 0)
        .map((element) => {
          const box = element.getBoundingClientRect();
          return {
            text: element.textContent.trim(), width: box.width, height: box.height,
            fits: box.left >= -1 && box.right <= window.innerWidth + 1,
          };
        }));
      expect(targets.length, `${route} exposes a booking action at ${width}px`).toBeGreaterThan(0);
      for (const target of targets) {
        expect(target.height, `${target.text} is tall enough to tap at ${width}px on ${route}`).toBeGreaterThanOrEqual(44);
        expect(target.width, `${target.text} is wide enough to tap at ${width}px on ${route}`).toBeGreaterThanOrEqual(44);
        expect(target.fits, `${target.text} fits at ${width}px on ${route}`).toBe(true);
      }
      if (route === "/work/" && width <= 390) {
        expect(await page.locator("#project-browser-search").evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
          "The project search avoids automatic iPhone zoom").toBeGreaterThanOrEqual(16);
      }
    }
  }
});

test.describe("booking information without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("direct booking links and portfolio ownership context are available before scripts load", async ({ page }) => {
    await page.goto(serviceRoute);
    const opening = page.locator(".page-intro");
    await expectDirectBooking(opening.locator(".page-actions [data-booking-link]"));
    await expectExternalOnlyBooking(page);
    await expect(opening.locator("form, input, textarea, select")).toHaveCount(0);
    await expect(opening.locator('a[href^="mailto:"]')).toHaveCount(0);
    const email = page.locator('footer a[href^="mailto:"]');
    await expect(email).toBeVisible();
    const draft = expectBusinessEmail(await email.getAttribute("href"));
    expect(draft.searchParams.get("body")).toContain(`Source page: https://customtechbuilt4u.com${serviceRoute}`);
    await openStubbedBooking(page, opening.locator(".page-actions [data-booking-link]"));
    for (const route of ["/", "/work/"]) {
      await page.goto(route);
      await expectExternalOnlyBooking(page);
      const disclosure = page.locator(".portfolio-disclosure, .portfolio-ownership, .simple-disclosure");
      await expect(disclosure).toHaveCount(1);
      await expect(disclosure).toBeVisible();
      await expect(disclosure).toContainText(/personal|independent/i);
      await expect(disclosure).toContainText(/client/i);
      await expect(disclosure).toContainText(/permission|consent/i);
    }
  });
});
