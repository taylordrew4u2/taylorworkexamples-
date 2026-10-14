import { test, expect } from "@playwright/test";
import { projects, featuredProjects } from "../projects.js";

const removedProjectIds = [
  "HealYourHeart",
  "laugh-extractor",
  "Laugh-Map",
  "markvegas",
  "mystorydailjournal",
  "CONTROLLEREVENT",
  "comedysub",
  "staybusy",
];

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
    const frame = element.closest(".archive-preview, .dialog-preview, .case-screen, .project-visual");
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
  expect(geometry.naturalWidth).toBe(expected.width);
  expect(geometry.naturalHeight).toBe(expected.height);
  expect(geometry.fit).toBe("contain");
  expect(geometry.frameFilter, "The preview preserves the source image colors").toBe("none");
  expect(geometry.width).toBeGreaterThan(0);
  expect(geometry.height).toBeGreaterThan(0);
  expect(geometry.inside, `${expected.image} fits its preview frame`).toBe(true);
  expect(await image.page().evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth,
  )).toBe(true);
}

async function expectInlineGalleryFrame(card, project, frame, screenSelector) {
  const screen = card.locator(screenSelector);
  await expectLoadedImageToFit(screen.locator(".primary-screen"), frame);
  await expect(screen.locator(".companion-screen")).toHaveCount(frame.companion ? 1 : 0);
  if (frame.companion) {
    await expectLoadedImageToFit(screen.locator(".companion-screen"), frame.companion);
  }
  await expect(card.locator(".screen-caption")).toHaveText(frame.caption);
  if (screenSelector === ".archive-preview") {
    const suppliedArtwork = frame.sourceKind === "owner-supplied-product-artwork";
    await expect(card.locator(".image-kind")).toHaveText(suppliedArtwork ? "Supplied product artwork" : frame.imageLabel || project.imageLabel);
    await expect(card.locator(".preview-context")).toHaveText(suppliedArtwork
      ? "Owner-supplied promotional artwork; original colors and full-resolution pixels preserved."
      : frame.previewContext || project.previewContext);
  }
  const original = card.locator(".showcase-original");
  await expect(original).toHaveAttribute("href", frame.image);
  await expect(original).toHaveAttribute("target", "_blank");
  await expect(original).toHaveAttribute("rel", /noopener/);
  await expect(screen).toHaveAttribute("data-project", project.id);
  expect(await screen.evaluate((element) => element.classList.contains("portrait"))).toBe(frame.portrait === true);
  expect(await screen.evaluate((element) => element.classList.contains("paired"))).toBe(Boolean(frame.companion || frame.workflow));
  if (frame.workflow) {
    await expect(screen.locator(".workflow-step")).toHaveText(frame.workflow);
  } else {
    await expect(screen.locator(".screen-workflow")).toHaveCount(0);
  }
  await expect(card.page().getByRole("dialog")).toBeHidden();
}

async function expectProjectIcon(scope, project) {
  const frame = scope.locator(".project-identity .project-icon-frame");
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

async function expectHeroPreview(page) {
  const stage = page.locator(".hero-stage");
  await expect(stage).toHaveAttribute("aria-label", "Featured app previews");
  await expect(stage.locator("button.hero-project")).toHaveCount(2);
  expect(await stage.locator("button.hero-project").evaluateAll((buttons) =>
    buttons.map((button) => button.dataset.project),
  )).toEqual(heroPreviews.map(([id]) => id));
  await expect(stage.locator("img.hero-project-screen")).toHaveCount(2);
  await expect(stage.locator("img")).toHaveCount(2);
  await expect(stage.locator(
    ".hero-web, .hero-phone, .hero-orbit, .hero-asterisk, .hero-project-info, .hero-project-icon, .hero-project-copy, .hero-project-arrow",
  )).toHaveCount(0);
  expect((await stage.innerText()).trim(), "The artwork has no added visible text or labels").toBe("");
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
    expect(geometry.naturalWidth).toBe(1920);
    expect(geometry.naturalHeight).toBe(1080);
    expect(geometry.aspectError, `${project.title}: the banner keeps its original upright proportions`).toBeLessThanOrEqual(1);
    expect(geometry.wholeScreenInside, `${project.title}: the complete banner fits its control`).toBe(true);
    expect(geometry.fitsViewport, `${project.title}: the banner fits the viewport`).toBe(true);
  }
  expect(await stage.locator(".hero-project").evaluateAll((buttons) => {
    const first = buttons[0].getBoundingClientRect();
    const second = buttons[1].getBoundingClientRect();
    return second.top >= first.bottom - 1;
  }), "Both opening banners remain separate without overlap").toBe(true);
}

