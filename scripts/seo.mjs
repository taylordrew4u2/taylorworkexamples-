import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { site, services, guide, projectSlugs } from "../seo-content.js";
import { articles } from "../seo-articles.js";
import { localConsultation } from "../seo-local.js";
import { projects, featuredProjects } from "../public-projects.js";
import { projectStories } from "../project-stories.js";
import { escape, enquiryURL, renderFeaturedProjects, renderArchiveProjects } from "../render-projects.js";
import { bookingURL } from "../booking.js";
import { addInquirySource } from "../contact-context.js";
import { renderRangeProof } from "../range-proof.js";
import { renderKickoffForm } from "../kickoff-view.js";

const origin = site.origin;
const organizationId = `${origin}/#organization`;
const websiteId = `${origin}/#website`;
export const release = "43";
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
  if (page.article) {
    webPage.mainEntity = { "@id": `${url}#article` };
    nodes.push({ "@type": "Article", "@id": `${url}#article`, url,
      headline: page.article.title, description: page.article.description,
      author: { "@id": organizationId }, publisher: { "@id": organizationId },
      datePublished: site.published, dateModified: page.article.modified || site.modified || site.published,
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
    <meta property="og:type" content="website" />
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
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;450;500;550;600;650;700;750&amp;family=Manrope:wght@400;500;600;650;700;750;800&amp;display=swap" />
    <link rel="stylesheet" href="${local(page.path, "styles.css")}?v=${release}" />
    <link rel="stylesheet" href="${local(page.path, "seo.css")}?v=${release}" />
    <script type="application/ld+json">${json(graph(page))}</script>
    <meta name="built4u-analytics" content="${site.analyticsEnabled && !page.noindex ? "vercel" : "off"}" />
    <script type="module" src="${local(page.path, "analytics.js")}?v=${release}"></script>
    ${page.kickoffForm ? `<script type="module" src="${local(page.path, "kickoff-form.js")}?v=${release}"></script>` : ""}
    ${homepage ? `<script type="module" src="./app.js?v=${release}"></script>` : ""}
  </head>`;
}

function header(route) {
  return `<a class="skip-link" href="#main">Skip to content</a><header class="site-header page-header wrap">
    <a class="wordmark" href="${local(route)}" aria-label="4u Digital, home"><img class="brand-symbol" src="${local(route, "assets/4u-digital-logo-mono.png")}" alt="" width="256" height="256" /><span class="brand-name">4u Digital</span></a>
    <nav class="page-nav" aria-label="Main navigation"><a href="${local(route, "services/")}">Services</a><a href="${local(route, "work/")}">Projects</a><a href="${local(route, "insights/")}">Guides</a><a href="${local(route, "about/")}">About 4u Digital</a>${bookingLink("nav-contact")}</nav>
  </header>`;
}

function brandSignature(route) {
  return `<a class="brand-signature" href="${local(route)}" aria-label="4u Digital, home"><img class="brand-signature-mark" src="${local(route, "assets/4u-digital-logo-mono.png")}" alt="" width="256" height="256" loading="lazy" decoding="async" /><span>4u Digital</span></a>`;
}

function footer(route) {
  return `<footer class="page-footer wrap"><div>${brandSignature(route)}<p>Custom tech build for you.</p><p>Start on Zoom. NYC in-person consultations can help clarify your needs or plan technology around your space and workflow.</p><a class="text-link" href="mailto:${site.email}">${site.email} <span aria-hidden="true">↗</span></a></div><nav aria-label="Footer navigation">${bookingLink("text-link")}<a href="${local(route, "services/")}">Development services</a><a href="${local(route, "work/")}">Project portfolio</a><a href="${local(route, "insights/")}">Business technology guides</a><a href="${local(route, "guides/website-or-app/")}">Website or app?</a><a href="${local(route, "new-york-city/")}">New York City consultations</a><a href="${local(route, "about/")}">About 4u Digital</a><a href="${local(route, "contact/")}">Contact 4u Digital</a><a href="${local(route, "project-kickoff/")}">Project kickoff checklist</a><a href="${local(route, "privacy/")}">Privacy &amp; site analytics</a><a href="https://github.com/taylordrew4u2" target="_blank" rel="noopener noreferrer">GitHub ↗</a></nav><p class="page-copyright">© 2026 4u Digital</p></footer>`;
}

function breadcrumbs(page) {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="${local(page.path)}">4u Digital</a></li>${page.breadcrumbs.map((item, index) => `<li>${index === page.breadcrumbs.length - 1 ? `<span aria-current="page">${escape(item.name)}</span>` : `<a href="${local(page.path, item.path.slice(1))}">${escape(item.name)}</a>`}</li>`).join("")}</ol></nav>`;
}

function frame(page, content) {
  return sourceEmailLinks(`<!doctype html><html lang="en">${pageHead(page)}<body class="content-page${page.project ? " project-detail-page" : ""}">${header(page.path)}<main id="main" class="page-main wrap">${breadcrumbs(page)}${content}</main>${footer(page.path)}</body></html>`, page.path);
}

function sourceEmailLinks(html, route) {
  return html.replace(/href="(mailto:[^"]*)"/g, (_, href) =>
    `href="${escape(addInquirySource(href.replace(/&amp;/g, "&"), route))}"`);
}

