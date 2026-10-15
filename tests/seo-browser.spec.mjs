import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";
import { services, guide, projectSlugs, site } from "../seo-content.js";
import { articles } from "../seo-articles.js";
import { localConsultation } from "../seo-local.js";

test.use({ javaScriptEnabled: false });

async function linkTo(page, pathname) {
  const links = page.locator("a[href]");
  const index = await links.evaluateAll((elements, target) => elements.findIndex((element) =>
    new URL(element.getAttribute("href"), location.href).pathname === target), pathname);
  expect(index, `A real navigation link reaches ${pathname}`).toBeGreaterThanOrEqual(0);
  return links.nth(index);
}

async function expectPageFit(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    "The complete page fits the viewport").toBe(true);
  const controls = await page.locator(".page-nav a, .breadcrumbs, .page-actions a, .project-story-nav a, .project-build-cta a").evaluateAll((elements) =>
    elements.every((element) => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && box.left >= -1 && box.right <= window.innerWidth + 1;
    }));
  expect(controls, "Navigation and inquiry controls stay readable inside the viewport").toBe(true);
  expect(await page.evaluate(() => {
    const navigation = document.querySelector(".page-nav");
    const main = document.querySelector(".page-main");
    return !navigation || !main || navigation.getBoundingClientRect().bottom <= main.getBoundingClientRect().top + 1;
  }), "The page navigation sits above the content rather than covering its title").toBe(true);
}

async function expectOriginalImage(image, frame) {
  await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
  await expect(image).toHaveAttribute("alt", frame.imageAlt);
  await expect(image).toHaveAttribute("width", String(frame.width));
  await expect(image).toHaveAttribute("height", String(frame.height));
  await expect(image).toHaveCSS("object-fit", "contain");
  await expect(image).toHaveCSS("filter", "none");
  await expect(image).toHaveCSS("mix-blend-mode", "normal");
  await expect(image).toHaveCSS("opacity", "1");
  const geometry = await image.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const figure = element.closest("figure").getBoundingClientRect();
    return {
      source: new URL(element.getAttribute("src"), location.href).pathname,
      width: element.naturalWidth, height: element.naturalHeight,
      fits: box.width > 0 && box.height > 0 && box.left >= figure.left - 1 && box.right <= figure.right + 1 &&
        box.top >= figure.top - 1 && box.bottom <= figure.bottom + 1,
    };
  });
  expect(geometry.source).toBe(`/${frame.image.replace(/^\.\//, "")}`);
  expect(geometry.width).toBe(frame.width);
  expect(geometry.height).toBe(frame.height);
  expect(geometry.fits, "The full original remains inside its figure").toBe(true);
}

