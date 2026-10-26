import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { bookingURL } from "../booking.js";

const check = expect.configure({ timeout: 2500 });
const plannerExclusions = new Set(["/project-brief/", "/project-kickoff/", "/privacy/", "/terms/", "/guarantee/", "/404.html"]);
const resourceRoutes = new Set(["/project-brief/", "/project-kickoff/", "/privacy/", "/terms/", "/guarantee/", "/404.html"]);
const generatedSitemap = new URL("../dist/sitemap.xml", import.meta.url);

async function publishedRoutes() {
  // Read the actual output after Playwright's configured web server has built it.
  // This avoids a second route list that can silently miss a newly added page.
  const xml = await readFile(generatedSitemap, "utf8");
  const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, location]) => location.replaceAll("&amp;", "&"));
  check(locations.length, "The generated sitemap has canonical pages to inspect").toBeGreaterThan(0);
  const routes = locations.map((location) => new URL(location).pathname);
  check(new Set(routes).size, "Each canonical path appears once in the sitemap").toBe(routes.length);
  return routes;
}

async function expectBookingLink(link, width) {
  await check(link).toBeVisible();
  await check(link).toHaveAttribute("href", bookingURL);
  await check(link).toHaveAttribute("target", "_blank");
  await check(link).toHaveAttribute("rel", /\bnoopener\b/);
  await check(link).toHaveAttribute("rel", /\bnoreferrer\b/);
  await check(link).toContainText("Book a consultation");
  const box = await link.boundingBox();
  check(box.width, "The booking target has a usable tap width").toBeGreaterThanOrEqual(44);
  check(box.height, "The booking target has a usable tap height").toBeGreaterThanOrEqual(44);
  check(box.x, "Booking stays within the phone's left edge").toBeGreaterThanOrEqual(-1);
  check(box.x + box.width, "Booking stays within the phone's right edge").toBeLessThanOrEqual(width + 1);
}

async function expectDirectHit(link) {
  check(await link.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return hit === element || element.contains(hit);
  }), "The visible action can be tapped without another element intercepting it").toBe(true);
}

