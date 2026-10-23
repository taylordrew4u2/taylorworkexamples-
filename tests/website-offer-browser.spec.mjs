import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";
import { clientTestimonials } from "../content/client-testimonials.js";
import { clientCare } from "../client-care.js";
import { services } from "../seo-content.js";

const bookingURL = "https://briefbooth.com/book/4u-digital";
const website = projects.find((project) => project.id === "micro-short-website");
const testimonial = clientTestimonials.find((entry) => entry.id === "sarah-t");

async function followOfferLink(page, link) {
  await expect(link).toHaveAttribute("href", "./offer/");
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/offer\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

async function expectPageFits(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
    "The offer is readable without horizontal page scrolling").toBe(true);
}

async function expectClientCare(page) {
  const care = page.locator("#client-care");
  await expect(care.getByRole("heading", { level: 2 })).toHaveText(clientCare.heading);
  await expect(care.locator(".client-care-intro")).toHaveText(clientCare.intro);
  await expect(care.locator(".client-care-intro")).toContainText(/(?:every|all) projects?/i);
  await expect(care.locator(".client-care-grid > .client-care-card")).toHaveCount(clientCare.sections.length);
  for (const section of clientCare.sections) {
    const card = care.locator(`[data-client-care="${section.id}"]`);
    await expect(card.getByRole("heading", { level: 3 })).toHaveText(section.title);
    await expect(card.locator("p")).toHaveText(section.text);
  }
  await expect(care.locator('[data-client-care="guarantee"]')).toContainText(/30 days.*launch/i);
  await expect(care.locator('[data-client-care="guarantee"]')).toContainText(/completed product/i);
  await expect(care.locator('[data-client-care="guarantee"]')).toContainText(/full refund/i);
  await expect(care.locator('[data-client-care="changes"]')).toContainText(/30 days.*launch/i);
  await expect(care.locator('[data-client-care="changes"]')).toContainText(/reasonable changes.*included/i);
  const support = care.locator('[data-client-care="support"]');
  await expect(support).toContainText(/optional six-month/i);
  await expect(support).toContainText(/50% discount/i);
  await expect(support).toContainText(/agreed standard rate/i);
  await expect(support).not.toContainText(/\bfree\s+(?:debugging|support)\b/i);
  await expect(care.locator('[data-client-care="contract"]')).toContainText(/tailored.*specific needs/i);
  const email = new URL(await care.locator('a[href^="mailto:"]').getAttribute("href"));
  expect(email.pathname).toBe("admin@customtechbuilt4u.com");
}

