import test, { before } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { projects, featuredProjects } from "../public-projects.js";
import { site, services, projectSlugs } from "../seo-content.js";
import { articles } from "../seo-articles.js";
import { localConsultation } from "../seo-local.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist");
const origin = "https://customtechbuilt4u.com";
const githubPrefix = "/taylorworkexamples-";
const routes = ["/", "/services/", ...services.map((service) => `/services/${service.slug}/`),
  "/work/", ...projects.map((project) => `/work/${projectSlugs[project.id]}/`),
  "/guides/website-or-app/", "/about/", "/contact/", "/insights/",
  ...articles.map((article) => `/insights/${article.slug}/`), "/new-york-city/"];
const documents = new Map();

const decode = (value = "") => value.replace(/&#(x[\da-f]+|\d+);/gi, (_, code) =>
  String.fromCodePoint(code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code)),
).replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, name) =>
  ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " })[name]);
const attributes = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g)]
  .map(([, name, , value]) => [name.toLowerCase(), decode(value)]));
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
  assert.equal(projects.length, 15);
  assert.equal(articles.length, 6);
  assert.equal(routes.length, 33);
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

test("every indexable page has unique metadata, one semantic heading, and consistent social metadata", async () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const route of routes) {
    const html = documents.get(route);
    const pageTitle = title(html);
    const description = metadata(html, "description");
    const headings = h1s(html);
    assert.ok(pageTitle.includes("Built4U"), `${route}: page title identifies the business`);
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
    assert.equal(org.name, "Built4U");
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
      assert.equal(schema.datePublished, "2026-10-14");
      assert.equal(schema.dateModified, schema.datePublished);
      assert.equal(schema.datePublished, site.published);
      assert.deepEqual(tags(html, "time").map((tag) => tag.datetime), [schema.datePublished]);
      assert.ok(visible.includes("by built4u"), `${route}: visible company author`);
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

test("business guides and consultation details are discoverable, truthful, and ready for email inquiries", () => {
  const hubRoute = "/insights/";
  const localRoute = "/new-york-city/";
  const linksTo = (html, route, target) => tags(html, "a").some((tag) =>
    tag.href && sameSite(tag.href, route) && pathname(tag.href, route) === target);
  for (const route of ["/", "/contact/", hubRoute]) {
    const html = documents.get(route);
    assert.ok(linksTo(html, route, localRoute), `${route}: reachable consultation page`);
    assert.match(text(html), /Zoom/);
    assert.match(text(html), /New York City/);
    assert.match(text(html), /by arrangement/i);
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
  const consultations = tags(local, "a").filter((tag) => tag.href?.startsWith("mailto:"))
    .map((tag) => new URL(tag.href)).filter((url) => url.searchParams.get("subject") === "Built4U consultation");
  assert.ok(consultations.length > 0, "the local page provides an actual consultation inquiry");
  for (const draft of consultations) {
    assert.equal(draft.pathname, "admin@customtechbuilt4u.com");
    assert.ok(draft.searchParams.get("body").includes("Consultation format (Zoom or in-person in New York City):"));
    assert.ok(draft.searchParams.get("body").includes("Preferred times:"));
    assert.ok(draft.searchParams.get("body").includes("The problem:"));
  }
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

test("every page offers the same consultation entry without relying on JavaScript", () => {
  for (const route of routes) {
    const html = documents.get(route);
    const header = html.match(/<header\b[\s\S]*?<\/header>/i)?.[0];
    assert.ok(header, `${route}: a site header is present`);
    const action = tags(header, "a").find((tag) => tag.class?.split(/\s+/).includes("nav-contact"));
    assert.ok(action, `${route}: the primary consultation link is present`);
    const destination = new URL(action.href, `${origin}${route}`);
    assert.equal(destination.origin, origin);
    assert.equal(destination.pathname, "/");
    assert.equal(destination.hash, "#consultation");
    assert.ok(text(header).includes("Book a consultation"));
    assert.ok(tags(html, "a").some((tag) => tag.href && sameSite(tag.href, route) && pathname(tag.href, route) === "/contact/"),
      `${route}: the contact page remains reachable`);
  }
});

test("case pages preserve every original gallery image and caption in static HTML", async () => {
  for (const project of projects) {
    const route = `/work/${projectSlugs[project.id]}/`;
    const html = documents.get(route);
    const images = tags(html, "img");
    for (const frame of project.gallery) {
      assert.ok(text(html).includes(frame.caption), `${project.title}: visible capture disclosure`);
      for (const image of [frame, frame.companion].filter(Boolean)) {
        const absolutePath = `/${image.image.replace(/^\.\//, "")}`;
        const tag = images.find((entry) => entry.src && pathname(entry.src, route) === absolutePath);
        assert.ok(tag, `${project.title}: ${image.image} is in initial HTML`);
        assert.equal(tag.alt, image.imageAlt);
        assert.equal(Number(tag.width), image.width);
        assert.equal(Number(tag.height), image.height);
        assert.deepEqual(await readFile(await localFile(tag.src, route)), await readFile(path.join(root, image.image)),
          `${image.image}: the deployed original is unchanged`);
      }
    }
  }
});

test("the published business excludes personal identity while preserving allowed GitHub sources", async () => {
  const excluded = ["taylordrewwebsite", "https://www.taylordrew4u.com"];
  const published = (await filesUnder(output)).filter((file) => /\.(?:html|js|json|xml|txt)$/.test(file));
  for (const file of published) {
    const contents = await readFile(file, "utf8");
    for (const value of excluded) assert.ok(!contents.includes(value), `${path.relative(output, file)} excludes ${value}`);
    assert.doesNotMatch(contents, /\bTaylor\s+Drew\b|\bTaylorDrew\b|by taylordrew4u|class=["'][^"']*owner-credit/i);
  }
  const publicModule = await readFile(path.join(output, "public-projects.js"), "utf8");
  for (const project of projects) {
    assert.ok(publicModule.includes(project.repoUrl), `${project.title}: GitHub source remains public`);
  }
  for (const [route, html] of documents) {
    for (const link of tags(html, "a").filter((tag) => tag.href?.startsWith("mailto:"))) {
      assert.equal(new URL(link.href).pathname, "admin@customtechbuilt4u.com", `${route}: business inquiries use the requested address`);
    }
  }
  assert.ok(!documents.has("/work/retro-desktop-website/"));
  await assert.rejects(stat(path.join(output, "assets/taylosite-capture.webp")), { code: "ENOENT" });
});
