import { bookingURL } from "./booking.js?v=50";
import { email } from "./public-projects.js?v=50";
import { addInquirySource } from "./contact-context.js?v=50";
import { responsiveAttributes, gallerySizes, dialogSizes } from "./responsive-images.js?v=50";

export const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
export const external = 'target="_blank" rel="noopener noreferrer"';
export function enquiryURL(topic = "general", reference = "", source = "/") {
  if (topic === "consultation") return bookingURL;
  const topics = {
    general: "website, app, or business software",
    website: "website",
    "web-app": "web application",
    ios: "iOS app",
    software: "custom app or business software",
    salon: "salon booking website or app",
    restaurant: "restaurant ordering website or app",
  };
  const selected = topics[topic] || topics.general;
  const subjects = {
    general: "Website, app, or software project",
    website: "Website project",
    "web-app": "Web application project",
    ios: "iOS app project",
    software: "Custom app or software project",
    salon: "Salon booking project",
    restaurant: "Restaurant ordering project",
  };
  const subject = reference
    ? `Project inspired by ${reference}`
    : subjects[topic] || subjects.general;
  const introduction = reference
    ? `I saw ${reference} in your portfolio and would like to discuss something similar.`
    : `I'm looking for help with ${topic === "ios" ? "an" : "a"} ${selected}.`;
  const body = `Hi 4u Digital,\n\n${introduction}\n\nCompany/project:\nThe problem:\nWho will use it:\nWhat I need:\nExisting website (if any):\nBudget range (if known):\nTarget launch date:\n\nThanks!`;
  return addInquirySource(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, source);
}
export const labels = {
  web: "WEB DEVELOPMENT",
  ios: "NATIVE iOS",
  desktop: "DESKTOP & AUDIO",
  tools: "TOOLS & EXPERIMENTS",
};
export const tags = (stack, limit = stack.length) =>
  stack
    .slice(0, limit)
    .map((item) => `<span class="tag">${escape(item)}</span>`)
    .join("");
const detailsButton = (project, text = "Project details", className = "") =>
  `<button type="button" class="${className}" data-project="${escape(project.id)}" aria-label="${escape(text)} for ${escape(project.title)}">${escape(text)} <span aria-hidden="true">↗</span></button>`;
export const sourceLink = (project, label = "Source", className = "", url = project.repoUrl) =>
  project.sourceAvailable === false
    ? `<span class="${escape(className)} source-note">Source not public</span>`
    : `<a class="${escape(className)}" href="${escape(url)}" ${external}>${escape(project.codeAvailable === false ? project.repoLabel || "Project repository" : label)} <span aria-hidden="true">↗</span></a>`;
const liveLink = (project) =>
  project.demoUrl
    ? `<a href="${escape(project.demoUrl)}" ${external}>${escape(project.demoLabel || "Live site")} <span aria-hidden="true">↗</span></a>`
    : "";

export function projectIcon(project) {
  return `<span class="project-icon-frame" aria-hidden="true">${project.icon
    ? `<img class="project-icon" src="${escape(project.icon)}" alt="" width="${project.iconWidth}" height="${project.iconHeight}" loading="lazy" decoding="async">`
    : `<span class="project-initials">${escape(project.iconFallback || project.title.slice(0, 2))}</span>`}</span>`;
}

function projectHeading(project, className = "project-title") {
  return `<div class="project-identity">${projectIcon(project)}<h3 class="${className}"><button data-project="${escape(project.id)}">${escape(project.title)}</button></h3></div>`;
}

export function projectWorkflows(project) {
  return `<ul class="project-workflows" aria-label="What ${escape(project.title)} does">${project.workflows.map((item) => `<li>${escape(item)}</li>`).join("")}</ul>`;
}

export function previewImages(frame, sizes = gallerySizes) {
  const workflow = frame.workflow
    ? `<span class="screen-workflow"><span class="workflow-label">Import workflow</span><span class="workflow-steps" role="list">${frame.workflow.map((step) => `<span class="workflow-step" role="listitem">${escape(step)}</span>`).join("")}</span><span class="workflow-source">From the current source</span></span>`
    : "";
  return `<img class="primary-screen" src="${escape(frame.image)}" alt="${escape(frame.imageAlt)}" width="${frame.width || (frame.portrait ? 600 : 1280)}" height="${frame.height || (frame.portrait ? 1299 : 800)}" loading="lazy" decoding="async"${responsiveAttributes(frame.image, sizes)}>${frame.companion ? `<img class="companion-screen" src="${escape(frame.companion.image)}" alt="${escape(frame.companion.imageAlt)}" width="${frame.companion.width || 600}" height="${frame.companion.height || 1299}" loading="lazy" decoding="async"${responsiveAttributes(frame.companion.image, sizes)}>` : ""}${workflow}`;
}

