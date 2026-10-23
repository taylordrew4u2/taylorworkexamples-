import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";

const shortcutLabel = "Know what you want? Open the optional project planner";
const example = projects.find((project) => project.id === "The-Bit-Binder");
const marketingRoutes = [
  "/",
  "/services/salon-booking-app-development/",
  "/contact/",
  example.caseUrl,
];

function plannerShortcut(page) {
  return page.getByRole("link", { name: shortcutLabel, exact: true });
}

async function expectAccessibleShortcut(page) {
  const shortcut = plannerShortcut(page);
  await expect(shortcut).toHaveClass(/\bplanner-shortcut\b/);
  await expect(shortcut).toBeVisible();
  await expect(shortcut).toBeInViewport({ ratio: 1 });
  await expect(shortcut).toContainText("Know what you want?");
  await expect(shortcut).toContainText("Project planner");
  const href = await shortcut.getAttribute("href");
  expect(href, "The shortcut works on the primary domain and the GitHub Pages mirror")
    .not.toMatch(/^(?:https?:)?\/\//);
  expect(new URL(href, page.url()).pathname).toBe("/project-brief/");
  await expect(shortcut).not.toHaveAttribute("target", "_blank");
  await expect(shortcut).toHaveCSS("position", "fixed");
  const bounds = await shortcut.boundingBox();
  const viewport = page.viewportSize();
  expect(bounds.width, "The planner target is wide enough to tap").toBeGreaterThanOrEqual(44);
  expect(bounds.height, "The planner target is tall enough to tap").toBeGreaterThanOrEqual(44);
  expect(bounds.x, "The shortcut stays inside the left edge").toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width, "The shortcut stays inside the right edge")
    .toBeLessThanOrEqual(viewport.width);
  expect(bounds.y + bounds.height, "The shortcut stays inside the bottom edge")
    .toBeLessThanOrEqual(viewport.height);
  expect(await shortcut.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const target = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return target === element || element.contains(target);
  }), "The visible planner shortcut can be tapped directly").toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    "The floating controls do not create horizontal scrolling").toBe(true);
  return shortcut;
}

async function expectMobileControlsSeparated(page) {
  const shortcut = await expectAccessibleShortcut(page);
  const dock = page.getByRole("complementary", { name: "Consultation booking", exact: true });
  await expect(dock).toBeInViewport({ ratio: 1 });
  const booking = dock.getByRole("link", { name: /^Book a consultation/ });
  await expect(booking).toHaveAttribute("href", "https://briefbooth.com/book/4u-digital");
  const shortcutBounds = await shortcut.boundingBox();
  const dockBounds = await dock.boundingBox();
  const bookingBounds = await booking.boundingBox();
  for (const [label, bounds] of [["Planner", shortcutBounds], ["Booking", bookingBounds]]) {
    expect(bounds.x, `${label} stays inside the consultation dock's left edge`)
      .toBeGreaterThanOrEqual(dockBounds.x);
    expect(bounds.x + bounds.width, `${label} stays inside the consultation dock's right edge`)
      .toBeLessThanOrEqual(dockBounds.x + dockBounds.width);
    expect(bounds.y, `${label} stays inside the consultation dock's top edge`)
      .toBeGreaterThanOrEqual(dockBounds.y);
    expect(bounds.y + bounds.height, `${label} stays inside the consultation dock's bottom edge`)
      .toBeLessThanOrEqual(dockBounds.y + dockBounds.height);
  }
  expect(shortcutBounds.x + shortcutBounds.width,
    "The planner occupies the dock's left slot and does not overlap booking")
    .toBeLessThanOrEqual(bookingBounds.x);
  expect(Math.min(shortcutBounds.y + shortcutBounds.height, bookingBounds.y + bookingBounds.height),
    "Both actions share one compact horizontal dock")
    .toBeGreaterThan(Math.max(shortcutBounds.y, bookingBounds.y));
  expect(bookingBounds.height, "Booking remains a separate, full-size tap target")
    .toBeGreaterThanOrEqual(44);
  expect(await booking.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const target = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return target === element || element.contains(target);
  }), "The planner never blocks the booking button").toBe(true);
}

for (const width of [390, 320]) {
  for (const route of marketingRoutes) {
    test(`the optional planner is reachable without covering booking at ${width}px on ${route}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(route);
      await expectMobileControlsSeparated(page);
      await page.evaluate(async () => {
        await document.fonts.ready;
        scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
      });
      await expectMobileControlsSeparated(page);
      const shortcut = plannerShortcut(page);
      await shortcut.focus();
      await expect(shortcut).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/project-brief\/$/);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your project planner.");
      await expect(page.locator(".page-intro")).toContainText("No account or consultation booking is needed.");
      await expect(page.locator(".planner-shortcut")).toHaveCount(0);
    });
  }
}

for (const javaScriptEnabled of [true, false]) {
  test.describe(`native planner shortcut with JavaScript ${javaScriptEnabled ? "enabled" : "disabled"}`, () => {
    test.use({ javaScriptEnabled });

    test("a desktop visitor can open the planner from the floating link", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto("/contact/");
      const shortcut = await expectAccessibleShortcut(page);
      const bounds = await shortcut.boundingBox();
      expect(bounds.x, "The desktop shortcut sits toward the right edge").toBeGreaterThan(1000);
      expect(bounds.y, "The desktop shortcut sits toward the bottom edge").toBeGreaterThan(700);
      await shortcut.focus();
      await expect(shortcut).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/project-brief\/$/);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your project planner.");
    });

    test("the narrow-screen link leaves booking reachable without script assistance", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 844 });
      await page.goto("/services/salon-booking-app-development/");
      await expectMobileControlsSeparated(page);
    });

    test("native text and selection controls take priority over the floating planner", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/contact/");
      await expectAccessibleShortcut(page);
      // These local-only controls exercise the software keyboard rules without
      // creating or sending any real intake or consultation form.
      await page.locator("main").evaluate((main) => {
        const probe = document.createElement("section");
        probe.dataset.plannerFocusProbe = "";
        for (const tag of ["input", "textarea", "select"]) {
          const control = document.createElement(tag);
          control.setAttribute("aria-label", `Planner focus check: ${tag}`);
          if (tag === "select") control.add(new Option("Example", "example"));
          probe.append(control);
        }
        main.append(probe);
      });
      const probe = page.locator("[data-planner-focus-probe]");
      try {
        for (const tag of ["input", "textarea", "select"]) {
          const control = probe.locator(tag);
          await control.focus();
          await expect(control).toBeFocused();
          await expect(plannerShortcut(page)).toBeHidden();
          await control.evaluate((element) => element.blur());
          await expect(plannerShortcut(page)).toBeVisible();
        }
      } finally {
        await probe.evaluate((element) => element.remove());
      }
    });
  });
}

test("the planner shortcut stays behind project details and returns when they close", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expectAccessibleShortcut(page);
  await page.locator(`.hero-project[data-project="${example.id}"]`).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(plannerShortcut(page)).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expectAccessibleShortcut(page);
});

test("the planner shortcut does not compete with planner, kickoff, or privacy pages", async ({ page }) => {
  for (const route of ["/project-brief/", "/project-kickoff/", "/privacy/"]) {
    await page.goto(route);
    await expect(page.locator(".planner-shortcut")).toHaveCount(0);
  }
});
