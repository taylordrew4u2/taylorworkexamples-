import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { site, services, guide, projectSlugs } from "../seo-content.js";
import { articles, articleTopics, homepageArticles } from "../seo-articles.js";
import { clientTestimonials } from "../content/client-testimonials.js";
import { localConsultation } from "../seo-local.js";
import { launchOffer } from "../seo-offer.js";
import { clientCare } from "../client-care.js";
import { projects, featuredProjects } from "../public-projects.js";
import { projectStories } from "../project-stories.js";
import { projectClientUses } from "../content/project-client-uses.js";
import { projectBuildCare } from "../content/project-build-care.js";
import { escape, enquiryURL } from "../render-projects.js";
import { bookingURL } from "../booking.js";
import { addInquirySource } from "../contact-context.js";
import { renderRangeProof } from "../range-proof.js";
import { renderKickoffForm } from "../kickoff-view.js";
import { renderProjectBrief } from "../project-brief-view.js";
import { legalBusiness } from "../legal-content.js";
import { renderLegalPages } from "../legal-pages.js";
import { pricing } from "../content/pricing.js";

const origin = site.origin;
const organizationId = `${origin}/#organization`;
const websiteId = `${origin}/#website`;
export const release = "50";
const assetsFrom = (route) => "../".repeat(Math.max(0, route.split("/").filter(Boolean).length - (route.endsWith("/") ? 0 : 1)));
const local = (route, target = "") => `${assetsFrom(route) || "./"}${target}`;
const absolute = (asset) => `${origin}/${asset.replace(/^\.\//, "")}`;
const json = (value) => JSON.stringify(value).replace(/</g, "\\u003c");

function organization() {
  return {
    "@type": "Organization", "@id": organizationId, name: "4u Digital", url: `${origin}/`,
    slogan: "Custom tech build for you.",
    description: "Custom apps, websites, and software for businesses.",
    email: site.email, logo: `${origin}/assets/4u-digital-logo-mono.png`,
    sameAs: ["https://github.com/taylordrew4u2"],
  };
}