function intro(eyebrow, heading, text, actions = "", icon = "") {
  return `<header class="page-intro"><p class="eyebrow">${escape(eyebrow)}</p><h1${icon ? ' class="page-project-title"' : ""}>${icon}<span>${escape(heading)}</span></h1><p class="page-lead">${escape(text)}</p>${actions}</header>`;
}

function inquiry(topic = "general", text = "Tell me what you need", reference = "") {
  if (topic === "consultation") return bookingLink();
  return `<a class="button button-dark" href="${escape(enquiryURL(topic, reference))}">${escape(text)} <span aria-hidden="true">↗</span></a>`;
}

function bookingLink(className = "button button-dark") {
  return `<a class="${className}" data-booking-link href="${bookingURL}" target="_blank" rel="noopener noreferrer">Book a consultation <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>`;
}

function faqBlock(title, faqs) {
  return `<section class="page-section"><h2>${escape(title)}</h2><div class="faq-list">${faqs.map(({ question, answer }) => `<details class="faq-item"><summary>${escape(question)}</summary><p>${escape(answer)}</p></details>`).join("")}</div></section>`;
}

function projectType(project) {
  return project.projectType || { web: "Website", ios: "iOS app", desktop: "Desktop application", tools: "Developer tool" }[project.category] || "Software project";
}

function iconFor(project, route) {
  return `<span class="project-icon-frame" aria-hidden="true">${project.icon ? `<img class="project-icon" src="${local(route, project.icon.replace(/^\.\//, ""))}" alt="" width="${project.iconWidth}" height="${project.iconHeight}" loading="lazy" decoding="async" />` : `<span class="project-initials">${escape(project.iconFallback || project.title.slice(0, 2))}</span>`}</span>`;
}

function projectCard(project, route) {
  return `<article class="seo-project-card"><a class="seo-project-cover" href="${local(route, `work/${projectSlugs[project.id]}/`)}"><img src="${local(route, project.image.replace(/^\.\//, ""))}" alt="${escape(project.imageAlt)}" width="${project.imageWidth}" height="${project.imageHeight}" loading="lazy" decoding="async" /></a><div class="seo-project-body"><p class="eyebrow">${escape(projectType(project))}</p><div class="seo-project-heading">${iconFor(project, route)}<h3><a href="${local(route, `work/${projectSlugs[project.id]}/`)}">${escape(project.title)}</a></h3></div><p>${escape(project.purpose)}</p><a class="text-link" href="${local(route, `work/${projectSlugs[project.id]}/`)}">See ${escape(project.title)} <span aria-hidden="true">↗</span></a></div></article>`;
}

function serviceCards(route) {
  return `<div class="service-page-grid">${services.map((service) => `<article class="service-page-card"><p class="eyebrow">${escape(service.eyebrow)}</p><h2><a href="${local(route, `services/${service.slug}/`)}">${escape(service.title)}</a></h2><p>${escape(service.description)}</p><a class="text-link" href="${local(route, `services/${service.slug}/`)}">${escape(service.title)} <span aria-hidden="true">↗</span></a></article>`).join("")}</div>`;
}

function articleCards(route, collection = articles) {
  return `<div class="insight-grid">${collection.map((article) => `<article class="insight-card"><p class="eyebrow">BUSINESS TECHNOLOGY</p><h3><a href="${local(route, `insights/${article.slug}/`)}">${escape(article.title)}</a></h3><p>${escape(article.summary)}</p><a class="text-link" href="${local(route, `insights/${article.slug}/`)}">Read the guide <span aria-hidden="true">↗</span></a></article>`).join("")}</div>`;
}

function consultationCallout(route) {
  return `<aside class="page-callout"><h2>Let’s talk through your workflow.</h2><p>A website, a mobile app, a web platform, desktop software, or a custom business workflow: we can work out what fits your business. Start with a Zoom consultation through BriefBooth. If you are unsure what you need, or the technology depends on a particular space, we can arrange an in-person consultation in the NYC area.</p><div class="page-actions">${bookingLink()}<a class="text-link" href="${local(route, "new-york-city/")}">New York City consultations ↗</a></div></aside>`;
}

