import { test, expect } from "@playwright/test";
import { projects } from "../public-projects.js";
import { services, guide, projectSlugs, site } from "../seo-content.js";
import { articles } from "../seo-articles.js";
import { localConsultation } from "../seo-local.js";

const bookingURL = "https://briefbooth.com/book/4u-digital";

async function expectBookingLink(link) {
  await expect(link).toHaveAttribute("href", bookingURL);
  await expect(link).toHaveAttribute("data-booking-link", "");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /\bnoopener\b/);
  await expect(link).toHaveAttribute("rel", /\bnoreferrer\b/);
  await expect(link).toContainText("Book a consultation");
}

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
  const controls = await page.locator(".page-nav a, .breadcrumbs, .page-actions a, .project-story-nav a, .page-section-nav a, .article-contents a, .project-build-cta a, .footer-link-group a").evaluateAll((elements) =>
    elements.filter((element) => element.getClientRects().length > 0).every((element) => {
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

async function expectHeaderSection(page, path, current = "location") {
  const selected = page.locator(".page-nav a[aria-current]");
  await expect(selected).toHaveCount(1);
  await expect(selected).toHaveAttribute("aria-current", current);
  expect(new URL(await selected.getAttribute("href"), page.url()).pathname).toBe(path);
}

async function expectServiceSections(page, service) {
  const navigation = page.getByRole("navigation", { name: "On this service page", exact: true });
  await expect(navigation).toBeVisible();
  const destinations = [
    ["service-fit", `What could ${service.title.toLowerCase()} help you do?`],
    ["examples", "See the work behind the offer."],
    ["service-scope", "What do we decide before building?"],
    ["service-questions", `Questions about ${service.title.toLowerCase()}`],
  ];
  await expect(navigation.locator("a")).toHaveCount(destinations.length);
  for (const [id, heading] of destinations) {
    const link = navigation.locator(`a[href="#${id}"]`);
    await expect(link).toBeVisible();
    await expect(page.locator(`#${id}`)).toHaveCount(1);
    await expect(page.locator(`#${id}`).getByRole("heading", { level: 2 })).toHaveText(heading);
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
  }
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
      current: element.currentSrc,
      candidates: element.srcset.split(",").filter(Boolean).map((candidate) =>
        new URL(candidate.trim().split(/\s+/)[0], document.baseURI).href),
      sizes: element.sizes,
      fits: box.width > 0 && box.height > 0 && box.left >= figure.left - 1 && box.right <= figure.right + 1 &&
        box.top >= figure.top - 1 && box.bottom <= figure.bottom + 1,
    };
  });
  expect(geometry.source).toBe(`/${frame.image.replace(/^\.\//, "")}`);
  expect(geometry.width).toBeGreaterThan(0);
  expect(geometry.height).toBeGreaterThan(0);
  const originalRatio = frame.width / frame.height;
  // Responsive natural dimensions are density-corrected integer CSS pixels.
  // Allow one pixel of rounding per axis; encoded proportions are checked in Node.
  expect(Math.abs(geometry.width - geometry.height * originalRatio),
    "Responsive intrinsic dimensions preserve proportions within per-axis pixel rounding")
    .toBeLessThanOrEqual(1 + originalRatio);
  if (geometry.candidates.length) {
    expect(geometry.sizes.trim()).not.toBe("");
    expect(geometry.candidates).toContain(geometry.current);
    expect(new URL(geometry.current).pathname).toMatch(/\/assets\/optimized\//);
  } else {
    expect(geometry.width).toBe(frame.width);
    expect(geometry.height).toBe(frame.height);
  }
  expect(geometry.fits, "The full original remains inside its figure").toBe(true);
}

test("the homepage exposes the portfolio and project navigation without JavaScript", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("You know your business. I’ll build the technology.");
  await expect(page.locator("#featured-projects .project-card")).toHaveCount(6);
  await expect(page.locator("#archive-projects .archive-card")).toHaveCount(projects.length);
  expect(await page.evaluate(() => {
    const work = document.querySelector("#work");
    const archive = document.querySelector("#project-archive");
    const featured = document.querySelector("#featured-projects");
    const rangeProof = document.querySelector("#range-proof");
    const groups = [...document.querySelectorAll("#featured-projects, #archive-projects, .project-card, .archive-card")];
    const sections = ["work", "process", "project-faq", "consultation", "business-guides"]
      .map((id) => document.getElementById(id));
    return work.contains(archive) && work.contains(rangeProof) && groups.every((group) => work.contains(group)) &&
      Boolean(featured.compareDocumentPosition(rangeProof) & Node.DOCUMENT_POSITION_FOLLOWING) &&
      Boolean(rangeProof.compareDocumentPosition(archive) & Node.DOCUMENT_POSITION_FOLLOWING) &&
      sections.every((section, index) => section && (index === 0 || Boolean(
        sections[index - 1].compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING,
      ))) && work.getBoundingClientRect().bottom <= sections[1].getBoundingClientRect().top + 1;
  }), "All projects stay together before the process, questions, consultation, and guides").toBe(true);
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
  await expectHeaderSection(page, "/work/", "page");
  await expectPageFit(page);
});

