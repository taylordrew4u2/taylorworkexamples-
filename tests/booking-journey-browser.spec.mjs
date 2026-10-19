import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";

const bookingURL = "https://briefbooth.com/book/4u-digital";
const serviceRoute = "/services/salon-booking-app-development/";
const example = projects.find((project) => project.id === "The-Bit-Binder");

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

test("a service visitor can book directly from the opening and return to the same page", async ({ page }) => {
  await page.goto(serviceRoute);
  const opening = page.locator(".page-intro");
  const booking = opening.locator(".page-actions [data-booking-link]");
  await expectDirectBooking(booking);
  await expectExternalOnlyBooking(page);
  await expect(opening.locator("form, input, textarea, select")).toHaveCount(0);
  const email = opening.locator('.page-actions a[href^="mailto:"]');
  await expect(email).toBeVisible();
  expectBusinessEmail(await email.getAttribute("href"));
  await openStubbedBooking(page, booking);
  await expect(opening.getByRole("heading", { level: 1 })).toBeVisible();
});

test("booking from a project preview preserves its selected image and returns focus when closed", async ({ page }) => {
  await page.goto("/#project-archive");
  const trigger = page.locator(`.archive-preview[data-project="${example.id}"]`);
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close project details" })).toBeFocused();
  const selected = dialog.locator('[data-dialog-screen="1"]');
  await selected.click();
  const frame = example.gallery[1];
  await expect(selected).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.locator(".primary-screen")).toHaveAttribute("src", frame.image);
  await expect(dialog.locator(".image-original")).toHaveAttribute("href", frame.image);

  const bookingIntro = dialog.locator(".dialog-booking-intro");
  const booking = bookingIntro.locator("[data-booking-link]");
  await expectDirectBooking(booking);
  await expectExternalOnlyBooking(page);
  await expect(dialog.locator("form, input, textarea, select")).toHaveCount(0);
  await openStubbedBooking(page, booking);
  await expect(dialog).toBeVisible();
  await expect(selected).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.locator(".primary-screen")).toHaveAttribute("src", frame.image);
  await expect(dialog.locator(".dialog-image-caption")).toHaveText(frame.caption);
  await expect(dialog.locator(".image-original")).toHaveAttribute("href", frame.image);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("a project story offers direct booking and an attributed email alternative before the gallery", async ({ page }) => {
  await page.goto(example.caseUrl);
  const opening = page.locator(".project-story-hero .page-intro");
  const booking = opening.locator(".page-actions [data-booking-link]");
  await expectDirectBooking(booking);
  await expectExternalOnlyBooking(page);
  await expect(opening.locator("form, input, textarea, select")).toHaveCount(0);
  const email = opening.locator('.page-actions a[href^="mailto:"]');
  await expect(email).toBeVisible();
  const draft = expectBusinessEmail(await email.getAttribute("href"));
  expect(draft.searchParams.get("subject")).toBe(`Project inspired by ${example.title}`);
  expect(draft.searchParams.get("body")).toContain(`Source page: https://customtechbuilt4u.com${new URL(page.url()).pathname}`);
  expect(await booking.evaluate((element) => Boolean(
    element.compareDocumentPosition(document.querySelector("#project-cover")) & Node.DOCUMENT_POSITION_FOLLOWING,
  )), "The consultation action comes before the project images").toBe(true);
  await openStubbedBooking(page, booking);
});

test("booking targets remain usable without horizontal scrolling from narrow phones through desktop", async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", serviceRoute, example.caseUrl]) {
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
      if (route === "/" && width <= 390) {
        expect(await page.locator("#project-search").evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
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
    expectBusinessEmail(await opening.locator('.page-actions a[href^="mailto:"]').getAttribute("href"));
    await openStubbedBooking(page, opening.locator(".page-actions [data-booking-link]"));
    for (const route of ["/", "/work/"]) {
      await page.goto(route);
      await expectExternalOnlyBooking(page);
      const disclosure = page.locator(".portfolio-disclosure");
      await expect(disclosure).toHaveCount(1);
      await expect(disclosure).toBeVisible();
      await expect(disclosure).toContainText(/personal|independent/i);
      await expect(disclosure).toContainText(/client/i);
      await expect(disclosure).toContainText(/permission|consent/i);
    }
  });
});