function kickoffPage() {
  const page = { path: "/project-kickoff/", title: "Project Kickoff Checklist | 4u Digital",
    description: "Plan your 4u Digital project after consultation: first-version scope, approvals, assets, account access, and a clear handover before building.",
    modified: "2026-10-18", kickoffForm: true, breadcrumbs: [{ name: "Project kickoff checklist", path: "/project-kickoff/" }],
  };
  const draft = new URL(`mailto:${site.email}`);
  draft.searchParams.set("subject", "4u Digital project kickoff details");
  draft.searchParams.set("body", `Hi 4u Digital,\n\nFollowing our consultation, here are the details for my project. We can work through anything still undecided.\n\nBUSINESS AND CONTACTS\nCompany / project:\nMain contact and business email:\nWho approves scope, price, and the final work:\nWho gathers feedback, and how we will record approvals:\n\nFIRST VERSION\nThe business problem and intended users:\nOne complete task the first version should support:\nWhat is included:\nWhat is outside this version:\nExamples of a successful result to check together:\nBudget, price, and target dates to agree:\nDependencies that could affect those dates:\n\nASSETS AND ACCOUNTS\nContent, images, brand files, or other material to supply:\nWho supplies and approves each item, and its permitted use:\nExisting tools / accounts involved and their owners:\nAccount invitations and access to arrange separately:\n\nREVIEW AND HANDOVER\nThe next review step:\nProject files, account ownership, and handover to agree:\nLaunch responsibilities and any support / maintenance to agree:\n\nPlease list the accounts involved without sending passwords, payment details, or customer records.\n\nThanks!`);
  const content = intro("AFTER THE CONSULTATION", "A clear plan before the build.",
    "We’ll agree what the first version includes, how we’ll review it, and what each of us needs to provide. You don’t need this worked out before getting in touch.",
    `<div class="page-actions"><a class="button button-dark" data-kickoff-start href="${escape(draft.href)}">Prepare a kickoff email <span aria-hidden="true">↗</span></a>${bookingLink("text-link")}</div>`) + `<div id="kickoff-fallback">` +
    `<section class="page-section"><h2>1. Agree the first useful version.</h2><ul class="page-list"><li><strong>The problem and the people.</strong> Identify who will use the technology and one complete task it should help them finish.</li><li><strong>What’s included—and what comes later.</strong> Record the features, project boundaries, existing-tool connections, price, and dates we agree.</li><li><strong>What a successful result looks like.</strong> Write down examples we can check together, including everyday use and what should happen if something changes or goes wrong.</li><li><strong>Dependencies and changes.</strong> Note any content, account access, or outside decisions needed. Agree changes to scope and their effect on price or dates before adding them.</li></ul><aside class="page-callout"><h3>An example to make it concrete.</h3><p>For a salon booking project, one possible check is: a customer can choose a service and available time, receive the agreed confirmation, and the team can see the booking. We would check it with sample appointments and agree how cancellations or unavailable times should behave.</p><p>This is an illustration. Your project’s features and checks are agreed together.</p></aside></section>` +
    `<section class="page-section"><h2>2. Know who makes the decisions.</h2><ul class="page-list"><li><strong>Main contact.</strong> Name the person who coordinates the project and the business email to use.</li><li><strong>Final approver.</strong> Agree who can approve scope, price, content, and the finished work.</li><li><strong>Feedback and reviews.</strong> Name the person who gathers comments, agree the next review step, and record decisions in the agreed written channel.</li></ul><p>These details belong to your project. We confirm them before the build starts.</p></section>` +
    `<section class="page-section"><h2>3. Plan the assets, access, and handover.</h2><ul class="page-list"><li><strong>Content and files.</strong> List the copy, images, logos, menus, service details, or other material needed. Record who supplies and approves each item, when it is needed, and its permitted use.</li><li><strong>Tools and account owners.</strong> Identify any domains, hosting, booking tools, app-store accounts, or payment services involved. We agree the access needed and arrange appropriate account invitations separately.</li><li><strong>Ownership and launch.</strong> Agree who owns the project files and accounts, who handles launch tasks, and what will be handed over.</li><li><strong>Support after launch.</strong> Record any agreed maintenance or support and the responsibilities for outside services before building.</li></ul><p>List the accounts involved; don’t send passwords, payment details, or customer records in the kickoff email.</p></section>` +
    `<aside class="page-callout"><h2>Turn the conversation into a working brief.</h2><p>The email template includes these headings so you can add what you know. Leave undecided items for us to discuss. It prepares a draft in your email app; you choose whether to send it to ${site.email}.</p><a class="button button-dark" href="${escape(draft.href)}">Prepare a kickoff email <span aria-hidden="true">↗</span></a><p>This checklist helps us prepare the project. The agreed scope, price, responsibilities, and schedule are confirmed separately.</p></aside></div>` + renderKickoffForm();
  return { ...page, html: frame(page, content) };
}