test("the homepage exposes the portfolio and project navigation without JavaScript", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("You know your business. I’ll build the technology.");
  await expect(page.locator("#featured-projects .project-card")).toHaveCount(6);
  await expect(page.locator("#archive-projects .archive-card")).toHaveCount(projects.length);
  await expect(page.locator(".owner-credit")).toHaveCount(0);
  await page.locator(".archive-disclosure summary").click();
  await expect(page.locator(".archive-disclosure")).toHaveAttribute("open", "");
  const project = projects.find((entry) => entry.id === "Bill-Spilt");
  const story = page.locator(`.archive-card[data-showcase-id="${project.id}"] .case-page-link`);
  await expect(story).toBeVisible();
  await story.click();
  await expect(page).toHaveURL(new RegExp(`/work/${projectSlugs[project.id]}/$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(project.title);
  const portfolio = await linkTo(page, "/work/");
  await portfolio.click();
  await expect(page.locator(".work-page-grid .seo-project-card")).toHaveCount(projects.length);
  await expectPageFit(page);
});

test("a service page leads to relevant project proof and a complete business inquiry without JavaScript", async ({ page }) => {
  const service = services.find((entry) => entry.slug === "website-development");
  const project = projects.find((entry) => entry.id === service.projectIds[0]);
  await page.goto("/");
  const serviceLink = await linkTo(page, `/services/${service.slug}/`);
  await serviceLink.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(service.heading);
  await expectPageFit(page);
  const proof = await linkTo(page, `/work/${projectSlugs[project.id]}/`);
  await proof.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(project.title);
  await expect(page.getByRole("link", { name: `${project.title} source code on GitHub`, exact: false })).toHaveAttribute("href", project.repoUrl);
  const inquiry = page.locator(".page-actions a[href^='mailto:']");
  await expect(inquiry).toBeVisible();
  const draft = new URL(await inquiry.getAttribute("href"));
  expect(draft.pathname).toBe("admin@customtechbuilt4u.com");
  expect(draft.searchParams.get("subject")).toBe(`Project inspired by ${project.title}`);
  expect(draft.searchParams.get("body")).toContain("The problem:");
  expect(draft.searchParams.get("body")).toContain("Who will use it:");
  await expectPageFit(page);
});

test("a project case shows authentic paired captures and both original image links without JavaScript", async ({ page }) => {
  const project = projects.find((entry) => entry.id === "Showrunner-ICanRunAShow");
  await page.goto(`/work/${projectSlugs[project.id]}/`);
  const cover = page.locator(".project-page-gallery > figure");
  await expectOriginalImage(cover.locator("img"), project.gallery[0]);
  await expect(cover.locator("figcaption p")).toHaveText(project.gallery[0].caption);
  const native = project.gallery.find((frame) => frame.label === "Workspace & cues");
  const frame = page.locator(`#project-views .project-page-frame[data-view="${project.gallery.indexOf(native)}"]`);
  await expect(frame).toBeVisible();
  await expect(frame.locator("details")).toHaveCount(0);
  await expect(frame.locator("img")).toHaveCount(2);
  await expectOriginalImage(frame.locator("img").nth(0), native);
  await expectOriginalImage(frame.locator("img").nth(1), native.companion);
  await expect(frame.locator("figcaption p")).toHaveText(native.caption);
  const original = frame.getByRole("link", { name: "Open full-size image", exact: false });
  expect(new URL(await original.getAttribute("href"), page.url()).pathname).toBe(`/${native.image.replace(/^\.\//, "")}`);
  await expect(original).toHaveAttribute("target", "_blank");
  await expect(original).toHaveAttribute("rel", /noopener/);
  const companion = frame.getByRole("link", { name: "Open companion image", exact: false });
  expect(new URL(await companion.getAttribute("href"), page.url()).pathname).toBe(`/${native.companion.image.replace(/^\.\//, "")}`);
  await expect(companion).toHaveAttribute("target", "_blank");
  await expect(companion).toHaveAttribute("rel", /noopener/);
  await companion.focus();
  await expect(companion).toBeFocused();
  await expectPageFit(page);
});

for (const project of projects) {
  test(`${project.title} explains the app and exposes every original view without JavaScript`, async ({ page }) => {
    await page.goto(`/work/${projectSlugs[project.id]}/`);
    await expect(page.locator("body")).toHaveClass(/\bproject-detail-page\b/);
    await expect(page.locator(".project-story-hero h1")).toHaveText(project.title);
    await expect(page.locator(".project-story-hero .page-lead")).toHaveText(project.purpose);
    await expectPageFit(page);

    const navigation = page.getByRole("navigation", { name: "On this project page", exact: true });
    await expect(navigation).toBeVisible();
    await expect(navigation.locator("a")).toHaveCount(3);
    for (const target of ["overview", "project-views", "development"]) {
      const link = navigation.locator(`a[href="#${target}"]`);
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(new RegExp(`#${target}$`));
      await expect(page.locator(`#${target}`)).toBeVisible();
    }

    await expect(page.locator("#overview .project-summary")).toHaveText(project.clientSummary || project.summary);
    const workflows = page.locator("#overview .project-workflow-card");
    await expect(workflows).toHaveCount(project.workflows.length);
    for (const [index, workflow] of project.workflows.entries()) {
      const card = workflows.nth(index);
      await expect(card).toBeVisible();
      await expect(card.locator("h3")).toHaveText(workflow);
      const explanation = (await card.locator("p").innerText()).trim();
      expect(explanation, `${workflow} explains the task beyond its label`).not.toBe("");
      expect(explanation).not.toBe(workflow);
    }

    await expect(page.locator(".project-page-frame")).toHaveCount(project.gallery.length);
    const cover = page.locator(".project-story-hero .project-page-gallery > figure");
    await expect(cover).toHaveCount(1);
    await expect(cover).toHaveAttribute("data-view", "0");
    await expect(page.locator("#project-views .project-page-frame")).toHaveCount(project.gallery.length - 1);
    await expect(page.locator(".project-gallery-detail")).toHaveCount(0);
    for (const [index, original] of project.gallery.entries()) {
      const frame = page.locator(`.project-page-frame[data-view="${index}"]`);
      await expect(frame).toBeVisible();
      expect(await frame.evaluate((element) => element.closest("details") === null),
        `${original.label} is available without expanding a hidden image row`).toBe(true);
      await expect(frame.locator("figcaption strong")).toHaveText(original.label);
      await expect(frame.locator("figcaption p")).toHaveText(original.caption);
      const originals = [original, original.companion].filter(Boolean);
      await expect(frame.locator("img")).toHaveCount(originals.length);
      for (const [imageIndex, source] of originals.entries()) {
        await expectOriginalImage(frame.locator("img").nth(imageIndex), source);
        const fullSize = frame.getByRole("link", {
          name: imageIndex === 0 ? "Open full-size image" : "Open companion image", exact: false,
        });
        await expect(fullSize).toBeVisible();
        expect(new URL(await fullSize.getAttribute("href"), page.url()).pathname)
          .toBe(`/${source.image.replace(/^\.\//, "")}`);
        await expect(fullSize).toHaveAttribute("target", "_blank");
        await expect(fullSize).toHaveAttribute("rel", /noopener/);
      }
    }

    const source = page.locator("#development").getByRole("link", {
      name: `${project.title} source code on GitHub`, exact: false,
    });
    await expect(source).toHaveAttribute("href", project.repoUrl);
    if (project.notes) await expect(page.locator("#development")).toContainText(project.notes);
    const inquiry = page.locator(".project-build-cta a[href^='mailto:']");
    await expect(inquiry).toBeVisible();
    const draft = new URL(await inquiry.getAttribute("href"));
    expect(draft.pathname).toBe("admin@customtechbuilt4u.com");
    expect(draft.searchParams.get("subject")).toBe(`Project inspired by ${project.title}`);
    expect(draft.searchParams.get("body")).toContain("The problem:");
    expect(draft.searchParams.get("body")).toContain("Who will use it:");
    const consultation = new URL(await page.locator(".page-nav .nav-contact").getAttribute("href"), page.url());
    expect(consultation.pathname).toBe("/");
    expect(consultation.hash).toBe("#consultation");
    await expectPageFit(page);
  });
}

test("the comparison guide, business information, and contact remain usable without JavaScript", async ({ page }) => {
  await page.goto("/guides/website-or-app/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(guide.title);
  await expect(page.locator(".table-scroll table tbody tr")).toHaveCount(4);
  await expectPageFit(page);
  const about = await linkTo(page, "/about/");
  await about.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("You know your business. I’ll build the technology.");
  await expect(page.locator("main")).not.toContainText(/Taylor Drew|stand-up biography/i);
  await expectPageFit(page);
  const contact = await linkTo(page, "/contact/");
  await contact.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What would you like to build?");
  for (const link of await page.locator("main a[href^='mailto:']").all()) {
    expect(new URL(await link.getAttribute("href")).pathname).toBe("admin@customtechbuilt4u.com");
  }
  await expectPageFit(page);
});

test("a business guide connects the idea to a service and an arranged Zoom or NYC consultation without JavaScript", async ({ page }) => {
  const article = articles.find((entry) => entry.slug === "salon-booking-website");
  const service = services.find((entry) => entry.slug === article.serviceSlugs[0]);
  await page.goto("/");
  await expect(page.locator("#business-guides .insight-card")).toHaveCount(articles.length);
  const guides = await linkTo(page, "/insights/");
  await guides.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Useful reads for your next business build.");
  await expect(page.locator(".insight-grid .insight-card")).toHaveCount(articles.length);
  await expectPageFit(page);

  const guide = await linkTo(page, `/insights/${article.slug}/`);
  await guide.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(article.title);
  await expect(page.locator(".article-byline")).toContainText("By Built4U");
  await expect(page.locator(".article-byline time")).toHaveAttribute("datetime", site.published);
  await expect(page.locator("main")).toContainText(article.intro);
  await expectPageFit(page);
  const development = page.getByRole("navigation", { name: "Related development services" })
    .getByRole("link", { name: service.title, exact: true });
  await expect(development).toBeVisible();
  await development.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(service.heading);
  await expectPageFit(page);

  const local = await linkTo(page, "/new-york-city/");
  await local.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(localConsultation.heading);
  await expect(page.locator("main")).toContainText(localConsultation.intro);
  await expect(page.locator("main")).toContainText(/Zoom consultations by arrangement/);
  const arrange = page.locator(".page-actions").getByRole("link", { name: "Arrange a consultation", exact: false });
  await expect(arrange).toBeVisible();
  const draft = new URL(await arrange.getAttribute("href"));
  expect(draft.pathname).toBe("admin@customtechbuilt4u.com");
  expect(draft.searchParams.get("subject")).toBe("Built4U consultation");
  expect(draft.searchParams.get("body")).toContain("Consultation format (Zoom or in-person in New York City):");
  expect(draft.searchParams.get("body")).toContain("Preferred times:");
  expect(draft.searchParams.get("body")).toContain("The problem:");
  await expectPageFit(page);
});
