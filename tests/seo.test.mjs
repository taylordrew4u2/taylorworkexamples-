import test, { before } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { readFile, readdir, stat } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import sharp from "sharp";
import { projects, featuredProjects } from "../public-projects.js";
import { projects as auditedProjects } from "../projects.js";
import { site, services, projectSlugs } from "../seo-content.js";
import { articles, articleTopics, homepageArticles } from "../seo-articles.js";
import { clientTestimonials } from "../content/client-testimonials.js";
import { localConsultation } from "../seo-local.js";
import { bookingURL } from "../booking.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist");
const origin = "https://customtechbuilt4u.com";
const githubPrefix = "/taylorworkexamples-";
const routes = ["/", "/services/", ...services.map((service) => `/services/${service.slug}/`),
  "/work/", ...projects.map((project) => `/work/${projectSlugs[project.id]}/`),
  "/guides/website-or-app/", "/about/", "/contact/", "/project-kickoff/", "/privacy/", "/insights/",
  ...articles.map((article) => `/insights/${article.slug}/`), "/new-york-city/"];
const documents = new Map();

const decode = (value = "") => value.replace(/&#(x[\da-f]+|\d+);/gi, (_, code) =>
  String.fromCodePoint(code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code)),
).replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, name) =>
  ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " })[name]);
