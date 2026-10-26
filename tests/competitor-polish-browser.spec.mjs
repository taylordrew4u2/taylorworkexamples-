import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";
import { projectSlugs } from "../seo-content.js";
import { bookingURL } from "../booking.js";

const apps = ["The-Bit-Binder", "MyGigCalendar"].map((id) => projects.find((project) => project.id === id));
const banner = (page, project) => page.locator(`a.hero-project[data-project="${project.id}"]`);

async function expectTapTarget(link, width) {
  await expect(link).toBeVisible();
  const box = await link.boundingBox();
  expect(box.width, "The link has a comfortable touch width").toBeGreaterThanOrEqual(44);
  expect(box.height, "The link has a comfortable touch height").toBeGreaterThanOrEqual(44);
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
}

async function expectDirectHit(link) {
  await link.focus();
  await expect(link).toBeInViewport({ ratio: 1 });
  expect(await link.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return hit === element || element.contains(hit);
  }), "Another element does not cover the visible action").toBe(true);
}

async function expectBannerDestination(page, project) {
  const link = banner(page, project);
  await expect(link).toHaveAttribute("href", project.caseUrl);
  await expect(link).toHaveRole("link");
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/work/${projectSlugs[project.id]}/$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(project.title);
}

for (const javaScriptEnabled of [true, false]) {
  test.describe(`clear opening and secondary actions with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled });

    test("phone visitors can choose a service before reaching project images while booking remains primary", async ({ page }) => {
      await page.context().route(bookingURL, (route) => route.fulfill({
        status: 200, contentType: "text/html",
        body: "<!doctype html><title>Booking handoff test</title><h1>Booking handoff test</h1>",
      }));
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 });
        await page.goto("/");
        await page.evaluate(() => document.fonts.ready);
        const actions = page.locator(".intro-actions");
        const booking = actions.locator("[data-booking-link]");
        await expect(actions.locator("a").first()).toHaveAttribute("data-booking-link", "");
        await expect(booking).toHaveAttribute("href", bookingURL);
        await expect(booking).toHaveAttribute("target", "_blank");
        await expect(booking).toHaveAttribute("rel", /\bnoopener\b/);
        await expect(booking).toHaveAttribute("rel", /\bnoreferrer\b/);
        await expect(booking).toHaveAccessibleName(/^Book a consultation\b/);
        await expectTapTarget(booking, width);
        await expectDirectHit(booking);
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

        const service = actions.getByRole("link", { name: "Choose a service", exact: false });
        await expect(service).toHaveAttribute("href", "#services");
        await expectTapTarget(service, width);
        expect(await service.evaluate((element) => {
          const stage = document.querySelector(".hero-stage");
          return Boolean(element.compareDocumentPosition(stage) & Node.DOCUMENT_POSITION_FOLLOWING) &&
            element.getBoundingClientRect().bottom <= stage.getBoundingClientRect().top + 1;
        }), "The service choice is available before the project imagery in reading and visual order").toBe(true);
        await expect(actions.getByRole("link", { name: "View all projects", exact: false }))
          .toHaveAttribute("href", "./work/");
        await service.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/\/#services$/);
        await expect(page.locator("#services-title")).toBeInViewport();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    });

    test("publication evidence and related links remain comfortable touch targets on narrow phones", async ({ page }) => {
      test.setTimeout(60_000);
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 844 });
        await page.goto("/");
        const proof = page.locator(".hero-range-proof");
        await expectTapTarget(proof, width);
        await expectDirectHit(proof);
        await proof.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/\/work\/#app-store-proof$/);
        const storeLinks = page.locator("#app-store-proof .range-store-link");
        await expect(storeLinks).toHaveCount(3);
        for (const link of await storeLinks.all()) {
          await expectTapTarget(link, width);
          await expect(link).toHaveAttribute("href", /^https:\/\/apps\.apple\.com\//);
          await expectDirectHit(link);
        }
        const rangeLinks = page.locator("#range-proof .range-project-links a");
        await expect(rangeLinks).not.toHaveCount(0);
        for (const link of await rangeLinks.all()) await expectTapTarget(link, width);
        for (const route of ["/guides/website-or-app/", "/services/website-development/", "/insights/salon-business-website/"]) {
          await page.goto(route);
          const related = page.locator(route === "/guides/website-or-app/"
            ? ".guide-choice-card .text-link:visible"
            : ".related-links a:visible");
          await expect(related).not.toHaveCount(0);
          for (const link of await related.all()) await expectTapTarget(link, width);
          await expectDirectHit(related.last());
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        }
      }
    });
  });
}

test.describe("ordinary app-banner links without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("both supplied app banners open their actual individual project pages with native keyboard activation", async ({ page }) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const project of apps) {
        await page.goto("/");
        await expectBannerDestination(page, project);
      }
    }
  });
});

test("app banners still open complete project pages if the homepage enhancement module fails", async ({ page }) => {
  let blockedRequests = 0;
  await page.route(/\/app\.js(?:\?|$)/, (route) => {
    blockedRequests += 1;
    return route.abort();
  });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const project of apps) {
      await page.goto("/");
      await expect(banner(page, project)).not.toHaveAttribute("aria-haspopup", "dialog");
      await expectBannerDestination(page, project);
    }
  }
  expect(blockedRequests, "The test actually exercises a failed homepage module").toBeGreaterThanOrEqual(4);
});

test("app banners remain ordinary project links when dialog previews are unsupported", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true, writable: true, value: undefined,
    });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const project of apps) {
    await page.goto("/");
    expect(await page.evaluate(() => typeof HTMLDialogElement.prototype.showModal)).toBe("undefined");
    const link = banner(page, project);
    expect(await link.getAttribute("aria-haspopup"), "An unavailable preview is not advertised").toBeNull();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expectBannerDestination(page, project);
  }
});

test("enhanced app previews open by keyboard and return focus to their original link when closed", async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    for (const project of apps) {
      const link = banner(page, project);
      await expect(link).toHaveAttribute("href", project.caseUrl);
      await expect(link).toHaveAttribute("aria-haspopup", "dialog");
      await link.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(project.title);
      await expect(page).toHaveURL(/\/$/);
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(link).toBeFocused();
    }
  }
});