function articlePage(article) {
  const route = `/insights/${article.slug}/`;
  const page = { path: route, title: article.metaTitle, description: article.description, article, faq: article.faq,
    breadcrumbs: [{ name: "Business guides", path: "/insights/" }, { name: article.title, path: route }],
  };
  const sections = article.sections.map(({ heading, text, paragraphs }) => `<section class="page-section"><h2>${escape(heading)}</h2>${(paragraphs || [text]).filter(Boolean).map((paragraph) => `<p>${escape(paragraph)}</p>`).join("")}</section>`).join("");
  const examples = article.projectIds.map((id) => projects.find((project) => project.id === id)).filter(Boolean);
  const content = `<article class="guide-article">${intro("A 4u Digital BUSINESS GUIDE", article.title, article.intro)}<p class="article-byline">By 4u Digital · <time datetime="${site.published}">October 14, 2026</time></p>${sections}${article.faq?.length ? faqBlock("A few useful answers", article.faq) : ""}<section class="page-section"><h2>Relevant work from the 4u Digital portfolio</h2><p>See the product screens and development details behind these related software projects. Each project page explains its purpose and the context of its images.</p><div class="seo-project-grid">${examples.map((project) => projectCard(project, route)).join("")}</div></section><section class="page-section"><h2>What would help your business?</h2><p>${escape(article.closing)}</p><nav class="related-links" aria-label="Related development services">${article.serviceSlugs.map((slug) => services.find((service) => service.slug === slug)).filter(Boolean).map((service) => `<a href="${local(route, `services/${service.slug}/`)}">${escape(service.title)}</a>`).join("")}</nav></section>${consultationCallout(route)}<nav class="related-links" aria-label="More business guides"><a href="${local(route, "insights/")}">All 4u Digital business guides</a><a href="${local(route, "guides/website-or-app/")}">Website, web app, or native app?</a></nav></article>`;
  return { ...page, html: frame(page, content) };
}

function localPage() {
  const route = "/new-york-city/";
  const page = { path: route, title: localConsultation.metaTitle, description: localConsultation.description,
    service: localConsultation, local: true, faq: localConsultation.faq,
    breadcrumbs: [{ name: "New York City consultations", path: route }],
  };
  const content = intro("NEW YORK CITY · ZOOM CONSULTATIONS", localConsultation.heading, localConsultation.intro,
    `<div class="page-actions">${bookingLink()}<a class="text-link" href="mailto:${site.email}">${site.email} ↗</a></div>`) +
    localConsultation.sections.map(({ heading, text }) => `<section class="page-section"><h2>${escape(heading)}</h2><p>${escape(text)}</p></section>`).join("") +
    `<section class="page-section"><h2>What could we build for your business?</h2><nav class="related-links" aria-label="Local development services">${localConsultation.serviceSlugs.map((slug) => services.find((service) => service.slug === slug)).filter(Boolean).map((service) => `<a href="${local(route, `services/${service.slug}/`)}">${escape(service.title)}</a>`).join("")}</nav><p>See how a booking or ordering workflow could be scoped before committing to a build.</p><nav class="related-links" aria-label="Business workflow guides"><a href="${local(route, "insights/salon-booking-website/")}">Planning a salon booking website</a><a href="${local(route, "insights/restaurant-ordering-app/")}">Planning restaurant online ordering</a><a href="${local(route, "work/")}">The 4u Digital project portfolio</a></nav></section>` +
    faqBlock("Questions about consultations", localConsultation.faq) +
    `<aside class="page-callout"><h2>Bring the problem, not a finished plan.</h2><p>${escape(localConsultation.bookingIntro)}</p>${bookingLink()}</aside>`;
  return { ...page, html: frame(page, content) };
}

function servicePage(service) {
  const route = `/services/${service.slug}/`;
  const page = { path: route, title: service.metaTitle, description: service.description, service, faq: service.faq,
    modified: service.modified,
    breadcrumbs: [{ name: "Services", path: "/services/" }, { name: service.title, path: route }],
  };
  const examples = service.projectIds.map((id) => projects.find((project) => project.id === id)).filter(Boolean);
  const content = intro(service.eyebrow, service.heading, service.intro, `<div class="page-actions">${inquiry(service.topic, "Discuss your project")}<a class="text-link" href="#examples">See examples ↓</a></div>`) +
    `<section class="page-section"><h2>What could ${escape(service.title.toLowerCase())} help you do?</h2><div class="page-columns">${service.when.map(({ title, text }) => `<article><h3>${escape(title)}</h3><p>${escape(text)}</p></article>`).join("")}</div></section>` +
    `<section id="examples" class="page-section"><h2>See the work behind the offer.</h2><p class="section-lead">${escape(service.proofIntro)}</p><div class="seo-project-grid">${examples.map((project) => projectCard(project, route)).join("")}</div></section>` +
    `<section class="page-section"><h2>What do we decide before building?</h2><div class="page-columns">${service.scope.map(({ title, text }) => `<article><h3>${escape(title)}</h3><p>${escape(text)}</p></article>`).join("")}</div></section>` +
    faqBlock(`Questions about ${service.title.toLowerCase()}`, service.faq) +
    `<aside class="page-callout"><h2>Start with the problem.</h2><p>Describe your business, who will use the technology, and what needs to work better. A finished plan isn’t required.</p>${inquiry(service.topic, "Email about your project")}</aside>` +
    `<section class="page-section"><h2>Still choosing what to build?</h2><p>A website, browser app, and native app solve different problems. Compare the options before choosing a platform.</p>${service.guideSlug ? `<p><a class="text-link" href="${local(route, `insights/${service.guideSlug}/`)}">Read the ${service.topic === "salon" ? "salon booking" : "restaurant ordering"} planning guide ↗</a></p>` : ""}<a class="text-link" href="${local(route, "guides/website-or-app/")}">Should you build a website or an app? ↗</a><nav class="related-links" aria-label="Other development services">${services.filter((other) => other.slug !== service.slug).map((other) => `<a href="${local(route, `services/${other.slug}/`)}">${escape(other.title)}</a>`).join("")}</nav></section>`;
  return { ...page, html: frame(page, content) };
}