const attributes = (tag) => {
  const result = Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g)]
    .map(([, name, , value]) => [name.toLowerCase(), decode(value)]));
  if (/\sdata-booking-link(?=\s|=|>)/i.test(tag)) result["data-booking-link"] ??= "";
  return result;
};
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map(([tag]) => attributes(tag));
const text = (html) => decode(html.replace(/<script\b[\s\S]*?<\/script>/gi, " ")
  .replace(/<style\b[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const normalize = (value) => value.replace(/\s+/g, " ").trim().toLowerCase();
const h1s = (html) => [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(([, contents]) =>
  text(contents.replace(/<([a-z][\w:-]*)\b[^>]*aria-hidden=["']true["'][^>]*>[\s\S]*?<\/\1>/gi, "")));
const metadata = (html, name) => tags(html, "meta").filter((tag) => tag.name === name || tag.property === name);
const canonical = (html) => tags(html, "link").filter((tag) => tag.rel === "canonical");
const title = (html) => decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "");
const schemaNodes = (html) => [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(([, attrs]) => attributes(attrs).type === "application/ld+json")
  .flatMap(([, , contents]) => {
    const schema = JSON.parse(contents);
    return schema["@graph"] || [schema];
  });
const hasType = (node, type) => [node["@type"]].flat().includes(type);
const pageFile = (route) => path.join(output, route === "/404.html" ? "404.html" : `${route.slice(1)}index.html`);
const sameSite = (href, route) => new URL(href, `${origin}${route}`).origin === origin;
const pathname = (href, route) => new URL(href, `${origin}${route}`).pathname;

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory()
    ? filesUnder(path.join(directory, entry.name)) : [path.join(directory, entry.name)]))).flat();
}

async function localFile(url, route) {
  const parsed = new URL(url, `${origin}${route}`);
  const target = path.join(output, decodeURIComponent(parsed.pathname).replace(/^\//, ""));
  const info = await stat(target);
  return info.isDirectory() ? path.join(target, "index.html") : target;
}

before(async () => {
  // Test the exact production output, including the sanitized public data module.
  await promisify(execFile)(process.execPath, ["scripts/build.mjs"], { cwd: root, maxBuffer: 1024 * 1024 });
  for (const route of [...routes, "/404.html"]) {
    documents.set(route, await readFile(pageFile(route), "utf8"));
  }
});

test("the sitemap indexes exactly the public service, project, guide, and business pages", async () => {
  assert.equal(projects.length, 9);
  assert.equal(articles.length, 19);
  assert.equal(services.length, 6);
  assert.equal(routes.length, 44);
  assert.equal(site.origin, origin);
  assert.equal(new Set(routes).size, routes.length);
  const xml = await readFile(path.join(output, "sitemap.xml"), "utf8");
  assert.match(xml, /<urlset\s+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
  const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, value]) => decode(value));
  assert.deepEqual(locations.sort(), routes.map((route) => origin + route).sort());
  for (const location of locations) {
    const url = new URL(location);
    assert.equal(url.origin, origin);
    assert.equal(url.hash, "");
    assert.equal(url.search, "");
    assert.notEqual(url.pathname, "/404.html");
    await stat(await localFile(location, "/"));
  }
  const robots = await readFile(path.join(output, "robots.txt"), "utf8");
  assert.match(robots, /^User-agent:\s*\*$/m);
  assert.match(robots, /^Allow:\s*\/$/m);
  assert.doesNotMatch(robots, /^Disallow:\s*\/\s*$/m);
  assert.match(robots, /^Sitemap:\s*https:\/\/customtechbuilt4u\.com\/sitemap\.xml$/m);
  const missing = documents.get("/404.html");
  assert.match(metadata(missing, "robots")[0]?.content || "", /\bnoindex\b/);
  assert.equal(canonical(missing)[0]?.href, `${origin}/404.html`);
});

test("the kickoff checklist is a later project step with a complete, attributed business email draft", () => {
  const route = "/project-kickoff/";
  const html = documents.get(route);
  const linksTo = (html, base, target) => tags(html, "a").some(tag =>
    tag.href && sameSite(tag.href, base) && pathname(tag.href, base) === target);
  assert.ok(linksTo(documents.get("/"), "/", route));
  assert.ok(linksTo(documents.get("/contact/"), "/contact/", route));
  assert.match(text(html), /AFTER THE CONSULTATION/);
  assert.match(text(html), /You don’t need this worked out before getting in touch/);
  assert.match(text(html), /This is an illustration/);
  const drafts = tags(html, "a").filter(tag => tag.href?.startsWith("mailto:"))
    .map(tag => new URL(tag.href)).filter(url => url.searchParams.get("subject") === "4u Digital project kickoff details");
  assert.ok(drafts.length > 0);
  for (const draft of drafts) {
    assert.equal(draft.pathname, site.email);
    const body = draft.searchParams.get("body");
    for (const field of ["Main contact and business email:", "Who approves scope", "Who gathers feedback",
      "What is included:", "What is outside this version:", "Examples of a successful result",
      "Who supplies and approves each item, and its permitted use:", "accounts involved and their owners:",
      "Account invitations and access to arrange separately:", "handover to agree:"]) assert.ok(body.includes(field), field);
    assert.match(body, /without sending passwords, payment details, or customer records/);
    assert.ok(body.endsWith(`Source page: ${origin}${route}`));
  }
});

test("every indexable page has unique metadata, one semantic heading, and consistent social metadata", async () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const route of routes) {
    const html = documents.get(route);
    const pageTitle = title(html);
    const description = metadata(html, "description");
    const headings = h1s(html);
    assert.ok(pageTitle.includes("4u Digital"), `${route}: page title identifies the business`);
    assert.ok(!titles.has(pageTitle), `${route}: unique title`);
    titles.add(pageTitle);
    assert.equal(description.length, 1);
    assert.ok(description[0].content.length > 30);
    assert.ok(!descriptions.has(description[0].content), `${route}: unique description`);
    descriptions.add(description[0].content);
    assert.equal(headings.length, 1, `${route}: one semantic h1`);
    assert.ok(headings[0].length > 3);
    assert.deepEqual(canonical(html).map((tag) => tag.href), [origin + route]);
    assert.doesNotMatch(metadata(html, "robots")[0]?.content || "", /\bnoindex\b/);
    assert.equal(metadata(html, "og:url")[0]?.content, origin + route);
    assert.equal(metadata(html, "og:title")[0]?.content, pageTitle);
    assert.equal(metadata(html, "og:description")[0]?.content, description[0].content);
    assert.equal(metadata(html, "twitter:title")[0]?.content, pageTitle);
    assert.equal(metadata(html, "twitter:description")[0]?.content, description[0].content);
    if (route === "/" && site.googleSiteVerification) {
      assert.equal(metadata(html, "google-site-verification")[0]?.content, site.googleSiteVerification);
    }
    const image = metadata(html, "og:image")[0]?.content;
    assert.ok(image?.startsWith(`${origin}/assets/`), `${route}: owned social image`);
    assert.ok((await readFile(await localFile(image, route))).length > 0);
    assert.ok(Number(metadata(html, "og:image:width")[0]?.content) > 0);
    assert.ok(Number(metadata(html, "og:image:height")[0]?.content) > 0);
    assert.ok(metadata(html, "og:image:alt")[0]?.content);
    assert.equal(metadata(html, "twitter:image")[0]?.content, image);
  }
});

test("structured data points to the canonical business and matches visible service, project, article, and FAQ copy", () => {
  const forbidden = new Set(["founder", "founders", "parentOrganization", "aggregateRating", "review", "ratingValue", "price", "priceCurrency", "address", "openingHours", "openingHoursSpecification"]);
  const inspect = (value, route) => {
    if (!value || typeof value !== "object") return;
    assert.ok(!hasType(value, "Person"), `${route}: independent business identity`);
    for (const [key, child] of Object.entries(value)) {
      assert.ok(!forbidden.has(key), `${route}: no unsupported ${key}`);
      if (typeof child === "object") inspect(child, route);
    }
  };
  for (const route of routes) {
    const html = documents.get(route);
    const visible = normalize(text(html));
    const nodes = schemaNodes(html);
    assert.ok(nodes.length >= 3);
    const org = nodes.find((node) => hasType(node, "Organization"));
    assert.equal(org.name, "4u Digital");
    assert.equal(org.email, "admin@customtechbuilt4u.com");
    assert.equal(org.url, `${origin}/`);
    assert.ok(org.sameAs.includes("https://github.com/taylordrew4u2"));
    const page = nodes.find((node) => node["@id"] === `${origin}${route}#page`);
    assert.equal(page.url, origin + route);
    assert.equal(page.name, title(html));
    assert.equal(page.description, metadata(html, "description")[0].content);
    assert.equal(page.publisher["@id"], org["@id"]);
    if (route !== "/") {
      const breadcrumb = nodes.find((node) => hasType(node, "BreadcrumbList"));
      assert.ok(breadcrumb, `${route}: breadcrumb schema`);
      assert.equal(page.breadcrumb["@id"], breadcrumb["@id"]);
      assert.equal(breadcrumb.itemListElement.at(-1).item, origin + route);
      assert.deepEqual(breadcrumb.itemListElement.map((item) => item.position),
        breadcrumb.itemListElement.map((_, index) => index + 1));
      for (const item of breadcrumb.itemListElement) {
        assert.ok(routes.includes(new URL(item.item).pathname));
        assert.ok(visible.includes(normalize(item.name)), `${route}: visible breadcrumb label ${item.name}`);
      }
    }
    const service = services.find((entry) => route === `/services/${entry.slug}/`);
    if (service) {
      const schema = nodes.find((node) => hasType(node, "Service"));
      assert.equal(schema.name, service.title);
      assert.equal(schema.description, service.intro);
      assert.equal(schema.provider["@id"], org["@id"]);
      assert.ok(visible.includes(normalize(schema.description)));
      assert.equal(page.mainEntity["@id"], schema["@id"]);
    }
    const article = articles.find((entry) => route === `/insights/${entry.slug}/`);
    if (article) {
      const schema = nodes.find((node) => hasType(node, "Article"));
      assert.ok(schema, `${route}: article schema`);
      assert.equal(schema.url, origin + route);
      assert.equal(schema.headline, h1s(html)[0]);
      assert.equal(schema.headline, article.title);
      assert.equal(title(html), article.metaTitle);
      assert.equal(schema.description, article.description);
      assert.equal(schema.author["@id"], org["@id"]);
      assert.equal(schema.publisher["@id"], org["@id"]);
      assert.equal(schema.mainEntityOfPage["@id"], page["@id"]);
      assert.equal(page.mainEntity["@id"], schema["@id"]);
      assert.equal(schema.datePublished, article.published || site.published);
      assert.equal(schema.dateModified, article.modified || site.modified || schema.datePublished);
      assert.equal(metadata(html, "article:modified_time")[0].content, schema.dateModified);
      assert.ok(schema.dateModified >= schema.datePublished, `${route}: modification does not precede publication`);
      assert.deepEqual(tags(html, "time").map((tag) => tag.datetime), [schema.datePublished]);
      assert.ok(visible.includes("by 4u digital"), `${route}: visible company author`);
    }
    const project = projects.find((entry) => route === `/work/${projectSlugs[entry.id]}/`);
    if (project) {
      const schema = nodes.find((node) => hasType(node, "CreativeWork"));
      assert.equal(schema.name, project.title);
      assert.equal(schema.description, project.purpose);
      assert.equal(schema.image, origin + project.image.slice(1));
      assert.ok(visible.includes(normalize(project.purpose)));
      assert.equal(page.mainEntity["@id"], schema["@id"]);
    }
    for (const faq of nodes.filter((node) => hasType(node, "FAQPage"))) {
      for (const question of faq.mainEntity) {
        assert.ok(visible.includes(normalize(question.name)));
        assert.ok(visible.includes(normalize(question.acceptedAnswer.text)));
      }
    }
    inspect(nodes, route);
  }
});

test("short reads form a complete topic index and a focused homepage preview", async () => {
  const home = documents.get("/");
  const homeCards = [...home.matchAll(/<article class="insight-card">([\s\S]*?)<\/article>/g)];
  assert.equal(homeCards.length, 3, "the homepage stays focused on selected work");
  assert.deepEqual(homeCards.map(([, card]) => pathname(tags(card, "a")[0].href, "/")),
    homepageArticles.map((article) => `/insights/${article.slug}/`));
  assert.ok(text(homeCards[0][1]).includes("Just need a website?"));
  const hub = documents.get("/insights/");
  const indexed = [];
  for (const topic of articleTopics) {
    const section = hub.match(new RegExp(`<section id="guides-${topic.id}"[^>]*>([\\s\\S]*?)</section>`))?.[1];
    assert.ok(section, `${topic.label}: linked section exists`);
    assert.ok(text(section).includes(topic.title));
    assert.ok(tags(hub, "a").some((tag) => tag.href === `#guides-${topic.id}`));
    const cards = [...section.matchAll(/<article class="[^"]*\binsight-card\b[^"]*">([\s\S]*?)<\/article>/g)];
    const paths = cards.map(([, card]) => pathname(tags(card, "a")[0].href, "/insights/"));
    assert.deepEqual(paths, articles.filter((article) => article.topic === topic.id).map((article) => `/insights/${article.slug}/`));
    indexed.push(...paths);
  }
  assert.deepEqual(indexed.sort(), articles.map((article) => `/insights/${article.slug}/`).sort(), "each article appears exactly once");
  for (const article of articles.filter((article) => article.format === "note")) {
    const html = documents.get(`/insights/${article.slug}/`);
    const dateLabel = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${article.published}T00:00:00Z`));
    assert.ok(text(html).includes(dateLabel), `${article.slug}: visible publication date matches the article`);
    assert.equal(metadata(html, "og:type")[0].content, "article");
    assert.equal(metadata(html, "article:published_time")[0].content, article.published);
    assert.doesNotMatch(html, /class="seo-project-card"/, "short articles use compact related-work links");
  }
  const manifest = JSON.parse(await readFile(path.join(output, "search-manifest.json"), "utf8"));
  const { contactPages } = await import(pathToFileURL(path.join(output, "contact-pages.js")));
  assert.deepEqual(manifest.pages.map((page) => page.path).sort(), [...routes].sort());
  assert.deepEqual([...contactPages].sort(), [...routes].sort(), "new articles retain inquiry source attribution");
});

test("business guides and consultation details are discoverable, truthful, and ready for booking", () => {
  const hubRoute = "/insights/";
  const localRoute = "/new-york-city/";
  const linksTo = (html, route, target) => tags(html, "a").some((tag) =>
    tag.href && sameSite(tag.href, route) && pathname(tag.href, route) === target);
  for (const route of ["/", "/contact/", hubRoute]) {
    const html = documents.get(route);
    assert.ok(linksTo(html, route, localRoute), `${route}: reachable consultation page`);
    assert.match(text(html), /Zoom/);
    assert.match(text(html), /New York City|Manhattan/);
    assert.match(text(html), /in-person/i);
    assert.match(text(html), /space|workflow/i);
  }
  assert.ok(linksTo(documents.get("/"), "/", hubRoute), "the homepage links to the guide hub");
  const hub = documents.get(hubRoute);
  assert.equal([...hub.matchAll(/class="[^"]*\binsight-card\b/g)].length, articles.length);
  for (const article of articles) {
    const route = `/insights/${article.slug}/`;
    const html = documents.get(route);
    assert.ok(linksTo(hub, hubRoute, route), `${article.title}: reachable from the hub`);
    assert.ok(text(hub).includes(article.summary));
    assert.ok(text(html).includes(article.intro), `${article.title}: crawlable explanatory content`);
    for (const section of article.sections) {
      assert.ok(text(html).includes(section.heading));
      for (const paragraph of section.paragraphs || [section.text]) assert.ok(text(html).includes(paragraph));
    }
    assert.ok(text(html).includes(article.closing));
    assert.ok(linksTo(html, route, hubRoute));
    assert.ok(linksTo(html, route, localRoute));
    for (const slug of article.serviceSlugs) {
      assert.ok(services.some((service) => service.slug === slug), `${article.title}: real development service`);
      assert.ok(linksTo(html, route, `/services/${slug}/`));
    }
    for (const id of article.projectIds) {
      assert.ok(projects.some((project) => project.id === id), `${article.title}: published project evidence`);
      assert.ok(linksTo(html, route, `/work/${projectSlugs[id]}/`));
    }
  }
  const local = documents.get(localRoute);
  assert.equal(h1s(local)[0], localConsultation.heading);
  assert.ok(text(local).includes(localConsultation.intro));
  const service = schemaNodes(local).find((node) => hasType(node, "Service"));
  assert.equal(service.name, localConsultation.title);
  assert.equal(service.description, localConsultation.intro);
  assert.deepEqual(service.areaServed, { "@type": "City", name: "New York City" });
  for (const route of routes.filter((route) => route !== localRoute)) {
    for (const schema of schemaNodes(documents.get(route)).filter((node) => hasType(node, "Service"))) {
      assert.equal(schema.areaServed, undefined, `${route}: no invented local service claim`);
    }
  }
  for (const slug of localConsultation.serviceSlugs) assert.ok(linksTo(local, localRoute, `/services/${slug}/`));
  const consultations = tags(local, "a").filter((tag) => Object.hasOwn(tag, "data-booking-link"));
  assert.ok(consultations.length > 0, "the local page provides the actual booking destination");
  for (const action of consultations) {
    assert.equal(action.href, bookingURL);
    assert.equal(action.target, "_blank");
    assert.match(action.rel, /\bnoopener\b/);
    assert.match(action.rel, /\bnoreferrer\b/);
  }
  assert.match(text(local), /Start with a Zoom consultation/);
  assert.match(text(local), /See the space before deciding on the software\./);
  assert.match(text(local), /reception desk, booking handoff, order station/);
  assert.match(text(local), /in-person consultation can help us understand the work before choosing what to build/);
  for (const option of ["website", "mobile app", "web platform", "desktop software", "custom tool"]) {
    assert.ok(text(local).includes(option), `${option}: the consultation explains the available build range`);
  }
  assert.match(text(local), /Manhattan, Brooklyn, and parts of Queens/);
  const consultationMail = tags(local, "a").filter((tag) => tag.href?.startsWith("mailto:"))
    .map((tag) => new URL(tag.href)).filter((url) => /consultation/i.test(url.searchParams.get("subject") || ""));
  assert.equal(consultationMail.length, 0, "Booking is no longer routed into a consultation email draft");
});

test("project and service content is crawlable in production HTML before JavaScript runs", () => {
  const home = documents.get("/");
  const homeAnchors = tags(home, "a").filter((tag) => tag.href && sameSite(tag.href, "/"));
  assert.equal([...home.matchAll(/class="[^"]*\barchive-card\b/g)].length, projects.length);
  assert.equal([...home.matchAll(/class="[^"]*\bproject-card\b/g)].length, featuredProjects.length);
  for (const project of projects) {
    const route = `/work/${projectSlugs[project.id]}/`;
    assert.ok(homeAnchors.some((tag) => pathname(tag.href, "/") === route), `${project.title}: crawlable homepage case link`);
    const html = documents.get(route);
    assert.equal(h1s(html)[0], project.title);
    assert.ok(text(html).includes(project.purpose));
    assert.ok(tags(html, "a").some((tag) => tag.href === project.repoUrl), `${project.title}: allowed GitHub source link`);
    for (const workflow of project.workflows) assert.ok(text(html).includes(workflow));
  }
  for (const service of services) {
    const route = `/services/${service.slug}/`;
    assert.ok(homeAnchors.some((tag) => pathname(tag.href, "/") === route), `${service.title}: crawlable homepage service link`);
    const html = documents.get(route);
    assert.equal(h1s(html)[0], service.heading);
    for (const id of service.projectIds) {
      assert.ok(tags(html, "a").some((tag) => tag.href && sameSite(tag.href, route) &&
        pathname(tag.href, route) === `/work/${projectSlugs[id]}/`), `${service.title}: links to matching project proof`);
    }
  }
});

test("salon and restaurant services explain the business workflow and connect to their guides and genuine project evidence", async () => {
  const xml = await readFile(path.join(output, "sitemap.xml"), "utf8");
  const sitemapDates = new Map([...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>\s*<\/url>/g)]
    .map(([, location, date]) => [new URL(decode(location)).pathname, date]));
  const home = documents.get("/");
  const homeServices = home.match(/<section\b[^>]*id="services"[^>]*>([\s\S]*?)<\/section>/i)?.[1];
  assert.ok(homeServices, "industry-specific starting points are part of the homepage services");
  const linksTo = (html, route, target) => tags(html, "a").some((tag) =>
    tag.href && sameSite(tag.href, route) && pathname(tag.href, route) === target);
  for (const slug of ["salon-booking-app-development", "restaurant-ordering-app-development"]) {
    const service = services.find((entry) => entry.slug === slug);
    const route = `/services/${slug}/`;
    const html = documents.get(route);
    const visible = text(html);
    assert.deepEqual(canonical(html).map((tag) => tag.href), [origin + route]);
    assert.equal(title(html), service.metaTitle);
    assert.equal(h1s(html)[0], service.heading);
    assert.equal(metadata(html, "description")[0]?.content, service.description);
    assert.equal(sitemapDates.get(route), service.modified || "2026-10-19");
    assert.ok(linksTo(homeServices, "/", route), `${service.title}: homepage services entry`);
    assert.ok(linksTo(documents.get("/services/"), "/services/", route), `${service.title}: service directory entry`);
    for (const content of [service.intro, service.proofIntro, ...service.when.flatMap(({ title, text }) => [title, text]),
      ...service.scope.flatMap(({ title, text }) => [title, text]), ...service.faq.flatMap(({ question, answer }) => [question, answer])]) {
      assert.ok(visible.includes(content), `${service.title}: complete explanatory copy is in the production HTML`);
    }
    const serviceSchema = schemaNodes(html).find((node) => hasType(node, "Service"));
    assert.equal(serviceSchema.url, origin + route);
    assert.equal(serviceSchema.name, service.title);
    const faqSchema = schemaNodes(html).find((node) => hasType(node, "FAQPage"));
    assert.deepEqual(faqSchema.mainEntity.map((entry) => entry.name), service.faq.map((entry) => entry.question));
    for (const id of service.projectIds) {
      assert.ok(projects.some((project) => project.id === id));
      assert.ok(linksTo(html, route, `/work/${projectSlugs[id]}/`), `${service.title}: published portfolio evidence`);
    }
    const guideRoute = `/insights/${service.guideSlug}/`;
    assert.ok(linksTo(html, route, guideRoute), `${service.title}: relevant planning guide`);
    assert.ok(linksTo(documents.get(guideRoute), guideRoute, route), `${service.title}: guide links back to the service`);
    assert.equal(sitemapDates.get(guideRoute), "2026-10-19");
    const inquiry = tags(html, "a").filter((tag) => tag.href?.startsWith("mailto:"))
      .map((tag) => new URL(tag.href)).find((draft) => draft.searchParams.get("body")?.includes("The problem:"));
    assert.equal(inquiry?.pathname, "admin@customtechbuilt4u.com");
    assert.ok(inquiry.searchParams.get("body").includes(`Source page: ${origin}${route}`),
      `${service.title}: a real inquiry retains its source without JavaScript`);
  }
  for (const article of articles.filter((entry) => !entry.modified)) {
    assert.equal(sitemapDates.get(`/insights/${article.slug}/`), "2026-10-19",
      `${article.title}: the booking navigation updates the guide while its publication date remains unchanged`);
  }
  assert.equal(sitemapDates.get("/services/"), "2026-10-19");
  assert.equal(sitemapDates.get("/"), "2026-10-20");
  assert.equal(sitemapDates.get("/insights/"), "2026-10-20");
  for (const route of routes) {
    const article = articles.find((entry) => route === `/insights/${entry.slug}/`);
    const service = services.find((entry) => route === `/services/${entry.slug}/`);
    const editedProject = projects.some((project) => route === `/work/${projectSlugs[project.id]}/`);
    const modified = route === "/" || route === "/insights/" || editedProject ? "2026-10-20" : service?.modified || article?.modified || "2026-10-19";
    assert.equal(sitemapDates.get(route), modified, `${route}: modification dates reflect the pages whose content changed`);
  }
});

test("the homepage preserves every supplied testimonial with a clear attribution and optional additional reading", () => {
  const html = documents.get("/");
  const section = html.match(/<section id="testimonials"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(section, "client feedback has its own section");
  assert.equal(clientTestimonials.length, 9);
  assert.equal([...section.matchAll(/<blockquote>/g)].length, 9);
  assert.equal([...section.matchAll(/<figcaption>/g)].length, 9);
  const [featured, more] = section.split('<details class="testimonial-more">');
  assert.equal([...featured.matchAll(/class="testimonial-card"/g)].length, 3);
  assert.equal([...more.matchAll(/class="testimonial-card"/g)].length, 6);
  for (const testimonial of clientTestimonials) {
    assert.ok(text(section).includes(testimonial.quote));
    for (const value of [testimonial.name, testimonial.role || testimonial.business, testimonial.location]) {
      assert.ok(text(section).includes(value), `${testimonial.name}: supplied attribution is present`);
    }
  }
  assert.ok(tags(section, "a").some((tag) => tag.href === bookingURL));
  assert.doesNotMatch(section, /Gemini|Grok|AggregateRating|verified review|star rating/i);
  assert.ok(!schemaNodes(html).some((node) => hasType(node, "Review") || hasType(node, "AggregateRating")), "quotes do not invent review ratings");
});

test("the homepage keeps all project showcases together before client feedback, process, questions, and consultation", () => {
  const home = documents.get("/");
  const sectionTags = [...home.matchAll(/<\/?section\b[^>]*>/gi)];
  const workStart = sectionTags.findIndex(([tag]) => attributes(tag).id === "work");
  assert.ok(workStart >= 0, "the homepage has a work section");
  let depth = 0;
  let workEnd;
  for (const [tag, position] of sectionTags.slice(workStart).map((match) => [match[0], match.index])) {
    depth += /^<\/section/i.test(tag) ? -1 : 1;
    if (depth === 0) { workEnd = position + tag.length; break; }
  }
  assert.ok(workEnd, "the work section is complete");
  const work = home.slice(sectionTags[workStart].index, workEnd);
  for (const id of ["featured-projects", "project-archive", "archive-projects"]) {
    assert.ok([...work.matchAll(/<(?:section|div)\b[^>]*>/gi)].some(([tag]) => attributes(tag).id === id),
      `${id} belongs to the same work section`);
  }
  const sectionPosition = (id) => sectionTags.find(([tag]) => attributes(tag).id === id)?.index;
  const destinations = ["work", "testimonials", "process", "project-faq", "consultation", "business-guides"].map(sectionPosition);
  assert.ok(destinations.every((position) => Number.isInteger(position)), "all client journey sections are present");
  assert.ok(destinations.every((position, index) => index === 0 || destinations[index - 1] < position),
    "work is followed by client feedback, process, questions, consultation, and useful reads");
  assert.ok(workEnd <= sectionPosition("testimonials"), "the whole personal-project archive finishes before client feedback");
  assert.doesNotMatch(home.slice(workEnd), /class="[^"]*\b(?:project-card|archive-card)\b/,
    "no app showcase returns after the consultation panel or questions");
});

test("project stories explain the original workflows and preserve real development context and inquiry links", () => {
  for (const project of projects) {
    const route = `/work/${projectSlugs[project.id]}/`;
    const html = documents.get(route);
    assert.ok(tags(html, "body")[0]?.class?.split(/\s+/).includes("project-detail-page"),
      `${project.title}: the dedicated project layout is present`);
    const clientScripts = tags(html, "script").filter((tag) => tag.src);
    assert.equal(clientScripts.length, 1, `${project.title}: only the contact-tracking module is loaded`);
    assert.match(pathname(clientScripts[0].src, route), /^\/static\/[a-f0-9]{16}\/analytics\.js$/);
    assert.equal(clientScripts[0].type, "module");
    const visible = text(html);
    assert.ok(visible.includes(project.clientSummary || project.summary), `${project.title}: plain-language summary`);
    for (const original of [project.purpose, project.challenge, project.build, project.notes,
      ...project.features, ...project.stack, ...(project.highlights || []).flatMap(({ title, text }) => [title, text])].filter(Boolean)) {
      assert.ok(visible.includes(original), `${project.title}: existing product and evidence context is preserved`);
    }
    const workflowCards = [...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/gi)]
      .filter(([, attrs]) => attributes(attrs).class?.split(/\s+/).includes("project-workflow-card"));
    assert.equal(workflowCards.length, project.workflows.length, `${project.title}: one explanatory card for each workflow`);
    for (const [index, workflow] of project.workflows.entries()) {
      const [, , contents] = workflowCards[index];
      assert.equal(text(contents.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1] || ""), workflow,
        `${project.title}: the workflow remains accurate`);
      const explanation = text(contents.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] || "");
      assert.ok(explanation.length > 0 && explanation !== workflow,
        `${project.title}: ${workflow} has client-facing explanation beyond the label`);
    }
    const storyNavigation = html.match(/<nav\b[^>]*aria-label="On this project page"[^>]*>([\s\S]*?)<\/nav>/i)?.[1];
    assert.ok(storyNavigation, `${project.title}: the project has its own page navigation`);
    assert.deepEqual(tags(storyNavigation, "a").map((tag) => tag.href), ["#overview", "#project-views", "#development"]);
    for (const target of ["overview", "project-views", "development", "project-cover"]) {
      assert.ok(tags(html, target === "project-cover" ? "figure" : "section").some((tag) => tag.id === target),
        `${project.title}: ${target} is a real static destination`);
    }
    assert.ok(html.indexOf('id="project-cover"') < html.indexOf('id="overview"'),
      `${project.title}: original cover introduces the project before the workflow`);
    const buildCallout = html.match(/<section\b[^>]*class="[^"]*\bproject-build-cta\b[^"]*"[^>]*>([\s\S]*?)<\/section>/i)?.[1];
    assert.ok(buildCallout, `${project.title}: business inquiry follows the project evidence`);
    assert.match(text(buildCallout), /Zoom/);
    assert.match(text(buildCallout), /space or workflow would help define the build/);
    assert.match(text(buildCallout), /in-person consultation/i);
    const inquiryLinks = tags(buildCallout, "a");
    const draft = new URL(inquiryLinks.find((tag) => tag.href?.startsWith("mailto:"))?.href || "https://invalid.example");
    assert.equal(draft.pathname, "admin@customtechbuilt4u.com");
    assert.equal(draft.searchParams.get("subject"), `Project inspired by ${project.title}`);
    assert.ok(draft.searchParams.get("body").includes("The problem:"));
    assert.ok(draft.searchParams.get("body").includes("Who will use it:"));
    assert.ok(draft.searchParams.get("body").includes(`Source page: ${origin}${route}`),
      `${project.title}: source attribution remains available without JavaScript`);
    const consultation = inquiryLinks.find((tag) => Object.hasOwn(tag, "data-booking-link"));
    assert.equal(consultation?.href, bookingURL, `${project.title}: clients can book directly from the project evidence`);
    assert.equal(consultation.target, "_blank");
    assert.match(consultation.rel, /\bnoopener\b/);
    assert.match(consultation.rel, /\bnoreferrer\b/);
    if (project.demoUrl) assert.ok(tags(html, "a").some((tag) => tag.href === project.demoUrl),
      `${project.title}: its real live or app destination is retained`);
  }
});

test("all local document references exist and remain inside the GitHub Pages subfolder", async () => {
  for (const [route, html] of documents) {
    const references = [...tags(html, "a"), ...tags(html, "img"), ...tags(html, "script"), ...tags(html, "link")];
    for (const tag of references) {
      const reference = tag.href || tag.src;
      if (!reference || /^(?:mailto:|tel:|data:)/.test(reference)) continue;
      const url = new URL(reference, `${origin}${route}`);
      if (url.origin !== origin) continue;
      await stat(await localFile(reference, route));
      if (!/^(?:https?:)?\/\//.test(reference)) {
        const github = new URL(reference, `https://example.invalid${githubPrefix}${route}`);
        assert.ok(github.pathname.startsWith(`${githubPrefix}/`), `${route}: ${reference} retains its hosting subfolder`);
      }
      if (url.hash && tag.href && tag.rel !== "canonical") {
        const targetHtml = documents.get(url.pathname);
        if (targetHtml) assert.match(targetHtml,
          new RegExp(`\\bid=["']${decodeURIComponent(url.hash.slice(1)).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`),
          `${route}: ${reference} resolves to a real fragment`);
      }
    }
  }
});

