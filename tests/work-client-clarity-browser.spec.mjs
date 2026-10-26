import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";
import { projectSlugs } from "../seo-content.js";
import { projectClientUses } from "../content/project-client-uses.js";
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
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /\bnoopener\b/);
  await expect(link).toHaveAttribute("rel", /\bnoreferrer\b/);
  await expect(link).toContainText("Book a consultation");
}

for (const javaScriptEnabled of [true, false]) {
  test.describe(`client-facing portfolio context with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled });

    test("mobile cards introduce the app before its full-color image and distinguish capabilities from illustrative business uses", async ({ page }) => {
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/work/");
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator("#project-collection .seo-project-card:visible")).toHaveCount(projects.length);
        for (const project of projects) {
          const card = page.locator(`.seo-project-card[data-project-id="${project.id}"]`);
          const context = projectClientUses[project.id];
          const header = card.locator(".work-project-header");
          await expect(header.getByRole("heading", { level: 3 })).toHaveText(project.title);
          const image = card.locator(".seo-project-cover img");
          expect(new URL(await image.getAttribute("src"), page.url()).pathname)
            .toBe(`/${project.image.replace(/^\.\//, "")}`);
          await expect(image).toHaveAttribute("alt", project.imageAlt);
          await expect(image).toHaveAttribute("width", String(project.imageWidth));
          await expect(image).toHaveAttribute("height", String(project.imageHeight));
          await expect(image).toHaveCSS("object-fit", "contain");
          for (const element of [card, card.locator(".seo-project-cover"), image]) {
            await expect(element).toHaveCSS("filter", "none");
            await expect(element).toHaveCSS("mix-blend-mode", "normal");
          }
          if (project.icon) {
            const icon = header.locator("img.project-icon");
            expect(new URL(await icon.getAttribute("src"), page.url()).pathname)
              .toBe(`/${project.icon.replace(/^\.\//, "")}`);
            await expect(icon).toHaveCSS("filter", "none");
          } else {
            await expect(header.locator(".project-initials")).toHaveCount(1);
          }
          await expect(card.locator(".work-index-image-label")).toHaveText(project.imageLabel || "Project image");
          await expect(card.locator(".work-project-purpose")).toHaveText(project.purpose);
          await expect(card.locator(".work-project-capabilities li")).toHaveText(context.capabilities);
          await expect(card.locator(".work-project-business-use")).toContainText("A similar business need");
          await expect(card.locator(".work-project-business-use")).toContainText(context.businessUse);
          expect(await card.evaluate((element) => {
            const box = element.getBoundingClientRect();
            const header = element.querySelector(".work-project-header").getBoundingClientRect();
            const cover = element.querySelector(".seo-project-cover").getBoundingClientRect();
            const source = element.querySelector(".work-index-image-label");
            const label = source.getBoundingClientRect();
            const details = [...element.querySelectorAll(".work-project-purpose, .work-project-capabilities li, .work-project-business-use")];
            return header.bottom <= cover.top + 1 && label.top >= cover.bottom - 1 &&
              source.closest(".seo-project-cover") === null && details.every((detail) => {
                const bounds = detail.getBoundingClientRect();
                return bounds.left >= box.left && bounds.right <= box.right && bounds.width > 0;
              });
          }), `${project.title}: its name, artwork, source label, and explanation stay separate and fit the phone`).toBe(true);
          const action = card.getByRole("link", { name: `See how it works: ${project.title}`, exact: true });
          await expect(action).toHaveText(/See how it works/);
          expect(new URL(await action.getAttribute("href"), page.url()).pathname).toBe(`/work/${projectSlugs[project.id]}/`);
          await expectTapTarget(action, width);
        }
        await expect(page.locator('.seo-project-card[data-project-id="usbmic"] .work-project-status')).toHaveText("Release candidate");
        await expect(page.locator('.seo-project-card[data-project-id="usbmic"] .work-project-business-use'))
          .toContainText(/physical microphone validation pending/i);
        await expect(page.locator('.seo-project-card .work-project-status').filter({ hasText: "On the App Store" })).toHaveCount(3);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    });

    test("the opening offers direct booking and project browsing, then explains collaboration before the publication evidence", async ({ page }) => {
      // Keep the booking handoff local; no real appointment or email is created.
      await page.context().route(bookingURL, (route) => route.fulfill({
        status: 200, contentType: "text/html",
        body: "<!doctype html><title>Booking handoff test</title><h1>Booking handoff test</h1>",
      }));
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/work/");
        const opening = page.locator(".page-intro");
        await expect(opening.locator(".page-lead")).toContainText(/personal projects/i);
        await expect(opening.locator(".work-intro-promise")).toContainText(/work directly.*developer.*designs.*codes.*launches/i);
        const booking = opening.locator("[data-booking-link]");
        await expectDirectBooking(booking);
        await expectTapTarget(booking, width);
        await expect(opening.locator(".page-actions a").first()).toHaveAttribute("data-booking-link", "");
        await expect(opening.locator("form, input, select, textarea")).toHaveCount(0);
        await booking.focus();
        const pendingPopup = page.waitForEvent("popup");
        await page.keyboard.press("Enter");
        const popup = await pendingPopup;
        try {
          await expect(popup).toHaveURL(bookingURL);
          await expect(popup.getByRole("heading", { level: 1 })).toHaveText("Booking handoff test");
          await expect(page).toHaveURL(/\/work\/$/);
        } finally {
          await popup.close();
        }
        const browse = opening.getByRole("link", { name: "Browse projects", exact: false });
        await expect(browse).toHaveAttribute("href", "#project-collection");
        await expectTapTarget(browse, width);
        await browse.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/\/work\/#project-collection$/);
        await expect(page.locator("#project-collection-title")).toBeInViewport();

        const hiring = page.locator("#work-with-me");
        await expect(hiring.locator(".work-hiring-grid > article")).toHaveCount(3);
        for (const commitment of [/one developer/i, /clear scope/i, /custom code/i, /30.day money.back guarantee/i]) {
          await expect(hiring).toContainText(commitment);
        }
        expect(await hiring.evaluate((element) => Boolean(
          document.querySelector("#project-collection").compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING,
        ) && Boolean(element.compareDocumentPosition(document.querySelector("#range-proof")) & Node.DOCUMENT_POSITION_FOLLOWING)),
        "Collaboration commitments follow the projects and precede publication evidence").toBe(true);
        const disclosure = hiring.locator(".portfolio-disclosure");
        await expect(disclosure).toHaveCount(1);
        await expect(disclosure).toContainText(/selected personal projects/i);
        await expect(disclosure).toContainText(/custom code.*100% yours/i);
        await expect(disclosure).toContainText(/without your permission/i);
        await expectDirectBooking(hiring.locator("[data-booking-link]"));
        const terms = hiring.locator('a[href="../#client-care"]');
        await expectTapTarget(terms, width);
        await terms.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/\/#client-care$/);
        await expect(page.locator("#client-care-title")).toBeInViewport();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    });
  });
}