function graph(page) {
  const url = `${origin}${page.path}`;
  const webPage = {
    "@type": page.type || "WebPage", "@id": `${url}#page`, url, name: page.title,
    description: page.description, isPartOf: { "@id": websiteId },
    publisher: { "@id": organizationId }, inLanguage: "en",
  };
  const nodes = [organization(), {
    "@type": "WebSite", "@id": websiteId, url: `${origin}/`, name: "4u Digital",
    publisher: { "@id": organizationId }, inLanguage: "en",
  }, webPage];
  if (page.breadcrumbs?.length) {
    const breadcrumbId = `${url}#breadcrumbs`;
    webPage.breadcrumb = { "@id": breadcrumbId };
    nodes.push({ "@type": "BreadcrumbList", "@id": breadcrumbId,
      itemListElement: [{ name: "4u Digital", path: "/" }, ...page.breadcrumbs].map((item, index) => ({
        "@type": "ListItem", position: index + 1, name: item.name, item: `${origin}${item.path}`,
      })),
    });
  }
  if (page.service) {
    webPage.mainEntity = { "@id": `${url}#service` };
    nodes.push({ "@type": "Service", "@id": `${url}#service`, url,
      name: page.service.title, serviceType: page.service.title,
      description: page.service.intro, provider: { "@id": organizationId },
      ...(page.local ? { areaServed: { "@type": "City", name: "New York City" } } : {}),
    });
  }
  if (page.offer) {
    webPage.mainEntity = { "@id": `${url}#service` };
    nodes.push({
      "@type": "Service", "@id": `${url}#service`, url,
      name: page.offer.title, description: page.offer.intro,
      provider: { "@id": organizationId },
      areaServed: { "@type": "City", name: "New York City" },
      offers: {
        "@type": "Offer", url, name: "Custom business website",
        price: page.offer.price, priceCurrency: "USD",
        validThrough: page.offer.validUntil,
        description: "Up to five pages. First ten eligible NYC projects agreed by November 30, 2026, subject to scope and capacity.",
      },
    });
  }
  if (page.article) {
    webPage.mainEntity = { "@id": `${url}#article` };
    nodes.push({ "@type": "Article", "@id": `${url}#article`, url,
      headline: page.article.title, description: page.article.description,
      author: { "@id": organizationId }, publisher: { "@id": organizationId },
      datePublished: page.article.published || site.published, dateModified: page.article.modified || site.modified || site.published,
      mainEntityOfPage: { "@id": webPage["@id"] }, inLanguage: "en",
    });
  }
  if (page.project) {
    webPage.mainEntity = { "@id": `${url}#project` };
    nodes.push({ "@type": "CreativeWork", "@id": `${url}#project`, url,
      name: page.project.title, description: page.project.purpose,
      image: absolute(page.project.image), creator: { "@id": organizationId },
      genre: page.project.projectType || page.project.category,
    });
  }
  if (page.faq?.length) {
    nodes.push({ "@type": "FAQPage", "@id": `${url}#faq`,
      mainEntity: page.faq.map(({ question, answer }) => ({ "@type": "Question", name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": nodes };
}

export function pageHead(page, homepage = false) {
  const image = page.image || "./assets/4u-digital-logo-mono.png";
  const imageWidth = page.imageWidth || 256;
  const imageHeight = page.imageHeight || 256;
  return `<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#ffffff" />
    ${homepage && site.googleSiteVerification ? `<meta name="google-site-verification" content="${escape(site.googleSiteVerification)}" />` : ""}
    <meta name="robots" content="${page.noindex ? "noindex, follow" : "index, follow, max-image-preview:large"}" />
    <title>${escape(page.title)}</title>
    <meta name="description" content="${escape(page.description)}" />
    <link rel="canonical" href="${escape(origin + page.path)}" />
    <meta property="og:type" content="${page.article ? "article" : "website"}" />
    ${page.article ? `<meta property="article:published_time" content="${page.article.published || site.published}" />
    <meta property="article:modified_time" content="${page.article.modified || site.modified || site.published}" />` : ""}
    <meta property="og:site_name" content="4u Digital" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:url" content="${escape(origin + page.path)}" />
    <meta property="og:title" content="${escape(page.title)}" />
    <meta property="og:description" content="${escape(page.description)}" />
    <meta property="og:image" content="${escape(absolute(image))}" />
    <meta property="og:image:width" content="${imageWidth}" />
    <meta property="og:image:height" content="${imageHeight}" />
    <meta property="og:image:alt" content="${escape(page.imageAlt || "4u Digital open frame logo")}" />
    <meta name="twitter:card" content="${page.image ? "summary_large_image" : "summary"}" />
    <meta name="twitter:title" content="${escape(page.title)}" />
    <meta name="twitter:description" content="${escape(page.description)}" />
    <meta name="twitter:image" content="${escape(absolute(image))}" />
    <link rel="icon" type="image/png" sizes="64x64" href="${local(page.path, "assets/favicon-mono.png")}?v=${release}" />
    <link rel="stylesheet" href="${local(page.path, "styles.css")}?v=${release}" />
    <link rel="stylesheet" href="${local(page.path, "seo.css")}?v=${release}" />
    <script type="application/ld+json">${json(graph(page))}</script>
    <meta name="built4u-analytics" content="${site.analyticsEnabled && !page.noindex ? "vercel" : "off"}" />
    <script type="module" src="${local(page.path, "analytics.js")}?v=${release}"></script>
    <script type="module" src="${local(page.path, "navigation.js")}?v=${release}"></script>
    ${page.kickoffForm ? `<script type="module" src="${local(page.path, "kickoff-form.js")}?v=${release}"></script>` : ""}
    ${page.projectBrief ? `<link rel="stylesheet" href="${local(page.path, "project-brief.css")}?v=${release}" /><script type="module" src="${local(page.path, "project-brief.js")}?v=${release}"></script>` : ""}
    ${page.projectIndex ? `<script type="module" src="${local(page.path, "projects-page.js")}?v=${release}"></script>` : ""}
    ${homepage ? `<script type="module" src="./app.js?v=${release}"></script>` : ""}
  </head>`;
}

function header(route) {
  const navigation = [["services/", "Services"], ["work/", "Projects"]];
  const navLink = ([target, label]) => {
    const current = route === `/${target}` ? "page" : route.startsWith(`/${target}`) || (target === "insights/" && route.startsWith("/guides/")) ? "location" : "";
    return `<a href="${local(route, target)}"${current ? ` aria-current="${current}"` : ""}>${label}</a>`;
  };
  return `<a class="skip-link" href="#main">Skip to content</a><header class="site-header page-header wrap">
    <a class="wordmark" href="${local(route)}" aria-label="4u Digital, home"><img class="brand-symbol" src="${local(route, "assets/4u-digital-logo-mono.png")}" alt="" width="256" height="256" /><span class="brand-name">4u Digital</span></a>
    ${route === "/project-brief/" ? "" : `<button class="menu-toggle" aria-expanded="false" aria-controls="main-nav" aria-label="Open navigation"><span></span><span></span></button>`}
    <nav id="main-nav" class="page-nav" aria-label="Main navigation">${navigation.map(navLink).join("")}${bookingLink("nav-contact")}</nav>
  </header>`;
}

function brandSignature(route) {
  return `<a class="brand-signature" href="${local(route)}" aria-label="4u Digital, home"><img class="brand-signature-mark" src="${local(route, "assets/4u-digital-logo-mono.png")}" alt="" width="256" height="256" loading="lazy" decoding="async" /><span>4u Digital</span></a>`;
}

function footerPolicies(route) {
  return `<div class="footer-policies"><p class="legal-operator">4u Digital is operated by ${escape(legalBusiness.name)}.</p><nav aria-label="Policies"><a href="${local(route, "privacy/")}">Privacy policy</a><a href="${local(route, "terms/")}">Website terms</a><a href="${local(route, "guarantee/")}">Guarantee, refunds &amp; support</a></nav></div>`;
}

function footer(route) {
  return `<footer${route === "/" ? ' id="contact"' : ""} class="page-footer compact-footer wrap"><div class="page-footer-brand">${brandSignature(route)}<p class="page-footer-tagline">Custom tech build for you.</p></div><div class="page-footer-contact">${bookingLink("text-link footer-booking")}<a class="text-link" href="mailto:${site.email}">${site.email}</a></div><nav class="compact-footer-links" aria-label="Footer navigation"><a href="${local(route, "services/")}">Services</a><a href="${local(route, "work/")}">Projects</a><a href="${local(route, "pricing/")}">Pricing</a><a href="${local(route, "insights/")}">Guides</a><a href="${local(route, "offer/")}">Website offer</a><a href="${local(route, "project-brief/")}">Project planner</a><a href="${local(route, "about/")}">About</a><a href="${local(route, "contact/")}">Contact</a><a href="https://github.com/taylordrew4u2" target="_blank" rel="noopener noreferrer">GitHub ↗</a></nav>${footerPolicies(route)}<p class="page-copyright">© 2026 4u Digital</p></footer>`;
}

function breadcrumbs(page) {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="${local(page.path)}">4u Digital</a></li>${page.breadcrumbs.map((item, index) => `<li>${index === page.breadcrumbs.length - 1 ? `<span aria-current="page">${escape(item.name)}</span>` : `<a href="${local(page.path, item.path.slice(1))}">${escape(item.name)}</a>`}</li>`).join("")}</ol></nav>`;
}

function frame(page, content) {
  const pageClass = page.legal ? `legal-page ${page.path === "/privacy/" ? "privacy-page" : ""}` : page.project ? "project-detail-page" : page.article ? "article-detail-page" : page.local ? "local-consultation-page" : page.service ? "service-detail-page" : ({
    "/services/": "service-index-page", "/work/": "work-index-page", "/insights/": "insights-index-page",
    "/project-kickoff/": "kickoff-page", "/project-brief/": "project-brief-page", "/contact/": "contact-page", "/about/": "about-page",
    "/privacy/": "privacy-page", "/offer/": "offer-page", "/pricing/": "pricing-page", "/guides/website-or-app/": "comparison-page",
  }[page.path] || "");
  return sourceEmailLinks(`<!doctype html><html lang="en">${pageHead(page)}<body class="content-page ${pageClass}">${header(page.path)}<main id="main" class="page-main wrap">${breadcrumbs(page)}${content}</main>${footer(page.path)}${plannerShortcut(page.path)}${page.projectBrief ? "" : mobileConsultation()}</body></html>`, page.path);
}

function sourceEmailLinks(html, route) {
  return html.replace(/href="(mailto:[^"]*)"/g, (_, href) =>
    `href="${escape(addInquirySource(href.replace(/&amp;/g, "&"), route))}"`);
}

function intro(eyebrow, heading, text, actions = "", icon = "") {
  return `<header class="page-intro">${eyebrow ? `<p class="eyebrow">${escape(eyebrow)}</p>` : ""}<h1${icon ? ' class="page-project-title"' : ""}>${icon}<span>${escape(heading)}</span></h1><p class="page-lead">${escape(text)}</p>${actions}</header>`;
}

function inquiry(topic = "general", text = "Tell me what you need", reference = "", className = "button button-dark") {
  if (topic === "consultation") return bookingLink();
  return `<a class="${className}" href="${escape(enquiryURL(topic, reference))}">${escape(text)} <span aria-hidden="true">↗</span></a>`;
}

function bookingLink(className = "button button-dark") {
  return `<a class="${className}" data-booking-link href="${bookingURL}" target="_blank" rel="noopener noreferrer">Book a consultation <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>`;
}

function bookingDestinationNote() {
  return `<p class="booking-destination booking-destination-note">Video consultation · Opens BriefBooth in a new tab. Requests are reviewed before confirmation.</p>`;
}

function plannerShortcut(route) {
  return "";
}

function mobileConsultation() {
  return `<aside class="mobile-consultation" aria-label="Consultation booking">${bookingLink()}</aside>`;
}

function faqBlock(title, faqs, id = "") {
  return `<section${id ? ` id="${escape(id)}"` : ""} class="page-section"><h2>${escape(title)}</h2><div class="faq-list">${faqs.map(({ question, answer }) => `<details class="faq-item"><summary>${escape(question)}</summary><p>${escape(answer)}${answer.includes(clientCare.summary) ? ' <a href="#client-care">Read the guarantee and support details →</a>' : ""}</p></details>`).join("")}</div></section>`;
}

function projectType(project) {
  return project.projectType || { web: "Website", ios: "iOS app", desktop: "Desktop application", tools: "Developer tool" }[project.category] || "Software project";
}

function iconFor(project, route) {
  return `<span class="project-icon-frame" aria-hidden="true">${project.icon ? `<img class="project-icon" src="${local(route, project.icon.replace(/^\.\//, ""))}" alt="" width="${project.iconWidth}" height="${project.iconHeight}" loading="lazy" decoding="async" />` : `<span class="project-initials">${escape(project.iconFallback || project.title.slice(0, 2))}</span>`}</span>`;
}

function projectCard(project, route) {
  if (route === "/work/") return projectIndexCard(project, route);
  const search = [project.title, project.purpose, project.summary, projectType(project), ...project.stack, ...project.workflows].join(" ");
  return `<article class="seo-project-card" data-project-id="${escape(project.id)}" data-project-type="${projectFilterType(project)}" data-project-search="${escape(search)}"><a class="seo-project-cover" href="${local(route, `work/${projectSlugs[project.id]}/`)}"><img src="${local(route, project.image.replace(/^\.\//, ""))}" alt="${escape(project.imageAlt)}" width="${project.imageWidth}" height="${project.imageHeight}" loading="lazy" decoding="async" /></a><div class="seo-project-body"><p class="eyebrow">${escape(projectType(project))}</p><div class="seo-project-heading">${iconFor(project, route)}<h3><a href="${local(route, `work/${projectSlugs[project.id]}/`)}">${escape(project.title)}</a></h3></div><p>${escape(project.purpose)}</p>${route === "/work/" ? `<p class="work-index-image-label">${escape(project.imageLabel || "Project image")}</p>` : ""}<a class="text-link" href="${local(route, `work/${projectSlugs[project.id]}/`)}">See ${escape(project.title)} <span aria-hidden="true">↗</span></a></div></article>`;
}

function projectIndexCard(project, route) {
  const context = projectClientUses[project.id];
  if (!context) throw new Error(`Missing client context for ${project.id}`);
  const destination = local(route, `work/${projectSlugs[project.id]}/`);
  const search = [project.title, project.purpose, project.summary, projectType(project), ...project.stack, ...project.workflows,
    ...context.capabilities, context.businessUse].join(" ");
  const status = project.releaseStatus || (project.id === "FreeScript" ? "Signed Mac release · Not notarized" : project.demoLabel === "App Store" ? "On the App Store" : project.id === "usbmic" ? "Release candidate · Physical microphone validation pending" : "");
  const liveLink = project.demoUrl ? `<a class="text-link work-project-live-link" href="${escape(project.demoUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escape(project.title)}: ${escape(project.demoLabel || "Live site")} (opens in a new tab)">${escape(project.demoLabel || "Live site")} <span aria-hidden="true">↗</span></a>` : "";
  return `<article class="seo-project-card" data-project-id="${escape(project.id)}" data-project-type="${projectFilterType(project)}" data-project-search="${escape(search)}"><header class="work-project-header"><p class="eyebrow">${escape(projectType(project))}${status ? `<span class="work-project-status">${escape(status)}</span>` : ""}</p><div class="seo-project-heading">${iconFor(project, route)}<h3><a href="${destination}">${escape(project.title)}</a></h3></div></header><a class="seo-project-cover" href="${destination}" aria-label="Explore ${escape(project.title)}"><img src="${local(route, project.image.replace(/^\.\//, ""))}" alt="${escape(project.imageAlt)}" width="${project.imageWidth}" height="${project.imageHeight}" loading="lazy" decoding="async" /></a><p class="work-index-image-label">${escape(project.imageLabel || "Project image")}</p><div class="seo-project-body"><p class="work-project-purpose">${escape(project.purpose)}</p><ul class="work-project-capabilities" aria-label="What ${escape(project.title)} does">${context.capabilities.map((capability) => `<li>${escape(capability)}</li>`).join("")}</ul><div class="work-project-actions"><a class="text-link work-project-action" href="${destination}" aria-label="See how it works: ${escape(project.title)}">See how it works <span aria-hidden="true">↗</span></a>${liveLink}</div></div></article>`;
}

function projectFilterType(project) {
  if (project.projectType === "Website") return "website";
  if (project.category === "ios") return "ios";
  if (project.category === "desktop") return "desktop";
  return "web-app";
}

function projectIndexContent(route) {
  const orderedProjects = [...featuredProjects, ...projects.filter((project) => !featuredProjects.includes(project))];
  const filters = [["all", "All"], ["website", "Websites"], ["web-app", "Web apps"], ["ios", "iPhone & iPad"], ["desktop", "Desktop"]];
  const range = renderRangeProof().replace(/(href|src)="\.\//g, '$1="../');
  return intro("", "Projects.", `${projects.length} selected personal projects. Websites, apps, and software.`, `<div class="page-actions">${bookingLink()}</div>${bookingDestinationNote()}`) +
    `<section id="project-collection" class="page-section" aria-labelledby="project-collection-title"><h2 id="project-collection-title">Find a project like your idea.</h2><div id="project-browser-controls" class="project-browser-controls" hidden><fieldset class="project-type-filter"><legend>Project type</legend><div class="project-filter-options">${filters.map(([type, label]) => `<button type="button" data-project-filter="${type}" aria-pressed="${type === "all"}" aria-controls="project-index-grid">${escape(label)} <span aria-hidden="true">${projects.filter((project) => type === "all" || projectFilterType(project) === type).length}</span></button>`).join("")}</div></fieldset><label class="project-browser-search" for="project-browser-search"><span>Search projects</span><input id="project-browser-search" type="search" placeholder="Name, feature, or technology" autocomplete="off" aria-controls="project-index-grid" /></label></div><p id="project-browser-count" class="project-browser-count" role="status" aria-live="polite" aria-atomic="true">${projects.length} of ${projects.length} projects</p><div id="project-index-grid" class="seo-project-grid work-page-grid">${orderedProjects.map((project) => projectCard(project, route)).join("")}</div><div id="project-browser-empty" class="project-browser-empty" hidden><h3>No matching projects.</h3><p>Try a different word or project type.</p><button type="button" id="project-browser-reset" class="button button-outline">Show all projects</button></div><noscript><p class="no-js-help">All ${projects.length} projects are shown. Choose any project to open its complete story and images.</p></noscript></section>` +
    `<details id="range-proof" class="work-release-details"><summary>Published apps and development range</summary><div class="range-proof" aria-label="Development range and published app proof">${range}</div></details>` +
    `<section id="work-with-me" class="page-section work-hiring" aria-labelledby="work-hiring-title"><h2 id="work-hiring-title">Have something in mind?</h2><p class="work-hiring-intro">One developer for design, code, and launch. We agree the scope and price before building, with a 30-day money-back guarantee after your completed product launches.</p><div class="work-hiring-actions">${bookingLink()}<a class="text-link" href="${local(route, "guarantee/")}">Guarantee &amp; support <span aria-hidden="true">↗</span></a></div><aside class="portfolio-disclosure"><p>These are selected personal projects, not every app I’ve built. All custom code I build for your project is 100% yours. Client work and code will never appear in my public portfolio without your permission.</p></aside></section>`;
}

const serviceChoices = {
  "website-development": { heading: "I need a website.", title: "Custom websites.", text: "Show your business, explain your services, and help customers get in touch. New sites and rebuilds.", capabilities: ["Clear service and product pages", "Useful inquiry or booking flows", "Layouts made for phones and computers"] },
  "web-app-development": { heading: "I need a web app.", title: "Web apps.", text: "Customer portals, bookings, shared records, and payments. Open it in a browser on any device.", capabilities: ["Customer and team accounts", "Requests, approvals, and shared records", "Payments connected to your workflow"] },
  "app-development": { heading: "I need an iPhone or Mac app.", title: "iPhone, iPad & Mac apps.", text: "A native app for iPhone, iPad, or Mac, built around the task your users need to do.", capabilities: ["Native iPhone, iPad, and Mac screens", "Device features and offline workflows", "Testing and release preparation"] },
  "custom-software-development": { heading: "I need custom software.", title: "Custom software.", text: "Internal tools, desktop software, and integrations that fit the way your team works.", capabilities: ["Tools for specialist team tasks", "Documents turned into useful records", "Connections between existing systems"] },
  "salon-booking-app-development": { heading: "Salon bookings.", title: "Salon booking apps.", text: "Services, appointment requests, and a schedule your staff can manage.", capabilities: ["Services, staff, and appointment choices", "A clear schedule for your team", "Rescheduling and cancellation rules"] },
  "restaurant-ordering-app-development": { heading: "Restaurant ordering.", title: "Restaurant ordering apps.", text: "Your menu, pickup orders, and a clear queue for the team preparing them.", capabilities: ["Menus, options, and item availability", "Customer orders and a staff queue", "Pickup or delivery rules that fit your team"] },
};

function serviceCards(route, entries) {
  return `<div class="service-page-grid">${entries.map((service) => {
    const choice = serviceChoices[service.slug];
    return `<article class="service-page-card service-choice" data-service-choice="${escape(service.slug)}"><a class="service-choice-link" href="${local(route, `services/${service.slug}/`)}" aria-labelledby="choice-${escape(service.slug)}"><h3 id="choice-${escape(service.slug)}">${escape(choice.heading)}</h3><p>${escape(choice.text)}</p><span class="service-choice-arrow" aria-hidden="true">→</span></a></article>`;
  }).join("")}</div>`;
}

function servicesContent(route) {
  const industrySlugs = ["salon-booking-app-development", "restaurant-ordering-app-development"];
  return intro("APPS, WEBSITES, AND SOFTWARE.", "What would you like to build?", "A new website, an app, or a better way to run your business. I design, code, and launch it with you.", `<div class="page-actions">${bookingLink()}</div>${bookingDestinationNote()}`) +
    `<section id="service-choices" class="page-section service-choice-section" aria-labelledby="service-choices-title"><h2 id="service-choices-title">Choose the closest fit.</h2>${serviceCards(route, services.filter((service) => !industrySlugs.includes(service.slug)))}</section>` +
    `<p class="service-pricing-link"><a class="text-link" href="${local(route, "guides/website-or-app/")}">Compare websites, web apps, and native apps <span aria-hidden="true">→</span></a><a class="text-link" href="${local(route, "pricing/")}">See starting prices <span aria-hidden="true">→</span></a></p>` +
    `<aside id="services-website-offer" class="service-website-offer service-offer-quiet" aria-labelledby="services-offer-title"><h2 id="services-offer-title">NYC website offer.</h2><p>A custom website for $1,500, or $3,000 with booking or ordering. First ten eligible New York City projects agreed by November 30, 2026, subject to scope and capacity.</p><a class="text-link" href="${local(route, "offer/")}">See what’s included <span aria-hidden="true">→</span></a></aside>` +
    `<section class="page-section service-industry-links" aria-labelledby="industry-choices-title"><h2 id="industry-choices-title">For your kind of business.</h2><nav class="related-links" aria-label="Industry services">${services.filter((service) => industrySlugs.includes(service.slug)).map((service) => `<a href="${local(route, `services/${service.slug}/`)}">${escape(serviceChoices[service.slug].heading)} <span aria-hidden="true">→</span></a>`).join("")}<a href="${local(route, "services/website-development/")}">Local shops and other businesses <span aria-hidden="true">→</span></a></nav></section>` +
    `<aside class="page-callout service-closing"><h2>Not sure yet? Let’s talk.</h2><p>An idea, an existing website, or a task that takes too long is enough to start. We’ll work out the right approach together.</p><div class="page-actions">${bookingLink()}</div>${bookingDestinationNote()}</aside>`;
}

function businessIcon(type) {
  const paths = {
    salon: '<circle cx="6" cy="7" r="3"/><circle cx="6" cy="17" r="3"/><path d="m8.5 8.5 12 12m-12-5 12-12M13 12l2-2"/>',
    restaurant: '<path d="M5 3v7c0 2 4 2 4 0V3M7 3v18M19 21V3c-4 2-4 9 0 9M15 12h4"/>',
    shop: '<path d="M4 10v11h16V10M3 6l2-3h14l2 3v4c0 2-3 2-3 0 0 2-3 2-3 0 0 2-3 2-3 0 0 2-3 2-3 0 0 2-3 2-3 0V6ZM3 6h18M9 21v-6h6v6"/>',
  };
  return `<svg class="business-guide-symbol" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[type] || paths.shop}</svg>`;
}

function articleCards(route, collection = articles) {
  return `<div class="insight-grid">${collection.map((article) => `<article class="insight-card${article.businessType ? " business-guide-card" : ""}">${article.businessType ? `<div class="business-guide-label"><span class="business-guide-icon">${businessIcon(article.businessType)}</span><p class="eyebrow">${escape(article.businessLabel)}<span>Website guide</span></p></div>` : `<p class="eyebrow">${escape(articleTopics.find((topic) => topic.id === article.topic)?.label || "Business technology")} · ${article.format === "note" ? "Short read" : "Guide"}</p>`}<h3><a href="${local(route, `insights/${article.slug}/`)}">${escape(article.title)}</a></h3><p>${escape(article.summary)}</p><a class="text-link" href="${local(route, `insights/${article.slug}/`)}">${article.businessType ? "Read the guide" : article.format === "note" ? "Read the article" : "Read the guide"} <span aria-hidden="true">↗</span></a></article>`).join("")}</div>`;
}

function testimonialCard(testimonial) {
  const story = testimonial.id === "alistair-f" ? testimonial.projectStory : null;
  const projectStory = story ? `<div class="testimonial-project-story"><p class="testimonial-story-label">Client account</p><dl><div><dt>Problem</dt><dd>${escape(story.problem)}</dd></div><div><dt>Build</dt><dd>${escape(story.build)}</dd></div><div><dt>Client-reported result</dt><dd>${escape(story.result)}</dd></div></dl></div>` : "";
  return `<figure class="testimonial-card" id="testimonial-${escape(testimonial.id)}"><span class="testimonial-mark" aria-hidden="true">“</span><blockquote><p>${escape(testimonial.quote)}</p></blockquote><figcaption><strong>${escape(testimonial.name)}</strong><span>${escape(testimonial.role || testimonial.business)}</span><span class="testimonial-location">${escape(testimonial.location)}</span>${projectStory}</figcaption></figure>`;
}

function testimonialsSection() {
  return `<div class="section-heading"><div><p class="eyebrow">CLIENT REVIEWS</p><h2 id="testimonials-title">In their own words.</h2></div></div><div class="testimonial-grid">${clientTestimonials.slice(0, 3).map(testimonialCard).join("")}</div><details class="review-more"><summary>Read all 9 client reviews</summary><div class="testimonial-grid">${clientTestimonials.slice(3).map(testimonialCard).join("")}</div></details>`;
}

function articleIndex(route) {
  return `<nav class="page-section-nav" aria-label="Browse guide topics"><span class="mono">FIND YOUR STARTING POINT</span>${articleTopics.map((topic) => `<a href="#guides-${topic.id}">${escape(topic.label)} <span aria-hidden="true">↓</span></a>`).join("")}</nav>` +
    articleTopics.map((topic) => `<section id="guides-${topic.id}" class="page-section insight-topic" aria-labelledby="topic-${topic.id}"><h2 id="topic-${topic.id}">${escape(topic.title)}</h2><p>${escape(topic.description)}</p>${articleCards(route, articles.filter((article) => article.topic === topic.id))}</section>`).join("");
}

function consultationCallout(route) {
  return `<aside class="page-callout consultation-callout"><div><p class="eyebrow">FROM IDEA TO A CLEAR NEXT STEP</p><h2>Let’s talk about your project.</h2><p>A website, a mobile app, a web platform, desktop software, or a custom business workflow: we can work out what fits your business. Start with a video consultation through BriefBooth. If you are unsure what you need, or the technology depends on a particular space, we can arrange an in-person consultation in the NYC area.</p></div><div class="page-actions">${bookingLink()}<a class="text-link" href="${local(route, "new-york-city/")}">New York City consultations ↗</a></div></aside>`;
}

function kickoffPage() {
  const page = { path: "/project-kickoff/", title: "Project Kickoff Checklist | 4u Digital",
    description: "Plan your 4u Digital project after consultation: first-version scope, approvals, assets, account access, and a clear handover before building.",
    modified: "2026-10-23", kickoffForm: true, breadcrumbs: [{ name: "Project kickoff checklist", path: "/project-kickoff/" }],
  };
  const draft = new URL(`mailto:${site.email}`);
  draft.searchParams.set("subject", "4u Digital project kickoff details");
  draft.searchParams.set("body", `Hi 4u Digital,\n\nFollowing our consultation, here are the details for my project. We can work through anything still undecided.\n\nBUSINESS AND CONTACTS\nCompany / project:\nMain contact and business email:\nWho approves scope, price, and the final work:\nWho gathers feedback, and how we will record approvals:\n\nFIRST VERSION\nThe business problem and intended users:\nOne complete task the first version should support:\nWhat is included:\nWhat is outside this version:\nExamples of a successful result to check together:\nBudget, price, and target dates to agree:\nDependencies that could affect those dates:\n\nASSETS AND ACCOUNTS\nContent, images, brand files, or other material to supply:\nWho supplies and approves each item, and its permitted use:\nExisting tools / accounts involved and their owners:\nAccount invitations and access to arrange separately:\n\nREVIEW AND HANDOVER\nThe next review step:\nProject files, account ownership, and handover to agree:\nLaunch responsibilities and any support / maintenance to agree:\n\nPlease list the accounts involved without sending passwords, payment details, or customer records.\n\nThanks!`);
  const content = intro("EXISTING CLIENTS · AFTER THE CONSULTATION", "A clear plan before the build.",
    "Use this after we’ve discussed your project and agreed to work together. We’ll record the scope, approvals, and handover before building. You don’t need this worked out before getting in touch.",
    `<div class="page-actions"><a class="button button-dark" data-kickoff-start href="${escape(draft.href)}">Prepare a kickoff email <span aria-hidden="true">↗</span></a>${bookingLink("text-link")}</div>`) + `<div id="kickoff-fallback">` +
    `<section class="page-section"><h2>1. Agree the first useful version.</h2><ul class="page-list"><li><strong>The problem and the people.</strong> Identify who will use the technology and one complete task it should help them finish.</li><li><strong>What’s included—and what comes later.</strong> Record the features, project boundaries, existing-tool connections, price, and dates we agree.</li><li><strong>What a successful result looks like.</strong> Write down examples we can check together, including everyday use and what should happen if something changes or goes wrong.</li><li><strong>Dependencies and changes.</strong> Note any content, account access, or outside decisions needed. Agree changes to scope and their effect on price or dates before adding them.</li></ul><aside class="page-callout"><h3>An example to make it concrete.</h3><p>For a salon booking project, one possible check is: a customer can choose a service and available time, receive the agreed confirmation, and the team can see the booking. We would check it with sample appointments and agree how cancellations or unavailable times should behave.</p><p>This is an illustration. Your project’s features and checks are agreed together.</p></aside></section>` +
    `<section class="page-section"><h2>2. Know who makes the decisions.</h2><ul class="page-list"><li><strong>Main contact.</strong> Name the person who coordinates the project and the business email to use.</li><li><strong>Final approver.</strong> Agree who can approve scope, price, content, and the finished work.</li><li><strong>Feedback and reviews.</strong> Name the person who gathers comments, agree the next review step, and record decisions in the agreed written channel.</li></ul><p>These details belong to your project. We confirm them before the build starts.</p></section>` +
    `<section class="page-section"><h2>3. Plan the assets, access, and handover.</h2><ul class="page-list"><li><strong>Content and files.</strong> List the copy, images, logos, menus, service details, or other material needed. Record who supplies and approves each item, when it is needed, and its permitted use.</li><li><strong>Tools and account owners.</strong> Identify any domains, hosting, booking tools, app-store accounts, or payment services involved. We agree the access needed and arrange appropriate account invitations separately.</li><li><strong>Ownership and launch.</strong> Agree who owns the project files and accounts, who handles launch tasks, and what will be handed over.</li><li><strong>Support after launch.</strong> Record any agreed maintenance or support and the responsibilities for outside services before building.</li></ul><p>List the accounts involved; don’t send passwords, payment details, or customer records in the kickoff email.</p></section>` +
    `<aside class="page-callout"><h2>Turn the conversation into a working brief.</h2><p>The email template includes these headings so you can add what you know. Leave undecided items for us to discuss. It prepares a draft in your email app; you choose whether to send it to ${site.email}.</p><a class="button button-dark" href="${escape(draft.href)}">Prepare a kickoff email <span aria-hidden="true">↗</span></a><p>This checklist helps us prepare the project. The agreed scope, price, responsibilities, and schedule are confirmed separately.</p></aside></div>` + renderKickoffForm();
  return { ...page, html: frame(page, content) };
}

function projectBriefPage() {
  const page = { path: "/project-brief/", title: "Plan Your Website, App or Software Project | 4u Digital",
    description: "A guided project brief for your website, app or custom software. Explore features, colors, content and workflows, upload references, and send your ideas to 4u Digital.",
    modified: "2026-10-26", projectBrief: true,
    breadcrumbs: [{ name: "Project planner", path: "/project-brief/" }],
  };
  const content = intro("4U DIGITAL · PROJECT PLANNER", "Your project planner.",
    "Use this optional planner before or after a consultation. Skip anything undecided. Send your ideas to 4u Digital when ready. It doesn’t book a meeting. No account or consultation booking is needed.") + renderProjectBrief();
  return { ...page, html: frame(page, content) };
}

function articlePage(article) {
  const route = `/insights/${article.slug}/`;
  const page = { path: route, title: article.metaTitle, description: article.description, article: { ...article, modified: "2026-10-26" }, modified: "2026-10-26", faq: article.faq,
    breadcrumbs: [{ name: "Business guides", path: "/insights/" }, { name: article.title, path: route }],
  };
  const sections = article.sections.map(({ heading, text, paragraphs }, index) => `<section id="guide-section-${index + 1}" class="page-section"><h2>${escape(heading)}</h2>${(paragraphs || [text]).filter(Boolean).map((paragraph) => `<p>${escape(paragraph)}</p>`).join("")}</section>`).join("");
  const contents = `<nav class="article-contents" aria-label="Guide sections"><p class="eyebrow">IN THIS GUIDE</p><ol>${article.sections.map(({ heading }, index) => `<li><a href="#guide-section-${index + 1}">${escape(heading)}</a></li>`).join("")}</ol></nav>`;
  const readingGuide = article.businessType
    ? `<div class="industry-guide-sidebar"><aside class="industry-guide-summary" aria-label="${escape(article.businessLabel)} website essentials"><span class="business-guide-icon">${businessIcon(article.businessType)}</span><p class="eyebrow">AT A GLANCE</p><p class="industry-guide-takeaway">${escape(article.takeaway)}</p><ul role="list">${article.essentials.map((item) => `<li>${escape(item)}</li>`).join("")}</ul></aside><details class="industry-contents"><summary>Jump to a section <span aria-hidden="true">+</span></summary>${contents}</details></div>`
    : article.format === "note"
      ? `<details class="article-jump"><summary>Jump to a section <span aria-hidden="true">+</span></summary>${contents}</details>`
      : contents;
  const examples = article.projectIds.map((id) => projects.find((project) => project.id === id)).filter(Boolean);
  const published = article.published || site.published;
  const dateLabel = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${published}T00:00:00Z`));
  const preferred = (article.relatedSlugs || []).map((slug) => articles.find((entry) => entry.slug === slug)).filter(Boolean);
  const related = [...preferred, ...articles.filter((entry) => entry.slug !== article.slug && entry.topic === article.topic && !preferred.includes(entry))].slice(0, 2);
  const work = article.format === "note"
    ? `<section id="related-work" class="page-section article-related-work"><h2>See related personal projects.</h2><p>Explore the product screens and development details in the portfolio.</p><nav class="related-links" aria-label="Related personal projects">${examples.map((project) => `<a href="${local(route, `work/${projectSlugs[project.id]}/`)}">${escape(project.title)} <span aria-hidden="true">↗</span></a>`).join("")}</nav></section>`
    : `<section id="related-work" class="page-section"><h2>Relevant work from the 4u Digital portfolio</h2><p>See the product screens and development details behind these related software projects. Each project page explains its purpose and the context of its images.</p><div class="seo-project-grid">${examples.map((project) => projectCard(project, route)).join("")}</div></section>`;
  const serviceLinks = `<nav class="related-links" aria-label="Related development services">${article.serviceSlugs.map((slug) => services.find((service) => service.slug === slug)).filter(Boolean).map((service) => `<a href="${local(route, `services/${service.slug}/`)}">${escape(service.title)}</a>`).join("")}</nav>`;
  const nextStep = `<aside class="page-callout article-next-step${article.businessType ? " industry-guide-cta" : ""}"><p class="eyebrow">YOUR NEXT STEP</p><h2>${article.businessType ? `Let’s plan your ${escape({ salon: "salon", restaurant: "restaurant", shop: "shop" }[article.businessType])} website.` : "Talk through your next build."}</h2><p>${escape(article.closing)}</p><div class="page-actions">${bookingLink()}<a class="text-link" href="${local(route, "new-york-city/")}">About NYC in-person consultations <span aria-hidden="true">↗</span></a></div>${serviceLinks}${article.slug === "what-to-bring-to-a-developer" ? `<p class="article-planner-note">Prefer to write your ideas first? The <a href="${local(route, "project-brief/")}">optional project planner</a> is available before or after a consultation and does not book a meeting.</p>` : ""}</aside>`;
  const content = `<article class="guide-article${article.format === "note" ? " short-article" : ""}${article.businessType ? " industry-guide" : ""}">${intro(article.businessType ? `${article.businessLabel} · A 4u Digital WEBSITE GUIDE` : article.format === "note" ? "A SHORT READ FROM 4u Digital" : "A 4u Digital BUSINESS GUIDE", article.title, article.summary, `<div class="page-actions article-intro-actions">${bookingLink()}<a class="text-link" href="#related-work">See related projects <span aria-hidden="true">↓</span></a></div>`)}<p class="article-byline">By 4u Digital · <time datetime="${published}">${dateLabel}</time></p><div class="article-layout">${readingGuide}<div class="article-body"><p class="article-opening">${escape(article.intro)}</p>${sections}${article.faq?.length ? faqBlock("A few useful answers", article.faq) : ""}</div></div>${work}<section class="page-section"><h2>Keep reading.</h2><nav class="related-links" aria-label="More business guides">${related.map((entry) => `<a href="${local(route, `insights/${entry.slug}/`)}">${escape(entry.title)}</a>`).join("")}<a href="${local(route, "insights/")}">All 4u Digital business guides</a><a href="${local(route, "guides/website-or-app/")}">Website, web app, or native app?</a></nav></section>${nextStep}</article>`;
  return { ...page, html: frame(page, content) };
}

function localPage() {
  const route = "/new-york-city/";
  const page = { path: route, title: localConsultation.metaTitle, description: localConsultation.description,
    service: localConsultation, local: true, modified: "2026-10-26", faq: localConsultation.faq,
    breadcrumbs: [{ name: "New York City consultations", path: route }],
  };
  const content = intro("NEW YORK CITY · VIDEO CONSULTATIONS", localConsultation.heading, localConsultation.intro,
    `<div class="page-actions">${bookingLink()}<a class="text-link" href="mailto:${site.email}">${site.email} ↗</a></div>${bookingDestinationNote()}`) +
    `<section class="page-section local-meeting-choices" aria-labelledby="meeting-choices-title"><h2 id="meeting-choices-title">Start online. See the space when it helps.</h2><div class="page-columns"><article><h3>Meet online.</h3><p>Talk through a website, app, or business problem. A rough idea is enough. The consultation is booked through BriefBooth.</p></article><article><h3>NYC visits, by arrangement.</h3><p>If you’re unsure what you need or the software must fit a physical space, we can look at the workflow together. Manhattan, Brooklyn, and parts of Queens are available by arrangement; travel farther afield is discussed in advance.</p></article></div><h3>Bring anything you already have.</h3><ul class="page-list"><li>Your current website, form, or spreadsheet.</li><li>An example of a customer or staff task you want to improve.</li><li>Questions, rough notes, or screenshots. A finished plan is optional.</li></ul></section>` +
    localConsultation.sections.map(({ heading, text }) => `<section class="page-section"><h2>${escape(heading)}</h2><p>${escape(text)}</p></section>`).join("") +
    `<section class="page-section"><h2>What could we build for your business?</h2><nav class="related-links" aria-label="Local development services">${localConsultation.serviceSlugs.map((slug) => services.find((service) => service.slug === slug)).filter(Boolean).map((service) => `<a href="${local(route, `services/${service.slug}/`)}">${escape(service.title)}</a>`).join("")}</nav><p>See how a booking or ordering workflow could be scoped before committing to a build.</p><nav class="related-links" aria-label="Business workflow guides"><a href="${local(route, "insights/salon-booking-website/")}">Planning a salon booking website</a><a href="${local(route, "insights/restaurant-ordering-app/")}">Planning restaurant online ordering</a><a href="${local(route, "work/")}">The 4u Digital project portfolio</a></nav></section>` +
    faqBlock("Questions about consultations", localConsultation.faq) +
    `<aside class="page-callout"><h2>Bring the problem, not a finished plan.</h2><p>${escape(localConsultation.bookingIntro)}</p>${bookingLink()}</aside>`;
  return { ...page, html: frame(page, content) };
}

function clientCareSection(homepage = false) {
  if (homepage) return `<section id="client-care" class="simple-care wrap" aria-labelledby="client-care-title"><h2 id="client-care-title">Your product. Your code.</h2><p>Your custom code is 100% yours. Client work and code stay private unless you give permission. Every project includes a 30-day money-back guarantee after the completed product launches.</p><a class="text-link" href="./guarantee/">Guarantee, refunds &amp; support <span aria-hidden="true">→</span></a><details><summary>Read the commitments</summary><div class="client-care-grid">${clientCare.sections.map(({ id, title, text }) => `<article class="client-care-card" data-client-care="${escape(id)}"><h3>${escape(title)}</h3><p>${escape(text)}</p></article>`).join("")}</div></details></section>`;
  return `<section id="client-care" class="${homepage ? "client-care-section wrap" : "page-section client-care"}" aria-labelledby="client-care-title"><div class="section-heading"><div><p class="eyebrow">${escape(clientCare.eyebrow)}</p><h2 id="client-care-title">${escape(clientCare.heading)}</h2><p class="client-care-intro">${escape(clientCare.intro)}</p></div></div><div class="client-care-grid">${clientCare.sections.map(({ id, title, text }) => `<article class="client-care-card" data-client-care="${escape(id)}"><h3>${escape(title)}</h3><p>${escape(text)}</p></article>`).join("")}</div><a class="text-link" href="mailto:${site.email}">Email about your project or guarantee <span aria-hidden="true">↗</span></a></section>`;
}

function pricingPage() {
  const route = pricing.path;
  const page = { path: route, title: pricing.title, description: pricing.description,
    modified: pricing.modified, breadcrumbs: [{ name: "Pricing", path: route }],
  };
  const amount = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: pricing.currency, minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 }).format(value);
  const emphasizeOfferTerms = (text) => [pricing.websiteOffer.paymentTerms, pricing.websiteOffer.contentChangeTerms]
    .reduce((markup, term) => markup.replace(escape(term), `<strong>${escape(term)}</strong>`), escape(text));
  const cards = pricing.entries.map((entry) => `<article class="pricing-card" data-pricing-id="${escape(entry.id)}"><h2>${escape(entry.title)}</h2><p class="pricing-amount">${entry.kind === "starting-budget" ? '<span class="pricing-from">From </span>' : ""}<strong>${amount(entry.amount)}</strong>${entry.kind === "hourly" ? '<span class="pricing-unit">/hour</span>' : ""}</p>${entry.kind === "nyc-offer" ? '<p class="pricing-availability">Limited NYC website offer</p>' : ""}<p class="pricing-summary">${escape(entry.summary)}</p><ul>${entry.includes.map((item) => `<li>${escape(item)}</li>`).join("")}</ul></article>`).join("");
  const content = intro("USD", pricing.heading, pricing.intro) +
    `<section class="page-section pricing-starting-points" aria-label="Project starting prices"><p class="pricing-eligibility">${escape(pricing.websiteOffer.compactEligibility)} <span>${escape(pricing.websiteOffer.outsideOffer)}</span></p><div class="pricing-grid">${cards}</div></section>` +
    `<section id="pricing-scope" class="page-section pricing-scope" aria-labelledby="pricing-scope-title"><h2 id="pricing-scope-title">Agree the whole cost first.</h2><p class="pricing-budget-note">${escape(pricing.budgetNote)}</p><p>${escape(pricing.runningCosts)}</p><p>The $75 hourly rate applies only to additional work agreed separately. Reasonable changes included in the launch guarantee and work covered by your existing agreement remain included.</p><p class="pricing-eligibility-full">${escape(pricing.websiteOffer.eligibility)}</p><details class="service-details pricing-offer-details"><summary>Read the NYC website offer scope and terms</summary><div class="service-reading">${pricing.websiteOffer.sections.map(({ heading, text }) => `<article><h3>${escape(heading)}</h3><p>${emphasizeOfferTerms(text)}</p></article>`).join("")}</div><a class="text-link" href="${local(route, pricing.websiteOffer.page.slice(1))}">Explore the complete NYC website offer <span aria-hidden="true">→</span></a></details></section>` +
    `<section id="client-care" class="page-section pricing-care" aria-labelledby="client-care-title"><h2 id="client-care-title">Your product. Your code.</h2><p>Every project includes the 30-day money-back guarantee after the completed product launches, with reasonable changes included during those 30 days. Your custom code is 100% yours.</p><p>Optional six-month debugging and support includes changes at a 50% discount on the agreed standard rate.</p><a class="text-link" href="${local(route, "guarantee/")}">Guarantee, refunds &amp; support <span aria-hidden="true">→</span></a><details class="service-details pricing-commitments"><summary>Read the commitments and support example</summary><div class="service-reading">${pricing.care.sections.map(({ id, title, text }) => `<article data-client-care="${escape(id)}"><h3>${escape(title)}</h3><p>${escape(text)}</p></article>`).join("")}<p class="pricing-support-example">${escape(pricing.hourlySupportExample)}</p></div></details></section>` +
    `<aside class="page-callout pricing-closing"><h2>Let’s scope your idea.</h2><p>A rough idea is enough to start. We’ll discuss the useful first version and agree the price before building.</p><div class="page-actions">${bookingLink()}</div>${bookingDestinationNote()}</aside>`;
  return { ...page, html: frame(page, content) };
}

function offerPage() {
  const route = "/offer/";
  const page = { path: route, title: launchOffer.metaTitle, description: launchOffer.description,
    offer: launchOffer, modified: launchOffer.modified, faq: launchOffer.faq,
    breadcrumbs: [{ name: "Website offer", path: route }],
  };
  const websiteExample = projects.find((project) => project.id === "micro-short-website");
  const clientFeedback = clientTestimonials.find((testimonial) => testimonial.id === "sarah-t");
  const packageDetails = launchOffer.sections.slice(0, 2);
  const commitmentDetails = launchOffer.sections.slice(2);
  const keyTerms = [
    "Half is paid at the start and half at launch.",
    "If the first design review, before any code is written, is not right, the deposit comes back.",
    "The code, the domain, the hosting account, and your data.",
    "There is no monthly builder fee and no percentage on bookings or orders.",
  ];
  const emphasizeTerms = (text) => keyTerms.reduce((markup, term) => markup.replace(escape(term), `<strong>${escape(term)}</strong>`), escape(text));
  const upfrontTerms = `<section id="offer-terms" class="page-section offer-terms" aria-labelledby="offer-terms-title"><h2 id="offer-terms-title">Payment, timing, and ownership.</h2><div class="offer-terms-grid">${commitmentDetails.map(({ heading, text }) => `<article><h3>${escape(heading)}</h3><p>${emphasizeTerms(text)}</p></article>`).join("")}</div><details class="offer-package-details"><summary>More about the website and workflow scope <span aria-hidden="true">+</span></summary><div class="offer-expanded-scope">${packageDetails.map(({ heading, text }) => `<article><h3>${escape(heading)}</h3><p>${escape(text)}</p></article>`).join("")}</div></details></section>`;
  const proof = `<section id="offer-proof" class="page-section offer-proof" aria-labelledby="offer-proof-title"><p class="eyebrow">THE WORK AND THE EXPERIENCE</p><h2 id="offer-proof-title">See the work. Read the feedback.</h2><p>A selected personal website project, alongside feedback from a separate client engagement.</p><div class="offer-proof-grid"><div class="offer-project-example">${projectCard(websiteExample, route)}<p class="offer-image-context">Repository website capture · Original film artwork and festival laurels are part of this project’s content.</p></div><div class="offer-client-feedback"><p class="eyebrow">A CLIENT’S EXPERIENCE</p>${testimonialCard(clientFeedback)}<a class="text-link" href="${local(route)}#testimonials">Read all nine client reviews <span aria-hidden="true">↗</span></a></div></div></section>`;
  const content = intro(launchOffer.eyebrow, launchOffer.heading, launchOffer.intro,
    `<div class="page-actions">${bookingLink()}<a class="text-link" href="mailto:${site.email}">${site.email} ↗</a></div>${bookingDestinationNote()}`) +
    `<section class="page-section offer-packages" aria-label="Compare the website packages"><div class="offer-package-grid"><article><p class="eyebrow">CUSTOM WEBSITE</p><h2>$1,500</h2><ul class="page-list"><li>Up to five pages, designed for phones first.</li><li>Your services or menu, hours, location, work, and contact or request form.</li><li>Domain, hosting account, custom code, and data in your name.</li><li>Three months of content changes after launch.</li></ul></article><article><p class="eyebrow">WEBSITE + BOOKING OR ORDERING</p><h2>$3,000</h2><ul class="page-list"><li>The custom website, plus one complete booking or ordering workflow.</li><li>A staff view to accept appointment requests or handle pickup orders.</li><li>The exact task, access, and integrations agreed before building.</li><li>Additional workflows and native apps can be scoped later.</li></ul></article></div><p>The first ten eligible New York City business projects agreed by November 30, 2026, subject to scope and capacity. Every project includes the <a href="#client-care">30-day money-back guarantee after the completed product launches</a>.</p></section>` +
    upfrontTerms +
    proof +
    clientCareSection() +
    `<section class="page-section"><h2>What could the site include?</h2><nav class="related-links" aria-label="Related development services">${launchOffer.serviceSlugs.map((slug) => services.find((service) => service.slug === slug)).filter(Boolean).map((service) => `<a href="${local(route, `services/${service.slug}/`)}">${escape(service.title)}</a>`).join("")}<a href="${local(route, "project-brief/")}">Optional project planner</a><a href="${local(route, "work/")}">The 4u Digital project portfolio</a></nav></section>` +
    faqBlock("Questions about the offer", launchOffer.faq) +
    `<aside class="page-callout"><h2>Bring the problem, not a finished plan.</h2><p>${escape(launchOffer.bookingIntro)}</p>${bookingLink()}</aside>`;
  return { ...page, html: frame(page, content) };
}

function servicePage(service) {
  const route = `/services/${service.slug}/`;
  const page = { path: route, title: service.metaTitle, description: service.description, service, faq: service.faq,
    modified: "2026-10-27",
    breadcrumbs: [{ name: "Services", path: "/services/" }, { name: service.title, path: route }],
  };
  const examples = service.projectIds.map((id) => projects.find((project) => project.id === id)).filter(Boolean);
  const leadingExamples = examples.slice(0, 2);
  const remainingExamples = examples.slice(leadingExamples.length);
  const exampleCard = (project) => {
    const status = project.id === "usbmic" ? "Desktop release candidate. Physical-microphone validation is pending." : project.id === "FreeScript" ? "Signed Mac release. Not notarized." : project.demoLabel === "App Store" ? "Available on the App Store." : "";
    return `<article class="service-example" data-project-id="${escape(project.id)}"><a class="service-example-link" href="${local(route, `work/${projectSlugs[project.id]}/`)}" aria-labelledby="service-example-${escape(projectSlugs[project.id])}"><div class="service-example-heading">${iconFor(project, route)}<h3 id="service-example-${escape(projectSlugs[project.id])}">${escape(project.title)}</h3></div><div class="service-example-image"><img class="service-example-artwork" src="${local(route, project.image.replace(/^\.\//, ""))}" alt="${escape(project.imageAlt)}" width="${project.imageWidth}" height="${project.imageHeight}" loading="lazy" decoding="async" /></div><p class="service-example-caption">${escape(project.imageLabel || "Project image")}</p><p class="service-example-purpose">${escape(project.purpose)}</p>${status ? `<p class="service-example-status">${escape(status)}</p>` : ""}<span class="text-link">See how it works <span aria-hidden="true">→</span></span></a></article>`;
  };
  const storeProof = service.slug === "app-development" ? `<p class="service-opening-proof"><a class="text-link" href="${local(route, "work/")}#app-store-proof">3 apps published on the App Store <span aria-hidden="true">↗</span></a></p>` : "";
  const websiteOffer = launchOffer.serviceSlugs.includes(service.slug) ? `<aside class="service-website-offer service-offer-quiet"><p><strong>NYC website offer:</strong> $1,500 for a custom website, or $3,000 with booking or ordering. First ten eligible projects agreed by November 30, 2026, subject to scope and capacity.</p><a class="text-link" href="${local(route, "offer/")}">See the website offer <span aria-hidden="true">→</span></a></aside>` : "";
  const content = intro(service.eyebrow, serviceChoices[service.slug].title, service.intro, `<div class="page-actions">${bookingLink()}<a class="text-link" href="#examples">See project examples <span aria-hidden="true">↓</span></a></div>${bookingDestinationNote()}<ul class="service-capabilities" aria-label="What this service can include">${serviceChoices[service.slug].capabilities.map((capability) => `<li>${escape(capability)}</li>`).join("")}</ul>${storeProof}`) +
    `<section id="examples" class="page-section service-examples"><h2>Explore related projects.</h2><p>${/salon|restaurant/.test(service.slug) ? "Related personal projects, not salon or restaurant client work. Your own workflow would be designed with you." : "Selected personal projects. Open one to see its workflow and complete original gallery."}</p><div class="service-example-grid">${leadingExamples.map(exampleCard).join("")}</div>${remainingExamples.length ? `<nav class="related-links service-more-projects" aria-label="More related project examples">${remainingExamples.map((project) => `<a href="${local(route, `work/${projectSlugs[project.id]}/`)}">${escape(project.title)} <span aria-hidden="true">→</span></a>`).join("")}</nav>` : ""}<details class="service-details service-evidence"><summary>About these examples</summary><p>${escape(service.proofIntro)}</p></details></section>` +
    websiteOffer +
    `<section class="page-section service-planning" aria-labelledby="service-planning-title"><h2 id="service-planning-title">A clear plan before the build.</h2><p>We agree the useful first version, price, and timeline together. Expand the details that matter to you.</p><p class="service-pricing-link"><a class="text-link" href="${local(route, "pricing/")}">See starting prices <span aria-hidden="true">→</span></a></p><details id="service-fit" class="service-details"><summary>What this can include</summary><div class="service-reading">${service.when.map(({ title, text }) => `<article><h3>${escape(title)}</h3><p>${escape(text)}</p></article>`).join("")}</div></details><details id="service-scope" class="service-details"><summary>Planning your scope</summary><div class="service-reading">${service.scope.map(({ title, text }) => `<article><h3>${escape(title)}</h3><p>${escape(text)}</p></article>`).join("")}</div></details></section>` +
    `<section id="client-care" class="page-section service-care" aria-labelledby="client-care-title"><h2 id="client-care-title">Your product. Your code.</h2><p>Your custom code is 100% yours. Client work stays private unless you give permission. Every project includes the 30-day money-back guarantee after the completed product launches.</p><a class="text-link" href="${local(route, "guarantee/")}">Guarantee, refunds &amp; support <span aria-hidden="true">→</span></a><details class="service-details"><summary>Read the commitments</summary><div class="service-reading">${clientCare.sections.map(({ id, title, text }) => `<article data-client-care="${escape(id)}"><h3>${escape(title)}</h3><p>${escape(text)}</p></article>`).join("")}</div></details></section>` +
    faqBlock(`Questions about ${service.title.toLowerCase()}`, service.faq, "service-questions") +
    `<details class="service-details service-other-options"><summary>Still comparing your options?</summary><p>A website, browser app, and native app solve different problems.</p><nav class="related-links" aria-label="Service planning guides"><a href="${local(route, "guides/website-or-app/")}">Compare websites and apps <span aria-hidden="true">→</span></a>${service.guideSlug ? `<a href="${local(route, `insights/${service.guideSlug}/`)}">${service.topic === "salon" ? "Salon booking" : "Restaurant ordering"} planning guide <span aria-hidden="true">→</span></a>` : ""}</nav><nav class="related-links" aria-label="Other development services">${services.filter((other) => other.slug !== service.slug).map((other) => `<a href="${local(route, `services/${other.slug}/`)}">${escape(other.serviceLabel)}</a>`).join("")}</nav></details>` +
    `<aside class="page-callout service-closing"><h2>Start with the problem.</h2><p>Tell me what your business needs to do. A rough idea is enough to start the conversation.</p><div class="page-actions">${bookingLink()}</div>${bookingDestinationNote()}</aside>`;
  return { ...page, html: frame(page, content) };
}

function projectFrame(view, index, route) {
  const image = (capture, first = false) => `<img src="${local(route, capture.image.replace(/^\.\//, ""))}" alt="${escape(capture.imageAlt)}" width="${capture.width}" height="${capture.height}" ${first ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" />`;
  const fullSize = (capture, label) => `<a href="${local(route, capture.image.replace(/^\.\//, ""))}" target="_blank" rel="noopener noreferrer">${label} <span aria-hidden="true">↗</span></a>`;
  const artwork = !view.portrait && !view.companion && /product-artwork$/.test(view.sourceKind || "");
  return `<figure ${index === 0 ? 'id="project-cover"' : `id="project-view-${index}"`} data-view="${index}" class="project-page-frame ${view.portrait ? "portrait" : ""} ${view.companion ? "paired" : ""}${artwork ? " product-artwork" : ""}"><div>${image(view, index === 0)}${view.companion ? image(view.companion) : ""}</div><figcaption><strong>${escape(view.label)}</strong><p>${escape(view.caption)}</p><div class="project-image-links">${fullSize(view, "Open full-size image")}${view.companion ? fullSize(view.companion, "Open companion image") : ""}</div></figcaption></figure>`;
}

function projectViews(project, route) {
  const views = project.gallery.map((view, index) => ({ view, index })).slice(1);
  const artwork = views.filter(({ view }) => /product artwork|promotional artwork/i.test(view.caption));
  const captures = views.filter(({ view }) => !/product artwork|promotional artwork/i.test(view.caption));
  // Focusable fragment destinations let keyboard users land on the actual
  // captioned image without changing its position or hiding any gallery view.
  const group = (items, heading = "") => items.length ? `<div class="project-visual-group">${heading ? `<h3>${heading}</h3>` : ""}<div class="project-views-grid ${items.every(({ view }) => view.portrait && !view.companion) ? "portrait-grid" : ""}">${items.map(({ view, index }) => projectFrame(view, index, route).replace("<figure ", '<figure tabindex="-1" ')).join("")}</div></div>` : "";
  const imageOrder = [{ view: project.gallery[0], index: 0 }, ...captures, ...artwork];
  const picker = views.length ? `<details class="project-image-picker"><summary>Choose a project image <span class="project-image-count">${project.gallery.length} views</span></summary><nav aria-label="Project image index"><ol>${imageOrder.map(({ view, index }, position) => `<li><a href="#${index === 0 ? "project-cover" : `project-view-${index}`}"><span class="project-image-number" aria-hidden="true">${String(position + 1).padStart(2, "0")}</span><span>${escape(view.label)}</span></a></li>`).join("")}</ol></nav></details>` : "";
  return `<section id="project-views" class="page-section project-views"><div class="project-section-heading"><div><h2>Project images</h2></div><p>${views.length ? "Every original view, in full color. Open any image at full size." : "The original image is above. Open it at full size for a closer look."}</p></div>${picker}${views.length ? group(captures, artwork.length ? "App and website captures" : "") + group(artwork, "Product graphics") : '<a class="project-section-link" href="#project-cover">View the project image <span aria-hidden="true">↑</span></a>'}</section>`;
}

function projectPromotions(project, route) {
  if (!project.promotion) return "";
  const promotion = project.promotion;
  const heading = promotion.heading ?? "Watch the workflow. Explore the identity.";
  const intro = promotion.intro ?? "Edited, captioned demonstrations built from genuine app captures with fictional sample writing. The separate campaign photograph is AI-generated promotional artwork.";
  const downloadDescription = promotion.downloadDescription ?? "Logos, design tokens, brand guidelines, reusable social layouts, launch copy, real screenshots, and both videos.";
  const note = promotion.note ?? "PDF import requires selectable text. Mac drafts and the hosted chat companion transfer through import/export, without automatic synchronization.";
  const downloads = promotion.downloads || [];
  return `<section id="project-promotion" class="page-section project-promotion"><p class="eyebrow">BRAND &amp; PRODUCT STORY</p><h2>${escape(heading)}</h2>${intro ? `<p>${escape(intro)}</p>` : ""}<div class="project-promo-videos">${(promotion.videos || []).map(video => `<figure><video controls playsinline preload="none" poster="${local(route,video.poster.replace(/^\.\//,""))}" aria-label="${escape(video.label)}"><source src="${local(route,video.src.replace(/^\.\//,""))}" type="video/mp4"><track kind="captions" src="${local(route,video.captions.replace(/^\.\//,""))}" srclang="en" label="English"><a href="${local(route,video.src.replace(/^\.\//,""))}">Download video</a></video><figcaption><h3>${escape(video.label)}</h3><p>${escape(video.caption)}</p><a class="text-link" href="${local(route,video.src.replace(/^\.\//,""))}" download>Download MP4</a> · <a class="text-link" href="${local(route,video.captions.replace(/^\.\//,""))}">Read captions</a></figcaption></figure>`).join("")}</div>${downloads.length ? `<h3>Promotional downloads</h3>${downloadDescription ? `<p>${escape(downloadDescription)}</p>` : ""}<ul class="page-list">${downloads.map(file=>`<li><a class="text-link" href="${local(route,file.src.replace(/^\.\//,""))}" download>${escape(file.label)}</a></li>`).join("")}</ul>` : ""}${note ? `<p>${escape(note)}</p>` : ""}</section>`;
}

function projectPage(project) {
  const route = `/work/${projectSlugs[project.id]}/`;
  const page = { path: route, title: `${project.title} — ${projectType(project)} | 4u Digital`,
    description: `${project.purpose} See the screens, workflows, and development details in the 4u Digital portfolio.`,
    project, modified: project.modified || "2026-10-27", image: project.image, imageAlt: project.imageAlt,
    imageWidth: project.imageWidth, imageHeight: project.imageHeight,
    breadcrumbs: [{ name: "Projects", path: "/work/" }, { name: project.title, path: route }],
  };
  const story = projectStories[project.id];
  const context = projectClientUses[project.id];
  const service = services.find((entry) => entry.slug === context.serviceSlug);
  const status = project.releaseStatus || (project.id === "FreeScript" ? "Signed Mac release · Not notarized" : project.demoLabel === "App Store" ? "On the App Store" : project.id === "usbmic" ? "Release candidate" : "");
  const pageNavigation = `<nav class="project-story-nav" aria-label="On this project page"><a href="#overview">How it works</a><a href="#project-views">Images</a><a href="#your-business">A similar build</a><a href="#development">Technical details</a></nav>`;
  const releaseNote = project.id === "usbmic" ? "Physical microphone validation is still pending." : project.id === "FreeScript" ? "PDF import needs selectable text. Scanned PDFs require OCR first. Physical Intel testing is pending." : "";
  const content = `<section class="project-story-hero">${intro(projectType(project), project.title, project.purpose,
    `<div class="project-release-context"><p class="project-personal-note">Selected personal project</p>${status ? `<p class="project-release-status">${escape(status)}</p>` : ""}</div>${releaseNote ? `<p class="project-release-note">${escape(releaseNote)}</p>` : ""}<div class="page-actions">${bookingLink()}<a class="text-link project-hero-browse" href="#overview">See how it works</a></div>${bookingDestinationNote()}`, iconFor(project, route))}<div class="project-page-gallery" aria-label="Main image from ${escape(project.title)}">${projectFrame(project.gallery[0], 0, route).replace("<figure ", '<figure tabindex="-1" ')}${project.demoUrl ? `<p class="project-live-destination"><a class="text-link" href="${escape(project.demoUrl)}" target="_blank" rel="noopener noreferrer">${escape(project.demoLabel || "Visit the project")} <span aria-hidden="true">↗</span></a></p>` : ""}</div></section>` + pageNavigation +
    `<section id="overview" class="page-section project-overview"><div class="project-section-heading"><div><h2>How it works</h2></div><p class="project-summary">${escape(project.clientSummary || project.summary)}</p></div><p class="project-audience"><span>Made for</span> ${escape(story.audience)}</p><div class="project-workflow-grid">${project.workflows.map((workflow, index) => `<article class="project-workflow-card"><span class="mono project-step" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span><h3>${escape(workflow)}</h3><p>${escape(story.workflowDescriptions[index])}</p></article>`).join("")}</div><details class="project-extra project-capabilities"><summary>More features</summary><ul class="project-quick-capabilities" aria-label="What ${escape(project.title)} does">${context.capabilities.map((capability) => `<li>${escape(capability)}</li>`).join("")}</ul>${project.highlights?.length ? `<div class="page-columns">${project.highlights.map(({ title, text }) => `<article><h4>${escape(title)}</h4><p>${escape(text)}</p></article>`).join("")}</div>` : ""}</details></section>` +
    projectViews(project, route) +
    `<section id="your-business" class="page-section project-business-fit" aria-labelledby="project-business-title"><div><h2 id="project-business-title">Need something similar?</h2><div class="project-business-example"><h3>A similar business need</h3><p>${escape(context.businessUse)}</p></div><details class="project-extra project-build-care"><summary>How I would approach your build</summary><p>${escape(projectBuildCare[project.id])}</p><ul class="project-client-promises"><li>Design, development, testing, and launch with a direct line to the person building your product.</li><li>Scope, price, start date, and target launch agreed before development.</li><li>Your custom code and deployment handover, with the 30-day money-back guarantee after the completed product launches.</li></ul></details></div><div class="project-client-offer"><p>Work directly with the developer, from the first idea to launch. Your custom code is 100% yours. Client work and code stay out of this public portfolio unless you give permission.</p><div class="project-fit-actions">${bookingLink()}<a class="text-link" href="${local(route, `services/${service.slug}/`)}">${escape(service.title)}</a><a class="text-link" href="${local(route, "guarantee/")}">Guarantee &amp; support</a></div></div></section>` +
    projectPromotions(project, route) +
    `<section id="development" class="page-section project-development"><h2>Behind the build</h2><a class="text-link project-source-link" href="${escape(project.repoUrl)}" target="_blank" rel="noopener noreferrer">${escape(project.title)} ${project.codeAvailable === false ? "project repository" : "source code"} on GitHub ↗</a><details class="project-extra project-technical"><summary>Technical details &amp; image context</summary>${project.challenge ? `<div class="project-context"><article><h3>The problem</h3><p>${escape(project.challenge)}</p></article><article><h3>What was built</h3><p>${escape(project.build)}</p></article></div>` : ""}<div class="project-development-grid"><div><h3>Development details</h3><ul class="page-list">${project.features.map((feature) => `<li>${escape(feature)}</li>`).join("")}</ul></div><aside class="project-stack"><h3>Built with</h3><div class="project-tags">${project.stack.map((technology) => `<span class="tag">${escape(technology)}</span>`).join("")}</div></aside></div>${project.notes ? `<div class="project-evidence"><h3>About these images and previews</h3><p>${escape(project.notes)}</p></div>` : ""}</details></section>` +
    `<nav class="related-links project-related" aria-label="Related services"><a href="${local(route, "work/")}">Back to all projects</a><a href="${local(route, `services/${service.slug}/`)}">${escape(service.title)}</a></nav>`;
  return { ...page, html: frame(page, content) };
}

function guidePage() {
  const route = "/guides/website-or-app/";
  const page = { path: route, title: guide.metaTitle, description: guide.description, modified: "2026-10-26", faq: guide.faq,
    breadcrumbs: [{ name: guide.title, path: route }],
  };
  const content = intro("CHOOSE THE RIGHT BUILD", guide.title, guide.intro) +
    `<section class="page-section"><h2>Which kind of technology fits the job?</h2><div class="guide-choice-grid">${guide.rows.map((row) => `<article class="guide-choice-card"><h3>${escape(row.type)}</h3><p>${escape(row.when)}</p><p class="guide-choice-example"><strong>A personal project example</strong>${escape(row.example)}</p><a class="text-link" href="${local(route, `services/${row.serviceSlug}/`)}">Explore ${escape(row.type.toLowerCase())} development <span aria-hidden="true">↗</span></a></article>`).join("")}</div><div class="table-scroll" role="region" aria-label="Website and app comparison" tabindex="0"><table><caption>Compare four common ways to build business technology.</caption><thead><tr><th scope="col">Build</th><th scope="col">Choose it when</th><th scope="col">Example workflow</th></tr></thead><tbody>${guide.rows.map((row) => `<tr><th scope="row"><a href="${local(route, `services/${row.serviceSlug}/`)}">${escape(row.type)}</a></th><td>${escape(row.when)}</td><td>${escape(row.example)}</td></tr>`).join("")}</tbody></table></div></section>` +
    guide.sections.map(({ heading, text }) => `<section class="page-section"><h2>${escape(heading)}</h2><p>${escape(text)}</p></section>`).join("") +
    faqBlock("Questions about choosing a website or app", guide.faq) +
    `<aside class="page-callout"><h2>Tell 4u Digital what needs to work better.</h2><p>You don’t need to arrive with a platform choice. Describe the users and the task, and we can choose a sensible starting point.</p><div class="page-actions">${bookingLink()}${inquiry("general", "Email a quick question", "", "text-link")}</div></aside>` +
    `<p class="content-review">Reviewed October 26, 2026 · 4u Digital development services. A comparison of websites, browser apps, native apps, and custom business software.</p>`;
  return { ...page, html: frame(page, content) };
}

export async function generateSEO(output) {
  const home = { path: "/", title: "Custom App, Website & Software Development | 4u Digital",
    description: "Custom iOS apps, websites, and business software by 4u Digital. Explore three App Store apps, full-stack web platforms, and desktop development.",
    modified: "2026-10-27",
  };
  let html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  html = html.replace(/<head>[\s\S]*?<\/head>/, pageHead(home, true));
  html = html.replace('<section id="client-care" class="client-care-section wrap" aria-labelledby="client-care-title"></section>', clientCareSection(true));
  html = html.replace(/(<p data-after-launch-summary>)[\s\S]*?(<\/p>)/, `$1${escape(clientCare.summary)}$2`);
  html = html.replace('<div id="home-insights"></div>', articleCards("/", homepageArticles));
  html = html.replace('<section id="testimonials" class="testimonials-section wrap" aria-labelledby="testimonials-title"></section>', `<section id="testimonials" class="testimonials-section wrap" aria-labelledby="testimonials-title">${testimonialsSection()}</section>`);
  html = html.replace('<div id="footer-policies"></div>', footerPolicies("/"));
  html = html.replace('<div id="shared-footer"></div>', footer("/"));
  html = sourceEmailLinks(html, "/");
  await writeFile(path.join(output, "index.html"), html);

  const servicesPage = { path: "/services/", title: "App, Website & Business Software Services | 4u Digital",
    description: "Custom website development, web applications, native apps, and business software by 4u Digital. Compare services and see real project examples.",
    modified: "2026-10-26",
    breadcrumbs: [{ name: "Services", path: "/services/" }],
  };
  const work = { path: "/work/", title: "Website, App & Software Project Portfolio | 4u Digital",
    description: `See ${projects.length} selected 4u Digital software projects: websites, business web apps, native apps, and desktop tools. View original product images and development details.`,
    type: "CollectionPage", projectIndex: true, modified: "2026-10-28", breadcrumbs: [{ name: "Projects", path: "/work/" }],
  };
  const about = { path: "/about/", title: "About 4u Digital | Custom Technology for Your Business",
    description: "4u Digital builds custom apps, websites, and business software. Learn how an idea becomes a defined scope, working technology, and a launch plan.",
    type: "AboutPage", modified: "2026-10-26", breadcrumbs: [{ name: "About 4u Digital", path: "/about/" }],
  };
  const contact = { path: "/contact/", title: "Discuss Your App, Website or Software Project | 4u Digital",
    description: "Contact 4u Digital about your website, app, or business software. Book your first video consultation through BriefBooth or email a project inquiry.",
    type: "ContactPage", modified: "2026-10-23", breadcrumbs: [{ name: "Contact 4u Digital", path: "/contact/" }],
  };
  const insights = { path: "/insights/", title: "Business Website, App & Software Guides | 4u Digital",
    description: "Practical website guides for salons, restaurants, and local shops, plus advice on pricing, comparing quotes, and planning apps or business software.",
    modified: "2026-10-20",
    type: "CollectionPage", breadcrumbs: [{ name: "Business guides", path: "/insights/" }],
  };
  const pages = [
    { ...home, html },
    { ...servicesPage, html: frame(servicesPage, servicesContent(servicesPage.path)) },
    pricingPage(),
    ...services.map(servicePage),
    { ...work, html: frame(work, projectIndexContent(work.path)) },
    ...projects.map(projectPage),
    guidePage(),
    { ...insights, html: frame(insights, intro("BEFORE YOU BUILD", "Useful reads for your next business build.", "Just need a website? Find practical advice for your salon, restaurant, or local shop, along with short reads on pricing and planning apps or business software.") + articleIndex(insights.path) + consultationCallout(insights.path)) },
    ...articles.map(articlePage),
    localPage(),
    offerPage(),
    kickoffPage(),
    projectBriefPage(),
    ...renderLegalPages({ frame, intro, local }),
    { ...about, html: frame(about, intro("ABOUT 4u Digital", "You know your business. I’ll build the technology.", "Work directly with the developer designing, coding, testing, and launching your product. From a simple business website to a custom app or desktop tool, we build around the way your business works.", `<div class="page-actions">${bookingLink()}<a class="text-link" href="${local(about.path, "work/")}">Explore the projects <span aria-hidden="true">↗</span></a></div>`) + `<section class="page-section"><h2>What does 4u Digital build?</h2><p>4u Digital handles interface design and development, including the screens people use and the systems behind them. The portfolio includes public websites, web applications with accounts and shared workflows, native Apple apps, and desktop tools.</p><a class="text-link" href="${local(about.path, "work/")}">See 4u Digital’s software portfolio ↗</a></section><section class="page-section"><h2>How does full-stack development help your project?</h2><p>4u Digital handles the interface people use and the backend code that stores records, checks access, and connects services. The portfolio includes authenticated web workspaces, shared records, and payment-provider integrations. The scope identifies what your project needs and which existing tools it can use.</p></section><section class="page-section"><h2>How does a project start?</h2><ol class="page-list"><li><strong>Describe the problem.</strong> Explain who will use the technology and what they need to do.</li><li><strong>Agree the scope and price.</strong> Define the features, project boundaries, costs, and responsibilities before building.</li><li><strong>Build, review, and prepare for launch.</strong> Review the work as it develops, then agree hosting, maintenance, and the launch requirements.</li></ol></section><section class="page-section"><h2>Where can you see the development work?</h2><p>The public portfolio shows selected personal projects, not every app I’ve built. Project pages include product screens, workflow descriptions, and links to live products and public repositories. Captions distinguish app captures from promotional artwork and identify sample content.</p><p class="client-ownership-note">Your custom code is 100% yours. Client work and code stay out of this public portfolio unless you give permission.</p><a class="text-link" href="https://github.com/taylordrew4u2" target="_blank" rel="noopener noreferrer">Browse the public GitHub projects ↗</a></section>${consultationCallout(about.path)}`) },
    { ...contact, html: frame(contact, intro("LET’S TALK", "What would you like to build?", "Start with a rough idea, a website you need, or a problem to solve. You don’t need a finished plan or a technical background.", `<div class="page-actions">${bookingLink()}<a class="button button-outline" href="${local(contact.path, "project-brief/")}">Open project planner →</a></div><p class="contact-choice-note">Book a video consultation to talk it through. Prefer to write? The planner is optional before or after a consultation and does not book a meeting.</p><p class="booking-destination">Booking opens BriefBooth in a new tab. Requests are reviewed before confirmation.</p>`) + `<section class="page-section"><h2>A quick question first?</h2><p>You can email <a class="text-link" href="mailto:${site.email}">${site.email}</a>. A short description of what you need is enough; budget, features, and timing can be worked out together.</p>${inquiry("general", "Email a quick question", "", "text-link")}</section><section class="page-section"><h2>Online or in New York City.</h2><p>Use BriefBooth for the available video consultation and times. If you’re unsure what you need or the technology needs to fit a physical space, we can arrange an in-person visit in Manhattan, Brooklyn, or parts of Queens.</p><a class="text-link" href="${local(contact.path, "new-york-city/")}">About NYC consultations →</a></section><section class="page-section existing-client-resource"><h2>Already working together?</h2><p>The <a class="text-link" href="${local(contact.path, "project-kickoff/")}">existing-client kickoff form</a> records the agreed project scope, approvals, and handover before the build.</p></section>`) },
  ].map((page) => ({
    ...page,
    // The minimal shared navigation and footer changed every published page on October 27.
    modified: [page.modified || page.article?.modified || site.modified || site.published, "2026-10-27"].sort().at(-1),
  }));
  for (const page of pages.filter((page) => page.path !== "/")) {
    const directory = path.join(output, page.path);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "index.html"), page.html);
  }
  const notFound = { path: "/404.html", title: "Page Not Found | 4u Digital", description: "Return to 4u Digital’s services and software portfolio.", noindex: true, breadcrumbs: [{ name: "Page not found", path: "/404.html" }] };
  const notFoundHTML = frame(notFound, intro("PAGE NOT FOUND", "Let’s get you back on track.", "This address doesn’t match a 4u Digital page.", `<div class="page-actions"><a class="button button-dark" href="./">4u Digital home ↗</a><a class="text-link" href="./services/">Development services</a></div>`));
  // A 404 can be served at any nesting depth, so its assets and recovery links use the primary domain.
  await writeFile(path.join(output, "404.html"), notFoundHTML.replace(/(href|src)="\.\/([^\"]*)"/g, (_, attribute, target) => `${attribute}="${origin}/${target}"`));
  await writeFile(path.join(output, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
  await writeFile(path.join(output, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((page) => `  <url><loc>${escape(origin + page.path)}</loc><lastmod>${page.modified || page.article?.modified || site.modified || site.published}</lastmod></url>`).join("\n")}\n</urlset>\n`);
  await writeFile(path.join(output, "search-manifest.json"), JSON.stringify({ brand: "4u Digital", published: site.published, pages: pages.map(({ path: route, title, description }) => ({ path: route, title, description })) }, null, 2));
  return pages;
}