test("every public page offers the exact supplied booking destination without JavaScript", () => {
  assert.equal(bookingURL, "https://briefbooth.com/book/4u-digital");
  for (const route of routes) {
    const html = documents.get(route);
    const header = html.match(/<header\b[\s\S]*?<\/header>/i)?.[0];
    assert.ok(header, `${route}: a site header is present`);
    const action = tags(header, "a").find((tag) => tag.class?.split(/\s+/).includes("nav-contact"));
    assert.ok(action, `${route}: the primary booking link is present`);
    assert.ok(Object.hasOwn(action, "data-booking-link"));
    assert.equal(action.href, bookingURL);
    assert.ok(text(header).includes("Book a consultation"));
    const bookingLinks = tags(html, "a").filter((tag) => Object.hasOwn(tag, "data-booking-link"));
    assert.ok(bookingLinks.length >= 2, `${route}: booking is available in the header and the page`);
    for (const link of bookingLinks) {
      assert.equal(link.href, bookingURL, `${route}: no queries, fragments, or private data are added to booking links`);
      assert.equal(link.target, "_blank");
      assert.match(link.rel, /\bnoopener\b/);
      assert.match(link.rel, /\bnoreferrer\b/);
    }
    assert.doesNotMatch(html, /id="consultation-(?:form|email|times|project|copy|draft)"/);
    assert.doesNotMatch(text(html), /\bRequest a consultation\b/);
    for (const mail of tags(html, "a").filter((tag) => tag.href?.startsWith("mailto:"))) {
      const draft = new URL(mail.href);
      assert.equal(draft.pathname, "admin@customtechbuilt4u.com");
      assert.doesNotMatch(draft.searchParams.get("subject") || "", /consultation/i,
        `${route}: consultation booking does not open an old email request`);
    }
    assert.ok(tags(html, "a").some((tag) => tag.href && sameSite(tag.href, route) && pathname(tag.href, route) === "/contact/"),
      `${route}: the contact page remains reachable`);
  }
});

