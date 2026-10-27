import { test, expect } from "@playwright/test";

async function interceptContactNavigation(page) {
  await page.evaluate(() => document.addEventListener("click", (event) => {
    if (event.target.closest?.('a[href^="mailto:"], a[data-booking-link]')) event.preventDefault();
  }, true));
}

async function enableTestAnalytics(page, { blocked = false, privacy = {} } = {}) {
  // CI uses a local page and an explicit production-location facade. The transport
  // stays mocked, so tests exercise the real hooks without sending visitor data.
  await page.route("**/_vercel/insights/script.js", (route) => route.fulfill({
    status: 200, contentType: "text/javascript", body: "/* Analytics transport mocked by this test. */",
  }));
  return page.evaluate(async ({ blocked, privacy }) => {
    let meta = document.querySelector('meta[name="built4u-analytics"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "built4u-analytics";
      document.head.appendChild(meta);
    }
    meta.content = "vercel";
    window.__contactEvents = [];
    window.__analyticsTestWindow = {
      location: new URL(`https://customtechbuilt4u.com${location.pathname}${location.search}${location.hash}`),
      navigator: privacy,
      va(type, payload) {
        if (blocked) throw new Error("Analytics provider blocked");
        if (type === "event") window.__contactEvents.push(payload);
      },
    };
    const analyticsModuleURL = document.querySelector('script[type="module"][src*="analytics.js"]')?.src;
    if (!analyticsModuleURL) throw new Error("The page is missing its analytics module script.");
    const analytics = await import(analyticsModuleURL);
    window.__analyticsTestAPI = analytics;
    return analytics.initAnalytics(document, window.__analyticsTestWindow);
  }, { blocked, privacy });
}

async function contactEvents(page) {
  return page.evaluate(() => window.__contactEvents || []);
}

const bookingURL = "https://briefbooth.com/book/4u-digital";

test("disabled analytics leaves booking usable and sends nothing", async ({ page }) => {
  await page.goto("/");
  await interceptContactNavigation(page);
  const initialized = await page.evaluate(async () => {
    document.querySelector('meta[name="built4u-analytics"]')?.remove();
    window.__contactEvents = [];
    const analyticsModuleURL = document.querySelector('script[type="module"][src*="analytics.js"]')?.src;
    if (!analyticsModuleURL) throw new Error("The page is missing its analytics module script.");
    const analytics = await import(analyticsModuleURL);
    return analytics.initAnalytics(document, {
      location: new URL("https://customtechbuilt4u.com/"), navigator: {},
      va: (type, data) => { if (type === "event") window.__contactEvents.push(data); },
    });
  });
  expect(initialized).toBe(false);
  const booking = page.locator(".simple-actions [data-booking-link]");
  await expect(booking).toHaveAttribute("href", bookingURL);
  await booking.focus();
  await page.keyboard.press("Enter");
  expect(await contactEvents(page)).toEqual([]);
  await expect(page.locator('script[data-built4u-analytics]')).toHaveCount(0);
});

test("booking tracking records the current public page and excludes query values", async ({ page }) => {
  await page.goto("/?from=%2Fservices%2Fsalon-booking-app-development%2F&email=private@example.test#consultation");
  await interceptContactNavigation(page);
  expect(await enableTestAnalytics(page)).toBe(true);
  expect(await page.evaluate(() => window.__analyticsTestAPI.initAnalytics(document, window.__analyticsTestWindow))).toBe(false);
  const booking = page.locator("#consultation [data-booking-link]");
  await expect(booking).toHaveAttribute("href", bookingURL);
  await booking.focus();
  await page.keyboard.press("Enter");
  const events = await contactEvents(page);
  expect(events).toEqual([
    { name: "Contact intent", data: { page: "/", action: "consultation-booking" } },
  ]);
  expect(JSON.stringify(events)).not.toMatch(/private|@|from=|email=|briefbooth|subject|body/i);
});

test("booking tracking rejects changed URLs and private query parameters", async ({ page }) => {
  await page.goto("/");
  await interceptContactNavigation(page);
  expect(await enableTestAnalytics(page)).toBe(true);
  const booking = page.locator(".simple-actions [data-booking-link]");
  for (const destination of [
    `${bookingURL}?email=private@example.test`, `${bookingURL}#private-note`,
    "https://briefbooth.com/book/another-business", "https://example.com/book/4u-digital",
  ]) {
    await booking.evaluate((element, href) => element.setAttribute("href", href), destination);
    await booking.focus();
    await page.keyboard.press("Enter");
  }
  expect(await contactEvents(page)).toEqual([]);
});

test("ordinary business email links record intent without reading their attributed draft", async ({ page }) => {
  await page.goto("/");
  await interceptContactNavigation(page);
  expect(await enableTestAnalytics(page)).toBe(true);
  await page.locator("footer a[href^='mailto:']").click();
  expect(await contactEvents(page)).toEqual([
    { name: "Contact intent", data: { page: "/", action: "email" } },
  ]);
});

test("project inquiry links are tracked once without reading their email draft", async ({ page }) => {
  await page.goto("/work/bitbinder/");
  await interceptContactNavigation(page);
  expect(await enableTestAnalytics(page)).toBe(true);
  await page.locator(".project-story-hero .page-actions a[href^='mailto:']").click();
  expect(await contactEvents(page)).toEqual([
    { name: "Contact intent", data: { page: "/work/bitbinder/", action: "email" } },
  ]);
});

test("service consultation requests identify the service carrying the button", async ({ page }) => {
  await page.goto("/services/restaurant-ordering-app-development/");
  expect(await enableTestAnalytics(page)).toBe(true);
  const menu = page.getByRole("button", { name: "Open navigation", exact: true });
  const hasMenu = await menu.isVisible();
  if (hasMenu) await menu.click();
  const consultation = page.locator(".page-nav .nav-contact");
  await expect(consultation).toBeVisible();
  await expect(consultation).toHaveAttribute("href", bookingURL);
  await consultation.evaluate((element) => element.addEventListener("click", (event) => event.preventDefault()));
  await consultation.click();
  if (hasMenu) await page.keyboard.press("Escape");
  expect(await contactEvents(page)).toEqual([
    { name: "Contact intent", data: { page: "/services/restaurant-ordering-app-development/", action: "consultation-booking" } },
  ]);
});

test("privacy preferences and blocked analytics leave booking and email actions working", async ({ page }) => {
  await page.goto("/");
  await interceptContactNavigation(page);
  expect(await enableTestAnalytics(page, { privacy: { globalPrivacyControl: true } })).toBe(false);
  expect(await contactEvents(page)).toEqual([]);
  expect(await enableTestAnalytics(page, { blocked: true })).toBe(true);
  const booking = page.locator(".simple-actions [data-booking-link]");
  await expect(booking).toHaveAttribute("href", bookingURL);
  await booking.focus();
  await page.keyboard.press("Enter");
  const email = page.locator("#contact a[href^='mailto:']").first();
  await expect(email).toHaveAttribute("href", /^mailto:admin@customtechbuilt4u\.com/);
  await email.focus();
  await page.keyboard.press("Enter");
  expect(await contactEvents(page)).toEqual([]);
});
