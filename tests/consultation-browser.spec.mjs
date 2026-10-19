import { test, expect } from "@playwright/test";

const bookingURL = "https://briefbooth.com/book/4u-digital";

async function expectBookingLink(link) {
  await expect(link).toHaveAttribute("href", bookingURL);
  await expect(link).toHaveAttribute("data-booking-link", "");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /\bnoopener\b/);
  await expect(link).toHaveAttribute("rel", /\bnoreferrer\b/);
  await expect(link).toContainText("Book a consultation");
}

async function expectConsultationFit(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    "The booking section fits the page on this device").toBe(true);
  const controlsFit = await page.locator("#consultation a")
    .evaluateAll((elements) => elements.filter((element) => element.getClientRects().length > 0).every((element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.width > 0 && bounds.left >= -1 && bounds.right <= window.innerWidth + 1;
    }));
  expect(controlsFit, "Booking actions fit the viewport").toBe(true);
}

async function expectNativeBookingOpens(page, link) {
  await page.context().route(bookingURL, (route) => route.fulfill({
    status: 200, contentType: "text/html", body: "<title>Booking destination test</title><h1>Booking destination test</h1>",
  }));
  const originalURL = page.url();
  await link.focus();
  const popupPromise = page.waitForEvent("popup");
  await page.keyboard.press("Enter");
  const popup = await popupPromise;
  try {
    await expect(popup).toHaveURL(bookingURL);
    await expect(popup.getByRole("heading", { level: 1 })).toHaveText("Booking destination test");
    await expect(page).toHaveURL(originalURL);
  } finally { await popup.close(); }
}

test("homepage consultation actions open the supplied booking page and explain the meeting options", async ({ page }, testInfo) => {
  await page.goto("/");
  expect(await page.locator("#consultation").evaluate((section) => Boolean(
    document.querySelector("#process").compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING,
  )), "Clients see services and selected work before the booking panel").toBe(true);
  await expectBookingLink(page.locator(".intro-actions [data-booking-link]"));
  const menu = page.locator(".menu-toggle");
  if (testInfo.project.name === "phone") await menu.click();
  const navAction = page.locator("#main-nav .nav-contact");
  await expectBookingLink(navAction);
  if (testInfo.project.name === "phone") await menu.click();
  const panel = page.locator("#consultation .consultation-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText(/Zoom/);
  await expect(panel).toContainText(/No account needed/);
  await expect(page.locator(".hero-consultation-note")).toContainText(/six steps, then choose a time/);
  await expect(page.locator("#consultation")).toContainText(/in-person/i);
  await expect(page.locator("#consultation")).toContainText(/space|workflow/i);
  await expect(page.locator(".consultation-how")).toContainText(/unsure what you need/i);
  await expect(page.locator("#consultation")).toContainText(/Manhattan, Brooklyn, and parts of Queens/);
  await expect(panel.locator(".booking-steps li > span:last-child")).toHaveText([
    "Complete the six-step intake about your business and project.",
    "Then choose an available time for your first Zoom consultation.",
    "Meet to work out what to build and where to start.",
  ]);
  await expect(panel.locator(".booking-destination")).toContainText(/BriefBooth.*new tab/i);
  const booking = panel.locator(".booking-primary");
  await expectBookingLink(booking);
  await expect(page.locator("#consultation-form, #consultation-email, #consultation-copy, #consultation-draft, .consultation-fallback")).toHaveCount(0);
  await expectNativeBookingOpens(page, booking);
  await expectConsultationFit(page);
});

test("consultation booking works directly from the homepage without JavaScript", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: testInfo.project.use.viewport });
  try {
    const page = await context.newPage();
    await page.goto(new URL("/", testInfo.project.use.baseURL || "http://127.0.0.1:4173").href);
    const hero = page.locator(".intro-actions [data-booking-link]");
    await expectBookingLink(hero);
    await expectBookingLink(page.locator("#consultation .booking-primary"));
    await expect(page.locator("#consultation")).toContainText(/Zoom/);
    await expect(page.locator("#consultation")).toContainText(/six-step intake/);
    await expect(page.locator("#consultation")).toContainText(/No account needed/);
    await expect(page.locator("#consultation")).toContainText(/in-person/i);
    await expect(page.locator("#consultation")).toContainText(/space|workflow/i);
    await expect(page.locator("#consultation form, #consultation-email, [data-consultation-format]")).toHaveCount(0);
    await expectNativeBookingOpens(page, hero);
    await expectConsultationFit(page);
  } finally { await context.close(); }
});