test("case pages expose every original gallery image, caption, and full-size link in static HTML", async () => {
  for (const project of projects) {
    const route = `/work/${projectSlugs[project.id]}/`;
    const html = documents.get(route);
    const figures = [...html.matchAll(/<figure\b([^>]*)>([\s\S]*?)<\/figure>/gi)]
      .filter(([, attrs]) => attributes(attrs).class?.split(/\s+/).includes("project-page-frame"));
    assert.equal(figures.length, project.gallery.length, `${project.title}: each original view appears once`);
    assert.deepEqual(figures.map(([, attrs]) => Number(attributes(attrs)["data-view"])).sort((a, b) => a - b),
      project.gallery.map((_, index) => index), `${project.title}: all original view indices are retained`);
    assert.doesNotMatch(html, /\bproject-gallery-detail\b/, `${project.title}: product views are not hidden in collapsed gallery rows`);
    for (const [index, frame] of project.gallery.entries()) {
      const [, attrs, contents] = figures.find(([, attrs]) => attributes(attrs)["data-view"] === String(index));
      assert.equal(attributes(attrs).id, index === 0 ? "project-cover" : `project-view-${index}`);
      const caption = contents.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1];
      assert.equal(text(caption.match(/<strong\b[^>]*>([\s\S]*?)<\/strong>/i)?.[1] || ""), frame.label);
      assert.equal(text(caption.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] || ""), frame.caption,
        `${project.title}: the original capture disclosure remains beside its image`);
      const originals = [frame, frame.companion].filter(Boolean);
      const images = tags(contents, "img");
      const fullSize = tags(caption, "a");
      assert.equal(images.length, originals.length, `${project.title}: all paired captures remain visible`);
      assert.equal(fullSize.length, originals.length, `${project.title}: every image has its own original-size link`);
      for (const image of originals) {
        const absolutePath = `/${image.image.replace(/^\.\//, "")}`;
        const matches = images.filter((entry) => entry.src && pathname(entry.src, route) === absolutePath);
        assert.equal(matches.length, 1, `${project.title}: ${image.image} appears once inside the original view`);
        const tag = matches[0];
        assert.equal(tag.alt, image.imageAlt);
        assert.equal(Number(tag.width), image.width);
        assert.equal(Number(tag.height), image.height);
        const link = fullSize.find((entry) => entry.href && sameSite(entry.href, route) && pathname(entry.href, route) === absolutePath);
        assert.ok(link, `${project.title}: ${image.image} can be inspected at its original size`);
        assert.equal(link.target, "_blank");
        assert.ok(link.rel.split(/\s+/).includes("noopener"));
        assert.deepEqual(await readFile(await localFile(tag.src, route)), await readFile(path.join(root, image.image)),
          `${image.image}: the deployed original is unchanged`);
      }
    }
  }
});