for (const width of [320, 390]) {
  test(`every generated page supports a complete client journey on a ${width}px phone`, async ({ page }, testInfo) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width, height: 844 });
    // The recovery page intentionally uses primary-domain asset URLs so it also
    // works at nested missing addresses. Check this build's files locally rather
    // than asking production for fingerprints that have not been deployed yet.
    await page.route("https://customtechbuilt4u.com/static/**", async (request) => {
      const source = new URL(request.request().url());
      const local = new URL(`${source.pathname}${source.search}`, testInfo.project.use.baseURL || "http://127.0.0.1:4173");
      const response = await request.fetch({ url: local.href });
      await request.fulfill({ response, headers: { ...response.headers(), "access-control-allow-origin": "*" } });
    });
    const canonicalRoutes = await publishedRoutes();
    const routes = [...canonicalRoutes, ...(!canonicalRoutes.includes("/404.html") ? ["/404.html"] : [])];
    const coverage = [];

    for (const route of routes) {
      const result = { route, canonical: canonicalRoutes.includes(route), width, status: "pending", checks: [] };
      try {
        await test.step(`${route} at ${width}px`, async () => {
          const response = await page.goto(route);
          check(response, "The page returns a response").not.toBeNull();
          check(route === "/404.html" ? [200, 404] : [200]).toContain(response.status());
          await page.evaluate(() => document.fonts.ready);
          const main = page.locator("main");
          await check(main).toHaveCount(1);
          await check(page.locator("h1")).toHaveCount(1);
          await check(page.getByRole("heading", { level: 1 })).toBeVisible();
          result.heading = await page.getByRole("heading", { level: 1 }).innerText();
          check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            "The document fits the phone; scrollable comparison regions may manage their own overflow").toBe(true);
          result.checks.push("response", "one visible h1", "document fits phone");

          const navigation = page.getByRole("navigation", { name: "Main navigation", exact: true });
          const menu = page.getByRole("button", { name: "Open navigation", exact: true });
          const hasMenu = await menu.isVisible();
          if (hasMenu) await menu.click();
          await check(navigation).toBeVisible();
          const navigationLinks = navigation.getByRole("link");
          const navigationLinkCount = await navigationLinks.count();
          if (route === "/project-brief/") {
            check(navigationLinkCount, "The focused planner header retains its direct booking action").toBeGreaterThanOrEqual(1);
          } else {
            check(navigationLinkCount, "The menu exposes real navigation choices").toBeGreaterThan(1);
          }
          for (const link of await navigationLinks.all()) await check(link).toBeVisible();
          const navBooking = navigation.locator("[data-booking-link]");
          await check(navBooking).toHaveCount(1);
          await expectBookingLink(navBooking, width);
          if (hasMenu) {
            await page.keyboard.press("Escape");
            await check(page.locator(".menu-toggle")).toHaveAttribute("aria-expanded", "false");
          }
          result.checks.push("usable main navigation", "direct navigation booking");

          const inPageAnchors = await main.locator("a[href]").evaluateAll((links) => links.flatMap((link) => {
            const url = new URL(link.getAttribute("href"), location.href);
            if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash || url.hash === "#") return [];
            let id;
            try { id = decodeURIComponent(url.hash.slice(1)); } catch { id = url.hash.slice(1); }
            return [{ label: link.textContent.trim(), href: link.getAttribute("href"), id,
              exists: Boolean(document.getElementById(id) || [...document.getElementsByName(id)].length) }];
          }));
          check(inPageAnchors.filter((anchor) => !anchor.exists), "Every same-page main-content link has a real destination")
            .toEqual([]);
          result.inPageAnchorCount = inPageAnchors.length;
          result.checks.push("all main same-page destinations exist");

          const planner = page.getByRole("link", { name: "Know what you want? Open the optional project planner", exact: true });
          if (plannerExclusions.has(route)) {
            await check(planner).toHaveCount(0);
            result.checks.push("context-appropriate planner exclusion");
          } else {
            await check(planner).toHaveCount(1);
            await check(planner).toBeInViewport({ ratio: 1 });
            check(new URL(await planner.getAttribute("href"), page.url()).pathname).toBe("/project-brief/");
            await check(planner).toHaveAccessibleName("Know what you want? Open the optional project planner");
            await expectDirectHit(planner);
            result.checks.push("optional planner is reachable");
          }

          if (!resourceRoutes.has(route)) {
            const nextStep = route === "/contact/" ? main.locator("[data-booking-link]") : main.locator([
              ".page-callout [data-booking-link]", ".project-build-cta [data-booking-link]",
              "#consultation [data-booking-link]", "#work-with-me [data-booking-link]",
            ].join(", "));
            check(await nextStep.count(), "A marketing page offers a content-level consultation action beyond its header")
              .toBeGreaterThan(0);
            await expectBookingLink(nextStep.last(), width);
            result.checks.push("content-level next step");
          }

          const footer = page.locator("footer");
          await check(footer).toHaveCount(1);
          const footerBooking = footer.locator("[data-booking-link]");
          check(await footerBooking.count(), "The end of the page offers direct booking").toBeGreaterThan(0);
          await expectBookingLink(footerBooking.first(), width);
          await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
          const lastFooterLink = footer.locator("a:visible").last();
          await lastFooterLink.focus();
          await check(lastFooterLink).toBeFocused();
          await check(lastFooterLink).toBeInViewport({ ratio: 1 });
          await expectDirectHit(lastFooterLink);

          const dock = page.getByRole("complementary", { name: "Consultation booking", exact: true });
          if (route === "/project-brief/") {
            await check(dock).toHaveCount(0);
          } else {
            await check(dock).toBeInViewport({ ratio: 1 });
            const dockBooking = dock.locator("[data-booking-link]");
            await expectBookingLink(dockBooking, width);
            await expectDirectHit(dockBooking);
            const footerBox = await footer.boundingBox();
            const dockBox = await dock.boundingBox();
            check(footerBox.y + footerBox.height, "The footer remains above the persistent booking dock")
              .toBeLessThanOrEqual(dockBox.y + 1);
            if (!plannerExclusions.has(route)) {
              await check(planner).toBeInViewport({ ratio: 1 });
              await expectDirectHit(planner);
              const plannerBox = await planner.boundingBox();
              const bookingBox = await dockBooking.boundingBox();
              check(plannerBox.x + plannerBox.width, "The planner does not cover booking")
                .toBeLessThanOrEqual(bookingBox.x);
            }
          }
          check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          result.checks.push("footer remains reachable", "booking dock respects page context", "no footer/control overlap");
          result.status = "passed";
        });
      } catch (error) {
        result.status = "failed";
        result.error = error.message;
      }
      coverage.push(result);
    }

    await testInfo.attach(`entire-site-mobile-${width}px-${testInfo.project.name}.json`, {
      body: JSON.stringify({ source: "dist/sitemap.xml", canonicalRouteCount: canonicalRoutes.length,
        inspectedRouteCount: routes.length, width, project: testInfo.project.name, coverage }, null, 2),
      contentType: "application/json",
    });
    check(coverage).toHaveLength(routes.length);
    check(coverage.filter((result) => result.status === "failed"), "Every sitemap route and the not-found page completed the mobile checks")
      .toEqual([]);
  });
}