for (const javaScriptEnabled of [true, false]) {
  test.describe(`website offer with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled });

    test("clients can find the offer from the homepage opening, navigation, services, and footer", async ({ page }) => {
      await page.goto("/");
      const heroOfferLink = page.locator(".intro").getByRole("link", { name: /^See the website offer\b/ });
      await expect(heroOfferLink).toBeVisible();
      const heroContrast = await heroOfferLink.evaluate((link) => {
        const channels = (value) => value.match(/[\d.]+/g).map(Number);
        const luminance = (color) => color.map((channel) => {
          const value = channel / 255;
          return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
        }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
        return [["offer link", link], ["supporting paragraph", link.closest(".hero-website-offer")]]
          .map(([label, element]) => {
            const layers = [];
            for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
              const color = channels(getComputedStyle(ancestor).backgroundColor);
              const alpha = color[3] ?? 1;
              if (alpha > 0) layers.push(color);
              if (alpha === 1) break;
            }
            // Composite any translucent ancestor over the next real background.
            const background = layers.reverse().reduce((below, color) => color.slice(0, 3)
              .map((channel, index) => channel * (color[3] ?? 1) + below[index] * (1 - (color[3] ?? 1))), [255, 255, 255]);
            const foreground = channels(getComputedStyle(element).color);
            const paintedText = foreground.slice(0, 3).map((channel, index) =>
              channel * (foreground[3] ?? 1) + background[index] * (1 - (foreground[3] ?? 1)));
            const light = luminance(paintedText);
            const dark = luminance(background);
            return { label, foreground: foreground.slice(0, 3), background,
              ratio: (Math.max(light, dark) + .05) / (Math.min(light, dark) + .05) };
          });
      });
      for (const contrast of heroContrast) {
        expect(contrast.ratio,
          `Hero ${contrast.label}: rgb(${contrast.foreground}) on rgb(${contrast.background}) remains readable`)
          .toBeGreaterThanOrEqual(4.5);
      }
      const careLink = page.locator('.intro a[href="#client-care"]');
      await expect(careLink).toBeVisible();
      await careLink.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/#client-care$/);
      await expectClientCare(page);
      await expect(page.locator("#client-care-title")).toBeInViewport();
      await followOfferLink(page, heroOfferLink);

      await page.goto("/");
      const menu = page.locator(".menu-toggle");
      if (javaScriptEnabled && await menu.isVisible()) {
        await menu.click();
        await expect(menu).toHaveAttribute("aria-expanded", "true");
      }
      const navigation = page.getByRole("navigation", { name: "Main navigation", exact: true });
      await expect(navigation).toBeVisible();
      await expectPageFits(page);
      await followOfferLink(page, navigation.getByRole("link", { name: "Website offer", exact: true }));

      await page.goto("/");
      const panel = page.locator("#website-offer");
      await expect(panel.getByRole("heading", { level: 2 })).toBeVisible();
      await expect(panel).toContainText("$1,200");
      await expect(panel).toContainText("$1,900");
      expect(await panel.evaluate((element) => {
        const services = document.querySelector("#services");
        const work = document.querySelector("#work");
        return Boolean(services.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) &&
          Boolean(element.compareDocumentPosition(work) & Node.DOCUMENT_POSITION_FOLLOWING);
      }), "The offer follows the services and precedes the project portfolio").toBe(true);
      await expect(panel.locator("form, iframe, input[type='date'], input[type='time']")).toHaveCount(0);
      await panel.locator('a[href="#client-care"]').click();
      await expect(page).toHaveURL(/\/#client-care$/);
      await expect(page.locator("#client-care-title")).toBeInViewport();
      await followOfferLink(page, panel.getByRole("link", { name: "Explore the website offer", exact: true }));

      await page.goto("/");
      await followOfferLink(page, page.locator('#services [data-service="website"] a[href="./offer/"]').first());

      await page.goto("/");
      await followOfferLink(page, page.locator("footer").getByRole("link", { name: "Website offer", exact: true }));
    });

    test("the offer shows genuine work and attributed feedback and hands booking to BriefBooth", async ({ page }) => {
      await page.goto("/offer/");
      const main = page.locator("main");
      await expect(main).toContainText("$1,200");
      await expect(main).toContainText("$1,900");
      await expect(main).toContainText(/(?:three|3) months of content changes after launch/i);
      await expect(main).toContainText(/first design review.*before any code is written.*deposit comes back/i);
      await expect(main.locator("form, iframe, input[type='date'], input[type='time'], input[type='datetime-local']")).toHaveCount(0);
      await expectClientCare(page);

      const proof = page.locator("#offer-proof");
      await expect(proof.getByRole("heading", { level: 2 })).toBeVisible();
      await expect(proof).toContainText(/personal website project.*separate client engagement/i);
      const example = proof.locator(".offer-project-example");
      const image = example.locator("img").first();
      await expect(image).toHaveAttribute("width", "1600");
      await expect(image).toHaveAttribute("height", "1000");
      await expect(image).toHaveAttribute("alt", website.imageAlt);
      expect(new URL(await image.getAttribute("src"), page.url()).pathname).toBe("/assets/micro-short/home.jpg");
      await expect(example.locator('a[href$="work/micro-short-film-website/"]').first()).toBeVisible();
      await expect(proof.locator(".offer-image-context")).toContainText("Repository website capture");

      const feedback = proof.locator(`#testimonial-${testimonial.id}`);
      await expect(feedback.locator("blockquote")).toHaveText(testimonial.quote);
      for (const credit of [testimonial.name, testimonial.role, testimonial.location]) {
        await expect(feedback.locator("figcaption")).toContainText(credit);
      }
      await expect(proof.locator('a[href="../#testimonials"]')).toBeVisible();

      const bookingLinks = main.locator("[data-booking-link]");
      await expect(bookingLinks).not.toHaveCount(0);
      for (const link of await bookingLinks.all()) {
        await expect(link).toHaveAttribute("href", bookingURL);
        await expect(link).toHaveAttribute("target", "_blank");
        await expect(link).toHaveAttribute("rel", /\bnoopener\b/);
        await expect(link).toHaveAttribute("rel", /\bnoreferrer\b/);
        await expect(link).toContainText("Book a consultation");
      }

      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await image.scrollIntoViewIfNeeded();
        await expect(image).toBeVisible();
        await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
        await expect(image).toHaveCSS("filter", "none");
        await expect(image).toHaveCSS("mix-blend-mode", "normal");
        expect(await image.evaluate((element) => {
          const box = element.getBoundingClientRect();
          const ratio = Number(element.getAttribute("width")) / Number(element.getAttribute("height"));
          return box.width > 0 && box.left >= -1 && box.right <= innerWidth + 1 &&
            Math.abs(box.width - box.height * ratio) <= 2 &&
            Math.abs(element.naturalWidth - element.naturalHeight * ratio) <= 2;
        }), "The real project image fits the phone without stretching or cropping").toBe(true);
        await expectPageFits(page);
      }

      // Keep the scheduler handoff local: this test never requests a real appointment.
      await page.context().route(bookingURL, (route) => route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<!doctype html><title>Booking handoff test</title><h1>Booking handoff test</h1>",
      }));
      const originalURL = page.url();
      await bookingLinks.first().focus();
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
    });

    test("every development service explains the same launch guarantee and optional contracted support", async ({ page }) => {
      expect(services).toHaveLength(6);
      for (const service of services) {
        await page.goto(`/services/${service.slug}/`);
        await expectClientCare(page);
        await expect(page.locator("#client-care")).toContainText(clientCare.contract.text);
        await expectPageFits(page);
      }
    });
  });
}

