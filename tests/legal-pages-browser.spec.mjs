import { test, expect } from "@playwright/test";
import { bookingURL } from "../booking.js";
import { clientCare } from "../client-care.js";
import { launchOfferPaymentTerms, launchOfferContentChangeTerms } from "../seo-offer.js";

const policies = [
  { path: "/privacy/", label: "Privacy policy" },
  { path: "/terms/", label: "Website terms" },
  { path: "/guarantee/", label: "Guarantee, refunds & support" },
];

async function expectTapTarget(link, width) {
  const box = await link.boundingBox();
  expect(box.width, "Policy links have a usable tap width").toBeGreaterThanOrEqual(44);
  expect(box.height, "Policy links have a usable tap height").toBeGreaterThanOrEqual(44);
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
}

async function expectBooking(link) {
  await expect(link).toHaveAttribute("href", bookingURL);
  await expect(link).toHaveAttribute("data-booking-link", "");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /\bnoopener\b/);
  await expect(link).toHaveAttribute("rel", /\bnoreferrer\b/);
  await expect(link).toHaveAccessibleName(/^Book a consultation\b/);
}

for (const javaScriptEnabled of [true, false]) {
  test.describe(`public policy pages with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled, reducedMotion: "reduce" });

    for (const width of [320, 390, 1440]) {
      test(`policy text, native contents, and footer links work at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        for (const policy of policies) {
          await page.goto(policy.path);
          await page.evaluate(() => document.fonts.ready);
          const main = page.locator("main");
          await expect(main).toHaveCount(1);
          await expect(page.locator(".legal-page")).toHaveCount(1);
          await expect(page.getByRole("heading", { level: 1 })).toHaveText(`${policy.label}.`);
          await expect(main).toContainText("TaylorDrew4u LLC");
          await expect(page.locator(".planner-shortcut")).toHaveCount(0);
          await expect(main.locator("form, iframe, input, textarea, select")).toHaveCount(0);
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            `${policy.path}: the full document fits the viewport`).toBe(true);
          const paragraphs = await main.locator("section p").evaluateAll((elements) => elements.map((element) => {
            const style = getComputedStyle(element);
            return { fontSize: parseFloat(style.fontSize), lineHeight: parseFloat(style.lineHeight) };
          }));
          expect(paragraphs.length, "The policy text is rendered as readable paragraphs").toBeGreaterThan(0);
          for (const paragraph of paragraphs) {
            expect(paragraph.fontSize).toBeGreaterThanOrEqual(16);
            expect(paragraph.lineHeight / paragraph.fontSize).toBeGreaterThanOrEqual(1.4);
          }

          const menu = page.getByRole("button", { name: "Open navigation", exact: true });
          if (await menu.isVisible()) await menu.click();
          const navigation = page.getByRole("navigation", { name: "Main navigation", exact: true });
          await expect(navigation).toBeVisible();
          await expectBooking(navigation.locator("[data-booking-link]"));
          if (await menu.isVisible()) await page.keyboard.press("Escape");

          const contents = main.getByRole("navigation", { name: "On this page", exact: true });
          await expect(contents).toBeVisible();
          expect(await contents.getByRole("link").count()).toBeGreaterThan(1);
          for (const link of await contents.getByRole("link").all()) {
            const href = await link.getAttribute("href");
            expect(href).toMatch(/^#[\w-]+$/);
            await expect(link).toHaveAccessibleName(/\S/);
            await expectTapTarget(link, width);
            const section = main.locator(href);
            await expect(section).toHaveCount(1);
            await link.focus();
            await page.keyboard.press("Enter");
            expect(new URL(page.url()).hash).toBe(href);
            await expect(section.getByRole("heading", { level: 2 }).first()).toBeInViewport();
            await expect(section).toBeFocused();
          }

          const footer = page.locator("footer");
          const footerPolicies = footer.getByRole("navigation", { name: "Policies", exact: true });
          for (const destination of policies) {
            const link = footerPolicies.getByRole("link", { name: destination.label, exact: true });
            await link.focus();
            await expect(link).toBeInViewport({ ratio: 1 });
            await expectTapTarget(link, width);
            expect(new URL(await link.getAttribute("href"), page.url()).pathname).toBe(destination.path);
            expect(await link.getAttribute("target")).not.toBe("_blank");
            expect(await link.evaluate((element) => {
              const box = element.getBoundingClientRect();
              const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
              return hit === element || element.contains(hit);
            }), "A policy footer link can be tapped directly").toBe(true);
          }
          const operator = footer.locator(".legal-operator");
          await expect(operator).toBeVisible();
          await expect(operator).toContainText("4u Digital is operated by TaylorDrew4u LLC.");
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        }
      });
    }

    test("the guarantee page displays existing launch, refund, support, and offer promises unchanged", async ({ page }) => {
      await page.goto("/guarantee/");
      const main = page.locator("main");
      const text = (await main.innerText()).replace(/\s+/g, " ");
      for (const section of clientCare.sections) {
        await expect(main.locator(`#${section.id}`)).toContainText(section.text);
        expect(text.split(section.text).length - 1, `${section.id}: the complete promise appears once`).toBe(1);
      }
      for (const promise of [launchOfferPaymentTerms, launchOfferContentChangeTerms]) {
        expect(text.split(promise).length - 1, "The offer-specific promise remains intact").toBe(1);
      }
    });

    test("the homepage footer reaches every policy through an ordinary keyboard link", async ({ page }) => {
      for (const policy of policies) {
        await page.goto("/");
        const link = page.locator("footer").getByRole("link", { name: policy.label, exact: true });
        await link.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(new RegExp(`${policy.path}$`));
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(`${policy.label}.`);
      }
    });
  });
}
