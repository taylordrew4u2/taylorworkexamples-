import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";
import { projectSlugs } from "../seo-content.js";
import { bookingURL } from "../booking.js";

const widths = [320, 390];
const galleryProjects = projects.filter((project) =>
  ["Showrunner-ICanRunAShow", "The-Bit-Binder"].includes(project.id));
const handoffProjects = projects.filter((project) =>
  ["BriefBooth.com", "The-Bit-Binder"].includes(project.id));

async function expectHorizontalFitAndTapSize(link, width) {
  const box = await link.boundingBox();
  expect(box, "The product or image link has visible bounds").not.toBeNull();
  expect(box.height, "Project actions have a full-size tap target").toBeGreaterThanOrEqual(44);
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
}

async function expectReadableBookingNote(page, width) {
  const hero = page.locator(".project-story-hero .page-intro");
  const note = hero.locator(":scope > .booking-destination-note");
  await expect(note).toHaveCount(1);
  await expect(note).toHaveText("Video consultation · Opens BriefBooth in a new tab. Requests are reviewed before confirmation.");
  await expect(hero.locator("[data-booking-link]")).toHaveAttribute("href", bookingURL);
  const metrics = await note.evaluate((element) => {
    const style = getComputedStyle(element);
    let surface = element;
    let background = "rgba(0, 0, 0, 0)";
    while (surface && background === "rgba(0, 0, 0, 0)") {
      background = getComputedStyle(surface).backgroundColor;
      surface = surface.parentElement;
    }
    const bounds = element.getBoundingClientRect();
    return {
      color: style.color, background, whiteSpace: style.whiteSpace,
      left: bounds.left, right: bounds.right,
      scrollWidth: element.scrollWidth, clientWidth: element.clientWidth,
    };
  });
  const luminance = (color) => {
    const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map((value) => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const values = [luminance(metrics.color), luminance(metrics.background)].sort((a, b) => a - b);
  expect((values[1] + 0.05) / (values[0] + 0.05), "Booking handoff instructions stay readable on the dark project opening")
    .toBeGreaterThanOrEqual(4.5);
  expect(metrics.whiteSpace, "Booking instructions wrap on a narrow phone").not.toBe("nowrap");
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.left).toBeGreaterThanOrEqual(-1);
  expect(metrics.right).toBeLessThanOrEqual(width + 1);
}

async function gallerySnapshot(page) {
  return page.locator(".project-page-frame").evaluateAll((frames) => frames.map((frame) => ({
    id: frame.id,
    label: frame.querySelector("figcaption strong").textContent,
    images: [...frame.querySelectorAll("img")].map((image) => image.getAttribute("src")),
  })));
}

for (const javaScriptEnabled of [true, false]) {
  test.describe(`project exploration with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled });

    test("real product links are distinct from case studies and open a separate tab", async ({ page }) => {
      for (const width of widths) {
        await page.setViewportSize({ width, height: 844 });
        await page.goto("/work/");
        for (const project of projects) {
          const card = page.locator(`.seo-project-card[data-project-id="${project.id}"]`);
          const live = card.locator(".work-project-live-link");
          const caseStudy = card.getByRole("link", { name: `See how it works: ${project.title}`, exact: true });
          expect(new URL(await caseStudy.getAttribute("href"), page.url()).pathname)
            .toBe(`/work/${projectSlugs[project.id]}/`);
          await expect(live).toHaveCount(project.demoUrl ? 1 : 0);
          if (!project.demoUrl) continue;
          await expect(live).toHaveAttribute("href", project.demoUrl);
          await expect(live).toHaveAccessibleName(`Open ${project.title}: ${project.demoLabel || "Live site"} (opens in a new tab)`);
          await expect(live).toHaveAttribute("target", "_blank");
          await expect(live).toHaveAttribute("rel", /\bnoopener\b/);
          await expect(live).toHaveAttribute("rel", /\bnoreferrer\b/);
          await expectHorizontalFitAndTapSize(live, width);
        }
        await expect(page.locator('.seo-project-card[data-project-id="usbmic"] .work-project-status'))
          .toHaveText("Release candidate · Physical microphone validation pending");
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }

      // Intercept both public destinations: this verifies the native handoff
      // without loading an external product, scheduler, or App Store page.
      for (const project of handoffProjects) {
        const destination = new URL(project.demoUrl).href;
        await page.context().route((url) => url.href === destination, (request) => request.fulfill({
          status: 200,
          contentType: "text/html",
          body: "<!doctype html><title>Local product handoff</title><h1>Local product handoff</h1>",
        }));
        const live = page.locator(`.seo-project-card[data-project-id="${project.id}"] .work-project-live-link`);
        await live.focus();
        const popupReady = page.waitForEvent("popup");
        await page.keyboard.press("Enter");
        const popup = await popupReady;
        await expect(popup).toHaveURL(destination);
        await expect(popup).toHaveTitle("Local product handoff");
        await expect(page).toHaveURL(/\/work\/$/);
        await popup.close();
      }
    });

    for (const project of galleryProjects) {
      test(`${project.title} image captions support native keyboard exploration without hiding the gallery`, async ({ page }) => {
        for (const width of widths) {
          await page.setViewportSize({ width, height: 844 });
          await page.goto(`/work/${projectSlugs[project.id]}/`);
          await expectReadableBookingNote(page, width);
          const before = await gallerySnapshot(page);
          expect(before).toHaveLength(project.gallery.length);
          const frames = page.locator(".project-page-frame");
          expect(await frames.evaluateAll((elements) => elements.every((element) => element.closest("details") === null)),
            "All original project images remain expanded outside the caption picker").toBe(true);

          const picker = page.locator(".project-image-picker");
          const summary = picker.locator("summary");
          await expect(picker).not.toHaveAttribute("open", "");
          await expect(picker.locator("img")).toHaveCount(0);
          await expect(picker.locator("a")).toHaveCount(before.length);
          await summary.focus();
          await page.keyboard.press("Enter");
          await expect(picker).toHaveAttribute("open", "");
          for (const frame of before) {
            await expect(picker.locator(`a[href="#${frame.id}"]`)).toHaveAccessibleName(frame.label);
          }
          for (const link of await picker.locator("a").all()) await expectHorizontalFitAndTapSize(link, width);

          const captureIndex = project.gallery.findIndex((view, index) => index > 0 &&
            !/product artwork|promotional artwork/i.test(view.caption));
          expect(captureIndex).toBeGreaterThan(0);
          const target = page.locator(`#project-view-${captureIndex}`);
          await picker.locator(`a[href="#project-view-${captureIndex}"]`).focus();
          await page.keyboard.press("Enter");
          await expect(page).toHaveURL(new RegExp(`#project-view-${captureIndex}$`));
          await expect(target).toBeFocused();
          await expect(target).toBeInViewport({ ratio: 0.01 });
          await page.keyboard.press("Tab");
          await expect(target.getByRole("link", { name: "Open full-size image", exact: false })).toBeFocused();

          await picker.locator('a[href="#project-cover"]').focus();
          await page.keyboard.press("Enter");
          await expect(page).toHaveURL(/#project-cover$/);
          await expect(page.locator("#project-cover")).toBeFocused();
          expect(await gallerySnapshot(page), "Caption navigation preserves every original image and caption").toEqual(before);
          await expect(page.locator(".project-page-frame img").first()).toHaveCSS("filter", "none");
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        }
      });
    }
  });
}
