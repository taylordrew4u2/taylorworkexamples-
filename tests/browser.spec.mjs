import { test, expect } from "@playwright/test";
import { projects, featuredProjects } from "../public-projects.js";
import { launchOffer } from "../seo-offer.js";

const removedProjectIds = [
  "HealYourHeart",
  "laugh-extractor",
  "Laugh-Map",
  "markvegas",
  "mystorydailjournal",
  "CONTROLLEREVENT",
  "comedysub",
  "staybusy",
  "taylordrewwebsite",
  "Role-Call", "bleepkit", "dictype", "vlognudge", "nycstandupopenmicmaster", "tlcmassagewellness",
];

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

async function openSelectedGallery(card) {
  const disclosure = card.locator("details.gallery-disclosure");
  if (await disclosure.count() === 0) return; // Archive controls remain directly visible.
  if (await disclosure.getAttribute("open") === null) {
    await disclosure.locator("summary").click();
  }
  await expect(disclosure).toHaveAttribute("open", "");
}

async function expectInlineGalleryFrame(card, project, frame, screenSelector) {
  await openSelectedGallery(card);
  const screen = card.locator(screenSelector);
  const productCover = frame.portrait !== true &&
    !frame.companion && !frame.workflow && frame.width > frame.height &&
    /product-artwork$/.test(frame.sourceKind || "");
  expect(await screen.evaluate((element) => element.classList.contains("product-cover")),
    `${project.title}: only unpaired landscape product banners use the full composition frame`).toBe(productCover);
  if (productCover) {
    await expect(screen.locator(".visual-badge")).toBeHidden();
    await expect(screen.locator(".preview-arrow")).toBeHidden();
    const ratio = `${frame.width} / ${frame.height}`;
    expect(await screen.evaluate((element) => element.style.getPropertyValue("--product-cover-ratio").trim())).toBe(ratio);
    const aspectError = await screen.evaluate((element, heightPerWidth) => {
      const box = element.getBoundingClientRect();
      return Math.abs(box.height - box.width * heightPerWidth);
    }, frame.height / frame.width);
    expect(aspectError, `${frame.label}: the full cover frame retains the original image proportions`).toBeLessThanOrEqual(1);
  } else {
    expect(await screen.evaluate((element) => element.style.getPropertyValue("--product-cover-ratio").trim()),
      "Switching to an ordinary capture removes the artwork ratio").toBe("");
  }
  await expectLoadedImageToFit(screen.locator(".primary-screen"), frame);
  await expect(screen.locator(".companion-screen")).toHaveCount(frame.companion ? 1 : 0);
  if (frame.companion) {
    await expectLoadedImageToFit(screen.locator(".companion-screen"), frame.companion);
  }
  await expect(card.locator(".screen-caption")).toHaveText(frame.caption);
  if (screenSelector === ".archive-preview") {
    expect(await screen.evaluate((element) => element.classList.contains("source-overview")),
      `${project.title}: source diagrams keep their own layout when selected`).toBe(
      (frame.imageKind || project.imageKind) === "project-overview",
    );
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
  await expect(page.locator(".intro-description")).toHaveText(
    "Work directly with the developer designing, coding, and launching your website, app, or software.",
  );
  await expect(page.locator(".intro-description")).toBeVisible();
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
  await expect(page.locator(".project-card")).toHaveCount(featuredProjects.length);
  await expect(page.locator(".case-study")).toHaveCount(3);
  await expect(page.locator(".case-study .project-title")).toHaveText(featuredProjects.slice(0, 3).map((project) => project.title));
  await expect(page.locator(".supporting-grid .project-title")).toHaveText(featuredProjects.slice(3).map((project) => project.title));
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
  await expect(page.locator(".hero-app-previews img")).toHaveCount(2);
  await expect(page.locator(".hero-platform-previews .hero-platform-screen")).toHaveCount(3);
  for (const image of await page.locator(".hero-stage img, #featured-projects img").all()) {
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
  const website = projects.find((project) => project.id === "PinsAndNeedlesComedyWebsite");
  const websiteCard = page.locator(`.supporting-card[data-supporting-id="${website.id}"]`);
  await expect(websiteCard.locator(".visual-badge")).toHaveText(website.badge);
  await expect(websiteCard.locator(".project-visual img")).toHaveAttribute("src", "./assets/readme-overviews/pins-and-needles.png");
  await expect(websiteCard.locator(".project-visual img")).toHaveAttribute("alt", /Pins.*Needles.*repository product artwork/i);
  await expect(websiteCard.locator(".project-visual")).toHaveClass(/product-cover/);
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

test("I Can Run A Show opens with repository artwork and preserves paired native workspace context", async ({ page }) => {
  const project = projects.find((entry) => entry.id === "Showrunner-ICanRunAShow");
  await page.goto("/#project-archive");
  const selected = page.locator(`.case-study[data-case-id="${project.id}"]`);
  const archive = page.locator(`.archive-card[data-showcase-id="${project.id}"]`);
  const cover = project.gallery[0];
  expect(cover.sourceKind).toBe("repository-product-artwork");
  for (const [card, screen] of [[selected, ".case-screen"], [archive, ".archive-preview"]]) {
    const choices = card.locator("button[data-gallery][data-screen]");
    await expect(choices).toHaveCount(13);
    await expect(choices).toHaveText([
      "Product overview", "Workspace & cues", "Show planning", "Contracts & cues", "Mobile workspace",
      "Performer directory", "Stage remote", "Every show", "Run the show", "Run of show",
      "Show page", "Rolodex overview", "Stage remote overview",
    ]);
    await expect(choices.first()).toHaveAttribute("aria-pressed", "true");
    await expectInlineGalleryFrame(card, project, cover, screen);
  }
  await expect(archive.locator(".image-kind")).toHaveText("Repository product artwork");
  await expect(archive.locator(".preview-context")).toHaveText("Repository promotional artwork · Illustrative sample data");
  const native = project.gallery.find((frame) => frame.label === "Workspace & cues");
  expect(native.sourceKind).toBe("repository-app-capture");
  expect(native.companion).toBeDefined();
  const nativeChoice = archive.locator(".archive-gallery").getByRole("button", { name: native.label, exact: true });
  await nativeChoice.scrollIntoViewIfNeeded();
  await nativeChoice.focus();
  await page.keyboard.press("Enter");
  await expect(nativeChoice).toBeFocused();
  await expect(nativeChoice).toHaveAttribute("aria-pressed", "true");
  await expectInlineGalleryFrame(archive, project, native, ".archive-preview");
  await expect(archive.locator(".image-kind")).toHaveText("App screenshot");
  await expect(archive.locator(".preview-context")).toHaveText("Repository app capture · Sample show");
  const coverChoice = archive.locator(".archive-gallery").getByRole("button", { name: "Product overview", exact: true });
  await coverChoice.focus();
  await page.keyboard.press("Space");
  await expect(coverChoice).toBeFocused();
  await expect(coverChoice).toHaveAttribute("aria-pressed", "true");
  await expect(archive.locator('[data-gallery][aria-pressed="true"]')).toHaveCount(1);
  await expectInlineGalleryFrame(archive, project, cover, ".archive-preview");
  await expect(archive.locator(".image-kind")).toHaveText("Repository product artwork");
  await expect(selected.locator('[data-gallery][aria-pressed="true"]')).toHaveText("Product overview");
  await expect(selected.locator(".primary-screen")).toHaveAttribute("src", cover.image);
  const trigger = selected.locator(".case-screen");
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(project.title);
  await expect(dialog.getByRole("button", { name: "Close project details" })).toBeFocused();
  await expectLoadedImageToFit(dialog.locator(".primary-screen"), cover);
  await expect(dialog.locator(".companion-screen")).toHaveCount(0);
  await expect(dialog.locator('[data-dialog-screen][aria-pressed="true"]')).toHaveText("Product overview");
  await expect(dialog.locator(".dialog-image-caption")).toHaveText(cover.caption);
  await expect(dialog.locator(".image-original")).toHaveAttribute("href", cover.image);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the homepage gives clients clear next steps while keeping optional project screens compact", async ({ page }, testInfo) => {
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
  await expect(page.locator("#process").getByRole("heading", { level: 2 })).toHaveText("Your idea. A clear way forward.");
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

  const cards = page.locator("#featured-projects .project-card");
  await expect(cards).toHaveCount(featuredProjects.length);
  await expect(cards.locator(".project-title")).toHaveText(featuredProjects.map((project) => project.title));
  await expect(page.locator("#featured-projects details.gallery-disclosure:not([open])")).toHaveCount(featuredProjects.length);
  for (const project of featuredProjects) {
    const card = cards.filter({ has: page.locator(`.project-visual[data-project="${project.id}"]`) });
    const disclosure = card.locator("details.gallery-disclosure");
    const summary = disclosure.locator("summary");
    const choices = disclosure.locator("button[data-gallery][data-screen]");
    await expect(summary).toHaveText(`Browse ${project.gallery.length} screens +`);
    await expect(choices.first()).toBeHidden();
    const story = card.getByRole("link", { name: `View project: ${project.title}`, exact: true });
    await expect(story).toBeVisible();
    await expect(story).toHaveText("View project ↗");
    await expect(story).toHaveAttribute("href", project.caseUrl);
    await expect(card.locator(".project-links > :first-child")).toHaveClass(/case-page-link/);
    const more = card.locator("details.project-more");
    const moreLinks = more.locator(".project-more-links");
    const capabilityTags = moreLinks.locator(".capability-tags .tag");
    const tagTexts = (project.demonstrates || project.stack).slice(0, 3);
    await expect(card.locator(".capability-tags .tag")).toHaveCount(3);
    await expect(capabilityTags).toHaveText(tagTexts);
    const isLeadStory = featuredProjects.indexOf(project) < 3;
    const overview = card.locator(".project-description, .project-visual .primary-screen, .case-highlights li, .project-workflows li");
    await expect(overview).toHaveCount(2 + (isLeadStory ? project.highlights.length : project.workflows.length));
    await expect(card.locator(".project-description")).toHaveText(isLeadStory
      ? project.clientSummary || project.summary
      : project.purpose || project.clientSummary || project.summary);
    if (isLeadStory) await expect(card.locator(".case-highlights strong")).toHaveText(project.highlights.map((item) => item.title));
    else await expectProjectWorkflows(card, project);
    await expect(more).not.toHaveAttribute("open", "");
    await expect(moreLinks).toBeHidden();
    for (const tag of await capabilityTags.all()) await expect(tag).toBeHidden();
    for (const item of await overview.all()) await expect(item).toBeVisible();
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(disclosure).toHaveAttribute("open", "");
    await expect(summary).toBeFocused();
    await expect(choices).toHaveCount(project.gallery.length);
    await choices.last().focus();
    await page.keyboard.press("Space");
    await expect(choices.last()).toBeFocused();
    await expect(choices.last()).toHaveAttribute("aria-pressed", "true");
    const screen = project === featuredProjects[0] || project === featuredProjects[1] || project === featuredProjects[2]
      ? ".case-screen" : ".supporting-screen";
    await expectInlineGalleryFrame(card, project, project.gallery.at(-1), screen);
    await summary.focus();
    await page.keyboard.press("Space");
    await expect(disclosure).not.toHaveAttribute("open", "");
    await expect(choices.last()).toBeHidden();
    await expect(card.locator(".project-visual .primary-screen")).toHaveAttribute("src", project.gallery.at(-1).image);
    await more.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(more).toHaveAttribute("open", "");
    await expect(more.locator("summary")).toBeFocused();
    await expect(more.getByRole("button", { name: `Quick preview for ${project.title}`, exact: true })).toBeVisible();
    for (const tag of await capabilityTags.all()) await expect(tag).toBeVisible();
    for (const item of await overview.all()) await expect(item).toBeVisible();
    const source = more.getByRole("link", { name: project.codeAvailable === false ? "Project repository" : "Source code", exact: true });
    await expect(source).toBeVisible();
    await expect(source).toHaveAttribute("href", project.repoUrl);
    await more.locator("summary").focus();
    await page.keyboard.press("Space");
    await expect(more).not.toHaveAttribute("open", "");
    await expect(more.locator("summary")).toBeFocused();
    await expect(moreLinks).toBeHidden();
    for (const tag of await capabilityTags.all()) await expect(tag).toBeHidden();
    for (const item of await overview.all()) await expect(item).toBeVisible();
  }
  await expect(page.locator("#featured-projects details.gallery-disclosure[open]")).toHaveCount(0);
  await cards.first().getByRole("link", { name: `View project: ${featuredProjects[0].title}`, exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(featuredProjects[0].title);
});

test("BriefBooth is featured as a real product and opens its own story without starting a booking", async ({ page }) => {
  const project = projects.find((entry) => entry.id === "BriefBooth.com");
  expect(featuredProjects[0]).toBe(project);
  await page.goto("/");
  const firstStory = page.locator("#featured-projects .case-study").first();
  await expect(firstStory).toHaveAttribute("data-case-id", project.id);
  await expect(firstStory.locator(".project-title")).toHaveText("BriefBooth");
  await expect(firstStory.locator(".case-highlights li strong")).toHaveText(project.highlights.map((item) => item.title));
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
  await expect(services.locator("article.service-item")).toHaveCount(3);

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
    "Tell me the problem",
    "Agree scope, price, and timing",
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
  await expect(faqSection.locator("details.faq-item")).toHaveCount(6);
  await expect(faqSection.locator(".faq-item:not(details)")).toHaveCount(0);
  expect(await faqSection.evaluate((element) => Boolean(
    element.compareDocumentPosition(document.querySelector("#contact")) & Node.DOCUMENT_POSITION_FOLLOWING,
  )), "Project questions precede contact").toBe(true);
  const answers = [
    ["What if my idea isn’t finished?", "That’s fine. Start with the problem you want to solve. We can work out the details together."],
    ["How is pricing worked out?", "Pricing depends on scope, features, and complexity. We’ll agree what’s included and the price before building."],
    ["Does a consultation commit me to a project?", /No\..*scope, price, start date, and target launch in writing/],
    ["What happens after launch?", "We’ll discuss who maintains it and any hosting/service costs when defining the project."],
    ["What if I only need a website?", "That’s a complete project too. I can build a straightforward site for your services, location, work, and contact details. We’ll choose the pages and features your business needs. Explore website services ↗"],
    ["Who owns the code, and will my project be public?", "All custom code I build for your project is 100% yours. Client work and code will never appear in my public portfolio without your permission. The projects shown here are selected personal projects."],
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
    const faqSummaries = page.locator("#project-faq .faq-item summary");
    for (const summary of await faqSummaries.all()) {
      await summary.click();
    }
    await expect(page.locator("#project-faq details[open]")).toHaveCount(await faqSummaries.count());
    for (const selected of await page.locator("#featured-projects .project-card").all()) {
      await openSelectedGallery(selected);
    }
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
  expect(total).toBe(projects.length);
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
  const engineering = page.locator('[data-filter="tools"]');
  await expect(engineering).toHaveText("Engineering");
  await engineering.click();
  await expect(engineering).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".archive-card")).toHaveCount(1);
  await expect(page.locator(".archive-card h3")).toHaveText("SobStage");
  await expect(page.locator(".archive-card .preview-context")).toContainText(/release candidate/i);
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
  await expect(page.locator("#result-count")).toHaveText(`1 OF ${projects.length} PROJECTS`);
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
  await expect(page.locator(".archive-card")).toHaveCount(projects.length);
  await expect(page.locator("#result-count")).toHaveText(`${projects.length} OF ${projects.length} PROJECTS`);
});

test("all published archive projects explain their purpose and workflows with genuine icons and accurately labeled covers", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#project-archive");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".archive-card")).toHaveCount(projects.length);
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
    await expect(card.locator(".preview-context")).toHaveText(project.gallery[0].previewContext || project.previewContext);
    await expect(card.locator(".image-kind")).toHaveText(project.gallery[0].imageLabel || project.imageLabel);
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
    await expect(card.getByRole("link", { name: project.codeAvailable === false ? "Project repository" : "Source", exact: true })).toHaveAttribute("href", project.repoUrl);
    if (project.demoUrl) {
      const liveLink = card.getByRole("link", { name: project.demoLabel, exact: true });
      await expect(liveLink).toBeVisible();
      await expect(liveLink).toHaveAttribute("href", project.demoUrl);
      await expect(liveLink).toHaveAttribute("target", "_blank");
      await expect(liveLink).toHaveAttribute("rel", /noopener/);
    }
    const story = card.getByRole("link", { name: `View project: ${project.title}`, exact: true });
    await expect(story).toHaveAttribute("href", project.caseUrl);
    await expect(story).toHaveText("View project ↗");
    await expect(story).toBeVisible();
    await expect(card.locator(".project-links > a")).toHaveCount(project.demoUrl ? 3 : 2);
  }
  expect(errors).toEqual([]);
});

test("removed repositories stay out of archive, search and hero while public source and live-site links remain available", async ({ page }) => {
  const publicProject = projects.find((project) => project.id === "PinsAndNeedlesComedyWebsite");
  expect(publicProject.sourceAvailable).toBe(true);
  expect(publicProject.repoUrl).toBe("https://github.com/taylordrew4u2/PinsAndNeedlesComedyWebsite");
  expect(publicProject.demoUrl).toBe("https://pinsandneedlescomedy.com");

  await page.goto("/#project-archive");
  expect(projects.length).toBe(10);
  await expect(page.locator("#archive-title")).toHaveText("Explore 10 selected projects");
  await expect(page.locator(".archive-card")).toHaveCount(projects.length);
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
  for (const asset of ["markvegas.webp", "controller-live-loaded.webp", "staybusy-overview-mono.svg", "readme-overviews/rolecall.png",
    "readme-overviews/bleepkit.png", "readme-overviews/dictype.png", "tlc-homepage.webp"]) {
    const response = await page.request.get(`/assets/${asset}`);
    expect(response.status(), `${asset}: removed project media is not deployed`).toBe(404);
  }
  const search = page.getByRole("searchbox");
  for (const id of removedProjectIds) {
    await search.fill(id);
    await expect(page.locator(".archive-card")).toHaveCount(0);
    await expect(page.locator("#result-count")).toHaveText(`0 OF ${projects.length} PROJECTS`);
  }
  await search.fill("");
  await expect(page.locator(".archive-card")).toHaveCount(projects.length);

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

// Each complete gallery is a separate user flow, with its own normal timeout.
for (const project of projects) {
  test(`${project.title} dialog keeps images, caption, full-size link, and focus in sync`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/#project-archive");
    const dialog = page.getByRole("dialog");
    const trigger = page.locator(`.archive-preview[data-project="${project.id}"]`);
    await trigger.click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(project.title);
    await expect(dialog.getByRole("button", { name: "Close project details" })).toBeFocused();
    await expectProjectIcon(dialog, project);
    await expect(dialog.locator(".dialog-summary")).toBeVisible();
    await expect(dialog.locator(".dialog-summary")).toHaveText(project.purpose);
    await expectProjectWorkflows(dialog, project);
    const fullStory = dialog.getByRole("link", { name: `View project: ${project.title}`, exact: true });
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
      await expect(page.locator("#result-count")).toHaveText(`${projects.length} OF ${projects.length} PROJECTS`);
      await expect(page.locator("#project-search")).toHaveValue("");
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
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(navigation).toBeHidden();
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
  await expect(page).toHaveURL(/#work$/);
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
  ];
  await expect(page.locator(".service-item")).toHaveCount(3);
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

test("case studies show the need, build evidence, and a project-specific inquiry", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.locator(".archive-disclosure summary").click();
  await page.locator('.archive-card[data-showcase-id="PinsAndNeedlesComedyWebsite"]')
    .getByRole("button", { name: "Pins & Needles Comedy", exact: true }).click();
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
  expect(draft.searchParams.get("body")).toMatch(/^Hi 4u Digital,\n\n/);
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
    await openSelectedGallery(story);
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
  await openSelectedGallery(card);
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

for (const id of ["Bill-Spilt", "PinsAndNeedlesComedyWebsite"]) {
  const project = projects.find((entry) => entry.id === id);
  test(`${project.title} has a complete on-page showcase with keyboard gallery controls`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    const card = page.locator(`.supporting-card[data-supporting-id="${project.id}"]`);
    await openSelectedGallery(card);
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
    const gallerySteps = project.gallery[0].image.startsWith("./assets/readme-overviews/")
      ? [...new Set([0, 1, project.gallery.length - 1])] : [0, project.gallery.length - 1];
    for (const [order, index] of gallerySteps.entries()) {
      const choice = choices.nth(index);
      await choice.scrollIntoViewIfNeeded();
      await choice.focus();
      await page.keyboard.press(order % 2 === 0 ? "Enter" : "Space");
      await expect(choice).toBeFocused();
      await expect(choice).toHaveAttribute("aria-pressed", "true");
      await expect(card.locator('[data-gallery][aria-pressed="true"]')).toHaveCount(1);
      await expectInlineGalleryFrame(card, project, project.gallery[index], ".archive-preview");
      await expect(page.locator("#result-count")).toHaveText(`${projects.length} OF ${projects.length} PROJECTS`);
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
  await openSelectedGallery(selectedCard);
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
  await expect(page.locator(".archive-card")).toHaveCount(projects.length);
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
      await openSelectedGallery(card);
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
    const fit = await page.evaluate((supportingCount) => {
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
        completeSupportingShowcases: [...document.querySelectorAll(".supporting-card.has-gallery")].length === supportingCount &&
          [...document.querySelectorAll(".supporting-card.has-gallery")].every((card) =>
            Math.abs(card.getBoundingClientRect().width - gridWidth) <= 1),
        orderedNarrowCaseSections: window.innerWidth > 800 || [...document.querySelectorAll(".case-study")].every((card) => {
          const media = card.querySelector(".case-media").getBoundingClientRect();
          const header = card.querySelector(".case-header").getBoundingClientRect();
          const proof = card.querySelector(".case-proof").getBoundingClientRect();
          return header.top >= media.bottom - 1 && proof.top >= header.bottom - 1;
        }),
      };
    }, featuredProjects.length - 3);
    expect(fit).toEqual({
      page: true, controls: true, media: true,
      completeSupportingShowcases: true, orderedNarrowCaseSections: true,
    });
    await expect(page.getByRole("dialog")).toBeHidden();
  });
}