test("portfolio renders, previews load, and the page fits the viewport", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle("Built4U — Custom tech. Built for you.");
  await expect(page.getByRole("link", { name: "Built4U, home", exact: true })).toBeVisible();
  const headline = page.getByRole("heading", { level: 1 });
  await expect(headline).toHaveText("You know your business. I’ll build the technology.");
  await expect(headline).toBeVisible();
  await expect(page.locator(".hero-tagline")).toHaveText("Custom tech. Built for you.");
  await expect(page.locator(".hero-tagline")).toBeVisible();
  await expect(page.locator(".intro-descriptor")).toHaveText("Apps, websites, and software for your business.");
  await expect(page.locator(".intro-descriptor")).toBeVisible();
  await expect(page.locator(".intro-description")).toHaveText(
    "Need an app, a complete website, or software that makes running your business easier? I design, code, and build it from start to finish. You don’t need a technical background—or a finished plan—to get started.",
  );
  await expect(page.locator(".intro-description")).toBeVisible();
  await expect(page.locator(".footer-identity")).toContainText("Built4U");
  await expect(page.locator(".owner-credit")).toHaveText("by taylordrew4u");
  expect(await headline.evaluate((element) => {
    const headlineBox = element.getBoundingClientRect();
    const copy = element.closest(".intro-copy");
    const copyBox = copy.getBoundingClientRect();
    const descriptorBox = copy.querySelector(".intro-descriptor").getBoundingClientRect();
    const content = document.createRange();
    content.selectNodeContents(element);
    return descriptorBox.top >= headlineBox.bottom && [...content.getClientRects()].every((box) =>
      box.left >= copyBox.left - 1 && box.right <= copyBox.right + 1,
    );
  }), "Long headline stays within its copy column").toBe(true);
  await expect(page.locator(".project-card")).toHaveCount(6);
  await expect(page.locator(".case-study")).toHaveCount(3);
  await expect(page.locator(".case-study .project-title")).toHaveText([
    "I Can Run A Show",
    "The BitBinder",
    "The Trip Handler",
  ]);
  await expect(page.locator(".supporting-grid .project-title")).toHaveText([
    "BillSpilt",
    "RoleCall",
    "My Gig Calendar",
  ]);
  for (const story of await page.locator(".case-study").all()) {
    await expect(story.locator(".case-highlights li")).toHaveCount(3);
    for (const highlight of await story.locator(".case-highlights li").all()) {
      await expect(highlight).toBeVisible();
      await expect(highlight.locator("strong")).toHaveText(/\S/);
      await expect(highlight.locator("p")).toHaveText(/\S/);
    }
  }
  await expect(page.locator(".hero-stage .hero-project-screen")).toHaveCount(2);
  await expect(page.locator(".hero-stage .hero-project-icon")).toHaveCount(0);
  await expect(page.locator(".hero-stage img")).toHaveCount(2);
  for (const image of await page.locator(".hero-stage img, #featured-projects img").all()) {
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
  const calendarCard = page.locator(".supporting-card").filter({
    has: page.getByRole("button", { name: "My Gig Calendar", exact: true }),
  });
  await expect(calendarCard.locator(".project-visual .primary-screen")).toHaveAttribute("src", "./assets/my-gig-calendar/banner-1920x1080.png");
  await expect(calendarCard.locator('[data-gallery][aria-pressed="true"]')).toHaveText("Product overview");
  const binderCard = page.locator('.case-study[data-case-id="The-Bit-Binder"]');
  await expect(binderCard.locator(".project-visual .primary-screen")).toHaveAttribute("src", "./assets/bitbinder/banner-1920x1080.png");
  await expect(binderCard.locator('[data-gallery][aria-pressed="true"]')).toHaveText("Product overview");
  for (const [id] of heroPreviews) {
    await expect(page.locator(`.hero-project[data-project="${id}"] .hero-project-screen`)).toHaveAttribute(
      "src", projects.find((entry) => entry.id === id).image,
    );
  }
  const roleCard = page.locator(".supporting-card").filter({
    has: page.getByRole("button", { name: "RoleCall", exact: true }),
  });
  await expect(roleCard.locator(".visual-badge")).toHaveText("DEV PREVIEW");
  await expect(roleCard.locator(".project-visual img")).toHaveAttribute("src", /rolecall-shots-capture\.(webp|png)$/);
  await expect(roleCard.locator(".project-visual img")).toHaveAttribute("alt", /shot list.*fictional.*sample/i);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: testInfo.outputPath(`portfolio-${testInfo.project.name}.png`),
    fullPage: true,
  });
  await page.screenshot({
    path: testInfo.outputPath(`portfolio-${testInfo.project.name}-intro.png`),
  });
  const controls = page.locator(".case-study .project-visual");
  async function expectStaticControlOnHover(control) {
    await control.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const before = await control.boundingBox();
    await control.hover();
    const after = await control.boundingBox();
    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    for (const edge of ["x", "y", "width", "height"]) {
      expect(
        Math.abs(after[edge] - before[edge]),
        `Hover keeps control ${edge} stable`,
      ).toBeLessThanOrEqual(0.01);
    }
  }
  for (const index of [0, 1]) {
    await expectStaticControlOnHover(controls.nth(index));
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page.evaluate(() => ({
      scroll: getComputedStyle(document.documentElement).scrollBehavior,
      imageTransition: getComputedStyle(
        document.querySelector(".project-visual img"),
      ).transitionDuration,
      cardTransition: getComputedStyle(
        document.querySelector(".project-visual"),
      ).transitionDuration,
    })),
  ).toEqual({ scroll: "auto", imageTransition: "0s", cardTransition: "0s" });
  for (const index of [0, 1]) {
    const control = controls.nth(index);
    await control.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const restingTransform = await control
      .locator(".primary-screen")
      .evaluate((element) => getComputedStyle(element).transform);
    await expectStaticControlOnHover(control);
    expect(
      await control
        .locator(".primary-screen")
        .evaluate((element) => getComputedStyle(element).transform),
    ).toBe(restingTransform);
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

for (const [id, banner] of [
  ["The-Bit-Binder", "./assets/bitbinder/banner-1920x1080.png"],
  ["MyGigCalendar", "./assets/my-gig-calendar/banner-1920x1080.png"],
]) {
  const project = projects.find((entry) => entry.id === id);
  test(`${project.title} opens with its supplied banner across selected work, archive, and project details`, async ({ page }) => {
    await page.goto("/#project-archive");
    const card = id === "The-Bit-Binder"
      ? page.locator(`.case-study[data-case-id="${id}"]`)
      : page.locator(`.supporting-card[data-supporting-id="${id}"]`);
    const screenSelector = id === "The-Bit-Binder" ? ".case-screen" : ".supporting-screen";
    const archiveCard = page.locator(`.archive-card[data-showcase-id="${id}"]`);
    const frame = project.gallery[0];
    expect(frame.image).toBe(banner);
    expect(frame.width).toBe(1920);
    expect(frame.height).toBe(1080);
    expect(frame.portrait).toBe(false);
    expect(frame.sourceKind).toBe("owner-supplied-product-artwork");
    for (const [showcase, screen] of [[card, screenSelector], [archiveCard, ".archive-preview"]]) {
      await expect(showcase.locator('[data-gallery][aria-pressed="true"]')).toHaveCount(1);
      await expect(showcase.locator('[data-gallery][aria-pressed="true"]')).toHaveText("Product overview");
      await expectInlineGalleryFrame(showcase, project, frame, screen);
    }
    const trigger = card.getByRole("button", { name: `Explore ${project.title}`, exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(project.title);
    await expect(dialog.getByRole("button", { name: "Close project details" })).toBeFocused();
    await expectLoadedImageToFit(dialog.locator(".primary-screen"), frame);
    await expect(dialog.locator(".companion-screen")).toHaveCount(0);
    await expect(dialog.locator('[data-dialog-screen][aria-pressed="true"]')).toHaveCount(1);
    await expect(dialog.locator('[data-dialog-screen][aria-pressed="true"]')).toHaveText("Product overview");
    await expect(dialog.locator(".dialog-image-caption")).toHaveText(frame.caption);
    await expect(dialog.locator(".image-original")).toHaveAttribute("href", banner);
    await expect(dialog.locator(".image-original")).toHaveAttribute("target", "_blank");
    await expect(dialog.locator(".image-original")).toHaveAttribute("rel", /noopener/);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}

test("Open Micer Timer opens with its supplied banner and distinguishes its preserved native countdown views", async ({ page }) => {
  const project = projects.find((entry) => entry.id === "Open-Micer-Timer");
  await page.goto("/#project-archive");
  const card = page.locator(`.archive-card[data-showcase-id="${project.id}"]`);
  const choices = card.locator("button[data-gallery][data-screen]");
  const banner = project.gallery[0];
  expect(banner.image).toBe("./assets/open-micer-timer/banner-1920x1080.png");
  expect(banner.width).toBe(1920);
  expect(banner.height).toBe(1080);
  expect(banner.sourceKind).toBe("owner-supplied-product-artwork");
  await expect(choices).toHaveCount(10);
  await expect(choices).toHaveText([
    "Product overview", "Final-minute cue", "Running countdown", "Ready",
    "On the clock", "Hands-free", "Final minute", "Time’s up", "Set lengths", "Any screen",
  ]);
  await expect(choices.first()).toHaveAttribute("aria-pressed", "true");
  await expectInlineGalleryFrame(card, project, banner, ".archive-preview");
  await expect(page.locator(`.hero-project[data-project="${project.id}"]`)).toHaveCount(0);
  await expect(page.locator(`#featured-projects [data-case-id="${project.id}"], #featured-projects [data-supporting-id="${project.id}"]`)).toHaveCount(0);

  const native = project.gallery.find((frame) => frame.label === "Running countdown");
  const nativeChoice = choices.filter({ hasText: /^Running countdown$/ });
  await nativeChoice.scrollIntoViewIfNeeded();
  await nativeChoice.focus();
  await page.keyboard.press("Enter");
  await expect(nativeChoice).toBeFocused();
  await expect(nativeChoice).toHaveAttribute("aria-pressed", "true");
  await expect(card.locator('[data-gallery][aria-pressed="true"]')).toHaveCount(1);
  await expectInlineGalleryFrame(card, project, native, ".archive-preview");
  await expect(card.locator(".image-kind")).toHaveText("Native app screenshot");
  await expect(card.locator(".preview-context")).toHaveText("Native countdown capture");
  await choices.first().focus();
  await page.keyboard.press("Space");
  await expect(choices.first()).toBeFocused();
  await expect(choices.first()).toHaveAttribute("aria-pressed", "true");
  await expect(card.locator('[data-gallery][aria-pressed="true"]')).toHaveCount(1);
  await expectInlineGalleryFrame(card, project, banner, ".archive-preview");

  const trigger = card.locator(".archive-preview");
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(project.title);
  await expect(dialog.getByRole("button", { name: "Close project details" })).toBeFocused();
  await expectLoadedImageToFit(dialog.locator(".primary-screen"), banner);
  await expect(dialog.locator('[data-dialog-screen][aria-pressed="true"]')).toHaveText("Product overview");
  await expect(dialog.locator(".dialog-image-caption")).toHaveText(banner.caption);
  await expect(dialog.locator(".image-original")).toHaveAttribute("href", banner.image);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("BillSpilt uses its repository cover and switches artwork and app capture context accurately", async ({ page }) => {
  const project = projects.find((entry) => entry.id === "Bill-Spilt");
  await page.goto("/#project-archive");
  const selected = page.locator(`.supporting-card[data-supporting-id="${project.id}"]`);
  const archive = page.locator(`.archive-card[data-showcase-id="${project.id}"]`);
  const cover = project.gallery[0];
  expect(cover.image).toBe("./assets/billspilt/hero.png");
  expect(cover.width).toBe(2560);
  expect(cover.height).toBe(1440);
  expect(cover.sourceKind).toBe("repository-product-artwork");
  for (const [card, screen] of [[selected, ".supporting-screen"], [archive, ".archive-preview"]]) {
    const choices = card.locator("button[data-gallery][data-screen]");
    await expect(choices).toHaveCount(8);
    await expect(choices).toHaveText([
      "Product overview", "Balances", "Settlement", "Expense split", "Expense history",
      "Spending overview", "How it works", "Features",
    ]);
    await expect(choices.first()).toHaveAttribute("aria-pressed", "true");
    await expectInlineGalleryFrame(card, project, cover, screen);
  }
  await expect(archive.locator(".image-kind")).toHaveText("Repository product artwork");
  await expect(archive.locator(".preview-context")).toHaveText("Repository promotional artwork · Illustrative sample data");
  const native = project.gallery.find((frame) => frame.label === "Balances");
  const choices = archive.locator("button[data-gallery][data-screen]");
  const balances = choices.filter({ hasText: /^Balances$/ });
  await balances.scrollIntoViewIfNeeded();
  await balances.focus();
  await page.keyboard.press("Enter");
  await expect(balances).toBeFocused();
  await expect(balances).toHaveAttribute("aria-pressed", "true");
  await expect(archive.locator('[data-gallery][aria-pressed="true"]')).toHaveCount(1);
  await expectInlineGalleryFrame(archive, project, native, ".archive-preview");
  await expect(archive.locator(".image-kind")).toHaveText("App screenshot");
  await expect(archive.locator(".preview-context")).toHaveText("Repository app capture · Sample household");
  const artwork = project.gallery.find((frame) => frame.label === "How it works");
  const howItWorks = choices.filter({ hasText: /^How it works$/ });
  await howItWorks.focus();
  await page.keyboard.press("Space");
  await expect(howItWorks).toBeFocused();
  await expect(howItWorks).toHaveAttribute("aria-pressed", "true");
  await expectInlineGalleryFrame(archive, project, artwork, ".archive-preview");
  await expect(archive.locator(".image-kind")).toHaveText("Repository product artwork");
  await expect(archive.locator(".preview-context")).toHaveText("Repository promotional artwork · Illustrative sample data");
  await expect(selected.locator('[data-gallery][aria-pressed="true"]')).toHaveText("Product overview");
  await expect(selected.locator(".primary-screen")).toHaveAttribute("src", cover.image);
  const trigger = selected.locator(".supporting-screen");
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(project.title);
  await expect(dialog.getByRole("button", { name: "Close project details" })).toBeFocused();
  await expectLoadedImageToFit(dialog.locator(".primary-screen"), cover);
  await expect(dialog.locator('[data-dialog-screen][aria-pressed="true"]')).toHaveText("Product overview");
  await expect(dialog.locator(".dialog-image-caption")).toHaveText(cover.caption);
  await expect(dialog.locator(".image-original")).toHaveAttribute("href", cover.image);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("services lead to relevant project proof and restore keyboard focus", async ({ page }) => {
  await page.goto("/");
  const services = page.locator("#services");
  await expect(services).toBeVisible();
  expect(await services.evaluate((element) => Boolean(
    element.compareDocumentPosition(document.querySelector("#work")) & Node.DOCUMENT_POSITION_FOLLOWING,
  )), "Services precede the selected work").toBe(true);
  await expect(services.locator("article.service-item")).toHaveCount(3);

  const examples = [
    ["website", "PinsAndNeedlesComedyWebsite", "See Pins & Needles website project"],
    ["web-app", "the-trip-handler", "See The Trip Handler project"],
    ["software", "MyGigCalendar", "See My Gig Calendar app project"],
  ];
  const dialog = page.getByRole("dialog");
  for (const [service, id, name] of examples) {
    const item = services.locator(`article.service-item[data-service="${service}"]`);
    const project = projects.find((entry) => entry.id === id);
    const trigger = item.getByRole("button", { name, exact: true });
    await expect(trigger).toHaveClass(/service-proof/);
    await expect(trigger).toHaveAttribute("data-project", project.id);
    await expect(item.locator(".service-inquiry")).toHaveAttribute("data-enquiry", service);
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
    "Tell me the problem",
    "Agree scope and price",
    "Build, review, launch",
  ]);
  for (const step of await process.locator("li").all()) {
    await expect(step).toBeVisible();
    await expect(step.locator("p")).toHaveText(/\S/);
  }
  expect(await process.evaluate((element) => Boolean(
    document.querySelector("#work").compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING,
  )), "The process follows the selected work").toBe(true);

  const faqSection = page.locator("#project-faq");
  await expect(faqSection.locator("details.faq-item")).toHaveCount(3);
  await expect(faqSection.locator(".faq-item:not(details)")).toHaveCount(0);
  expect(await faqSection.evaluate((element) => Boolean(
    element.compareDocumentPosition(document.querySelector("#contact")) & Node.DOCUMENT_POSITION_FOLLOWING,
  )), "Project questions precede contact").toBe(true);
  const answers = [
    ["What if my idea isn’t finished?", "That’s fine. Start with the problem you want to solve. We can work out the details together."],
    ["How is pricing worked out?", "Pricing depends on scope, features, and complexity. We’ll agree what’s included and the price before building."],
    ["What happens after launch?", "We’ll discuss who maintains it and any hosting/service costs when defining the project."],
  ];
  for (const [question, answer] of answers) {
    const faq = faqSection.locator("details.faq-item").filter({ has: page.locator("summary", { hasText: question }) });
    const summary = faq.locator("summary");
    const content = faq.locator("p");
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

test("service choices, open FAQs, and the supporting gallery fit narrow and tablet viewports", async ({ page }) => {
  const calendar = projects.find((project) => project.id === "MyGigCalendar");
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    for (const summary of await page.locator("#project-faq .faq-item summary").all()) {
      await summary.click();
    }
    await expect(page.locator("#project-faq details[open]")).toHaveCount(3);
    const card = page.locator(`.supporting-card[data-supporting-id="${calendar.id}"]`);
    const choices = card.locator(".supporting-gallery button[data-screen]");
    await choices.last().click();
    await expect(choices.last()).toHaveAttribute("aria-pressed", "true");
    await expectLoadedImageToFit(card.locator(".supporting-screen .primary-screen"), calendar.gallery.at(-1));
    const fit = await page.evaluate(() => {
      const controls = document.querySelectorAll(
        "#services .service-actions > *, .process-steps > li, #project-faq summary, .supporting-gallery button",
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

test("archive opens and filters, searches, empty state, and reset work together", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#project-archive")).toBeVisible();
  const archive = page.locator(".archive-disclosure");
  await expect(archive).not.toHaveAttribute("open", "");
  await expect(page.getByRole("searchbox")).toBeHidden();
  await archive.locator("summary").click();
  await expect(archive).toHaveAttribute("open", "");
  const total = await page.locator(".archive-card").count();
  expect(total).toBe(16);
  await page.locator('[data-filter="ios"]').click();
  await expect(page.locator('[data-filter="ios"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(await page.locator(".archive-card").count()).toBeLessThan(total);
  expect(
    await page.locator(".archive-card .project-category").allTextContents(),
  ).toEqual(expect.arrayContaining(["NATIVE iOS"]));
  expect(
    (
      await page.locator(".archive-card .project-category").allTextContents()
    ).every((value) => value === "NATIVE iOS"),
  ).toBe(true);
  await page.locator('[data-filter="all"]').click();
  const search = page.getByRole("searchbox");
  await search.fill("showrunner");
  await expect(page.locator(".archive-card")).toHaveCount(1);
  await expect(page.locator(".archive-card h3")).toHaveText("I Can Run A Show");
  await search.fill("repayments");
  await expect(page.locator(".archive-card")).toHaveCount(1);
  await expect(page.locator(".archive-card h3")).toHaveText("BillSpilt");
  await expect(page.locator('.archive-preview[data-project="Bill-Spilt"]')).toBeVisible();
  await expect(page.locator(".archive-card .project-workflows")).toContainText("Plan repayments");
  await expect(page.locator("#result-count")).toHaveText("1 OF 16 PROJECTS");
  await search.fill("a-project-that-does-not-exist-9238");
  await expect(
    page.getByRole("heading", { name: "No projects found." }),
  ).toBeVisible();
  await expect(page.locator("#result-count")).toHaveText(
    `0 OF ${total} PROJECTS`,
  );
  await page.locator('[data-filter="ios"]').click();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(search).toHaveValue("");
  await expect(search).toBeFocused();
  await expect(page.locator('[data-filter="all"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".archive-card")).toHaveCount(total);
  await archive.locator("summary").click();
  await expect(page.getByRole("searchbox")).toBeHidden();
});

test("the archive deep link opens its images and filters on initial navigation", async ({ page }) => {
  await page.goto("/#project-archive");
  await expect(page.locator(".archive-disclosure")).toHaveAttribute("open", "");
  await expect(page.getByRole("searchbox")).toBeVisible();
  await expect(page.locator(".archive-card")).toHaveCount(16);
  await expect(page.locator("#result-count")).toHaveText("16 OF 16 PROJECTS");
});

test("all 16 archive projects explain their purpose and workflows with genuine icons and accurately labeled covers", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#project-archive");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".archive-card")).toHaveCount(16);
  await expect(page.locator(".archive-placeholder")).toHaveCount(0);
  for (const project of projects) {
    const preview = page.locator(`.archive-preview[data-project="${project.id}"]`);
    const card = preview.locator("..");
    await expect(preview).toHaveAccessibleName(`View images and details for ${project.title}`);
    await expect(card.locator("h3")).toHaveText(project.title);
    await expectProjectIcon(card, project);
    await expect(card.locator(".archive-purpose")).toBeVisible();
    await expect(card.locator(".archive-purpose")).toHaveText(project.purpose);
    await expectProjectWorkflows(card, project);
    await expect(card.locator(".preview-context")).toBeVisible();
    await expect(card.locator(".preview-context")).toHaveText(project.previewContext);
    await expect(card.locator(".image-kind")).toHaveText(project.imageLabel);
    await expect(preview.locator(".primary-screen")).toHaveCount(1);
    await expect(preview.locator("img")).toHaveCount(project.gallery[0].companion ? 2 : 1);
    await expectLoadedImageToFit(preview.locator(".primary-screen"), {
      image: project.image,
      imageAlt: project.imageAlt,
      width: project.imageWidth,
      height: project.imageHeight,
    });
    await expectInlineGalleryFrame(card, project, project.gallery[0], ".archive-preview");
    expect(project.sourceAvailable).toBe(true);
    await expect(card.locator(".source-note")).toHaveCount(0);
    await expect(card.getByRole("link", { name: "Source", exact: true })).toHaveAttribute("href", project.repoUrl);
    if (project.demoUrl) {
      const liveLink = card.getByRole("link", { name: project.demoLabel, exact: true });
      await expect(liveLink).toBeVisible();
      await expect(liveLink).toHaveAttribute("href", project.demoUrl);
      await expect(liveLink).toHaveAttribute("target", "_blank");
      await expect(liveLink).toHaveAttribute("rel", /noopener/);
    }
    await expect(card.locator(".project-links > a")).toHaveCount(project.demoUrl ? 2 : 1);
  }
  expect(errors).toEqual([]);
});

test("removed repositories stay out of archive, search and hero while public source and live-site links remain available", async ({ page }) => {
  const publicProject = projects.find((project) => project.id === "PinsAndNeedlesComedyWebsite");
  expect(publicProject.sourceAvailable).toBe(true);
  expect(publicProject.repoUrl).toBe("https://github.com/taylordrew4u2/PinsAndNeedlesComedyWebsite");
  expect(publicProject.demoUrl).toBe("https://pinsandneedlescomedy.com");

  await page.goto("/#project-archive");
  await expect(page.locator(".archive-card")).toHaveCount(16);
  await expect(page.locator(".source-note")).toHaveCount(0);
  await expect(page.locator(".hero-stage .hero-project")).toHaveCount(2);
  for (const [id] of heroPreviews) {
    const heroProject = projects.find((entry) => entry.id === id);
    await expect(page.locator(`.hero-project[data-project="${id}"] .hero-project-screen`)).toHaveAttribute("src", heroProject.image);
  }
  await expect(page.locator(".hero-stage")).not.toContainText(/Mark Vegas/i);
  for (const id of removedProjectIds) {
    await expect(page.locator(`[data-project="${id}"]`)).toHaveCount(0);
  }
  for (const asset of ["markvegas.webp", "controller-live-loaded.webp", "staybusy-overview-mono.svg"]) {
    const response = await page.request.get(`/assets/${asset}`);
    expect(response.status(), `${asset}: removed project media is not deployed`).toBe(404);
  }
  const search = page.getByRole("searchbox");
  for (const id of removedProjectIds) {
    await search.fill(id);
    await expect(page.locator(".archive-card")).toHaveCount(0);
    await expect(page.locator("#result-count")).toHaveText("0 OF 16 PROJECTS");
  }
  await search.fill("");
  await expect(page.locator(".archive-card")).toHaveCount(16);

  const publicPreview = page.locator(`.archive-preview[data-project="${publicProject.id}"]`);
  const publicCard = publicPreview.locator("..");
  await expect(publicCard.locator(".source-note")).toHaveCount(0);
  await expect(publicCard.getByRole("link", { name: "Source", exact: true })).toHaveAttribute("href", publicProject.repoUrl);
  await expect(publicCard.getByRole("link", { name: publicProject.demoLabel, exact: true })).toHaveAttribute("href", publicProject.demoUrl);
  await publicPreview.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(publicProject.title);
  await expect(dialog.locator(".source-note")).toHaveCount(0);
  await expect(dialog.getByRole("link", { name: "Project documentation", exact: true })).toHaveAttribute("href", publicProject.documentationUrl);
  await dialog.locator(".technical-details summary").click();
  await expect(dialog.getByRole("link", { name: "View source code", exact: true })).toHaveAttribute("href", publicProject.repoUrl);
  const liveSite = dialog.getByRole("link", { name: publicProject.demoLabel, exact: true });
  await expect(liveSite).toBeVisible();
  await expect(liveSite).toHaveAttribute("href", publicProject.demoUrl);
  await expect(liveSite).toHaveAttribute("target", "_blank");
  await expect(liveSite).toHaveAttribute("rel", /noopener/);
});

test("every project dialog shows its images and keeps gallery, caption, full-size link, and focus in sync", async ({ page }) => {
  // This serial catalog sweep loads every gallery, including full-resolution supplied artwork.
  test.setTimeout(60_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#project-archive");
  const dialog = page.getByRole("dialog");
  for (const project of projects) {
    const trigger = page.locator(`.archive-preview[data-project="${project.id}"]`);
    await trigger.click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(project.title);
    await expect(dialog.getByRole("button", { name: "Close project details" })).toBeFocused();
    await expectProjectIcon(dialog, project);
    await expect(dialog.locator(".dialog-summary")).toBeVisible();
    await expect(dialog.locator(".dialog-summary")).toHaveText(project.purpose);
    await expectProjectWorkflows(dialog, project);
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
      await expect(page.locator("#result-count")).toHaveText("16 OF 16 PROJECTS");
      await expect(page.locator("#project-search")).toHaveValue("");
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  }
  expect(errors).toEqual([]);
});

test("project dialog keeps background controls inactive, closes with Escape, and restores the trigger", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.getByRole("button", {
    name: "Explore I Can Run A Show",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(
    "I Can Run A Show",
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
  await expect(page.locator(".email-link")).toHaveAttribute(
    "href",
    "mailto:admin@customtechbuilt4u.com",
  );
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
  if (testInfo.project.name === "desktop") {
    await expect(menu).toBeHidden();
    await expect(
      page.getByRole("navigation", { name: "Main navigation" }),
    ).toBeVisible();
    return;
  }
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Projects", exact: true })
    .click();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("navigation")).toBeHidden();
  await menu.click();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeFocused();
});

test("project and service inquiry links prepare the correct email drafts", async ({
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
  await expect(generalLinks).toHaveCount(3);
  for (const link of await generalLinks.all()) {
    const draft = new URL(await link.getAttribute("href"));
    expect(draft.protocol).toBe("mailto:");
    expect(draft.pathname).toBe("admin@customtechbuilt4u.com");
    expect(draft.searchParams.get("subject")).toBe("Website, app, or software project");
    expect(draft.searchParams.get("body")).toMatch(/^Hi Built4U,\n\n/);
    expect(draft.searchParams.get("body")).toContain(
      "I'm looking for help with a website, app, or business software.",
    );
    expect(draft.searchParams.get("body")).toContain(inquiryPrompts);
  }

  const services = [
    ["website", "Website project", "a website"],
    ["web-app", "Web application project", "a web application"],
    ["software", "Custom app or software project", "a custom app or business software"],
  ];
  await expect(page.locator(".service-item")).toHaveCount(3);
  for (const [topic, subject, description] of services) {
    const service = page.locator(`.service-item[data-service="${topic}"] .service-inquiry.enquiry-link[data-enquiry="${topic}"]`);
    await service.scrollIntoViewIfNeeded();
    await expect(service).toBeVisible();
    const draft = new URL(await service.getAttribute("href"));
    expect(draft.protocol).toBe("mailto:");
    expect(draft.pathname).toBe("admin@customtechbuilt4u.com");
    expect(draft.searchParams.get("subject")).toBe(subject);
    expect(draft.searchParams.get("body")).toMatch(/^Hi Built4U,\n\n/);
    expect(draft.searchParams.get("body")).toContain(
      `I'm looking for help with ${description}.`,
    );
    expect(draft.searchParams.get("body")).toContain(inquiryPrompts);
    expect([...draft.searchParams.keys()]).toEqual(["subject", "body"]);
  }
});

test("case studies show the need, build evidence, and a project-specific inquiry", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.locator(".archive-disclosure summary").click();
  await page
    .getByRole("button", { name: "Pins & Needles Comedy", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(
    "Pins & Needles Comedy",
  );
  await expect(
    dialog.getByRole("heading", { name: "The need", exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "What I built", exact: true }),
  ).toBeVisible();
  for (const paragraph of await dialog.locator(".dialog-case p").all()) {
    await expect(paragraph).toHaveText(/\S/);
  }

  const technicalDetails = dialog.locator(".technical-details");
  await expect(technicalDetails.locator(".technical-content")).toBeHidden();
  await technicalDetails.locator("summary").click();
  await expect(technicalDetails).toHaveAttribute("open", "");
  await expect(technicalDetails.locator(".technical-content")).toBeVisible();
  expect(await technicalDetails.locator(".tag").allTextContents()).toEqual(
    expect.arrayContaining(["Next.js", "TypeScript"]),
  );
  expect(await technicalDetails.locator("li").count()).toBeGreaterThan(0);
  await expect(
    technicalDetails.getByRole("link", { name: "View source code" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/taylordrew4u2/PinsAndNeedlesComedyWebsite",
  );

  const inquiry = dialog.getByRole("link", {
    name: "Email about a similar project",
  });
  const draft = new URL(await inquiry.getAttribute("href"));
  expect(draft.pathname).toBe("admin@customtechbuilt4u.com");
  expect(draft.searchParams.get("subject")).toBe(
    "Project inspired by Pins & Needles Comedy",
  );
  expect(draft.searchParams.get("body")).toMatch(/^Hi Built4U,\n\n/);
  expect(draft.searchParams.get("body")).toContain(
    "I saw Pins & Needles Comedy in your portfolio and would like to discuss something similar.",
  );
  expect([...draft.searchParams.keys()]).toEqual(["subject", "body"]);
  await inquiry.scrollIntoViewIfNeeded();
  await expect(inquiry).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath(`case-study-${testInfo.project.name}.png`),
  });
});

for (const project of featuredProjects.slice(0, 3)) {
  test(`${project.title} lead gallery changes real images, captions, and selection without opening a modal`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const isBitBinder = project.id === "The-Bit-Binder";
    await page.goto(isBitBinder ? "/#the-bit-binder-showcase" : "/");
    const story = page.locator(`.case-study[data-case-id="${project.id}"]`);
    if (isBitBinder) {
      await expect(story).toHaveAttribute("id", "the-bit-binder-showcase");
      expect(new URL(page.url()).hash).toBe("#the-bit-binder-showcase");
      await expect(story).toBeInViewport();
    }
    const title = (await story.locator(".project-title").textContent()).trim();
    const group = story.getByRole("group", { name: `Screens from ${title}`, exact: true });
    const choices = group.locator("button[data-gallery][data-screen]");
    const count = await choices.count();
    expect(count).toBeGreaterThanOrEqual(2);
    await expect(choices).toHaveCount(project.gallery.length);
    await expect(choices).toHaveText(project.gallery.map((frame) => frame.label));
    if (isBitBinder) {
      expect(count).toBe(12);
      await expect(choices.filter({ hasText: /Product overview|Every bit|Import material|Joke library|Record & transcribe|Set lists|Brainstorm|BitBuddy|Roast mode/ })).toHaveCount(9);
      expect(project.gallery.filter((frame) => frame.sourceKind === "owner-supplied-product-artwork").map((frame) => frame.label)).toEqual([
        "Product overview", "Every bit", "Import material", "Joke library",
        "Record & transcribe", "Set lists", "Brainstorm", "BitBuddy", "Roast mode",
      ]);
    }
    await expect(choices.nth(0)).toHaveAttribute("aria-pressed", "true");
    await expect(group.locator('[aria-pressed="true"]')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const initialSource = await story.locator(".primary-screen").getAttribute("src");
    const initialCaption = await story.locator(".screen-caption").textContent();
    await expect(story.locator(".screen-caption")).toHaveAttribute("aria-live", "polite");
    await expectInlineGalleryFrame(story, project, project.gallery[0], ".case-screen");
    for (let index = 1; index < count; index += 1) {
      const choice = choices.nth(index);
      await choice.scrollIntoViewIfNeeded();
      await choice.focus();
      await page.keyboard.press(index % 2 === 0 ? "Enter" : "Space");
      await expect(choices.nth(index)).toHaveAttribute("aria-pressed", "true");
      await expect(choices.nth(0)).toHaveAttribute("aria-pressed", "false");
      await expect(group.locator('[aria-pressed="true"]')).toHaveCount(1);
      await expect(choices.nth(index)).toBeFocused();
      await expectInlineGalleryFrame(story, project, project.gallery[index], ".case-screen");
      expect(await story.locator(".primary-screen").getAttribute("src")).not.toBe(initialSource);
      expect(await story.locator(".screen-caption").textContent()).not.toBe(initialCaption);
      for (const image of await story.locator(".case-screen img").all()) {
        await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
      }
      await expect(page.getByRole("dialog")).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await choices.nth(0).click();
    await expect(story.locator(".primary-screen")).toHaveAttribute("src", initialSource);
    await expect(story.locator(".screen-caption")).toHaveText(initialCaption);
    await expect(choices.nth(0)).toHaveAttribute("aria-pressed", "true");
    await expect(group.locator('[aria-pressed="true"]')).toHaveCount(1);
    await expectInlineGalleryFrame(story, project, project.gallery[0], ".case-screen");
    await expect(page.locator('[data-case-id="The-Bit-Binder"] .screen-caption')).toHaveText(
      projects.find((entry) => entry.id === "The-Bit-Binder").gallery[0].caption,
    );
    expect(errors).toEqual([]);
  });
}

test("My Gig Calendar changes its on-page images, captions, and selection without opening a modal", async ({ page }) => {
  const project = projects.find((entry) => entry.id === "MyGigCalendar");
  expect(project.gallery.length).toBeGreaterThan(1);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const card = page.locator(`.supporting-card[data-supporting-id="${project.id}"]`);
  const screen = card.locator(".supporting-screen");
  const gallery = card.locator(".supporting-gallery");
  const group = gallery.getByRole("group", { name: `Screens from ${project.title}`, exact: true });
  const choices = group.locator("button[data-gallery][data-screen]");
  const caption = gallery.locator(".screen-caption");
  await expect(card).toBeVisible();
  await expect(screen).toHaveAttribute("data-project", project.id);
  await expect(choices).toHaveCount(project.gallery.length);
  await expect(choices).toHaveText(project.gallery.map((frame) => frame.label));
  await expect(choices.nth(0)).toHaveAttribute("aria-pressed", "true");
  await expect(group.locator('[aria-pressed="true"]')).toHaveCount(1);
  await expect(caption).toHaveAttribute("aria-live", "polite");
  await expect(screen.locator(".primary-screen")).toHaveAttribute("src", project.gallery[0].image);
  await expect(caption).toHaveText(project.gallery[0].caption);

  for (let index = 0; index < project.gallery.length; index += 1) {
    const frame = project.gallery[index];
    const choice = choices.nth(index);
    await choice.scrollIntoViewIfNeeded();
    await choice.focus();
    await page.keyboard.press(index % 2 === 0 ? "Enter" : "Space");
    await expect(choice).toBeFocused();
    await expect(choice).toHaveAttribute("aria-pressed", "true");
    await expect(group.locator('[aria-pressed="true"]')).toHaveCount(1);
    await expect(caption).toHaveText(frame.caption);
    await expectLoadedImageToFit(screen.locator(".primary-screen"), frame);
    await expect(screen.locator(".companion-screen")).toHaveCount(frame.companion ? 1 : 0);
    if (frame.companion) {
      await expectLoadedImageToFit(screen.locator(".companion-screen"), frame.companion);
    }
    await expectInlineGalleryFrame(card, project, frame, ".supporting-screen");
    await expect(page.getByRole("dialog")).toBeHidden();
  }
  await choices.nth(0).click();
  await expect(choices.nth(0)).toHaveAttribute("aria-pressed", "true");
  await expect(group.locator('[aria-pressed="true"]')).toHaveCount(1);
  await expect(screen.locator(".primary-screen")).toHaveAttribute("src", project.gallery[0].image);
  await expect(caption).toHaveText(project.gallery[0].caption);
  await expectInlineGalleryFrame(card, project, project.gallery[0], ".supporting-screen");
  expect(errors).toEqual([]);
});

for (const id of ["Bill-Spilt", "Role-Call"]) {
  const project = projects.find((entry) => entry.id === id);
  test(`${project.title} has a complete on-page showcase with keyboard gallery controls`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    const card = page.locator(`.supporting-card[data-supporting-id="${project.id}"]`);
    const group = card.getByRole("group", { name: `Screens from ${project.title}`, exact: true });
    const choices = group.locator("button[data-gallery][data-screen]");
    await expect(card).toHaveClass(/has-gallery/);
    await expectProjectIcon(card, project);
    await expect(card.locator(".project-description")).toHaveText(project.purpose);
    await expect(choices).toHaveCount(project.gallery.length);
    await expect(choices).toHaveText(project.gallery.map((frame) => frame.label));
    await expect(choices.first()).toHaveAttribute("aria-pressed", "true");
    await expect(card.locator(".screen-caption")).toHaveAttribute("aria-live", "polite");
    const unaffected = await page.locator("#featured-projects .project-card").evaluateAll((cards, currentId) =>
      cards.filter((entry) => entry.dataset.supportingId !== currentId).map((entry) => ({
        id: entry.dataset.caseId || entry.dataset.supportingId,
        image: entry.querySelector(".primary-screen").getAttribute("src"),
        pressed: [...entry.querySelectorAll('[data-gallery][aria-pressed="true"]')].map((button) => button.dataset.screen),
      })), project.id);
    for (let index = 0; index < project.gallery.length; index += 1) {
      const choice = choices.nth(index);
      await choice.scrollIntoViewIfNeeded();
      await choice.focus();
      await page.keyboard.press(index % 2 === 0 ? "Enter" : "Space");
      await expect(choice).toBeFocused();
      await expect(choice).toHaveAttribute("aria-pressed", "true");
      await expect(group.locator('[aria-pressed="true"]')).toHaveCount(1);
      await expectInlineGalleryFrame(card, project, project.gallery[index], ".supporting-screen");
    }
    const remaining = await page.locator("#featured-projects .project-card").evaluateAll((cards, currentId) =>
      cards.filter((entry) => entry.dataset.supportingId !== currentId).map((entry) => ({
        id: entry.dataset.caseId || entry.dataset.supportingId,
        image: entry.querySelector(".primary-screen").getAttribute("src"),
        pressed: [...entry.querySelectorAll('[data-gallery][aria-pressed="true"]')].map((button) => button.dataset.screen),
      })), project.id);
    expect(remaining, "Changing this gallery leaves the other selected showcases unchanged").toEqual(unaffected);
    await choices.first().click();
    await expect(choices.first()).toBeFocused();
    await expectInlineGalleryFrame(card, project, project.gallery[0], ".supporting-screen");
    expect(errors).toEqual([]);
  });
}

for (const project of projects) {
  test(`${project.title} archive gallery keeps its original images, captions, links, and keyboard selection together`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/#project-archive");
    const card = page.locator(`.archive-card[data-showcase-id="${project.id}"]`);
    const preview = card.locator(".archive-preview");
    const choices = card.locator(".archive-gallery button[data-gallery][data-screen]");
    await expect(card).toBeVisible();
    await expect(choices).toHaveCount(project.gallery.length > 1 ? project.gallery.length : 0);
    if (project.gallery.length > 1) {
      await expect(choices).toHaveText(project.gallery.map((frame) => frame.label));
      await expect(choices.first()).toHaveAttribute("aria-pressed", "true");
    }
    await expect(card.locator(".screen-caption")).toHaveAttribute("aria-live", "polite");
    await expect(card.locator(".screen-caption")).toHaveText(project.imageCaption || project.previewContext);
    await expect(card.locator(".showcase-original")).toHaveAttribute("href", project.image);
    await expect(preview.locator(".primary-screen")).toHaveCount(1);
    await expect(preview.locator("img")).toHaveCount(project.gallery[0].companion ? 2 : 1);
    await expectLoadedImageToFit(preview.locator(".primary-screen"), {
      image: project.image,
      imageAlt: project.imageAlt,
      width: project.imageWidth,
      height: project.imageHeight,
    });
    await expectInlineGalleryFrame(card, project, project.gallery[0], ".archive-preview");
    await expect(card.locator(".showcase-original")).toHaveAttribute("target", "_blank");
    await expect(card.locator(".showcase-original")).toHaveAttribute("rel", /noopener/);
    if (project.gallery.length === 1) {
      await expect(page.getByRole("dialog")).toBeHidden();
      expect(errors).toEqual([]);
      return;
    }
    const unaffected = await page.locator(".archive-card").evaluateAll((cards, currentId) =>
      cards.filter((entry) => entry.dataset.showcaseId !== currentId).map((entry) => ({
        id: entry.dataset.showcaseId,
        image: entry.querySelector(".archive-preview .primary-screen").getAttribute("src"),
        pressed: [...entry.querySelectorAll('[data-gallery][aria-pressed="true"]')].map((button) => button.dataset.screen),
      })), project.id);
    for (const [order, index] of [0, project.gallery.length - 1].entries()) {
      const choice = choices.nth(index);
      await choice.scrollIntoViewIfNeeded();
      await choice.focus();
      await page.keyboard.press(order % 2 === 0 ? "Enter" : "Space");
      await expect(choice).toBeFocused();
      await expect(choice).toHaveAttribute("aria-pressed", "true");
      await expect(card.locator('[data-gallery][aria-pressed="true"]')).toHaveCount(1);
      await expectInlineGalleryFrame(card, project, project.gallery[index], ".archive-preview");
      await expect(page.locator("#result-count")).toHaveText("16 OF 16 PROJECTS");
      await expect(page.getByRole("searchbox")).toHaveValue("");
    }
    const remaining = await page.locator(".archive-card").evaluateAll((cards, currentId) =>
      cards.filter((entry) => entry.dataset.showcaseId !== currentId).map((entry) => ({
        id: entry.dataset.showcaseId,
        image: entry.querySelector(".archive-preview .primary-screen").getAttribute("src"),
        pressed: [...entry.querySelectorAll('[data-gallery][aria-pressed="true"]')].map((button) => button.dataset.screen),
      })), project.id);
    expect(remaining, "Changing one archive gallery leaves the other archive showcases unchanged").toEqual(unaffected);
    await choices.first().click();
    await expect(choices.first()).toBeFocused();
    await expectInlineGalleryFrame(card, project, project.gallery[0], ".archive-preview");
    expect(errors).toEqual([]);
  });
}

test("archive re-rendering resets gallery state without changing selected-work galleries", async ({ page }) => {
  const project = projects.find((entry) => entry.id === "Bill-Spilt");
  await page.goto("/#project-archive");
  const selectedCard = page.locator(`.supporting-card[data-supporting-id="${project.id}"]`);
  const archiveCard = page.locator(`.archive-card[data-showcase-id="${project.id}"]`);
  const selectedChoices = selectedCard.locator("button[data-gallery][data-screen]");
  const archiveChoices = archiveCard.locator("button[data-gallery][data-screen]");
  await selectedChoices.nth(1).click();
  await expectInlineGalleryFrame(selectedCard, project, project.gallery[1], ".supporting-screen");
  await archiveChoices.last().click();
  await expectInlineGalleryFrame(archiveCard, project, project.gallery.at(-1), ".archive-preview");
  await expect(selectedChoices.nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(selectedCard.locator(".primary-screen")).toHaveAttribute("src", project.gallery[1].image);

  const search = page.getByRole("searchbox");
  await search.fill("repayments");
  await expect(page.locator(".archive-card")).toHaveCount(1);
  await expect(archiveChoices.first()).toHaveAttribute("aria-pressed", "true");
  await expect(archiveCard.locator(".archive-preview .primary-screen")).toHaveCount(1);
  await expect(archiveCard.locator(".archive-preview .primary-screen")).toHaveAttribute("src", project.image);
  await expect(archiveCard.locator(".screen-caption")).toHaveText(project.gallery[0].caption);
  await expect(archiveCard.locator(".showcase-original")).toHaveAttribute("href", project.image);
  await expectInlineGalleryFrame(archiveCard, project, project.gallery[0], ".archive-preview");
  await archiveChoices.last().click();
  await expectInlineGalleryFrame(archiveCard, project, project.gallery.at(-1), ".archive-preview");
  await page.locator('[data-filter="ios"]').click();
  await expect(archiveCard).toHaveCount(0);
  await page.getByRole("button", { name: "Clear filters", exact: true }).click();
  await expect(search).toHaveValue("");
  await expect(search).toBeFocused();
  await expect(page.locator(".archive-card")).toHaveCount(16);
  await expect(archiveChoices.first()).toHaveAttribute("aria-pressed", "true");
  await expect(archiveCard.locator(".archive-preview .primary-screen")).toHaveAttribute("src", project.image);
  await expect(archiveCard.locator(".screen-caption")).toHaveText(project.gallery[0].caption);
  await expect(archiveCard.locator(".showcase-original")).toHaveAttribute("href", project.image);
  await expectInlineGalleryFrame(archiveCard, project, project.gallery[0], ".archive-preview");
  await expect(selectedChoices.nth(1)).toHaveAttribute("aria-pressed", "true");
  await expectInlineGalleryFrame(selectedCard, project, project.gallery[1], ".supporting-screen");
});

for (const width of [320, 768, 1024]) {
  test(`all showcase media and gallery controls fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/#project-archive");
    await page.evaluate(() => document.fonts.ready);
    await expectHeroPreview(page);
    for (const card of await page.locator("#featured-projects .project-card, .archive-card").all()) {
      const id = await card.getAttribute("data-case-id") ||
        await card.getAttribute("data-supporting-id") || await card.getAttribute("data-showcase-id");
      const project = projects.find((entry) => entry.id === id);
      const choices = card.locator("button[data-gallery][data-screen]");
      const screenSelector = await card.getAttribute("data-case-id") ? ".case-screen" :
        await card.getAttribute("data-supporting-id") ? ".supporting-screen" : ".archive-preview";
      if (project.gallery.length > 1) {
        await choices.last().click();
        await expect(choices.last()).toHaveAttribute("aria-pressed", "true");
        await expectInlineGalleryFrame(card, project, project.gallery.at(-1), screenSelector);
      } else {
        await expectLoadedImageToFit(card.locator(".archive-preview .primary-screen"), {
          image: project.image,
          imageAlt: project.imageAlt,
          width: project.imageWidth,
          height: project.imageHeight,
        });
        await expectInlineGalleryFrame(card, project, project.gallery[0], ".archive-preview");
      }
    }
    const fit = await page.evaluate(() => {
      const bounds = (element) => {
        const box = element.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && box.left >= -1 && box.right <= window.innerWidth + 1;
      };
      const controls = document.querySelectorAll(
        "#featured-projects [data-gallery], .archive-card [data-gallery], .showcase-original",
      );
      const media = document.querySelectorAll(".case-screen, .supporting-screen, .archive-preview");
      const gridWidth = document.querySelector(".supporting-grid").getBoundingClientRect().width;
      return {
        page: document.documentElement.scrollWidth <= window.innerWidth,
        controls: [...controls].every(bounds),
        media: [...media].every(bounds),
        completeSupportingShowcases: [...document.querySelectorAll(".supporting-card.has-gallery")].length === 3 &&
          [...document.querySelectorAll(".supporting-card.has-gallery")].every((card) =>
            Math.abs(card.getBoundingClientRect().width - gridWidth) <= 1),
        orderedNarrowCaseSections: window.innerWidth > 800 || [...document.querySelectorAll(".case-study")].every((card) => {
          const media = card.querySelector(".case-media").getBoundingClientRect();
          const header = card.querySelector(".case-header").getBoundingClientRect();
          const proof = card.querySelector(".case-proof").getBoundingClientRect();
          return header.top >= media.bottom - 1 && proof.top >= header.bottom - 1;
        }),
      };
    });
    expect(fit).toEqual({
      page: true, controls: true, media: true,
      completeSupportingShowcases: true, orderedNarrowCaseSections: true,
    });
    await expect(page.getByRole("dialog")).toBeHidden();
  });
}