test("local brand fonts load on homepage and nested pages when Google Fonts is unavailable", async ({ page }) => {
  const googleRequests = [];
  let fontResponses = [];
  page.on("request", (request) => {
    if (/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//.test(request.url())) googleRequests.push(request.url());
  });
  page.on("response", (response) => {
    if (/\/assets\/fonts\/[^/?]+\.woff2(?:\?|$)/.test(response.url())) {
      fontResponses.push({ url: response.url(), status: response.status() });
    }
  });
  await page.route(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//, (route) => route.abort());

  for (const path of ["/", "/offer/", "/services/website-development/"]) {
    fontResponses = [];
    await page.goto(path);
    const typography = await page.evaluate(async () => {
      await document.fonts.ready;
      const stylesheet = [...document.styleSheets].find((sheet) => sheet.href &&
        /\/static\/[a-f0-9]{16}\/styles\.css$/.test(new URL(sheet.href).pathname));
      const family = (value) => value.replace(/["']/g, "").trim();
      return {
        stylesheet: stylesheet?.href,
        faces: [...document.fonts].map((face) => ({ family: family(face.family), status: face.status })),
        declarations: stylesheet ? [...stylesheet.cssRules]
          .filter((rule) => rule.type === CSSRule.FONT_FACE_RULE)
          .map((rule) => {
            const source = rule.style.getPropertyValue("src").match(/url\(["']?([^"')]+)["']?\)/)?.[1];
            return { family: family(rule.style.getPropertyValue("font-family")),
              url: source ? new URL(source, stylesheet.href).href : null };
          }) : [],
        bodyFamily: getComputedStyle(document.body).fontFamily,
        headingFamily: getComputedStyle(document.querySelector("main h1")).fontFamily,
      };
    });
    expect(typography.stylesheet, `${path}: fonts are declared in the versioned production stylesheet`).toBeTruthy();
    expect(typography.bodyFamily).toContain("DM Sans");
    expect(typography.headingFamily).toContain("Manrope");
    expect([...new Set(typography.declarations.map((declaration) => declaration.family))].sort())
      .toEqual(["DM Sans", "Manrope"]);
    for (const declaration of typography.declarations) {
      const font = new URL(declaration.url);
      expect(font.origin).toBe(new URL(page.url()).origin);
      expect(font.pathname).toMatch(/^\/assets\/fonts\/(?:dm-sans|manrope)\.[a-f0-9]{16}\.woff2$/);
    }
    for (const [family, prefix] of [["DM Sans", "dm-sans"], ["Manrope", "manrope"]]) {
      expect(typography.faces.some((face) => face.family === family && face.status === "loaded"),
        `${path}: the actual ${family} face loads without Google Fonts`).toBe(true);
      const responses = fontResponses.filter((response) => new URL(response.url).pathname.startsWith(`/assets/fonts/${prefix}.`));
      expect(responses.length, `${path}: the browser receives local ${family} files`).toBeGreaterThan(0);
      for (const response of responses) {
        expect(response.status).toBe(200);
        expect(typography.declarations.some((declaration) => declaration.url === response.url),
          "Browser font requests resolve from the actual stylesheet base URL").toBe(true);
      }
    }
    expect(googleRequests, "Page rendering does not request the unavailable Google font hosts").toEqual([]);
    await expectPageFits(page);
  }

  // The delivery change also preserves the original gallery colors and controls.
  await page.goto("/#work");
  const binder = projects.find((project) => project.id === "The-Bit-Binder");
  const card = page.locator(`#featured-projects [data-case-id="${binder.id}"]`);
  await card.locator(".gallery-disclosure > summary").click();
  await card.locator("button[data-gallery]").nth(1).click();
  const image = card.locator(".primary-screen");
  await expect(image).toHaveAttribute("src", binder.gallery[1].image);
  await expect(image).toHaveCSS("filter", "none");
  await expect(image).toHaveCSS("mix-blend-mode", "normal");
  await expect(card.locator(".project-visual")).toHaveCSS("filter", "none");
  await expectPageFits(page);
  expect(googleRequests).toEqual([]);
});
