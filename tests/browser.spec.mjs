import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";
import { launchOffer } from "../seo-offer.js";

async function expectResponsiveImageSource(image, expected) {
  const source = await image.evaluate((element) => ({
    width: element.naturalWidth,
    height: element.naturalHeight,
    current: element.currentSrc,
    candidates: element.srcset.split(",").filter(Boolean).map((candidate) =>
      new URL(candidate.trim().split(/\s+/)[0], document.baseURI).href),
    sizes: element.sizes,
  }));
  expect(source.width).toBeGreaterThan(0);
  expect(source.height).toBeGreaterThan(0);
  const originalRatio = expected.width / expected.height;
  // Width-descriptor candidates expose density-corrected integer CSS dimensions.
  // One pixel of rounding per axis can exceed 1% on a narrow companion image.
  // Encoded candidate dimensions and proportions are checked separately in Node.
  expect(Math.abs(source.width - source.height * originalRatio),
    "Responsive intrinsic dimensions preserve proportions within per-axis pixel rounding")
    .toBeLessThanOrEqual(1 + originalRatio);
  if (source.candidates.length) {
    expect(source.sizes.trim(), "Responsive images declare their displayed size").not.toBe("");
    expect(source.candidates, "The browser loads an advertised image candidate").toContain(source.current);
    expect(new URL(source.current).pathname).toMatch(/\/assets\/optimized\//);
  } else {
    expect(source.width).toBe(expected.width);
    expect(source.height).toBe(expected.height);
  }
}

async function expectLoadedImageToFit(image, expected) {
  await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate((element) =>
    element.complete && element.naturalWidth > 0 && element.naturalHeight > 0,
  )).toBe(true);
  await expect(image).toHaveAttribute("src", expected.image);
  await expect(image).toHaveAttribute("alt", expected.imageAlt);
  await expect(image).toHaveAttribute("width", String(expected.width));
  await expect(image).toHaveAttribute("height", String(expected.height));
  await expect(image).toHaveCSS("filter", "none");
  await expect(image).toHaveCSS("mix-blend-mode", "normal");
  await expect(image).toHaveCSS("opacity", "1");
  const geometry = await image.evaluate((element) => {
    const frame = element.closest(".dialog-preview");
    const imageBox = element.getBoundingClientRect();
    const frameBox = frame.getBoundingClientRect();
    return {
      naturalWidth: element.naturalWidth,
      naturalHeight: element.naturalHeight,
      fit: getComputedStyle(element).objectFit,
      frameFilter: getComputedStyle(frame).filter,
      width: imageBox.width,
      height: imageBox.height,
      inside: imageBox.left >= frameBox.left - 1 &&
        imageBox.right <= frameBox.right + 1 &&
        imageBox.top >= frameBox.top - 1 &&
        imageBox.bottom <= frameBox.bottom + 1,
    };
  });
  await expectResponsiveImageSource(image, expected);
  expect(geometry.fit).toBe("contain");
  expect(geometry.frameFilter, "The preview preserves the source image colors").toBe("none");
  expect(geometry.width).toBeGreaterThan(0);
  expect(geometry.height).toBeGreaterThan(0);
  expect(geometry.inside, `${expected.image} fits its preview frame`).toBe(true);
  expect(await image.page().evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth,
  )).toBe(true);
}

async function expectProjectIcon(scope, project, frameSelector = ".project-identity .project-icon-frame") {
  const frame = scope.locator(frameSelector);
  await expect(frame).toHaveCount(1);
  await expect(frame).toBeVisible();
  await expect(frame).toHaveAttribute("aria-hidden", "true");
  await expect(frame).toHaveCSS("filter", "none");
  const icon = frame.locator("img.project-icon");
  if (!project.icon) {
    await expect(icon).toHaveCount(0);
    await expect(frame.locator(".project-initials")).toHaveText(project.iconFallback);
    const color = await frame.locator(".project-initials").evaluate((element) => getComputedStyle(element).color);
    const channels = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    expect(channels, "Fallback initials use a neutral color").not.toBeNull();
    expect(new Set(channels.slice(1).map(Number)).size).toBe(1);
    return;
  }
  await expect(icon).toHaveCount(1);
  await expect(frame.locator(".project-initials")).toHaveCount(0);
  await icon.scrollIntoViewIfNeeded();
  await expect.poll(() => icon.evaluate((element) =>
    element.complete && element.naturalWidth > 0 && element.naturalHeight > 0,
  )).toBe(true);
  await expect(icon).toHaveAttribute("src", project.icon);
  await expect(icon).toHaveAttribute("alt", "");
  await expect(icon).toHaveAttribute("width", String(project.iconWidth));
  await expect(icon).toHaveAttribute("height", String(project.iconHeight));
  await expect(icon).toHaveCSS("object-fit", "contain");
  await expect(icon).toHaveCSS("filter", "none");
  const geometry = await icon.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const frameBox = element.closest(".project-icon-frame").getBoundingClientRect();
    return {
      width: box.width,
      height: box.height,
      naturalWidth: element.naturalWidth,
      naturalHeight: element.naturalHeight,
      inside: box.left >= frameBox.left - 1 && box.right <= frameBox.right + 1 &&
        box.top >= frameBox.top - 1 && box.bottom <= frameBox.bottom + 1,
    };
  });
  expect(geometry.width).toBeGreaterThan(0);
  expect(geometry.height).toBeGreaterThan(0);
  expect(geometry.inside, `${project.title}: complete icon fits its frame`).toBe(true);
  if (project.icon.endsWith(".png")) {
    expect(geometry.naturalWidth).toBe(project.iconWidth);
    expect(geometry.naturalHeight).toBe(project.iconHeight);
  }
}

async function expectProjectWorkflows(scope, project) {
  const workflows = scope.getByRole("list", { name: `What ${project.title} does`, exact: true });
  await expect(workflows).toBeVisible();
  await expect(workflows.locator("li")).toHaveText(project.workflows);
  for (const workflow of await workflows.locator("li").all()) {
    await expect(workflow).toBeVisible();
  }
}

