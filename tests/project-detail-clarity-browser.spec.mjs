import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";
import { projectSlugs } from "../seo-content.js";
import { projectClientUses } from "../content/project-client-uses.js";
import { projectBuildCare } from "../content/project-build-care.js";
import { bookingURL } from "../booking.js";

const representatives = ["BriefBooth.com", "The-Bit-Binder", "micro-short-website", "usbmic"]
  .map((id) => projects.find((project) => project.id === id));

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
  test.describe(`project detail clarity with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled });

    for (const project of representatives) {
      test(`${project.title} helps a mobile client understand the project, their own build, and the next step`, async ({ page }) => {
        // Each case exercises two phone widths, native disclosures and a booking popup.
        test.setTimeout(120_000);
        const route = `/work/${projectSlugs[project.id]}/`;
        const context = projectClientUses[project.id];
        await page.context().route(bookingURL, (request) => request.fulfill({
          status: 200, contentType: "text/html",
          body: "<!doctype html><title>Booking handoff test</title><h1>Booking handoff test</h1>",
        }));
        for (const width of [320, 390]) {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(route);
          await page.evaluate(() => document.fonts.ready);
          const hero = page.locator(".project-story-hero");
          await expect(hero.getByRole("heading", { level: 1 })).toHaveAccessibleName(project.title);
          await expect(hero.locator(".page-lead")).toHaveText(project.purpose);
          await expect(hero.locator(".project-personal-note")).toHaveText("Selected personal project");
          await expect(page.locator("#overview .project-quick-capabilities li")).toHaveText(context.capabilities);
          await expect(hero.locator(".project-quick-capabilities")).toHaveCount(0);
          const coverTop = await page.locator("#project-cover").evaluate((element) => element.getBoundingClientRect().top + scrollY);
          expect(coverTop, "The original cover begins within 1.25 phone screens").toBeLessThanOrEqual(900 * 1.25);
          const extraFeatures = page.locator("#overview .project-capabilities");
          await expect(extraFeatures).not.toHaveAttribute("open");
          await extraFeatures.locator("summary").focus();
          await page.keyboard.press("Enter");
          await expect(extraFeatures).toHaveAttribute("open", "");
          await expect(extraFeatures.locator(".project-quick-capabilities")).toBeVisible();
          const status = hero.locator(".project-release-status");
          if (project.demoLabel === "App Store") await expect(status).toHaveText("On the App Store");
          else if (project.id === "usbmic") {
            await expect(status).toHaveText("Release candidate");
            await expect(hero.locator(".project-release-note")).toContainText(/physical[- ]microphone.*pending|pending.*physical[- ]microphone/i);
          } else await expect(status).toHaveCount(0);

          const actions = hero.locator(".page-actions");
          await expect(actions.locator("a").first()).toHaveAttribute("data-booking-link", "");
          await expectDirectBooking(actions.locator("[data-booking-link]"));
          await expect(actions.locator("a")).toHaveCount(2);
          await expect(page.locator("main a[href^='mailto:']")).toHaveCount(0);
          await expect(page.locator(".project-build-cta")).toHaveCount(0);
          if (project.demoUrl) {
            await expect(hero.locator(`.project-live-destination a[href="${project.demoUrl}"]`)).toBeVisible();
          }
          const browse = hero.locator(".project-hero-browse");
          await expect(browse).toHaveAttribute("href", "#overview");
          await expect(browse).toHaveText(/See how it works/);
          await expectTapTarget(browse, width);
          await browse.focus();
          await page.keyboard.press("Enter");
          await expect(page).toHaveURL(new RegExp(`${route}#overview$`));
          await expect(page.locator("#overview .project-workflow-card")).toHaveCount(project.workflows.length);

          const navigation = page.getByRole("navigation", { name: "On this project page", exact: true });
          await expect(navigation.locator("a")).toHaveCount(4);
          expect(await navigation.evaluate((element) => {
            const cover = document.querySelector("#project-cover");
            return element.closest(".project-story-hero") === null &&
              cover.getBoundingClientRect().bottom <= element.getBoundingClientRect().top + 1;
          }), "The section navigation follows the complete original cover and caption").toBe(true);
          for (const target of ["overview", "your-business", "project-views", "development"]) {
            const link = navigation.locator(`a[href="#${target}"]`);
            await expectTapTarget(link, width);
          }
          await navigation.locator('a[href="#your-business"]').focus();
          await page.keyboard.press("Enter");
          await expect(page).toHaveURL(new RegExp(`${route}#your-business$`));
          const business = page.locator("#your-business");
          await expect(business.locator(".project-business-example")).toContainText("A similar business need");
          await expect(business.locator(".project-business-example")).toContainText(context.businessUse);
          await expect(business.locator(".project-build-care")).not.toHaveAttribute("open");
          await business.locator(".project-build-care > summary").click();
          await expect(business.locator(".project-build-care p")).toHaveText(projectBuildCare[project.id]);
          await expect(business.locator(".project-client-promises li")).toHaveCount(3);
          for (const promise of [/direct line|person building/i, /scope/i, /custom code/i, /30.day/i]) {
            await expect(business.locator(".project-client-promises")).toContainText(promise);
          }
          await expect(business).toContainText(/100% yours/);
          await expect(business).toContainText(/public portfolio/i);
          await expect(business).toContainText(/without your permission|unless you give permission/i);
          const service = business.locator(`a[href$="services/${context.serviceSlug}/"]`);
          await expectTapTarget(service, width);
          expect(new URL(await service.getAttribute("href"), page.url()).pathname)
            .toBe(`/services/${context.serviceSlug}/`);
          expect(await business.evaluate((element) => Boolean(
            document.querySelector("#overview").compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING,
          ) && Boolean(document.querySelector("#project-views").compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING)),
          "The illustrative business use follows the real workflow and original gallery").toBe(true);
          await expect(business.locator("form, input, select, textarea, iframe")).toHaveCount(0);
          const booking = business.locator("[data-booking-link]");
          await expectDirectBooking(booking);
          await expectTapTarget(booking, width);
          await booking.focus();
          const pendingPopup = page.waitForEvent("popup");
          await page.keyboard.press("Enter");
          const popup = await pendingPopup;
          try {
            await expect(popup).toHaveURL(bookingURL);
            await expect(popup.getByRole("heading", { level: 1 })).toHaveText("Booking handoff test");
            await expect(page).toHaveURL(new RegExp(`${route}#your-business$`));
          } finally {
            await popup.close();
          }
          const dock = page.locator(".mobile-consultation [data-booking-link]");
          await expectDirectBooking(dock);
          await expectTapTarget(dock, width);
          await expect(page.locator(".planner-shortcut")).toHaveCount(0);
          const planner = page.locator("footer").getByRole("link", { name: "Project planner", exact: true });
          expect(new URL(await planner.getAttribute("href"), page.url()).pathname).toBe("/project-brief/");
          const guarantee = business.locator('a[href$="guarantee/"]');
          await expectTapTarget(guarantee, width);
          expect(new URL(await guarantee.getAttribute("href"), page.url()).pathname).toBe("/guarantee/");
          await guarantee.focus();
          await page.keyboard.press("Enter");
          await expect(page).toHaveURL(/\/guarantee\/$/);
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        }
      });
    }
  });
}