function projectFrame(view, index, route) {
  const image = (capture, first = false) => `<img src="${local(route, capture.image.replace(/^\.\//, ""))}" alt="${escape(capture.imageAlt)}" width="${capture.width}" height="${capture.height}" ${first ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" />`;
  const fullSize = (capture, label) => `<a href="${local(route, capture.image.replace(/^\.\//, ""))}" target="_blank" rel="noopener noreferrer">${label} <span aria-hidden="true">↗</span></a>`;
  return `<figure ${index === 0 ? 'id="project-cover"' : `id="project-view-${index}"`} data-view="${index}" class="project-page-frame ${view.portrait ? "portrait" : ""} ${view.companion ? "paired" : ""}"><div>${image(view, index === 0)}${view.companion ? image(view.companion) : ""}</div><figcaption><strong>${escape(view.label)}</strong><p>${escape(view.caption)}</p><div class="project-image-links">${fullSize(view, "Open full-size image")}${view.companion ? fullSize(view.companion, "Open companion image") : ""}</div></figcaption></figure>`;
}

function projectViews(project, route) {
  const views = project.gallery.map((view, index) => ({ view, index })).slice(1);
  const artwork = views.filter(({ view }) => /product artwork|promotional artwork/i.test(view.caption));
  const captures = views.filter(({ view }) => !/product artwork|promotional artwork/i.test(view.caption));
  const group = (items, heading = "") => items.length ? `<div class="project-visual-group">${heading ? `<h3>${heading}</h3>` : ""}<div class="project-views-grid ${items.every(({ view }) => view.portrait && !view.companion) ? "portrait-grid" : ""}">${items.map(({ view, index }) => projectFrame(view, index, route)).join("")}</div></div>` : "";
  return `<section id="project-views" class="page-section project-views"><div class="project-section-heading"><div><p class="eyebrow">EXPLORE THE DETAILS</p><h2>See the project up close.</h2></div><p>${views.length ? "Images from the project, with context beside each view. Open an image at full size for a closer look." : "The available project image is shown above. Open it at full size to inspect the details."}</p></div>${views.length ? group(captures, artwork.length ? "App and website captures" : "") + group(artwork, "Product graphics") : '<a class="project-section-link" href="#project-cover">View the project image <span aria-hidden="true">↑</span></a>'}</section>`;
}