const heroPreviews = [
  ["The-Bit-Binder", "View the BitBinder project"],
  ["MyGigCalendar", "View the My Gig Calendar project"],
];

const heroPlatformPreviews = [
  ["BriefBooth.com", "briefbooth", "Web app BriefBooth", /Live website capture/i, /BriefBooth.*(?:booking|consultation|homepage)/i],
  ["micro-short-website", "website", "Website Micro-short", /Repository website capture/i, /Micro-short.*(?:film|website).*home/i],
  ["usbmic", "desktop", "Desktop SobStage", /Release candidate/i, /SobStage.*repository product artwork.*microphone.*recording/i],
];

async function selectHeroProject(page, value) {
  const radio = page.locator(`.hero-explorer-options input[name="hero-project"][value="${value}"]`);
  await page.locator(`.hero-project-choice:has(input[name="hero-project"][value="${value}"])`).click();
  await expect(radio).toBeChecked();
  return radio;
}

async function expectHeroPreview(page) {
  const stage = page.locator(".hero-stage");
  const appPreviews = stage.locator(".hero-app-previews");
  await expect(stage).toHaveAttribute("aria-label", "Featured websites, desktop software, and iPhone apps");
  await expect(appPreviews).toHaveCount(1);
  await expect(stage.locator("button.hero-project")).toHaveCount(2);
  expect(await stage.locator("button.hero-project").evaluateAll((buttons) =>
    buttons.map((button) => button.dataset.project),
  )).toEqual(heroPreviews.map(([id]) => id));
  await expect(stage.locator("img.hero-project-screen")).toHaveCount(2);
  await expect(appPreviews.locator("img")).toHaveCount(2);
  await expect(stage.locator("img.hero-choice-screen")).toHaveCount(3);
  await expect(stage.locator(
    ".hero-web, .hero-phone, .hero-orbit, .hero-asterisk, .hero-project-info, .hero-project-icon, .hero-project-copy, .hero-project-arrow",
  )).toHaveCount(0);
  expect(await appPreviews.locator(".hero-project").evaluateAll((buttons) =>
    buttons.every((button) => button.innerText.trim() === "")),
  "The supplied app artwork has no added visible text inside its controls").toBe(true);
  await expect(stage).toHaveCSS("filter", "none");
  for (const [id, label] of heroPreviews) {
    const project = projects.find((entry) => entry.id === id);
    const trigger = stage.getByRole("button", { name: label, exact: true });
    const image = trigger.locator("img.hero-project-screen");
    await expect(trigger).toHaveAttribute("data-project", project.id);
    await expect(image).toHaveCount(1);
    expect(await trigger.evaluate((element) => element.children.length === 1 &&
      element.firstElementChild.matches("img.hero-project-screen")),
    `${project.title}: the banner is the only content inside its control`).toBe(true);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
    await expect(image).toHaveAttribute("src", project.image);
    await expect(image).toHaveAttribute("alt", project.imageAlt);
    await expect(image).toHaveAttribute("width", "1920");
    await expect(image).toHaveAttribute("height", "1080");
    await expect(image).toHaveAttribute("srcset", /\S/);
    await expect(image).toHaveAttribute("sizes", /\S/);
    await expect(image).toHaveCSS("object-fit", "contain");
    await expect(image).toHaveCSS("filter", "none");
    await expect(image).toHaveCSS("mix-blend-mode", "normal");
    await expect(image).toHaveCSS("opacity", "1");
    await expect(image).toHaveCSS("transform", "none");
    await expect(trigger).toHaveCSS("transform", "none");
    await expect(trigger).toHaveCSS("filter", "none");
    const geometry = await trigger.evaluate((element) => {
      const button = element.getBoundingClientRect();
      const screen = element.querySelector(".hero-project-screen");
      const screenBox = screen.getBoundingClientRect();
      return {
        naturalWidth: screen.naturalWidth,
        naturalHeight: screen.naturalHeight,
        aspectError: Math.abs(screenBox.height - screenBox.width * 1080 / 1920),
        wholeScreenInside: screenBox.width > 0 && screenBox.height > 0 &&
          screenBox.left >= button.left - 1 && screenBox.right <= button.right + 1 &&
          screenBox.top >= button.top - 1 && screenBox.bottom <= button.bottom + 1,
        fitsViewport: button.left >= -1 && button.right <= window.innerWidth + 1 &&
          document.documentElement.scrollWidth <= window.innerWidth,
      };
    });
    await expectResponsiveImageSource(image, { width: 1920, height: 1080 });
    expect(geometry.aspectError, `${project.title}: the banner keeps its original upright proportions`).toBeLessThanOrEqual(1);
    expect(geometry.wholeScreenInside, `${project.title}: the complete banner fits its control`).toBe(true);
    expect(geometry.fitsViewport, `${project.title}: the banner fits the viewport`).toBe(true);
  }
  expect(await stage.locator(".hero-project").evaluateAll((buttons) => {
    const first = buttons[0].getBoundingClientRect();
    const second = buttons[1].getBoundingClientRect();
    return second.top >= first.bottom - 1;
  }), "Both opening banners remain separate without overlap").toBe(true);
  const platforms = stage.locator(".hero-platform-previews");
  const explorer = platforms.getByRole("group", { name: "Explore a real build.", exact: true });
  await expect(explorer).toHaveClass(/\bhero-explorer\b/);
  await expect(explorer.getByRole("radio")).toHaveCount(3);
  await expect(platforms.locator("a.hero-platform-project")).toHaveCount(3);
  for (const [id, value, label, status, imageDescription] of heroPlatformPreviews) {
    const project = projects.find((entry) => entry.id === id);
    const frame = project.gallery[0];
    const radio = explorer.getByRole("radio", { name: label, exact: true });
    await expect(radio).toHaveAttribute("type", "radio");
    await expect(radio).toHaveAttribute("name", "hero-project");
    await expect(radio).toHaveAttribute("value", value);
    await expect(radio).toHaveAttribute("aria-controls", `hero-${value}`);
    const choice = explorer.locator(`.hero-project-choice:has(input[value="${value}"])`);
    const thumbnail = choice.locator("img.hero-choice-screen");
    await expect(thumbnail).toHaveAttribute("src", frame.image);
    await expect(thumbnail).toHaveAttribute("alt", "");
    await expect(thumbnail).toHaveCSS("filter", "none");
    await choice.click();
    await expect(radio).toBeChecked();
    await expect(explorer.locator('input[type="radio"]:checked')).toHaveCount(1);
    const link = platforms.locator(`a.hero-platform-project[href="${project.caseUrl}"]`);
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute("id", `hero-${value}`);
    await expect(link).toHaveAttribute("data-hero-panel", value);
    await expect(link).toBeVisible();
    await expect(platforms.locator("a.hero-platform-project:visible")).toHaveCount(1);
    const image = link.locator("img.hero-platform-screen");
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
    await expect(image).toHaveAttribute("src", frame.image);
    await expect(image).toHaveAttribute("alt", imageDescription);
    await expect(image).toHaveAttribute("width", String(frame.width));
    await expect(image).toHaveAttribute("height", String(frame.height));
    await expect(image).toHaveAttribute("srcset", /\S/);
    await expect(image).toHaveAttribute("sizes", /\S/);
    await expect(image).toHaveCSS("object-fit", "contain");
    await expect(image).toHaveCSS("filter", "none");
    await expect(image).toHaveCSS("mix-blend-mode", "normal");
    await expect(image).toHaveCSS("opacity", "1");
    await expect(link).toHaveCSS("filter", "none");
    const caption = link.locator(".hero-platform-caption");
    await expect(caption.locator(".hero-project-link")).toBeVisible();
    await expect(caption.locator(".hero-project-link")).toContainText("View project");
    await expect(caption).toContainText(project.title);
    await expect(caption).toContainText(status);
    if (value === "desktop") {
      await expect(caption).toContainText(/repository product artwork/i);
      await expect(caption).toContainText(/physical.*microphone.*(?:pending|progress)/i);
    }
    await expectProjectIcon(caption, project, ".project-icon-frame");
    const geometry = await link.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const screen = element.querySelector(".hero-platform-screen");
      const imageBox = screen.getBoundingClientRect();
      const captionBox = element.querySelector(".hero-platform-caption").getBoundingClientRect();
      return {
        naturalWidth: screen.naturalWidth,
        naturalHeight: screen.naturalHeight,
        completeInside: imageBox.width > 0 && imageBox.height > 0 &&
          imageBox.left >= box.left - 1 && imageBox.right <= box.right + 1 &&
          imageBox.top >= box.top - 1 && imageBox.bottom <= box.bottom + 1,
        captionBelow: captionBox.top >= imageBox.bottom - 1,
        fitsViewport: box.left >= -1 && box.right <= window.innerWidth + 1,
      };
    });
    await expectResponsiveImageSource(image, frame);
    expect(geometry.completeInside, `${project.title}: the complete original fits its card`).toBe(true);
    expect(geometry.captionBelow, `${project.title}: its caption sits below the image without an overlay`).toBe(true);
    expect(geometry.fitsViewport, `${project.title}: its preview fits the viewport`).toBe(true);
  }
  expect(await platforms.evaluate((element) => {
    const platformBox = element.getBoundingClientRect();
    const appBox = document.querySelector(".hero-app-previews").getBoundingClientRect();
    return window.innerWidth > 600 || platformBox.bottom <= appBox.top + 1;
  }), "On smaller screens the selected platform preview appears above both upright app banners").toBe(true);
}

