import { test, expect } from "@playwright/test";

async function interceptEmail(page) {
  await page.evaluate(() => document.addEventListener("click", (event) => {
    if (event.target.closest?.('a[href^="mailto:"]')) event.preventDefault();
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
    const analytics = await import("/analytics.js?v=37");
    window.__analyticsTestAPI = analytics;
    return analytics.initAnalytics(document, window.__analyticsTestWindow);
  }, { blocked, privacy });
}

async function contactEvents(page) {
  return page.evaluate(() => window.__contactEvents || []);
}

test("disabled analytics leaves the consultation usable and sends nothing", async ({ page }) => {
  await page.goto("/");
  await interceptEmail(page);
  const initialized = await page.evaluate(async () => {
    document.querySelector('meta[name="built4u-analytics"]')?.remove();
    window.__contactEvents = [];
    const analytics = await import("/analytics.js?v=37");
    return analytics.initAnalytics(document, {
      location: new URL("https://customtechbuilt4u.com/"), navigator: {},
      va: (type, data) => { if (type === "event") window.__contactEvents.push(data); },
    });
  });
  expect(initialized).toBe(false);
  await page.locator("#consultation-times").fill("Friday afternoon, Eastern time");
  await page.locator('#consultation-form button[type="submit"]').click();
  await expect(page.locator("#consultation-status")).toContainText(/ready|send|email/i);
  expect(await contactEvents(page)).toEqual([]);
  await expect(page.locator('script[data-built4u-analytics]')).toHaveCount(0);
});

test("consultation tracking preserves its public source and excludes private form details", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", {
    configurable: true, value: { writeText: async () => {} },
  }));
  await page.goto("/?from=%2Fservices%2Fsalon-booking-app-development%2F&email=private@example.test#consultation");
  await interceptEmail(page);
  expect(await enableTestAnalytics(page)).toBe(true);
  expect(await page.evaluate(() => window.__analyticsTestAPI.initAnalytics(document, window.__analyticsTestWindow))).toBe(false);
  await page.locator('#consultation-form button[type="submit"]').click();
  expect(await contactEvents(page)).toEqual([]);

  await page.locator('#consultation-form input[value="in-person"]').check();
  await page.locator("#consultation-times").fill("PRIVATE Tuesday at 14:30, Eastern time");
  await page.locator("#consultation-project").fill("PRIVATE CLIENT private@example.test, proposed budget and customer records.");
  await page.locator('#consultation-form button[type="submit"]').click();
  await page.locator("#consultation-copy").click();
  await expect(page.locator("#consultation-status")).toContainText(/copied/i);
  const events = await contactEvents(page);
  expect(events).toEqual([
    { name: "Contact intent", data: { page: "/services/salon-booking-app-development/", action: "consultation-email-in-person" } },
    { name: "Contact intent", data: { page: "/services/salon-booking-app-development/", action: "consultation-copy" } },
  ]);
  expect(JSON.stringify(events)).not.toMatch(/PRIVATE|@|Tuesday|14:30|budget|records|subject|body|from=/i);
});

test("failed clipboard copying records no successful copy intent", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", {
    configurable: true, value: { writeText: async () => { throw new Error("Clipboard unavailable"); } },
  }));
  await page.goto("/");
  expect(await enableTestAnalytics(page)).toBe(true);
  await page.locator("#consultation-times").fill("Wednesday after 2 pm");
  await page.locator("#consultation-copy").click();
  await expect(page.locator("#consultation-draft-panel")).toBeVisible();
  expect(await contactEvents(page)).toEqual([]);
});

test("copying the business email address records intent only after clipboard success", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", {
    configurable: true, value: { writeText: async () => {} },
  }));
  await page.goto("/");
  expect(await enableTestAnalytics(page)).toBe(true);
  await page.locator("#copy-email").click();
  await expect(page.locator("#copy-status")).toContainText(/copied/i);
  expect(await contactEvents(page)).toEqual([
    { name: "Contact intent", data: { page: "/", action: "email-copy" } },
  ]);
});

test("dynamic project inquiry links are tracked once without reading their email draft", async ({ page }) => {
  await page.goto("/");
  await interceptEmail(page);
  expect(await enableTestAnalytics(page)).toBe(true);
  await page.locator('#featured-projects [data-project="The-Bit-Binder"]').first().click();
  await expect(page.locator("#project-dialog")).toBeVisible();
  await page.locator("#project-dialog .project-enquiry").click();
  expect(await contactEvents(page)).toEqual([
    { name: "Contact intent", data: { page: "/", action: "email" } },
  ]);
});

test("service consultation requests identify the service carrying the button", async ({ page }) => {
  await page.goto("/services/restaurant-ordering-app-development/");
  expect(await enableTestAnalytics(page)).toBe(true);
  const consultation = page.locator(".page-nav .nav-contact");
  await consultation.evaluate((element) => element.addEventListener("click", (event) => event.preventDefault()));
  await consultation.click();
  expect(await contactEvents(page)).toEqual([
    { name: "Contact intent", data: { page: "/services/restaurant-ordering-app-development/", action: "consultation-request" } },
  ]);
});

test("privacy preferences and blocked analytics leave email requests working", async ({ page }) => {
  await page.goto("/");
  await interceptEmail(page);
  expect(await enableTestAnalytics(page, { privacy: { globalPrivacyControl: true } })).toBe(false);
  expect(await contactEvents(page)).toEqual([]);
  expect(await enableTestAnalytics(page, { blocked: true })).toBe(true);
  await page.locator("#consultation-times").fill("Thursday morning, Eastern time");
  await page.locator('#consultation-form button[type="submit"]').click();
  await expect(page.locator("#consultation-email")).toBeVisible();
  await expect(page.locator("#consultation-status")).toContainText(/ready|send|email/i);
  expect(await contactEvents(page)).toEqual([]);
});