export const isProductCover = (frame) => frame.portrait !== true && !frame.companion && !frame.workflow &&
  Number.isFinite(frame.width) && Number.isFinite(frame.height) && frame.height > 0 &&
  frame.width > frame.height && /product-artwork$/.test(frame.sourceKind || "");

const productCoverStyle = (frame) => isProductCover(frame)
  ? ` style="--product-cover-ratio: ${frame.width} / ${frame.height};"`
  : "";

function showcaseGallery(project, frame, className, collapsed = false) {
  const choices = project.gallery.length > 1
    ? `<div class="screen-choices" role="group" aria-label="Screens from ${escape(project.title)}">${project.gallery.map((view, viewIndex) => `<button type="button" data-gallery="${escape(project.id)}" data-screen="${viewIndex}" aria-pressed="${viewIndex === 0}">${escape(view.label)}</button>`).join("")}</div>`
    : "";
  const content = `${choices}<p class="screen-caption" aria-live="polite">${escape(frame.caption)}</p><a class="showcase-original" href="${escape(frame.image)}" ${external}>Open full-size image <span aria-hidden="true">↗</span></a>`;
  return collapsed
    ? `<details class="${className} gallery-disclosure"><summary>Browse ${project.gallery.length} screens <span aria-hidden="true">+</span></summary><div class="gallery-disclosure-body">${content}</div></details>`
    : `<div class="${className}">${content}</div>`;
}

function featuredLinks(project) {
  const capabilities = `<div class="project-tags capability-tags" aria-label="Capabilities demonstrated">${tags(project.demonstrates || project.stack, 3)}</div>`;
  return `<div class="project-links">${caseLink(project)}${liveLink(project)}<details class="project-more"><summary>More project details <span aria-hidden="true">+</span></summary><div class="project-more-links">${capabilities}${detailsButton(project, "Quick preview", "case-link")}${sourceLink(project, "Source code", "source-link")}</div></details></div>`;
}

const workType = (project) => project.projectType === "Website"
  ? "website"
  : project.category === "ios" ? "ios" : "web-app";

function productStory(project, index) {
  const views = project.gallery || [
    {
      image: project.image,
      imageAlt: project.imageAlt,
      portrait: project.portrait,
      label: "Overview",
      caption: project.imageAlt,
    },
  ];
  const frame = views[0];
  const anchor = project.id === "The-Bit-Binder" ? 'id="the-bit-binder-showcase"' : "";
  const highlights = (project.highlights || [])
    .map(
      (item) =>
        `<li><strong>${escape(item.title)}</strong><p>${escape(item.text)}</p></li>`,
    )
    .join("");
  return `<article ${anchor} class="project-card case-study" data-card-index="${index + 1}" data-case-id="${escape(project.id)}" data-work-type="${workType(project)}"><div class="case-header"><div class="project-meta"><span class="mono project-category">${escape(project.projectType)}</span><span class="mono project-id">${String(index + 1).padStart(2, "0")}</span></div>${projectHeading(project)}<p class="project-description">${escape(project.clientSummary || project.summary)}</p>${featuredLinks(project)}</div><div class="case-media"><button class="project-visual case-screen ${escape(project.tone)} ${isProductCover(frame) ? "product-cover" : ""} ${frame.portrait ? "portrait" : ""} ${frame.companion || frame.workflow ? "paired" : ""}"${productCoverStyle(frame)} data-project="${escape(project.id)}" aria-label="Explore ${escape(project.title)}"><span class="visual-badge mono">${escape(project.badge)}</span>${previewImages(frame)}<span class="preview-arrow" aria-hidden="true">↗</span></button>${showcaseGallery(project, frame, "screen-toolbar", true)}</div><div class="case-proof"><ul class="case-highlights">${highlights}</ul></div></article>`;
}