test("portfolio renders, previews load, and the page fits the viewport", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle("Custom App, Website & Software Development | 4u Digital");
  await expect(page.getByRole("banner").getByRole("link", { name: "4u Digital, home", exact: true })).toBeVisible();
  for (const area of ["#consultation", "#contact"]) {
    const brand = page.locator(area).getByRole("link", { name: "4u Digital, home", exact: true });
    await expect(brand).toBeVisible();
    await expect(brand.locator("img")).toHaveAttribute("src", "./assets/4u-digital-logo-mono.png");
  }
  const headline = page.getByRole("heading", { level: 1 });
  await expect(headline).toHaveText("You know your business. I’ll build the technology.");
  await expect(headline).toBeVisible();
  await expect(page.locator(".hero-tagline")).toHaveText("Custom tech build for you.");
  await expect(page.locator(".hero-tagline")).toBeVisible();
  await expect(page.locator(".intro-descriptor")).toHaveText("Apps, websites, and software for your business.");
  await expect(page.locator(".intro-descriptor")).toBeVisible();
  const openingSummary = page.locator(".intro-summary");
  await expect(openingSummary.locator(".intro-description")).toHaveText(
    "Work directly with the developer designing, coding, and launching your website, app, or software.",
  );
  await expect(openingSummary.locator(".intro-description")).toBeVisible();
  expect(await openingSummary.evaluate((element) => Boolean(
    element.querySelector(".intro-description").compareDocumentPosition(element.querySelector(".intro-actions")) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  )), "The direct-developer explanation appears before the opening actions").toBe(true);
  await expect(page.locator(".hero-opening-notes, .hero-capabilities")).toHaveCount(0);
  await expect(page.locator(".intro-actions > a")).toHaveCount(2);
  await expect(page.locator(".intro-actions").getByRole("link", { name: "View all projects", exact: false }))
    .toHaveAttribute("href", "./work/");
  await expect(page.locator(".footer-identity")).toContainText("4u Digital");
  await expect(page.locator(".owner-credit")).toHaveCount(0);
  expect(await headline.evaluate((element) => {
    const headlineBox = element.getBoundingClientRect();
    const copy = element.closest(".intro-copy");
    const headingBox = element.closest(".intro-heading").getBoundingClientRect();
    const descriptorBox = copy.querySelector(".intro-descriptor").getBoundingClientRect();
    const content = document.createRange();
    content.selectNodeContents(element);
    const descriptorBelow = descriptorBox.top >= headlineBox.bottom - 1;
    const descriptorBeside = window.innerWidth > 900 && descriptorBox.left >= headingBox.right - 1;
    return (descriptorBelow || descriptorBeside) && [...content.getClientRects()].every((box) =>
      box.left >= headingBox.left - 1 && box.right <= headingBox.right + 1,
    );
  }), "The headline stays inside its heading column, with the descriptor beside it on desktop or below on phones").toBe(true);
  await expect(page.locator(".project-card, .archive-card, #featured-projects, #project-archive")).toHaveCount(0);
  await expect(page.locator("#work").getByRole("link", { name: "View all projects", exact: false }))
    .toHaveAttribute("href", "./work/");
  await expect(page.locator(".hero-stage .hero-project-screen")).toHaveCount(2);
  await expect(page.locator(".hero-stage .hero-project-icon")).toHaveCount(0);
  await expect(page.locator(".hero-app-previews img")).toHaveCount(2);
  await expect(page.locator(".hero-platform-previews .hero-platform-screen")).toHaveCount(3);
  for (const image of await page.locator(".hero-stage img").all()) {
    const panel = await image.evaluate((element) => element.closest("[data-hero-panel]")?.dataset.heroPanel);
    if (panel) await selectHeroProject(page, panel);
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate(
          (element) => element.complete && element.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  for (const [id] of heroPreviews) {
    await expect(page.locator(`.hero-project[data-project="${id}"] .hero-project-screen`)).toHaveAttribute(
      "src", projects.find((entry) => entry.id === id).image,
    );
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: testInfo.outputPath(`portfolio-${testInfo.project.name}.png`),
    fullPage: true,
  });
  await page.screenshot({
    path: testInfo.outputPath(`portfolio-${testInfo.project.name}-intro.png`),
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
});

test("the hero explorer follows native radio controls and opens only the chosen project", async ({ page }) => {
  await page.clock.install();
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");
  const explorer = page.getByRole("group", { name: "Explore a real build.", exact: true });
  const webApp = explorer.getByRole("radio", { name: "Web app BriefBooth", exact: true });
  const website = explorer.getByRole("radio", { name: "Website Micro-short", exact: true });
  const desktop = explorer.getByRole("radio", { name: "Desktop SobStage", exact: true });
  const panels = page.locator(".hero-platform-panels .hero-platform-project");
  const visiblePanel = page.locator(".hero-platform-panels .hero-platform-project:visible");
  await expect(panels).toHaveCount(3);
  await expect(webApp).toBeChecked();
  await expect(visiblePanel).toHaveAttribute("data-hero-panel", "briefbooth");

  for (const [id, value, name] of heroPlatformPreviews) {
    const radio = await selectHeroProject(page, value);
    await expect(radio).toHaveAccessibleName(name);
    await expect(radio).toBeFocused();
    const panel = page.locator(`.hero-platform-project[data-hero-panel="${value}"]`);
    await expect(visiblePanel).toHaveCount(1);
    await expect(panel).toBeVisible();
    await expect(panel.locator(".hero-platform-caption")).toContainText(projects.find((project) => project.id === id).title);
  }

  await webApp.focus();
  await page.keyboard.press("Space");
  await expect(webApp).toBeChecked();
  await expect(webApp).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(website).toBeChecked();
  await expect(website).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(desktop).toBeChecked();
  await expect(desktop).toBeFocused();
  await page.clock.fastForward("05:00");
  await expect(desktop).toBeChecked();
  await expect(desktop).toBeFocused();
  await expect(visiblePanel).toHaveAttribute("data-hero-panel", "desktop");
  await page.keyboard.press("ArrowRight");
  await expect(webApp).toBeChecked();
  await expect(webApp).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(desktop).toBeChecked();
  await expect(desktop).toBeFocused();
  await expect(page.locator(".hero-app-previews .hero-project")).toHaveCount(2);
  for (const banner of await page.locator(".hero-app-previews .hero-project").all()) await expect(banner).toBeVisible();
  await expect(page.locator(".mobile-consultation [data-booking-link]")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    "The explorer and native radio controls fit a 320px phone").toBe(true);

  for (const [id, value] of heroPlatformPreviews) {
    await page.goto("/");
    await selectHeroProject(page, value);
    const project = projects.find((entry) => entry.id === id);
    const link = page.locator(`.hero-platform-project[data-hero-panel="${value}"]`);
    await expect(link).toHaveAttribute("href", project.caseUrl);
    const destination = new URL(project.caseUrl, page.url()).href;
    await link.click();
    await expect(page).toHaveURL(destination);
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(project.title);
  }
});

test("the opening banners stay complete and separate, and each opens its matching project", async ({ page }) => {
  await page.goto("/");
  await expectHeroPreview(page);
  const dialog = page.getByRole("dialog");
  for (const [id, label] of heroPreviews) {
    const project = projects.find((entry) => entry.id === id);
    const trigger = page.getByRole("button", { name: label, exact: true });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(project.title);
    await expect(dialog.getByRole("button", { name: "Close project details" })).toBeFocused();
    await expect(dialog.locator(".primary-screen")).toHaveAttribute("src", project.image);
    await expect(dialog.locator(".dialog-image-caption")).toHaveText(project.gallery[0].caption);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.locator(".hero-project-screen").click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(project.title);
    await expect(dialog.getByRole("button", { name: "Close project details" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  }
});

test("the homepage gives clients clear next steps and sends the full portfolio to its own page", async ({ page }, testInfo) => {
  await page.goto("/");
  const menu = page.locator(".menu-toggle");
  if (testInfo.project.name === "phone") await menu.click();
  const offerLink = page.locator("#main-nav").getByRole("link", { name: "Website offer", exact: true });
  await expect(offerLink).toBeVisible();
  await expect(offerLink).toHaveAttribute("href", "./offer/");
  await expect(page.locator("#main-nav a[href*='github.com']")).toHaveCount(0);
  await expect(page.locator("footer a[href='https://github.com/taylordrew4u2']")).toBeVisible();
  await expect(page.locator(".intro-actions").getByRole("link", { name: "Book a consultation", exact: false }))
    .toHaveAttribute("href", "https://briefbooth.com/book/4u-digital");
  await expect(page.locator("#main-nav .nav-contact")).toHaveAttribute("href", "https://briefbooth.com/book/4u-digital");
  await offerLink.click();
  await expect(page).toHaveURL(/\/offer\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(launchOffer.heading);
  await page.goto("/#process");
  if (testInfo.project.name === "phone") {
    await menu.click();
    await page.locator("#main-nav a[href='#services']").click();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await page.goto("/#process");
  }
  await expect(page).toHaveURL(/#process$/);
  await expect(page.locator("#process").getByRole("heading", { level: 2 })).toHaveText("One developer. From idea to launch.");
  expect(await page.locator("#project-faq").evaluate((faq) => Boolean(
    document.querySelector("#process").compareDocumentPosition(faq) & Node.DOCUMENT_POSITION_FOLLOWING,
  ) && Boolean(faq.compareDocumentPosition(document.querySelector("#consultation")) & Node.DOCUMENT_POSITION_FOLLOWING)),
  "Clients see the process and answers before the booking section").toBe(true);

  const comparison = page.locator("details.service-comparison");
  await expect(comparison).not.toHaveAttribute("open", "");
  await expect(comparison.locator(".service-discovery")).toBeHidden();
  await expect(page.locator("#services .industry-services")).toBeVisible();
  await comparison.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(comparison.locator(".service-discovery")).toBeVisible();
  await expect(comparison.getByRole("navigation", { name: "Development services", exact: true }).locator("a")).toHaveCount(4);
  await comparison.locator("summary").focus();
  await page.keyboard.press("Space");
  await expect(comparison).not.toHaveAttribute("open", "");

  const work = page.locator("#work");
  await expect(work.locator(".project-card, .archive-card, .gallery-disclosure, input")).toHaveCount(0);
  await expect(work).toContainText("selected personal projects");
  const projectsLink = work.getByRole("link", { name: "View all projects", exact: false });
  await expect(projectsLink).toHaveAttribute("href", "./work/");
  await projectsLink.click();
  await expect(page).toHaveURL(/\/work\/$/);
  await expect(page.locator(".work-page-grid .seo-project-card")).toHaveCount(projects.length);
});

test("BriefBooth is featured as a real product and opens its own story without starting a booking", async ({ page }) => {
  const project = projects.find((entry) => entry.id === "BriefBooth.com");
  await page.goto("/");
  await selectHeroProject(page, "briefbooth");
  const opening = page.locator(`.hero-platform-project[href="${project.caseUrl}"]`);
  await expect(opening).toHaveCount(1);
  await expect(opening.locator(".hero-platform-caption")).toContainText("BriefBooth");
  await expect(opening.locator(".hero-platform-screen")).toHaveAttribute("src", project.image);
  await opening.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/work\/briefbooth\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "BriefBooth", exact: true })).toBeVisible();
  await expect(page.locator(".project-page-frame")).toHaveCount(3);
  await expect(page.locator(".project-workflow-card h3")).toHaveText(project.workflows);
  await expect(page.locator("main").getByRole("link", { name: "Project repository", exact: false }).first())
    .toHaveAttribute("href", project.repoUrl);
  await expect(page.locator("main").getByRole("link", { name: /source code/i })).toHaveCount(0);
  await expect(page.locator("main input[type='date'], main input[type='time'], main iframe")).toHaveCount(0);
  const booking = page.locator(".project-story-hero [data-booking-link]");
  await expect(booking).toHaveAttribute("href", "https://briefbooth.com/book/4u-digital");
  await expect(booking).toHaveAttribute("target", "_blank");
});

test("services lead to relevant project proof and restore keyboard focus", async ({ page }) => {
  await page.goto("/");
  const services = page.locator("#services");
  await expect(services).toBeVisible();
  expect(await services.evaluate((element) => Boolean(
    element.compareDocumentPosition(document.querySelector("#work")) & Node.DOCUMENT_POSITION_FOLLOWING,
  )), "Services precede the selected work").toBe(true);
  await expect(services.locator("article.service-item")).toHaveCount(4);
  const customSoftware = services.locator('article.service-item[data-service="custom-software"]');
  await expect(customSoftware.getByRole("heading", { level: 3 })).toHaveText("I need custom software.");
  await expect(customSoftware.locator("button[data-project], details.service-example")).toHaveCount(0);
  await expect(customSoftware.locator('a[href="./services/custom-software-development/"]')).toHaveCount(1);
  await expect(customSoftware.locator('a[href="./work/sobstage/"]')).toHaveCount(1);

  const examples = [
    ["website", "micro-short-website", "See Micro-short film website project"],
    ["web-app", "BriefBooth.com", "See BriefBooth booking platform project"],
    ["software", "MyGigCalendar", "See My Gig Calendar app project"],
  ];
  const dialog = page.getByRole("dialog");
  for (const [service, id, name] of examples) {
    const item = services.locator(`article.service-item[data-service="${service}"]`);
    const project = projects.find((entry) => entry.id === id);
    const trigger = item.getByRole("button", { name, exact: true });
    await expect(trigger).toHaveClass(/service-proof/);
    await expect(trigger).toHaveAttribute("data-project", project.id);
    const serviceSlugs = { website: "website-development", "web-app": "web-app-development", software: "app-development" };
    expect(new URL(await item.locator(`.service-inquiry[href="./services/${serviceSlugs[service]}/"]`).getAttribute("href"), page.url()).pathname)
      .toBe(`/services/${serviceSlugs[service]}/`);
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(project.title);
    await expect(dialog.getByRole("button", { name: "Close project details" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  }
});

test("the process and native FAQs explain scope and work with the keyboard", async ({ page }) => {
  await page.goto("/");
  const process = page.locator("ol.process-steps");
  await expect(process).toBeVisible();
  await expect(process.locator("li")).toHaveCount(3);
  await expect(process.locator("li h3")).toHaveText([
    "Make a clear plan.",
    "Build it together.",
    "Launch with ownership.",
  ]);
  for (const step of await process.locator("li").all()) {
    await expect(step).toBeVisible();
    await expect(step.locator("p")).toHaveText(/\S/);
  }
  expect(await process.evaluate((element) => Boolean(
    document.querySelector("#work").compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING,
  )), "The process follows the compact portfolio introduction").toBe(true);
  expect(await page.locator("#process").evaluate((element) => Boolean(
    element.compareDocumentPosition(document.querySelector("#testimonials")) & Node.DOCUMENT_POSITION_FOLLOWING,
  )), "Clients learn how the work happens before reading all nine reviews").toBe(true);
  await expect(page.locator("#testimonials .testimonial-card:visible")).toHaveCount(9);

  const faqSection = page.locator("#project-faq");
  await expect(faqSection.locator("details.faq-item")).toHaveCount(6);
  await expect(faqSection.locator(".faq-item:not(details)")).toHaveCount(0);
  expect(await faqSection.evaluate((element) => Boolean(
    element.compareDocumentPosition(document.querySelector("#contact")) & Node.DOCUMENT_POSITION_FOLLOWING,
  )), "Project questions precede contact").toBe(true);
  const answers = [
    ["What if my idea isn’t finished?", "That’s fine. Start with the problem you want to solve. We can work out the details together."],
    ["How is pricing worked out?", "Pricing depends on scope, features, and complexity. We’ll agree what’s included and the price before building."],
    ["Does a consultation commit me to a project?", /No\..*scope, price, start date, and target launch in writing/],
    ["What happens after launch?", /full refund/i],
    ["What if I only need a website?", "That’s a complete project too. I can build a straightforward site for your services, location, work, and contact details. We’ll choose the pages and features your business needs. Explore website services ↗"],
    ["Who owns the code, and will my project be public?", "All custom code I build for your project is 100% yours. Client work and code will never appear in my public portfolio without your permission. The projects shown here are selected personal projects."],
  ];
  for (const [question, answer] of answers) {
    const faq = faqSection.locator("details.faq-item").filter({ has: page.locator("summary", { hasText: question }) });
    const summary = faq.locator("summary");
    const content = faq.locator("p").first();
    await expect(summary).toHaveText(question);
    await expect(content).toHaveText(answer);
    await expect(faq).not.toHaveAttribute("open", "");
    await expect(content).toBeHidden();
    await summary.scrollIntoViewIfNeeded();
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(summary).toBeFocused();
    await expect(faq).toHaveAttribute("open", "");
    await expect(content).toBeVisible();
    await page.keyboard.press("Space");
    await expect(summary).toBeFocused();
    await expect(faq).not.toHaveAttribute("open", "");
    await expect(content).toBeHidden();
  }
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("service choices, open FAQs, and the portfolio link fit narrow and tablet viewports", async ({ page }) => {
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const serviceBounds = await page.locator("#services .service-item").evaluateAll((cards) => cards.map((card) => {
      const box = card.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, left: box.left, right: box.right };
    }));
    if (width === 320) {
      expect(serviceBounds.every((card, index) => index === 0 || card.top >= serviceBounds[index - 1].bottom - 1),
        "Phone visitors read one complete service choice at a time").toBe(true);
    } else if (width === 1024) {
      expect(Math.abs(serviceBounds[0].top - serviceBounds[1].top), "Desktop service choices form a readable pair")
        .toBeLessThanOrEqual(1);
      expect(serviceBounds[2].top, "The second service pair sits below the first")
        .toBeGreaterThanOrEqual(serviceBounds[0].bottom - 1);
    }
    const faqSummaries = page.locator("#project-faq .faq-item summary");
    for (const summary of await faqSummaries.all()) {
      await summary.click();
    }
    await expect(page.locator("#project-faq details[open]")).toHaveCount(await faqSummaries.count());
    const fit = await page.evaluate(() => {
      const controls = document.querySelectorAll(
        "#services .service-actions > *, .process-steps > li, #project-faq summary, .homepage-work-link .button",
      );
      return {
        page: document.documentElement.scrollWidth <= window.innerWidth,
        controls: [...controls].every((element) => {
          const box = element.getBoundingClientRect();
          return box.width > 0 && box.height > 0 && box.left >= -1 && box.right <= window.innerWidth + 1;
        }),
      };
    });
    expect(fit, `Engagement sections fit the ${width}px viewport`).toEqual({ page: true, controls: true });
    await expect(page.getByRole("dialog")).toBeHidden();
  }
});

test("old homepage portfolio links send clients to the separate projects page", async ({ page }) => {
  for (const fragment of ["work", "project-archive"]) {
    await page.goto(`/#${fragment}`);
    await expect(page).toHaveURL(/\/work\/$/);
    await expect(page.locator(".work-page-grid .seo-project-card")).toHaveCount(projects.length);
  }
});

// These four projects keep real homepage quick-preview entry points.
const dialogEntryPoints = [
  ["The-Bit-Binder", '.hero-project[data-project="The-Bit-Binder"]'],
  ["MyGigCalendar", '.hero-project[data-project="MyGigCalendar"]'],
  ["micro-short-website", '.service-proof[data-project="micro-short-website"]'],
  ["BriefBooth.com", '.service-proof[data-project="BriefBooth.com"]'],
];
for (const [id, selector] of dialogEntryPoints) {
  const project = projects.find((entry) => entry.id === id);
  test(`${project.title} dialog keeps images, caption, full-size link, and focus in sync`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    const dialog = page.getByRole("dialog");
    const trigger = page.locator(selector);
    await trigger.click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(project.title);
    await expect(dialog.getByRole("button", { name: "Close project details" })).toBeFocused();
    await expectProjectIcon(dialog, project);
    await expect(dialog.locator(".dialog-summary")).toBeVisible();
    await expect(dialog.locator(".dialog-summary")).toHaveText(project.purpose);
    await expectProjectWorkflows(dialog, project);
    const fullStory = dialog.getByRole("link", { name: `View full project: ${project.title}`, exact: true });
    await expect(fullStory).toHaveCount(1);
    await expect(fullStory).toHaveAttribute("href", project.caseUrl);
    expect(await fullStory.getAttribute("target"), "The full story continues in the same tab").toBeNull();
    const images = dialog.getByRole("region", { name: `Images from ${project.title}`, exact: true });
    await expect(images).toBeVisible();
    const group = images.getByRole("group", { name: `Project images from ${project.title}`, exact: true });
    const choices = group.locator("button[data-dialog-screen]");
    await expect(choices).toHaveCount(project.gallery.length > 1 ? project.gallery.length : 0);
    await expect(images.locator(".dialog-image-caption")).toHaveAttribute("aria-live", "polite");
    await expect(images.locator(".primary-screen")).toHaveAttribute("src", project.gallery[0].image);
    await expect(images.locator(".dialog-image-caption")).toHaveText(project.gallery[0].caption);
    await expect(images.locator(".image-original")).toHaveAttribute("href", project.gallery[0].image);
    if (project.gallery.length > 1) {
      await expect(choices.nth(0)).toHaveAttribute("aria-pressed", "true");
    }
    for (let index = 0; index < project.gallery.length; index += 1) {
      const frame = project.gallery[index];
      if (project.gallery.length > 1) {
        await choices.nth(index).click();
        await expect(choices.nth(index)).toHaveText(frame.label);
        await expect(choices.nth(index)).toHaveAttribute("aria-pressed", "true");
        await expect(group.locator('[aria-pressed="true"]')).toHaveCount(1);
        await expect(choices.nth(index)).toBeFocused();
      }
      await expectLoadedImageToFit(images.locator(".primary-screen"), frame);
      await expect(images.locator(".companion-screen")).toHaveCount(frame.companion ? 1 : 0);
      if (frame.companion) {
        await expectLoadedImageToFit(images.locator(".companion-screen"), frame.companion);
      }
      await expect(images.locator(".dialog-image-caption")).toHaveText(frame.caption);
      await expect(images.getByRole("link", { name: "Open full-size image", exact: true })).toHaveAttribute("href", frame.image);
      await expect(images.locator(".image-original")).toHaveAttribute("target", "_blank");
      await expect(images.locator(".image-original")).toHaveAttribute("rel", /noopener/);
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(errors).toEqual([]);
    // A client can move directly from the quick preview into the complete project page.
    await trigger.click();
    await fullStory.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new URL(project.caseUrl, test.info().project.use.baseURL || "http://127.0.0.1:4173").href);
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(project.title);
  });
}

test("project dialog keeps background controls inactive, closes with Escape, and restores the trigger", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.getByRole("button", {
    name: "View the BitBinder project",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(
    projects.find((project) => project.id === "The-Bit-Binder").title,
  );
  await expect(
    page.getByRole("button", { name: "Close project details" }),
  ).toBeFocused();
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press("Tab");
    // Native dialog navigation can pass through browser chrome (activeElement
    // becomes body), but must never focus an interactive background control.
    expect(
      await dialog.evaluate(
        (element) =>
          document.activeElement === document.body ||
          element.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await page.locator(".email-link").evaluate((element) => element.focus());
  await expect(page.locator(".email-link")).not.toBeFocused();
  expect(await dialog.evaluate((element) =>
    document.activeElement === document.body || element.contains(document.activeElement),
  )).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("button", { name: "Close project details" }).click();
  await expect(dialog).toBeHidden();
});

test("email copy succeeds and explains the fallback when clipboard is unavailable", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  const emailDraft = new URL(await page.locator(".email-link").getAttribute("href"));
  expect(emailDraft.pathname).toBe("admin@customtechbuilt4u.com");
  expect(emailDraft.searchParams.get("body")).toBe("Source page: https://customtechbuilt4u.com/");
  await page.getByRole("button", { name: "Copy email address" }).click();
  await expect(page.locator("#copy-status")).toHaveText(
    "Email address copied to clipboard.",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "admin@customtechbuilt4u.com",
  );
  await page.evaluate(() =>
    Object.defineProperty(navigator.clipboard, "writeText", {
      value: async () => {
        throw new Error("Clipboard blocked for test");
      },
    }),
  );
  await page.getByRole("button", { name: "Copy email address" }).click();
  await expect(page.locator("#copy-status")).toContainText(
    "Clipboard unavailable.",
  );
  expect(await page.evaluate(() => window.getSelection().toString())).toBe(
    "admin@customtechbuilt4u.com",
  );
});

test("navigation opens, closes on selection, and handles Escape on phones", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const menu = page.locator(".menu-toggle");
  const navigation = page.locator("#main-nav");
  if (testInfo.project.name === "desktop") {
    await expect(menu).toBeHidden();
    await expect(navigation).toBeVisible();
    return;
  }
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(navigation).toBeVisible();
  await navigation.getByRole("link", { name: "Projects", exact: true }).click();
  await expect(page).toHaveURL(/\/work\/$/);
  await page.goto("/");
  await menu.click();
  await expect(navigation).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(navigation).toBeHidden();
  await expect(menu).toBeFocused();
});

test("tablet navigation fits at 768px and closes on Escape, outside clicks, selection, and resizing", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");
  const menu = page.locator(".menu-toggle");
  const navigation = page.locator("#main-nav");
  const expectFits = async () => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      "The tablet page has no horizontal overflow").toBe(true);
    expect(await page.locator(".site-header .wordmark, .menu-toggle, #main-nav a").evaluateAll((elements) =>
      elements.filter((element) => element.getClientRects().length > 0).every((element) => {
        const box = element.getBoundingClientRect();
        return box.width > 0 && box.left >= -1 && box.right <= window.innerWidth + 1;
      })), "Every visible tablet navigation control fits inside the screen").toBe(true);
  };
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAccessibleName("Open navigation");
  await expect(navigation).toBeHidden();
  await expectFits();
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(navigation).toBeVisible();
  await expectFits();
  await page.keyboard.press("Escape");
  await expect(navigation).toBeHidden();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeFocused();

  await menu.click();
  await expect(navigation).toBeVisible();
  // The main content's outer edge is outside the header and its expanded menu.
  await page.locator("main").click({ position: { x: 4, y: 4 } });
  await expect(navigation).toBeHidden();
  await expect(menu).toHaveAttribute("aria-expanded", "false");

  await menu.click();
  await navigation.getByRole("link", { name: "Projects", exact: true }).click();
  await expect(page).toHaveURL(/\/work\/$/);
  await page.goto("/");
  await expect(navigation).toBeHidden();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expectFits();

  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.setViewportSize({ width: 1100, height: 900 });
  await expect(menu).toBeHidden();
  await expect(navigation).toBeVisible();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expectFits();
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(menu).toBeVisible();
  await expect(navigation).toBeHidden();
  await expectFits();
});

test("services open useful details before booking and general inquiries retain email drafts", async ({
  page,
}) => {
  await page.goto("/");
  const inquiryPrompts = [
    "Company/project:",
    "The problem:",
    "Who will use it:",
    "What I need:",
    "Existing website (if any):",
    "Budget range (if known):",
    "Target launch date:",
  ].join("\n");
  const generalLinks = page.locator('.enquiry-link[data-enquiry="general"]');
  await expect(generalLinks).toHaveCount(1);
  for (const link of await generalLinks.all()) {
    const draft = new URL(await link.getAttribute("href"));
    expect(draft.protocol).toBe("mailto:");
    expect(draft.pathname).toBe("admin@customtechbuilt4u.com");
    expect(draft.searchParams.get("subject")).toBe("Website, app, or software project");
    expect(draft.searchParams.get("body")).toMatch(/^Hi 4u Digital,\n\n/);
    expect(draft.searchParams.get("body")).toContain(
      "I'm looking for help with a website, app, or business software.",
    );
    expect(draft.searchParams.get("body")).toContain(inquiryPrompts);
  }

  const services = [
    ["website", "website-development", "Website project", "a website"],
    ["web-app", "web-app-development", "Web application project", "a web application"],
    ["software", "app-development", "Custom app or software project", "a custom app or business software"],
    ["custom-software", "custom-software-development", "Custom app or software project", "a custom app or business software"],
  ];
  await expect(page.locator(".service-item")).toHaveCount(4);
  for (const [topic, slug, subject, description] of services) {
    const service = page.locator(`.service-item[data-service="${topic}"] .service-inquiry[href="./services/${slug}/"]`);
    await service.scrollIntoViewIfNeeded();
    await expect(service).toBeVisible();
    await service.click();
    await expect(page).toHaveURL(new RegExp(`/services/${slug}/$`));
    const opening = page.locator(".page-intro");
    await expect(opening.locator("[data-booking-link]")).toHaveAttribute("href", "https://briefbooth.com/book/4u-digital");
    const draft = new URL(await opening.locator('a[href^="mailto:"]').getAttribute("href"));
    expect(draft.protocol).toBe("mailto:");
    expect(draft.pathname).toBe("admin@customtechbuilt4u.com");
    expect(draft.searchParams.get("subject")).toBe(subject);
    expect(draft.searchParams.get("body")).toMatch(/^Hi 4u Digital,\n\n/);
    expect(draft.searchParams.get("body")).toContain(
      `I'm looking for help with ${description}.`,
    );
    expect(draft.searchParams.get("body")).toContain(inquiryPrompts);
    expect([...draft.searchParams.keys()]).toEqual(["subject", "body"]);
    await page.goto("/");
  }
});

test("dedicated project pages show the need, build evidence, and a project-specific inquiry", async ({ page }) => {
  const project = projects.find((entry) => entry.id === "PinsAndNeedlesComedyWebsite");
  await page.goto("/work/");
  const card = page.locator(`.work-page-grid .seo-project-card[data-project-id="${project.id}"]`);
  await card.getByRole("link", { name: `See how it works: ${project.title}`, exact: true }).click();
  await expect(page).toHaveURL(/\/work\/pins-and-needles-comedy\/$/);
  await expect(page.locator("#overview .project-summary")).toHaveText(project.clientSummary);
  await expect(page.locator("#development .project-context")).toContainText(project.challenge);
  await expect(page.locator("#development .project-context")).toContainText(project.build);
  await expect(page.locator("#development .project-stack .tag")).toHaveText(project.stack);
  await expect(page.locator("#development").getByRole("link", { name: /source code on GitHub/ }))
    .toHaveAttribute("href", project.repoUrl);
  const inquiry = page.locator('.project-story-hero .page-actions a[href^="mailto:"]');
  const draft = new URL(await inquiry.getAttribute("href"));
  expect(draft.pathname).toBe("admin@customtechbuilt4u.com");
  expect(draft.searchParams.get("subject")).toBe(`Project inspired by ${project.title}`);
  expect(draft.searchParams.get("body")).toContain(`Source page: https://customtechbuilt4u.com/work/pins-and-needles-comedy/`);
  await expect(page.locator(".project-page-frame")).toHaveCount(project.gallery.length);
});
