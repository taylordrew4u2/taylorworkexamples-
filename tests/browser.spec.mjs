import { test, expect } from "@playwright/test";
import { projects } from "../projects.js";

async function expectLoadedImageToFit(image, expected) {
  await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate((element) =>
    element.complete && element.naturalWidth > 0 && element.naturalHeight > 0,
  )).toBe(true);
  await expect(image).toHaveAttribute("src", expected.image);
  await expect(image).toHaveAttribute("alt", expected.imageAlt);
  await expect(image).toHaveAttribute("width", String(expected.width));
  await expect(image).toHaveAttribute("height", String(expected.height));
  const geometry = await image.evaluate((element) => {
    const frame = element.closest(".archive-preview, .dialog-preview, .case-screen, .project-visual");
    const imageBox = element.getBoundingClientRect();
    const frameBox = frame.getBoundingClientRect();
    return {
      naturalWidth: element.naturalWidth,
      naturalHeight: element.naturalHeight,
      fit: getComputedStyle(element).objectFit,
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
  expect(geometry.width).toBeGreaterThan(0);
  expect(geometry.height).toBeGreaterThan(0);
  expect(geometry.inside, `${expected.image} fits its preview frame`).toBe(true);
  expect(await image.page().evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth,
  )).toBe(true);
}

test("portfolio renders, previews load, and the page fits the viewport", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /From idea\s+to real life/i,
  );
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
  await expect(calendarCard.locator("img")).toHaveAttribute("src", /gigcalendar-native-calendar\.webp/);
  await expect(calendarCard.locator("img")).toHaveAttribute("alt", /native iPhone/i);
  const roleCard = page.locator(".supporting-card").filter({
    has: page.getByRole("button", { name: "RoleCall", exact: true }),
  });
  await expect(roleCard.locator(".visual-badge")).toHaveText("DEV PREVIEW");
  await expect(roleCard.locator("img")).toHaveAttribute("src", /rolecall-shots-capture\.(webp|png)$/);
  await expect(roleCard.locator("img")).toHaveAttribute("alt", /shot list.*fictional.*sample/i);
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

test("hero previews open the matching website and native iPhone project", async ({
  page,
}) => {
  await page.goto("/");
  const previews = [
    ["View the Mark Vegas website project", "Mark Vegas Art Portfolio"],
    ["View the My Gig Calendar iPhone app project", "My Gig Calendar"],
  ];
  const dialog = page.getByRole("dialog");
  for (const [label, title] of previews) {
    const trigger = page.getByRole("button", { name: label, exact: true });
    await trigger.click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(title);
    await expect(page.getByRole("button", { name: "Close project details" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
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
  expect(total).toBe(24);
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
  await expect(page.locator(".archive-card")).toHaveCount(24);
  await expect(page.locator("#result-count")).toHaveText("24 OF 24 PROJECTS");
});

test("all 24 archive covers load, fit their frames, and disclose the kind of image", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#project-archive");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".archive-card")).toHaveCount(24);
  await expect(page.locator(".archive-placeholder")).toHaveCount(0);
  for (const project of projects) {
    const preview = page.locator(`.archive-preview[data-project="${project.id}"]`);
    const card = preview.locator("..");
    await expect(preview).toHaveAccessibleName(`View images and details for ${project.title}`);
    await expect(card.locator("h3")).toHaveText(project.title);
    await expect(card.locator(".image-kind")).toHaveText(project.imageLabel);
    await expect(preview.locator("img")).toHaveCount(1);
    await expectLoadedImageToFit(preview.locator("img"), {
      image: project.image,
      imageAlt: project.imageAlt,
      width: project.imageWidth,
      height: project.imageHeight,
    });
    if (project.sourceAvailable === false) {
      await expect(card.locator(".source-note")).toHaveText("Source not public");
      await expect(card.getByRole("link", { name: "Source", exact: true })).toHaveCount(0);
    } else {
      await expect(card.getByRole("link", { name: "Source", exact: true })).toHaveAttribute("href", project.repoUrl);
    }
  }
  expect(errors).toEqual([]);
});

test("unavailable source stays noninteractive while live-site and public source links remain available", async ({ page }) => {
  const earlierProject = projects.find((project) => project.id === "markvegas");
  const publicProject = projects.find((project) => project.id === "Showrunner-ICanRunAShow");
  expect(earlierProject.sourceAvailable).toBe(false);
  expect(earlierProject.demoUrl).toBe("https://markvegas.vercel.app");
  expect(publicProject.sourceAvailable).toBe(true);
  expect(publicProject.repoUrl).toBe("https://github.com/taylordrew4u2/Showrunner-ICanRunAShow");

  await page.goto("/#project-archive");
  const earlierPreview = page.locator(`.archive-preview[data-project="${earlierProject.id}"]`);
  const earlierCard = earlierPreview.locator("..");
  await expect(earlierCard.locator(".source-note")).toHaveText("Source not public");
  await expect(earlierCard.locator('a[href*="github.com"]')).toHaveCount(0);

  await earlierPreview.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(earlierProject.title);
  await expect(dialog.locator(".dialog-source .source-note")).toHaveText("Source not public");
  await dialog.locator(".technical-details summary").click();
  await expect(dialog.locator(".technical-content .source-note")).toBeVisible();
  await expect(dialog.locator(".technical-content .source-note")).toHaveText("Source not public");
  await expect(dialog.locator('a[href*="github.com"]')).toHaveCount(0);
  const liveSite = dialog.getByRole("link", { name: earlierProject.demoLabel, exact: true });
  await expect(liveSite).toBeVisible();
  await expect(liveSite).toHaveAttribute("href", earlierProject.demoUrl);
  await expect(liveSite).toHaveAttribute("target", "_blank");
  await expect(liveSite).toHaveAttribute("rel", /noopener/);
  await page.keyboard.press("Escape");

  const publicPreview = page.locator(`.archive-preview[data-project="${publicProject.id}"]`);
  const publicCard = publicPreview.locator("..");
  await expect(publicCard.locator(".source-note")).toHaveCount(0);
  await expect(publicCard.getByRole("link", { name: "Source", exact: true })).toHaveAttribute("href", publicProject.repoUrl);
  await publicPreview.click();
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(publicProject.title);
  await expect(dialog.locator(".source-note")).toHaveCount(0);
  await expect(dialog.getByRole("link", { name: "Project documentation", exact: true })).toHaveAttribute("href", publicProject.documentationUrl);
  await dialog.locator(".technical-details summary").click();
  await expect(dialog.getByRole("link", { name: "View source code", exact: true })).toHaveAttribute("href", publicProject.repoUrl);
});

test("every project dialog shows its images and keeps gallery, caption, full-size link, and focus in sync", async ({ page }) => {
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
      await expect(page.locator("#result-count")).toHaveText("24 OF 24 PROJECTS");
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
    "mailto:taylordrew4u@gmail.com",
  );
  await page.getByRole("button", { name: "Copy email address" }).click();
  await expect(page.locator("#copy-status")).toHaveText(
    "Email address copied to clipboard.",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "taylordrew4u@gmail.com",
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
    "taylordrew4u@gmail.com",
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
    expect(draft.pathname).toBe("taylordrew4u@gmail.com");
    expect(draft.searchParams.get("subject")).toBe("Website or app project");
    expect(draft.searchParams.get("body")).toContain(
      "I'm looking for help with a website or app.",
    );
    expect(draft.searchParams.get("body")).toContain(inquiryPrompts);
  }

  const services = [
    ["website", "Website project", "a website"],
    ["web-app", "Web application project", "a web application"],
    ["ios", "iOS app project", "an iOS app"],
  ];
  await expect(page.locator(".service-item")).toHaveCount(3);
  for (const [topic, subject, description] of services) {
    const service = page.locator(`.service-item[data-enquiry="${topic}"]`);
    await service.scrollIntoViewIfNeeded();
    await expect(service).toBeVisible();
    const draft = new URL(await service.getAttribute("href"));
    expect(draft.pathname).toBe("taylordrew4u@gmail.com");
    expect(draft.searchParams.get("subject")).toBe(subject);
    expect(draft.searchParams.get("body")).toContain(
      `I'm looking for help with ${description}.`,
    );
    expect(draft.searchParams.get("body")).toContain(inquiryPrompts);
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
  expect(draft.pathname).toBe("taylordrew4u@gmail.com");
  expect(draft.searchParams.get("subject")).toBe(
    "Project inspired by Pins & Needles Comedy",
  );
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

test("lead galleries change real images, captions, and selection without opening a modal", async ({
  page,
}) => {
  await page.goto("/");
  for (const story of await page.locator(".case-study").all()) {
    const title = (await story.locator(".project-title").textContent()).trim();
    const group = story.getByRole("group", { name: `Screens from ${title}`, exact: true });
    const choices = group.locator("button[data-gallery][data-screen]");
    const count = await choices.count();
    expect(count).toBeGreaterThanOrEqual(2);
    await expect(choices.nth(0)).toHaveAttribute("aria-pressed", "true");
    await expect(group.locator('[aria-pressed="true"]')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const initialSource = await story.locator(".primary-screen").getAttribute("src");
    const initialCaption = await story.locator(".screen-caption").textContent();
    await expect(story.locator(".screen-caption")).toHaveAttribute("aria-live", "polite");
    for (let index = 1; index < count; index += 1) {
      await choices.nth(index).click();
      await expect(choices.nth(index)).toHaveAttribute("aria-pressed", "true");
      await expect(choices.nth(0)).toHaveAttribute("aria-pressed", "false");
      await expect(group.locator('[aria-pressed="true"]')).toHaveCount(1);
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
  }
  await expect(page.locator('[data-case-id="The-Bit-Binder"] .screen-caption')).toHaveText(
    projects.find((project) => project.id === "The-Bit-Binder").gallery[0].caption,
  );
});