function projectPage(project) {
  const route = `/work/${projectSlugs[project.id]}/`;
  const page = { path: route, title: `${project.title} — ${projectType(project)} | 4u Digital`,
    description: `${project.purpose} See the screens, workflows, and development details in the 4u Digital portfolio.`,
    project, image: project.image, imageAlt: project.imageAlt,
    imageWidth: project.imageWidth, imageHeight: project.imageHeight,
    breadcrumbs: [{ name: "Projects", path: "/work/" }, { name: project.title, path: route }],
  };
  const story = projectStories[project.id];
  const content = `<section class="project-story-hero">${intro(projectType(project), project.title, project.purpose,
    `<p class="project-audience"><span>Made for</span> ${escape(story.audience)}</p><div class="page-actions">${inquiry("general", "Discuss a similar project", project.title)}${project.demoUrl ? `<a class="text-link" href="${escape(project.demoUrl)}" target="_blank" rel="noopener noreferrer">${escape(project.demoLabel || "Visit the project")} ↗</a>` : ""}</div>`, iconFor(project, route))}<div class="project-page-gallery" aria-label="Main image from ${escape(project.title)}">${projectFrame(project.gallery[0], 0, route)}</div></section>` +
    `<nav class="project-story-nav" aria-label="On this project page"><span class="mono">TAKE A CLOSER LOOK</span><a href="#overview">What it does <span aria-hidden="true">↓</span></a><a href="#project-views">Project images <span aria-hidden="true">↓</span></a><a href="#development">Behind the build <span aria-hidden="true">↓</span></a></nav>` +
    `<section id="overview" class="page-section project-overview"><div class="project-section-heading"><div><p class="eyebrow">THE WORKFLOW</p><h2>What does ${escape(project.title)} do?</h2></div><p class="project-summary">${escape(project.clientSummary || project.summary)}</p></div><div class="project-workflow-grid">${project.workflows.map((workflow, index) => `<article class="project-workflow-card"><span class="mono project-step" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span><h3>${escape(workflow)}</h3><p>${escape(story.workflowDescriptions[index])}</p></article>`).join("")}</div>${project.highlights?.length ? `<div class="project-capabilities"><h3>More of what’s inside</h3><div class="page-columns">${project.highlights.map(({ title, text }) => `<article><h4>${escape(title)}</h4><p>${escape(text)}</p></article>`).join("")}</div></div>` : ""}</section>` +
    projectViews(project, route) +
    `<section id="development" class="page-section project-development"><div class="project-section-heading"><div><p class="eyebrow">BEHIND THE BUILD</p><h2>From the task to the technology.</h2></div><p>The development work behind ${escape(project.title)}, with source code and image context available to explore.</p></div>${project.challenge ? `<div class="project-context"><article><h3>The problem</h3><p>${escape(project.challenge)}</p></article><article><h3>What was built</h3><p>${escape(project.build)}</p></article></div>` : ""}<div class="project-development-grid"><div><h3>Development details</h3><ul class="page-list">${project.features.map((feature) => `<li>${escape(feature)}</li>`).join("")}</ul></div><aside class="project-stack"><h3>Built with</h3><div class="project-tags">${project.stack.map((technology) => `<span class="tag">${escape(technology)}</span>`).join("")}</div><a class="text-link" href="${escape(project.repoUrl)}" target="_blank" rel="noopener noreferrer">${escape(project.title)} source code on GitHub ↗</a></aside></div>${project.notes ? `<details class="project-evidence"><summary>About these images and previews</summary><p>${escape(project.notes)}</p></details>` : ""}</section>` +
    `<section class="page-section project-build-cta"><div>${brandSignature(route)}<p class="eyebrow">YOUR BUSINESS, YOUR BUILD</p><h2>Could your business use something similar?</h2><p>Bring the workflow you need to improve. 4u Digital can help define the screens, data, and features for your own project.</p><p class="project-consultation-note">Start on Zoom. If seeing your space or workflow would help define the build, we can arrange an NYC in-person consultation.</p></div><div class="project-build-actions">${inquiry("general", "Talk about your build", project.title)}${bookingLink("project-section-link")}</div></section><nav class="related-links project-related" aria-label="Related services">${services.filter((service) => service.projectIds.includes(project.id)).map((service) => `<a href="${local(route, `services/${service.slug}/`)}">${escape(service.title)}</a>`).join("")}<a href="${local(route, "work/")}">All 4u Digital projects</a></nav>`;
  return { ...page, html: frame(page, content) };
}

function guidePage() {
  const route = "/guides/website-or-app/";
  const page = { path: route, title: guide.metaTitle, description: guide.description, faq: guide.faq,
    breadcrumbs: [{ name: guide.title, path: route }],
  };
  const content = intro("CHOOSE THE RIGHT BUILD", guide.title, guide.intro) +
    `<section class="page-section"><h2>Which kind of technology fits the job?</h2><div class="table-scroll" role="region" aria-label="Website and app comparison" tabindex="0"><table><caption>Compare four common ways to build business technology.</caption><thead><tr><th scope="col">Build</th><th scope="col">Choose it when</th><th scope="col">Example workflow</th></tr></thead><tbody>${guide.rows.map((row) => `<tr><th scope="row"><a href="${local(route, `services/${row.serviceSlug}/`)}">${escape(row.type)}</a></th><td>${escape(row.when)}</td><td>${escape(row.example)}</td></tr>`).join("")}</tbody></table></div></section>` +
    guide.sections.map(({ heading, text }) => `<section class="page-section"><h2>${escape(heading)}</h2><p>${escape(text)}</p></section>`).join("") +
    faqBlock("Questions about choosing a website or app", guide.faq) +
    `<aside class="page-callout"><h2>Tell 4u Digital what needs to work better.</h2><p>You don’t need to arrive with a platform choice. Describe the users and the task, and we can choose a sensible starting point.</p>${inquiry()}</aside>` +
    `<p class="content-review">Reviewed October 14, 2026 · 4u Digital development services. New: comparison of websites, browser apps, native apps, and custom business software.</p>`;
  return { ...page, html: frame(page, content) };
}