function supportingCard(project, index) {
  const frame = project.gallery[0];
  const anchor = project.id === "MyGigCalendar" ? 'id="my-gig-calendar-showcase"' : `id="${escape(project.id.toLowerCase())}-showcase"`;
  return `<article ${anchor} class="project-card supporting-card has-gallery" data-card-index="${index + 1}" data-supporting-id="${escape(project.id)}" data-work-type="${workType(project)}"><button class="project-visual supporting-screen ${escape(project.tone)} ${isProductCover(frame) ? "product-cover" : ""} ${frame.portrait ? "portrait" : ""} ${frame.companion ? "paired" : ""}"${productCoverStyle(frame)} data-project="${escape(project.id)}" aria-label="Explore ${escape(project.title)}"><span class="visual-badge mono">${escape(project.badge)}</span>${previewImages(frame)}<span class="preview-arrow" aria-hidden="true">↗</span></button>${projectHeading(project)}<div class="project-meta"><span class="mono project-category">${escape(project.projectType)}</span></div><p class="project-description">${escape(project.purpose || project.clientSummary || project.summary)}</p>${projectWorkflows(project)}${featuredLinks(project)}${showcaseGallery(project, frame, "supporting-gallery", true)}</article>`;
}

function archiveCard(project) {
  const frame = project.gallery[0];
  return `<article class="archive-card" data-showcase-id="${escape(project.id)}"><div class="archive-intro">${projectHeading(project)}<p class="archive-purpose">${escape(project.purpose)}</p></div><button class="archive-preview project-visual ${escape(project.tone)} ${isProductCover(frame) ? "product-cover" : ""} ${frame.portrait ? "portrait" : ""} ${frame.companion || frame.workflow ? "paired" : ""} ${(frame.imageKind || project.imageKind) === "project-overview" ? "source-overview" : ""}"${productCoverStyle(frame)} data-project="${escape(project.id)}" aria-label="View images and details for ${escape(project.title)}"><span class="visual-badge mono">${escape(project.badge)}</span>${previewImages(frame)}<span class="preview-arrow" aria-hidden="true">↗</span></button>${showcaseGallery(project, frame, "archive-gallery")}<div class="archive-description"><div class="project-meta"><span class="mono project-category">${labels[project.category]}</span><span class="image-kind">${escape(frame.imageLabel || project.imageLabel)}</span></div><p class="preview-context">${escape(frame.previewContext || project.previewContext)}</p>${projectWorkflows(project)}</div><div class="project-links">${liveLink(project)}${detailsButton(project, "Details", "case-link")}${sourceLink(project)}${caseLink(project)}</div></article>`;
}

export function dialogVisual(project, index = 0) {
  const views = project.gallery || [{ image: project.image, imageAlt: project.imageAlt, width: project.imageWidth, height: project.imageHeight, portrait: project.portrait, caption: project.imageCaption || project.imageAlt, label: "Overview" }];
  const frame = views[index];
  if (!frame?.image) return "";
  return `<section class="dialog-images" data-visual-project="${escape(project.id)}" aria-label="Images from ${escape(project.title)}"><div class="dialog-preview ${frame.portrait ? "portrait" : ""} ${frame.companion || frame.workflow ? "paired" : ""} ${escape(project.tone)}">${previewImages(frame, dialogSizes)}</div>${views.length > 1 ? `<div class="screen-choices dialog-screen-choices" role="group" aria-label="Project images from ${escape(project.title)}">${views.map((view, viewIndex) => `<button type="button" data-dialog-screen="${viewIndex}" aria-pressed="${index === viewIndex}">${escape(view.label)}</button>`).join("")}</div>` : ""}<p class="dialog-image-caption" aria-live="polite">${escape(frame.caption || project.imageCaption || "")}</p><a class="image-original text-link" href="${escape(frame.image)}" ${external}>Open full-size image <span aria-hidden="true">↗</span></a></section>`;
}


const caseLink = (project) => `<a class="case-page-link" href="${escape(project.caseUrl)}" aria-label="View project: ${escape(project.title)}">View project <span aria-hidden="true">↗</span></a>`;

export function renderFeaturedProjects(collection) {
  return `<div class="product-stories">${collection.slice(0, 3).map(productStory).join("")}</div><div class="supporting-section"><h3 class="supporting-title">More selected projects</h3><div class="supporting-grid">${collection.slice(3).map((project, index) => supportingCard(project, index + 3)).join("")}</div></div>`;
}

export function renderArchiveProjects(collection) {
  return collection.map(archiveCard).join("");
}
