import { test, expect } from "@playwright/test";
import { bookingURL } from "../booking.js";

const routes = ["/", "/services/salon-booking-app-development/"];

function headerControls(page) {
  const header = page.locator(".site-header");
  return {
    header,
    toggle: header.getByRole("button", { name: /^(Open|Close) navigation$/, includeHidden: true }),
    navigation: header.getByRole("navigation", { name: "Main navigation", exact: true }),
  };
}

async function expectTapTarget(control, page) {
  await expect(control).toBeInViewport({ ratio: 1 });
  const box = await control.boundingBox();
  expect(box, "The navigation action has visible bounds").not.toBeNull();
  expect(box.height, "Navigation actions are at least 44px high").toBeGreaterThanOrEqual(44);
  expect(box.width, "Navigation actions are at least 44px wide").toBeGreaterThanOrEqual(44);
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
  expect(await control.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const hit = document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    return hit === element || element.contains(hit);
  }), "The action is not covered by another control").toBe(true);
}

async function openMenu(page) {
  const controls = headerControls(page);
  await expect(controls.toggle).toBeVisible();
  await expect(controls.navigation).toBeHidden();
  await controls.toggle.focus();
  await page.keyboard.press("Enter");
  await expect(controls.toggle).toHaveAttribute("aria-expanded", "true");
  await expect(controls.toggle).toHaveAccessibleName("Close navigation");
  await expect(controls.navigation).toBeVisible();
  return controls;
}

async function expectBookingContrast(booking) {
  const colors = await booking.evaluate((element) => {
    const style = getComputedStyle(element);
    return { text: style.color, background: style.backgroundColor };
  });
  const luminance = (color) => {
    const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map((value) => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const values = [luminance(colors.text), luminance(colors.background)].sort((a, b) => a - b);
  expect((values[1] + 0.05) / (values[0] + 0.05), "The booking label has readable text contrast")
    .toBeGreaterThanOrEqual(4.5);
}

for (const width of [320, 390]) {
  for (const route of routes) {
    test(`${width}px navigation reaches services, projects, and booking from ${route}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      // No real scheduler is loaded and no consultation request is created.
      await page.context().route(bookingURL, (request) => request.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<!doctype html><title>Local booking handoff</title><h1>Local booking handoff</h1>",
      }));
      await page.goto(route);
      let controls = await openMenu(page);
      await expect(controls.navigation.getByRole("link")).toHaveCount(3);
      await expectTapTarget(controls.toggle, page);
      const services = controls.navigation.getByRole("link", { name: "Services", exact: true });
      await expectTapTarget(services, page);
      await page.keyboard.press("Tab");
      await expect(services).toBeFocused();
      expect(await services.evaluate((element) => {
        const style = getComputedStyle(element);
        return (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0) || style.boxShadow !== "none";
      }), "Keyboard navigation has a visible focus indicator").toBe(true);
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/services\/$/);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      await page.goto(route);
      controls = await openMenu(page);
      const projects = controls.navigation.getByRole("link", { name: "Projects", exact: true });
      await expectTapTarget(projects, page);
      await projects.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/work\/$/);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      await page.goto(route);
      controls = await openMenu(page);
      const booking = controls.navigation.getByRole("link", { name: /^Book a consultation/ });
      await expectTapTarget(booking, page);
      await expectBookingContrast(booking);
      await expect(booking).toHaveAttribute("href", bookingURL);
      await expect(booking).toHaveAttribute("target", "_blank");
      const originalURL = page.url();
      await booking.focus();
      const pendingPopup = page.waitForEvent("popup");
      await page.keyboard.press("Enter");
      const popup = await pendingPopup;
      try {
        await expect(popup).toHaveURL(bookingURL);
        await expect(popup.getByRole("heading", { level: 1 })).toHaveText("Local booking handoff");
        await expect(page).toHaveURL(originalURL);
        await expect(controls.toggle).toHaveAttribute("aria-expanded", "false");
        await expect(controls.toggle).toBeFocused();
      } finally {
        await popup.close();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Navigation does not widen the page").toBe(true);
    });
  }
}

for (const route of routes) {
  test(`navigation dismisses predictably and keeps keyboard focus usable on ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    const controls = await openMenu(page);
    await page.keyboard.press("Tab");
    await expect(controls.navigation.getByRole("link").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(controls.navigation).toBeHidden();
    await expect(controls.toggle).toHaveAttribute("aria-expanded", "false");
    await expect(controls.toggle).toBeFocused();

    await controls.toggle.click();
    await expect(controls.navigation).toBeVisible();
    // This blank outer edge is outside both the header and its dropdown.
    await page.mouse.click(388, 650);
    await expect(controls.navigation).toBeHidden();
    await expect(controls.toggle).toHaveAccessibleName("Open navigation");

    await controls.toggle.click();
    await expect(controls.navigation).toBeVisible();
    await page.setViewportSize({ width: 901, height: 844 });
    await expect(controls.toggle).toBeHidden();
    await expect(controls.toggle).toHaveAttribute("aria-expanded", "false");
    await expect(controls.navigation).toBeVisible();
    const projects = controls.navigation.getByRole("link", { name: "Projects", exact: true });
    await projects.focus();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(controls.navigation).toBeHidden();
    await expect(controls.toggle).toBeFocused();
  });
}

test.describe("navigation without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  for (const width of [320, 390]) {
    for (const route of routes) {
      test(`${width}px fallback navigation remains usable from ${route}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.goto(route);
        const controls = headerControls(page);
        await expect(controls.toggle).toBeHidden();
        await expect(controls.navigation).toBeVisible();
        const projects = controls.navigation.getByRole("link", { name: "Projects", exact: true });
        const booking = controls.navigation.getByRole("link", { name: /^Book a consultation/ });
        await expect(projects).toBeVisible();
        await expect(booking).toBeVisible();
        await expect(booking).toHaveAttribute("href", bookingURL);
        await projects.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/\/work\/$/);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      });
    }
  }
});

test("a navigation script failure leaves the inner-page links available", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/navigation.js*", (route) => route.abort());
  await page.goto(routes[1]);
  const controls = headerControls(page);
  await expect(controls.toggle).toBeHidden();
  await expect(controls.navigation).toBeVisible();
  const projects = controls.navigation.getByRole("link", { name: "Projects", exact: true });
  await projects.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/work\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("the focused optional planner keeps its direct booking alternative", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/project-brief/");
  const header = page.locator(".site-header");
  await expect(header.getByRole("button", { name: /navigation/ })).toHaveCount(0);
  const booking = header.getByRole("link", { name: /^Book a consultation/ });
  await expectTapTarget(booking, page);
  await expect(booking).toHaveAttribute("href", bookingURL);
  await expect(page.locator(".mobile-consultation")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your project planner.");
});