export async function generateSEO(output) {
  const home = { path: "/", title: "Custom App, Website & Software Development | 4u Digital",
    description: "Custom iOS apps, websites, and business software by 4u Digital. Explore three App Store apps, full-stack web platforms, and desktop development.",
    modified: "2026-10-19",
  };
  let html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  html = html.replace(/<head>[\s\S]*?<\/head>/, pageHead(home, true));
  html = html.replace('<div id="featured-projects" class="featured-grid"></div>', `<div id="featured-projects" class="featured-grid">${renderFeaturedProjects(featuredProjects)}</div>`);
  html = html.replace('<section id="range-proof" class="range-proof" aria-label="Development range and published app proof"></section>', `<section id="range-proof" class="range-proof" aria-label="Development range and published app proof">${renderRangeProof()}</section>`);
  html = html.replace('<div id="archive-projects" class="archive-list"></div>', `<div id="archive-projects" class="archive-list">${renderArchiveProjects(projects)}</div>`);
  html = html.replace('<div id="home-insights"></div>', articleCards("/"));
  html = html.replace('></p>\n            <div id="archive-projects"', `>${projects.length} OF ${projects.length} PROJECTS</p>\n            <div id="archive-projects"`);
  // Also give client-only controls a working route when JavaScript is unavailable.
  html = html.replace(/<noscript[\s\S]*?<\/noscript>/, '<noscript><p class="no-js-help">The projects below are available without JavaScript. Use each “Full project story” link to see every image and detail.</p></noscript>');
  html = sourceEmailLinks(html, "/");
  await writeFile(path.join(output, "index.html"), html);

  const servicesPage = { path: "/services/", title: "App, Website & Business Software Services | 4u Digital",
    description: "Custom website development, web applications, native apps, and business software by 4u Digital. Compare services and see real project examples.",
    breadcrumbs: [{ name: "Services", path: "/services/" }],
  };
  const work = { path: "/work/", title: "Website, App & Software Project Portfolio | 4u Digital",
    description: "See 15 4u Digital software projects: websites, business web apps, native apps, and desktop tools. View original product images and development details.",
    type: "CollectionPage", breadcrumbs: [{ name: "Projects", path: "/work/" }],
  };
  const about = { path: "/about/", title: "About 4u Digital | Custom Technology for Your Business",
    description: "4u Digital builds custom apps, websites, and business software. Learn how an idea becomes a defined scope, working technology, and a launch plan.",
    type: "AboutPage", breadcrumbs: [{ name: "About 4u Digital", path: "/about/" }],
  };
  const contact = { path: "/contact/", title: "Discuss Your App, Website or Software Project | 4u Digital",
    description: "Contact 4u Digital about your website, app, or business software. Book your first Zoom consultation through BriefBooth or email a project inquiry.",
    type: "ContactPage", breadcrumbs: [{ name: "Contact 4u Digital", path: "/contact/" }],
  };
  const insights = { path: "/insights/", title: "Business Website, App & Software Guides | 4u Digital",
    description: "Practical 4u Digital guides to hiring a freelance developer, choosing a custom build, salon bookings, restaurant ordering, and scoping business software.",
    type: "CollectionPage", breadcrumbs: [{ name: "Business guides", path: "/insights/" }],
  };
  const privacy = { path: "/privacy/", title: "Privacy & Site Analytics | 4u Digital",
    description: "How consultation booking through BriefBooth works alongside 4u Digital project inquiry emails, kickoff briefs, and public-page references.",
    modified: "2026-10-18", breadcrumbs: [{ name: "Privacy & site analytics", path: "/privacy/" }],
  };
  const pages = [
    { ...home, html },
    { ...servicesPage, html: frame(servicesPage, intro("CUSTOM TECH BUILD FOR YOU.", "Apps, websites, and software for your business.", "Choose the technology around the task. 4u Digital designs and develops public websites, browser-based applications, native apps, and custom business tools.") + serviceCards(servicesPage.path) + `<aside class="page-callout"><h2>Unsure what your business needs?</h2><p>Start with what needs to work better. We can decide the scope and platform together.</p><a class="text-link" href="${local(servicesPage.path, "guides/website-or-app/")}">Compare a website, web app, and native app ↗</a>${inquiry()}</aside>`) },
    ...services.map(servicePage),
    { ...work, html: frame(work, intro("THE 4u Digital PORTFOLIO", "See the work. Picture your own.", "15 websites, apps, and software projects built around real tasks. Each project shows its purpose, original product visuals, and the development behind it.") + `<div class="seo-project-grid work-page-grid">${projects.map((project) => projectCard(project, work.path)).join("")}</div>`) },
    ...projects.map(projectPage),
    guidePage(),
    { ...insights, html: frame(insights, intro("BEFORE YOU BUILD", "Useful reads for your next business build.", "Choose a development approach, think through your customer workflow, and decide what belongs in the first version. These short 4u Digital guides give you a practical starting point.") + articleCards(insights.path) + consultationCallout(insights.path)) },
    ...articles.map(articlePage),
    localPage(),
    kickoffPage(),
    { ...privacy, html: frame(privacy, intro("YOUR INFORMATION", "Privacy & site analytics.", "Here’s what happens when you explore 4u Digital, book a consultation, email an inquiry, or prepare a project kickoff brief.") + `<section class="page-section"><h2>Consultation bookings take place on BriefBooth.</h2><p>Booking links open the 4u Digital booking page on briefbooth.com in a new tab. You enter your consultation and scheduling details there. This portfolio does not submit a booking form or receive those details through its own form. Review the information and policies provided by BriefBooth before submitting your booking.</p><h3>Project inquiries use your email app.</h3><p>General project inquiry links prepare an email to admin@customtechbuilt4u.com. You choose whether to send it through your email service.</p><p>Inquiry drafts include the public 4u Digital page where the request began. This helps 4u Digital understand what interested you. The page reference contains no search terms, tracking parameters, or form details.</p></section><section class="page-section"><h2>Your kickoff brief is reviewed on your device.</h2><p>The project kickoff form keeps your answers in the current browser tab while you fill it out. It does not submit them to 4u Digital’s server or save them in browser storage. Leaving or refreshing the page can clear your answers.</p><p>Reviewing the brief does not send it. You can open a draft in your email app, copy it to your clipboard, or download a text file to your device. 4u Digital receives the brief only when you send the email to admin@customtechbuilt4u.com. Long briefs can be copied or downloaded for use with your email service.</p></section><section class="page-section"><h2>Understanding where an inquiry started.</h2><p>Inquiry emails include a reference to the public page where your request began. 4u Digital uses that reference to understand which services and projects interested you.</p><p>Visitor and contact-click analytics are disabled. This portfolio does not collect your project description, booking details, email body, or search input for analytics. It adds no analytics cookies or visitor identifiers. For email inquiries and kickoff briefs, you choose whether to send your draft. Consultation details entered on BriefBooth are handled through its booking process.</p></section><section class="page-section"><h2>Questions about your information?</h2><p>Email admin@customtechbuilt4u.com with your question. Information you choose to send by email is handled through the business email service.</p><a class="text-link" href="mailto:${site.email}">Contact 4u Digital ↗</a></section>`) },
    { ...about, html: frame(about, intro("ABOUT 4u Digital", "You know your business. I’ll build the technology.", "4u Digital is a custom technology business for companies that need an app, a website, or software shaped around how they work.") + `<section class="page-section"><h2>What does 4u Digital build?</h2><p>4u Digital handles interface design and development, including the screens people use and the systems behind them. The portfolio includes public websites, web applications with accounts and shared workflows, native Apple apps, and desktop tools.</p><a class="text-link" href="${local(about.path, "work/")}">See 4u Digital’s software portfolio ↗</a></section><section class="page-section"><h2>How does full-stack development help your project?</h2><p>4u Digital handles the interface people use and the backend code that stores records, checks access, and connects services. The portfolio includes authenticated web workspaces, shared records, and payment-provider integrations. The scope identifies what your project needs and which existing tools it can use.</p></section><section class="page-section"><h2>How does a project start?</h2><ol class="page-list"><li><strong>Describe the problem.</strong> Explain who will use the technology and what they need to do.</li><li><strong>Agree the scope and price.</strong> Define the features, project boundaries, costs, and responsibilities before building.</li><li><strong>Build, review, and prepare for launch.</strong> Review the work as it develops, then agree hosting, maintenance, and the launch requirements.</li></ol></section><section class="page-section"><h2>Where can you see the development work?</h2><p>Project pages include product screens, workflow descriptions, and links to public source code. Captions distinguish app captures from promotional artwork and identify sample content.</p><a class="text-link" href="https://github.com/taylordrew4u2" target="_blank" rel="noopener noreferrer">Browse the public GitHub projects ↗</a></section>${consultationCallout(about.path)}<aside class="page-callout"><h2>A rough idea is enough to start.</h2><p>Tell 4u Digital what your business needs. You don’t need a technical background or a finished specification.</p>${inquiry()}</aside>`) },
    { ...contact, html: frame(contact, intro("LET’S TALK", "What would you like to build?", "Email 4u Digital about your website, app, or business software. Start with the problem you want to solve; a rough idea is enough.", `<div class="page-actions">${inquiry()}<a class="text-link" href="mailto:${site.email}">${site.email} ↗</a></div>`) + `<section class="page-section"><h2>What should you include in your first email?</h2><ul class="page-list"><li>What your business does and who will use the technology.</li><li>The task or problem you want to improve.</li><li>Features you have in mind and any existing website or software.</li><li>Your budget range and target date, if you know them.</li></ul><p>4u Digital will discuss the scope and price before work starts. Hosting, outside services, and ongoing maintenance are agreed as part of that conversation.</p><p>After the consultation, use the <a class="text-link" href="${local(contact.path, "project-kickoff/")}">project kickoff checklist</a> to record the first version, approvals, and responsibilities together.</p></section>${consultationCallout(contact.path)}<section class="page-section"><h2>Choose a starting point.</h2><nav class="related-links" aria-label="Project inquiry types">${services.map((service) => `<a href="${escape(enquiryURL(service.topic))}">Discuss ${escape(service.title.toLowerCase())} ↗</a>`).join("")}</nav></section>`) },
  ].map((page) => ({
    ...page,
    // Every published page changed with the shared BriefBooth header and footer.
    modified: [page.modified || page.article?.modified || site.modified || site.published, "2026-10-19"].sort().at(-1),
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