test("a service page leads to relevant project proof and a complete business inquiry without JavaScript", async ({ page }, testInfo) => {
  const service = services.find((entry) => entry.slug === "website-development");
  const project = projects.find((entry) => entry.id === service.projectIds[0]);
  await page.goto("/");
  const comparison = page.locator("details.service-comparison");
  await expect(comparison).not.toHaveAttribute("open", "");
  // Focus an already visible summary so native smooth scrolling has finished before the pointer step.
  await comparison.locator("summary").scrollIntoViewIfNeeded();
  await comparison.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(comparison).toHaveAttribute("open", "");
  const serviceLink = await linkTo(page, `/services/${service.slug}/`);
  await serviceLink.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(service.heading);
  await expectHeaderSection(page, "/services/");
  await expectServiceSections(page, service);
  await expectPageFit(page);
  await page.setViewportSize({ width: 768, height: 1024 });
  await expectPageFit(page);
  await page.setViewportSize(testInfo.project.use.viewport);
  const proof = await linkTo(page, `/work/${projectSlugs[project.id]}/`);
  // Native activation remains usable while the section-link scroll is finishing.
  await proof.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(project.title);
  await expectHeaderSection(page, "/work/");
  await expect(page.getByRole("link", { name: `${project.title} source code on GitHub`, exact: false })).toHaveAttribute("href", project.repoUrl);
  const inquiry = page.locator(".page-actions a[href^='mailto:']");
  await expect(inquiry).toBeVisible();
  const draft = new URL(await inquiry.getAttribute("href"));
  expect(draft.pathname).toBe("admin@customtechbuilt4u.com");
  expect(draft.searchParams.get("subject")).toBe(`Project inspired by ${project.title}`);
  expect(draft.searchParams.get("body")).toContain("The problem:");
  expect(draft.searchParams.get("body")).toContain("Who will use it:");
  expect(draft.searchParams.get("body")).toContain(`Source page: ${site.origin}/work/${projectSlugs[project.id]}/`);
  await expectPageFit(page);
});

for (const slug of ["salon-booking-app-development", "restaurant-ordering-app-development"]) {
  test(`${slug} connects homepage visitors to a clear service, authentic evidence, and attributed contact without JavaScript`, async ({ page }) => {
    const service = services.find((entry) => entry.slug === slug);
    const route = `/services/${slug}/`;
    await page.goto("/");
    const industryLinks = page.locator("#services .industry-services");
    await expect(industryLinks.locator("a")).toHaveCount(2);
    const entryIndex = await industryLinks.locator("a").evaluateAll((elements, target) => elements.findIndex((element) =>
      new URL(element.getAttribute("href"), location.href).pathname === target), route);
    expect(entryIndex, "The homepage industry navigation reaches this service").toBeGreaterThanOrEqual(0);
    const start = industryLinks.locator("a").nth(entryIndex);
    await expect(start).toContainText(slug.startsWith("salon") ? /salon/i : /restaurant/i);
    await expect(start).toBeVisible();
    await start.click();
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(service.heading);
    await expectHeaderSection(page, "/services/");
    await expectServiceSections(page, service);
    await expect(page.locator("main")).toContainText(service.intro);
    await expect(page.locator("main")).toContainText(service.proofIntro);
    await expect(page.locator("link[rel='canonical']")).toHaveAttribute("href", site.origin + route);
    await expect(page.locator(".faq-list .faq-item")).toHaveCount(service.faq.length);
    const question = page.locator(".faq-list .faq-item").first();
    await question.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(question).toHaveAttribute("open", "");
    await expect(question.locator("p")).toHaveText(service.faq[0].answer);

    for (const id of service.projectIds) {
      const proof = await linkTo(page, `/work/${projectSlugs[id]}/`);
      await expect(proof).toBeVisible();
    }
    const inquiry = page.locator(".page-intro .page-actions a[href^='mailto:']");
    await expect(inquiry).toBeVisible();
    const draft = new URL(await inquiry.getAttribute("href"));
    expect(draft.pathname).toBe("admin@customtechbuilt4u.com");
    expect(draft.searchParams.get("body")).toContain("The problem:");
    expect(draft.searchParams.get("body")).toContain(`Source page: ${site.origin}${route}`);

    const consultationLink = page.locator(".page-nav .nav-contact");
    await expectBookingLink(consultationLink);
    await expectPageFit(page);

    const planning = await linkTo(page, `/insights/${service.guideSlug}/`);
    await planning.focus();
    await page.keyboard.press("Enter");
    const article = articles.find((entry) => entry.slug === service.guideSlug);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(article.title);
    await expectHeaderSection(page, "/insights/");
    const returnToService = page.getByRole("navigation", { name: "Related development services" })
      .getByRole("link", { name: service.title, exact: true });
    await expect(returnToService).toBeVisible();
    await returnToService.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(service.heading);
    await expectPageFit(page);
  });
}