test("responsive project images are real, proportionate WebP files with intact full-size originals", async () => {
  const { imageVariants } = await import(pathToFileURL(path.join(output, "image-variants.js")).href);
  assert.ok(Object.keys(imageVariants).length > 0, "the production build produces responsive images");
  for (const project of projects) {
    assert.ok(imageVariants[project.image]?.length, `${project.title}: its main image has optimized display sizes`);
  }
  const encodedFiles = new Set();
  for (const [source, variants] of Object.entries(imageVariants)) {
    assert.match(source, /^\.\/assets\//);
    assert.ok(Array.isArray(variants) && variants.length > 0, `${source}: candidates are available`);
    const original = await readFile(path.join(root, source));
    assert.deepEqual(await readFile(path.join(output, source)), original, `${source}: the full-size master stays unchanged`);
    assert.ok(variants.some((variant) => variant.bytes < original.length),
      `${source}: responsive delivery offers a genuinely smaller display file`);
    const metadata = await sharp(original).metadata();
    let previousWidth = 0;
    for (const variant of variants) {
      assert.match(variant.src, /^\.\/assets\/optimized\/.+\.webp$/);
      assert.match(path.basename(variant.src), /[a-f0-9]{16}/, `${source}: optimized URLs contain a content fingerprint`);
      assert.ok(Number.isInteger(variant.width) && variant.width > previousWidth,
        `${source}: candidates have unique increasing pixel widths`);
      assert.ok(variant.width <= metadata.width, `${source}: display variants never upscale the original`);
      assert.ok(Number.isInteger(variant.height) && variant.height > 0);
      const originalRatio = metadata.width / metadata.height;
      assert.ok(Math.abs(variant.width / variant.height - originalRatio) / originalRatio <= 0.01,
        `${source}: resizing preserves the original proportions`);
      const bytes = await readFile(path.join(output, variant.src));
      assert.equal(bytes.length, variant.bytes, `${variant.src}: advertised byte count matches the encoded file`);
      const fingerprint = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
      assert.ok(path.basename(variant.src).endsWith(`-${fingerprint}-${variant.width}.webp`),
        `${variant.src}: changing encoded image bytes changes the cache URL`);
      const encoded = await sharp(bytes).metadata();
      assert.equal(encoded.format, "webp");
      assert.equal(encoded.width, variant.width);
      assert.equal(encoded.height, variant.height);
      encodedFiles.add(path.resolve(output, variant.src));
      previousWidth = variant.width;
    }
  }
  const deployedVariants = await filesUnder(path.join(output, "assets/optimized"));
  assert.deepEqual(new Set(deployedVariants.map((file) => path.resolve(file))), encodedFiles,
    "every packaged responsive file belongs to the current public image manifest");

  for (const [route, html] of documents) {
    for (const image of tags(html, "img")) {
      if (!image.src || !sameSite(image.src, route)) continue;
      const key = `.${pathname(image.src, route)}`;
      const variants = imageVariants[key];
      if (!variants) continue;
      assert.ok(image.sizes?.trim(), `${route}: ${key} declares its displayed size without JavaScript`);
      const candidates = (image.srcset || "").split(",").map((candidate) => {
        const match = candidate.trim().match(/^(\S+)\s+(\d+)w$/);
        assert.ok(match, `${route}: ${key} has valid width-based responsive candidates`);
        const [, url, width] = match;
        const github = new URL(url, `https://example.invalid${githubPrefix}${route}`);
        assert.ok(github.pathname.startsWith(`${githubPrefix}/assets/optimized/`),
          `${route}: responsive URLs retain the GitHub Pages subfolder`);
        return { src: `.${pathname(url, route)}`, width: Number(width) };
      });
      assert.deepEqual(candidates, variants.map(({ src, width }) => ({ src, width })),
        `${route}: ${key} offers the actual generated image candidates`);
    }
  }
});

test("immutable caching applies only to content-versioned assets and keeps one complete module graph", async () => {
  const configuration = JSON.parse(await readFile(path.join(root, "vercel.json"), "utf8"));
  const cacheRules = (configuration.headers || []).flatMap((rule) => rule.headers
    .filter((header) => header.key.toLowerCase() === "cache-control")
    .map((header) => ({ source: rule.source, value: header.value })));
  assert.deepEqual(new Set(cacheRules.map(({ source }) => source)),
    new Set(["/static/(.*)", "/assets/optimized/(.*)"]),
    "only versioned modules, styles, and optimized image URLs receive a long browser cache");
  for (const rule of cacheRules) {
    assert.match(rule.value, /(?:^|,)\s*public\s*(?:,|$)/);
    assert.match(rule.value, /(?:^|,)\s*max-age=31536000\s*(?:,|$)/);
    assert.match(rule.value, /(?:^|,)\s*immutable\s*(?:,|$)/);
  }
  for (const route of [...routes, "/404.html"]) {
    assert.ok(!route.startsWith("/static/") && !route.startsWith("/assets/optimized/"),
      `${route}: HTML remains outside the immutable cache rules`);
  }

  const versions = await readdir(path.join(output, "static"));
  assert.equal(versions.length, 1, "the build emits one current asset graph");
  const [version] = versions;
  assert.match(version, /^[a-f0-9]{16}$/);
  const directory = path.join(output, "static", version);
  const names = (await readdir(directory)).sort();
  assert.ok(names.includes("app.js") && names.includes("analytics.js") && names.includes("styles.css") &&
    names.includes("image-variants.js"), "the graph includes entries, styles, and the generated image map");
  const digest = createHash("sha256");
  const moduleURLs = new Map();
  const rememberModule = (url) => {
    const name = path.posix.basename(url.pathname);
    if (moduleURLs.has(name)) assert.equal(url.href, moduleURLs.get(name),
      `${name}: page scripts and imports resolve to the same module instance`);
    moduleURLs.set(name, url.href);
  };
  for (const name of names) {
    const content = await readFile(path.join(directory, name));
    assert.deepEqual(content, await readFile(path.join(output, name)),
      `${name}: the versioned file matches the freshly generated compatibility copy`);
    digest.update(name).update("\0").update(content).update("\0");
    if (!name.endsWith(".js")) continue;
    const importer = `${origin}/static/${version}/${name}`;
    for (const [, reference] of content.toString("utf8").matchAll(/^\s*import\s+[^;\n]*?\bfrom\s+["']([^"']+)["']/gm)) {
      assert.ok(reference.startsWith("./"), `${name}: module imports stay relative to their versioned graph`);
      const target = new URL(reference, importer);
      assert.equal(path.posix.dirname(target.pathname), `/static/${version}`,
        `${name}: imported modules cannot fall back to stale unversioned URLs`);
      assert.ok(names.includes(path.posix.basename(target.pathname)), `${name}: ${reference} is packaged`);
      rememberModule(target);
    }
  }
  assert.equal(digest.digest("hex").slice(0, 16), version,
    "every changed module or stylesheet changes the shared immutable asset URL");
  for (const [route, html] of documents) {
    for (const tag of [...tags(html, "script"), ...tags(html, "link")]) {
      const reference = tag.src || tag.href;
      if (!reference || !sameSite(reference, route)) continue;
      const url = new URL(reference, `${origin}${route}`);
      if (!/\.(?:js|css)$/.test(url.pathname)) continue;
      assert.equal(path.posix.dirname(url.pathname), `/static/${version}`,
        `${route}: browser entry points use the current content version`);
      if (url.pathname.endsWith(".js")) rememberModule(url);
    }
  }
});

test("published pages, data, routes, and assets contain only the nine selected projects", async () => {
  const excludedIds = ["Role-Call", "bleepkit", "dictype", "vlognudge", "nycstandupopenmicmaster", "micro-short-website", "tlcmassagewellness", "taylordrewwebsite"];
  const excludedProjects = auditedProjects.filter((project) => excludedIds.includes(project.id));
  assert.equal(excludedProjects.length, 8, "Unselected projects still exist in the internal audited inventory");
  const excluded = ["https://www.taylordrew4u.com", ...excludedIds,
    ...excludedProjects.map((project) => project.title), ...excludedProjects.map((project) => `/work/${projectSlugs[project.id]}/`)];
  const outputFiles = await filesUnder(output);
  const published = outputFiles.filter((file) => /\.(?:html|js|json|xml|txt)$/.test(file));
  for (const file of published) {
    const contents = await readFile(file, "utf8");
    for (const value of excluded) assert.ok(!contents.toLowerCase().includes(value.toLowerCase()),
      `${path.relative(output, file)} excludes ${value}`);
    assert.doesNotMatch(contents, /\bTaylor\s+Drew\b|\bTaylorDrew\b|by taylordrew4u|class=["'][^"']*owner-credit/i);
  }
  const assetsFor = (project) => [project.image, project.icon,
    ...(project.gallery || []).flatMap((frame) => [frame.image, frame.companion?.image])].filter(Boolean);
  const selectedAssets = new Set(projects.flatMap(assetsFor));
  for (const project of excludedProjects) {
    const route = `/work/${projectSlugs[project.id]}/`;
    assert.ok(!documents.has(route), `${project.title}: no public case page is generated`);
    await assert.rejects(stat(pageFile(route)), { code: "ENOENT" }, `${project.title}: no stale case route remains in the build`);
    for (const asset of new Set(assetsFor(project))) {
      if (selectedAssets.has(asset)) continue;
      await assert.rejects(stat(path.join(output, asset)), { code: "ENOENT" },
        `${project.title}: unselected project media is not deployed`);
    }
  }
  const publicModule = await readFile(path.join(output, "public-projects.js"), "utf8");
  for (const project of projects) {
    assert.ok(publicModule.includes(project.repoUrl), `${project.title}: GitHub source remains public`);
  }
  for (const [route, html] of documents) {
    for (const link of tags(html, "a").filter((tag) => tag.href?.startsWith("mailto:"))) {
      const draft = new URL(link.href);
      assert.equal(draft.pathname, "admin@customtechbuilt4u.com", `${route}: business inquiries use the requested address`);
      const source = route === "/404.html" ? "/" : route;
      assert.ok(draft.searchParams.get("body")?.includes(`Source page: ${origin}${source}`),
        `${route}: an email inquiry retains its canonical source without JavaScript`);
    }
  }
  assert.ok(!documents.has("/work/retro-desktop-website/"));
  await assert.rejects(stat(path.join(output, "assets/taylosite-capture.webp")), { code: "ENOENT" });
});
