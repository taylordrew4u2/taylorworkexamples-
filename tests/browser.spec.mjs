import { test, expect } from "@playwright/test";

test("portfolio renders, previews load, and the page fits the viewport", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /Websites\.\s+Apps/i,
  );
  await expect(page.locator(".project-card")).toHaveCount(6);
  for (const image of await page.locator("#featured-projects img").all()) {
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
  if (testInfo.project.name === "desktop") {
    for (const row of await page.locator(".project-row").all()) {
      const tracks = await row.locator(".project-card").evaluateAll((cards) =>
        [".project-visual", ".project-tags", ".project-links"].map(
          (selector) => ({
            selector,
            tops: cards.map(
              (card) =>
                card.querySelector(selector).getBoundingClientRect().top,
            ),
          }),
        ),
      );
      for (const { selector, tops } of tracks) {
        expect(tops, `Both cards have a ${selector} track`).toHaveLength(2);
        expect(
          Math.abs(tops[0] - tops[1]),
          `Peer ${selector} top alignment`,
        ).toBeLessThanOrEqual(1);
      }
    }
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: testInfo.outputPath(`portfolio-${testInfo.project.name}.png`),
    fullPage: true,
  });
  await page.screenshot({
    path: testInfo.outputPath(`portfolio-${testInfo.project.name}-intro.png`),
  });
  const controls = page.locator(".project-visual");
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
      .locator("img")
      .evaluate((element) => getComputedStyle(element).transform);
    await expectStaticControlOnHover(control);
    expect(
      await control
        .locator("img")
        .evaluate((element) => getComputedStyle(element).transform),
    ).toBe(restingTransform);
  }
});

test("all projects are visible and filters, searches, empty state, and reset work together", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#project-archive")).toBeVisible();
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
    expect(draft.searchParams.get("body")).toContain(
      "Company/project:\nWhat I need:\nExisting website (if any):\nTarget launch date:",
    );
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
  }
});

test("case studies show the need, build evidence, and a project-specific inquiry", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Explore Pins & Needles Comedy", exact: true })
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
    expect((await paragraph.textContent()).trim().length).toBeGreaterThan(30);
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