test("a project case shows authentic paired captures and both original image links without JavaScript", async ({ page }, testInfo) => {
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
  const pairLayout = await frame.evaluate((element) => {
    const figure = element.getBoundingClientRect();
    const grid = element.closest(".project-views-grid").getBoundingClientRect();
    const [primary, companion] = [...element.querySelectorAll("img")].map((image) => image.getBoundingClientRect());
    return {
      spansGrid: figure.left >= grid.left - 1 && figure.right <= grid.right + 1 && figure.width >= grid.width - 2,
      primaryIsWider: primary.width > companion.width,
      stackedWithinViewport: companion.top >= primary.bottom - 1 && [primary, companion]
        .every((image) => image.left >= -1 && image.right <= window.innerWidth + 1),
    };
  });
  expect(pairLayout.spansGrid && (testInfo.project.name === "phone"
    ? pairLayout.stackedWithinViewport : pairLayout.primaryIsWider),
  "The wide workspace pair uses the full gallery width, with a larger desktop screen or stacked phone images").toBe(true);
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
  await page.setViewportSize({ width: 768, height: 1024 });
  await expectPageFit(page);
});

for (const project of projects) {
  test(`${project.title} explains the app and exposes every original view without JavaScript`, async ({ page }) => {
    await page.goto(`/work/${projectSlugs[project.id]}/`);
    await expect(page.locator("body")).toHaveClass(/\bproject-detail-page\b/);
    await expect(page.getByRole("heading", { level: 1, name: project.title, exact: true })).toHaveCount(1);
    await expect(page.locator(".project-story-hero h1 > span:last-child")).toHaveText(project.title);
    await expect(page.locator(".project-story-hero .page-lead")).toHaveText(project.purpose);
    await expectPageFit(page);

    const navigation = page.getByRole("navigation", { name: "On this project page", exact: true });
    await expect(navigation).toBeVisible();
    await expect(navigation.locator("a")).toHaveCount(3);
    for (const target of ["overview", "project-views", "development"]) {
      const link = navigation.locator(`a[href="#${target}"]`);
      await expect(link).toBeVisible();
      await link.focus();
      await page.keyboard.press("Enter");
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
    if (project.image.startsWith("./assets/readme-overviews/")) {
      await expect(cover.locator("figcaption strong")).toHaveText("Product overview");
      await expect(cover.locator("figcaption p")).toHaveText(/^Repository product artwork/);
      await expect(cover.locator("img")).toHaveAttribute("width", "2400");
      await expect(cover.locator("img")).toHaveAttribute("height", "1500");
      const layout = await cover.evaluate((element) => {
        const media = element.querySelector(":scope > div").getBoundingClientRect();
        const caption = element.querySelector("figcaption").getBoundingClientRect();
        return { noOverlay: caption.top >= media.bottom - 1, filter: getComputedStyle(element).filter };
      });
      expect(layout.noOverlay, "Repository artwork and its evidence caption remain separate without JavaScript").toBe(true);
      expect(layout.filter).toBe("none");
    }
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
    expect(draft.searchParams.get("body")).toContain(`Source page: ${site.origin}/work/${projectSlugs[project.id]}/`);
    await expectBookingLink(page.locator(".page-nav .nav-contact"));
    await expectBookingLink(page.locator(".project-build-cta [data-booking-link]"));
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
  await page.setViewportSize({ width: 768, height: 1024 });
  await expectPageFit(page);
});

test("the later kickoff checklist is reachable from the process and prepares an attributed email without JavaScript", async ({ page }) => {
  await page.goto("/");
  const kickoff = page.locator("#process").getByRole("link", { name: "Fill out the project kickoff form", exact: false });
  // Native keyboard activation does not wait on pointer stability during smooth scrolling.
  await kickoff.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A clear plan before the build.");
  await expect(page.locator("main")).toContainText("You don’t need this worked out before getting in touch.");
  for (const heading of ["1. Agree the first useful version.", "2. Know who makes the decisions.", "3. Plan the assets, access, and handover."])
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  const email = page.locator(".page-intro").getByRole("link", { name: "Prepare a kickoff email", exact: false });
  const draft = new URL(await email.getAttribute("href"));
  expect(draft.pathname).toBe("admin@customtechbuilt4u.com");
  expect(draft.searchParams.get("subject")).toBe("4u Digital project kickoff details");
  expect(draft.searchParams.get("body")).toContain("What is outside this version:");
  expect(draft.searchParams.get("body")).toContain("Who supplies and approves each item, and its permitted use:");
  expect(draft.searchParams.get("body")).toContain("without sending passwords");
  expect(draft.searchParams.get("body")).toContain(`Source page: ${site.origin}/project-kickoff/`);
  await expectPageFit(page);
  await expectBookingLink(page.locator(".page-nav .nav-contact"));
  await page.setViewportSize({ width: 768, height: 1024 });
  await expectPageFit(page);
});

test("a business guide connects the idea to a service and the supplied consultation booking page without JavaScript", async ({ page }) => {
  const article = articles.find((entry) => entry.slug === "salon-booking-website");
  const service = services.find((entry) => entry.slug === article.serviceSlugs[0]);
  await page.goto("/");
  await expect(page.locator("#business-guides .insight-card")).toHaveCount(articles.length);
  const guides = await linkTo(page, "/insights/");
  await guides.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Useful reads for your next business build.");
  await expectHeaderSection(page, "/insights/", "page");
  await expect(page.locator(".insight-grid .insight-card")).toHaveCount(articles.length);
  await expectPageFit(page);

  const guide = await linkTo(page, `/insights/${article.slug}/`);
  await guide.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(article.title);
  await expectHeaderSection(page, "/insights/");
  await expect(page.locator(".article-byline")).toContainText("By 4u Digital");
  await expect(page.locator(".article-byline time")).toHaveAttribute("datetime", site.published);
  await expect(page.locator("main")).toContainText(article.intro);
  const contents = page.getByRole("navigation", { name: "Guide sections", exact: true });
  await expect(contents).toBeVisible();
  await expect(contents.locator("a")).toHaveCount(article.sections.length);
  for (const [index, section] of article.sections.entries()) {
    const id = `guide-section-${index + 1}`;
    const link = contents.getByRole("link", { name: section.heading, exact: true });
    await expect(link).toHaveAttribute("href", `#${id}`);
    await expect(page.locator(`#${id}`)).toHaveCount(1);
    await expect(page.locator(`#${id}`).getByRole("heading", { level: 2 })).toHaveText(section.heading);
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
  }
  await expectPageFit(page);
  const development = page.getByRole("navigation", { name: "Related development services" })
    .getByRole("link", { name: service.title, exact: true });
  await expect(development).toBeVisible();
  // Keep this a native navigation test without waiting for pointer-position stability
  // after the preceding in-page links have started smooth scrolling.
  await development.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(service.heading);
  await expectPageFit(page);

  const local = await linkTo(page, "/new-york-city/");
  await local.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(localConsultation.heading);
  await expect(page.locator("main")).toContainText(localConsultation.intro);
  await expect(page.locator("main")).toContainText(/Start with a Zoom consultation/i);
  await expect(page.getByRole("heading", { name: "See the space before deciding on the software.", exact: true })).toBeVisible();
  await expect(page.locator("main")).toContainText(/reception desk, booking handoff, order station/i);
  for (const option of ["website", "mobile app", "web platform", "desktop software", "custom tool"]) {
    await expect(page.locator(".page-intro")).toContainText(option);
  }
  const arrange = page.locator(".page-intro .page-actions [data-booking-link]");
  await expect(arrange).toBeVisible();
  await expectBookingLink(arrange);
  const generalEmail = page.locator(".page-actions a[href^='mailto:']");
  await expect(generalEmail).toHaveCount(1);
  await expect(generalEmail).toContainText("admin@customtechbuilt4u.com");
  const emailDestination = new URL(await generalEmail.getAttribute("href"));
  expect(emailDestination.protocol).toBe("mailto:");
  expect(emailDestination.pathname).toBe("admin@customtechbuilt4u.com");
  expect(emailDestination.searchParams.get("subject") || "").not.toMatch(/consultation|Zoom|in.person/i);
  expect(emailDestination.searchParams.get("body") || "").not.toMatch(/Consultation format|Preferred (?:times|days)/i);
  await expect(generalEmail).not.toHaveAttribute("data-booking-link", "");
  for (const booking of await page.locator("[data-booking-link]").all()) {
    await expectBookingLink(booking);
  }
  await expect(page.locator("#consultation-form, [data-consultation-format]")).toHaveCount(0);
  await expectPageFit(page);
});
