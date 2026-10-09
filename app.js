import {
  email,
  projects,
  featuredProjects,
  filterProjects,
} from "./projects.js?v=11";

const $ = (selector) => document.querySelector(selector);
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const external = 'target="_blank" rel="noopener noreferrer"';
function enquiryURL(topic = "general", reference = "") {
  const topics = {
    general: "website or app",
    website: "website",
    "web-app": "web application",
    ios: "iOS app",
  };
  const selected = topics[topic] || topics.general;
  const subjects = {
    general: "Website or app project",
    website: "Website project",
    "web-app": "Web application project",
    ios: "iOS app project",
  };
  const subject = reference
    ? `Project inspired by ${reference}`
    : subjects[topic] || subjects.general;
  const introduction = reference
    ? `I saw ${reference} in your portfolio and would like to discuss something similar.`
    : `I'm looking for help with ${topic === "ios" ? "an" : "a"} ${selected}.`;
  const body = `Hi 4u Digital,\n\n${introduction}\n\nCompany/project:\nThe problem:\nWho will use it:\nWhat I need:\nExisting website (if any):\nBudget range (if known):\nTarget launch date:\n\nThanks!`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
document.querySelectorAll(".enquiry-link").forEach((link) => {
  link.href = enquiryURL(link.dataset.enquiry);
});
const labels = {
  web: "WEB DEVELOPMENT",
  ios: "NATIVE iOS",
  desktop: "DESKTOP & AUDIO",
  tools: "TOOLS & EXPERIMENTS",
};
const tags = (stack, limit = stack.length) =>
  stack
    .slice(0, limit)
    .map((item) => `<span class="tag">${escape(item)}</span>`)
    .join("");
const detailsButton = (project, text = "Project details", className = "") =>
  `<button type="button" class="${className}" data-project="${escape(project.id)}" aria-label="${escape(text)} for ${escape(project.title)}">${escape(text)} <span aria-hidden="true">↗</span></button>`;
const liveLink = (project) =>
  project.demoUrl
    ? `<a href="${escape(project.demoUrl)}" ${external}>${escape(project.demoLabel || "Live site")} <span aria-hidden="true">↗</span></a>`
    : "";

function previewImages(frame) {
  const workflow = frame.workflow
    ? `<span class="screen-workflow"><span class="workflow-label">Import workflow</span><span class="workflow-steps" role="list">${frame.workflow.map((step) => `<span class="workflow-step" role="listitem">${escape(step)}</span>`).join("")}</span><span class="workflow-source">From the current source</span></span>`
    : "";
  return `<img class="primary-screen" src="${escape(frame.image)}" alt="${escape(frame.imageAlt)}" width="${frame.width || (frame.portrait ? 600 : 1280)}" height="${frame.height || (frame.portrait ? 1299 : 800)}" loading="lazy" decoding="async">${frame.companion ? `<img class="companion-screen" src="${escape(frame.companion.image)}" alt="${escape(frame.companion.imageAlt)}" width="${frame.companion.width || 600}" height="${frame.companion.height || 1299}" loading="lazy" decoding="async">` : ""}${workflow}`;
}

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
  const highlights = (project.highlights || [])
    .map(
      (item) =>
        `<li><strong>${escape(item.title)}</strong><p>${escape(item.text)}</p></li>`,
    )
    .join("");
  return `<article class="project-card case-study" data-card-index="${index + 1}" data-case-id="${escape(project.id)}"><div class="case-header"><div class="project-meta"><span class="mono project-category">${escape(project.projectType)}</span><span class="mono project-id">${String(index + 1).padStart(2, "0")}</span></div><h3 class="project-title"><button data-project="${escape(project.id)}">${escape(project.title)}</button></h3><p class="project-description">${escape(project.clientSummary || project.summary)}</p><div class="project-links">${liveLink(project)}${detailsButton(project, "Project details", "case-link")}</div></div><div class="case-media"><button class="project-visual case-screen ${escape(project.tone)} ${frame.portrait ? "portrait" : ""} ${frame.companion || frame.workflow ? "paired" : ""}" data-project="${escape(project.id)}" aria-label="Explore ${escape(project.title)}"><span class="canvas-label" aria-hidden="true">${escape(project.title)} / ${escape(project.projectType)}</span>${previewImages(frame)}<span class="preview-arrow" aria-hidden="true">↗</span></button><div class="screen-toolbar"><div class="screen-choices" role="group" aria-label="Screens from ${escape(project.title)}">${views.map((view, viewIndex) => `<button type="button" data-gallery="${escape(project.id)}" data-screen="${viewIndex}" aria-pressed="${viewIndex === 0}">${escape(view.label)}</button>`).join("")}</div><p class="screen-caption" aria-live="polite">${escape(frame.caption)}</p></div></div><div class="case-proof"><ul class="case-highlights">${highlights}</ul></div></article>`;
}

function supportingCard(project, index) {
  const preview = project.image
    ? `<img src="${escape(project.image)}" alt="${escape(project.imageAlt)}" width="${project.imageWidth || (project.portrait ? 600 : 1280)}" height="${project.imageHeight || (project.portrait ? 1300 : 800)}" loading="lazy" decoding="async">`
    : "";
  return `<article class="project-card supporting-card" data-card-index="${index + 1}"><button class="project-visual ${escape(project.tone)} ${project.portrait ? "portrait" : ""}" data-project="${escape(project.id)}" aria-label="Explore ${escape(project.title)}"><span class="visual-badge mono">${escape(project.badge)}</span>${preview}<span class="preview-arrow" aria-hidden="true">↗</span></button><h3 class="project-title"><button data-project="${escape(project.id)}">${escape(project.title)}</button></h3><div class="project-meta"><span class="mono project-category">${escape(project.projectType)}</span></div><p class="project-description">${escape(project.clientSummary || project.summary)}</p><div class="project-tags capability-tags" aria-label="Capabilities demonstrated">${tags(project.demonstrates || project.stack, 3)}</div><div class="project-links">${liveLink(project)}${detailsButton(project, "About this project", "case-link")}<a class="source-link" href="${escape(project.repoUrl)}" ${external}>Source code <span aria-hidden="true">↗</span></a></div></article>`;
}

function archiveCard(project) {
  const preview = project.image
    ? `<img src="${escape(project.image)}" alt="${escape(project.imageAlt)}" width="${project.imageWidth || 1280}" height="${project.imageHeight || 800}" loading="lazy" decoding="async">`
    : `<span class="archive-placeholder" aria-hidden="true">${escape(project.title)}</span>`;
  return `<article class="archive-card"><button class="archive-preview project-visual ${escape(project.tone)} ${project.portrait ? "portrait" : ""} ${project.imageKind === "project-overview" ? "source-overview" : ""}" data-project="${escape(project.id)}" aria-label="View images and details for ${escape(project.title)}">${preview}<span class="preview-arrow" aria-hidden="true">↗</span></button><div class="archive-description"><div class="project-meta"><span class="mono project-category">${labels[project.category]}</span><span class="image-kind">${escape(project.imageLabel || "Project preview")}</span></div><h3><button data-project="${escape(project.id)}">${escape(project.title)}</button></h3><p>${escape(project.summary)}</p><div class="project-tags">${tags(project.stack, 3)}</div></div><div class="project-links">${detailsButton(project, "Details", "case-link")}<a href="${escape(project.repoUrl)}" ${external}>Source <span aria-hidden="true">↗</span></a></div></article>`;
}

function dialogVisual(project, index = 0) {
  const views = project.gallery || [{ image: project.image, imageAlt: project.imageAlt, width: project.imageWidth, height: project.imageHeight, portrait: project.portrait, caption: project.imageCaption || project.imageAlt, label: "Overview" }];
  const frame = views[index];
  if (!frame?.image) return "";
  return `<section class="dialog-images" data-visual-project="${escape(project.id)}" aria-label="Images from ${escape(project.title)}"><div class="dialog-preview ${frame.portrait ? "portrait" : ""} ${frame.companion || frame.workflow ? "paired" : ""} ${escape(project.tone)}">${previewImages(frame)}</div>${views.length > 1 ? `<div class="screen-choices dialog-screen-choices" role="group" aria-label="Project images from ${escape(project.title)}">${views.map((view, viewIndex) => `<button type="button" data-dialog-screen="${viewIndex}" aria-pressed="${index === viewIndex}">${escape(view.label)}</button>`).join("")}</div>` : ""}<p class="dialog-image-caption" aria-live="polite">${escape(frame.caption || project.imageCaption || "")}</p><a class="image-original text-link" href="${escape(frame.image)}" ${external}>Open full-size image <span aria-hidden="true">↗</span></a></section>`;
}

$("#featured-projects").innerHTML =
  `<div class="product-stories">${featuredProjects.slice(0, 3).map(productStory).join("")}</div><div class="supporting-section"><h3 class="supporting-title">More selected projects</h3><div class="supporting-grid">${featuredProjects
    .slice(3)
    .map((project, index) => supportingCard(project, index + 3))
    .join("")}</div></div>`;

$("#featured-projects").addEventListener("click", (event) => {
  const choice = event.target.closest("[data-gallery]");
  if (!choice) return;
  const project = projects.find((item) => item.id === choice.dataset.gallery);
  const frame = project?.gallery?.[Number(choice.dataset.screen)];
  if (!frame) return;
  const story = choice.closest(".case-study");
  story.querySelectorAll("[data-gallery]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button === choice));
  });
  const screen = story.querySelector(".case-screen");
  screen.classList.toggle("portrait", frame.portrait === true);
  screen.classList.toggle("paired", Boolean(frame.companion || frame.workflow));
  screen.innerHTML = `<span class="canvas-label" aria-hidden="true">${escape(project.title)} / ${escape(project.projectType)}</span>${previewImages(frame)}<span class="preview-arrow" aria-hidden="true">↗</span>`;
  story.querySelector(".screen-caption").textContent = frame.caption;
});

$("#year").textContent = new Date().getFullYear();

let activeFilter = "all";
function renderArchive() {
  const visible = filterProjects(
    projects,
    activeFilter,
    $("#project-search").value,
  );
  $("#archive-projects").innerHTML = visible.map(archiveCard).join("");
  $("#result-count").textContent =
    `${visible.length} OF ${projects.length} PROJECTS`;
  $("#empty-state").hidden = visible.length > 0;
}
renderArchive();

function openLinkedArchive() {
  if (window.location.hash === "#project-archive") {
    $(".archive-disclosure").open = true;
  }
}
openLinkedArchive();
window.addEventListener("hashchange", openLinkedArchive);

function setFilter(category) {
  activeFilter = category;
  document.querySelectorAll("[data-filter]").forEach((button) => {
    const selected = button.dataset.filter === category;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  renderArchive();
}
$(".filter-group").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (button) setFilter(button.dataset.filter);
});
$("#project-search").addEventListener("input", renderArchive);
$("#clear-filters").addEventListener("click", () => {
  $("#project-search").value = "";
  setFilter("all");
  $("#project-search").focus();
});

const dialog = $("#project-dialog");
document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-project]");
  if (!trigger) return;
  const project = projects.find((item) => item.id === trigger.dataset.project);
  if (!project) return;
  const image = dialogVisual(project);
  const source =
    project.sources.find((url) => url.includes("/blob/")) || project.repoUrl;
  const caseStudy = project.challenge
    ? `<div class="dialog-case"><section><h3>The need</h3><p>${escape(project.challenge)}</p></section><section><h3>What I built</h3><p>${escape(project.build)}</p></section></div>`
    : "";
  const technical = `<div class="technical-content"><div class="project-tags">${tags(project.stack)}</div><ul>${project.features.map((item) => `<li>${escape(item)}</li>`).join("")}</ul><a class="text-link" href="${escape(project.repoUrl)}" ${external}>View source code <span aria-hidden="true">↗</span></a></div>`;
  $("#dialog-content").innerHTML =
    `<h2 id="dialog-title" class="dialog-title">${escape(project.title)}</h2><p class="mono dialog-category">${escape(project.projectType || labels[project.category])}</p><p class="dialog-summary">${escape(project.clientSummary || project.summary)}</p>${project.demonstrates ? `<div class="project-tags capability-tags">${tags(project.demonstrates)}</div>` : ""}${image}${caseStudy}<details class="technical-details"><summary>Technical details</summary>${technical}</details>${project.notes ? `<p class="dialog-note">${escape(project.notes)}</p>` : ""}<div class="dialog-actions"><a class="button button-dark project-enquiry" href="${escape(enquiryURL("general", project.title))}">Email about a similar project <span aria-hidden="true">↗</span></a>${project.demoUrl ? `<a class="button button-outline" href="${escape(project.demoUrl)}" ${external}>${escape(project.demoLabel || "See it live")} <span aria-hidden="true">↗</span></a>` : ""}</div><p class="dialog-source"><a href="${escape(source)}" ${external}>Project documentation ↗</a></p>`;
  dialog.showModal();
  dialog.scrollTop = 0;
});
$("#dialog-content").addEventListener("click", (event) => {
  const choice = event.target.closest("[data-dialog-screen]");
  if (!choice) return;
  const area = choice.closest(".dialog-images");
  const project = projects.find((item) => item.id === area.dataset.visualProject);
  const index = Number(choice.dataset.dialogScreen);
  const frame = project?.gallery?.[index];
  if (!frame) return;
  area.querySelectorAll("[data-dialog-screen]").forEach((button) => button.setAttribute("aria-pressed", String(button === choice)));
  const preview = area.querySelector(".dialog-preview");
  preview.classList.toggle("portrait", frame.portrait === true);
  preview.classList.toggle("paired", Boolean(frame.companion || frame.workflow));
  preview.innerHTML = previewImages(frame);
  area.querySelector(".dialog-image-caption").textContent = frame.caption;
  area.querySelector(".image-original").href = frame.image;
});
$(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  )
    dialog.close();
});

const menuButton = $(".menu-toggle");
const navigation = $("#main-nav");
function closeMenu() {
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation");
  navigation.classList.remove("is-open");
}
menuButton.addEventListener("click", () => {
  const expanded = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(expanded));
  menuButton.setAttribute(
    "aria-label",
    expanded ? "Close navigation" : "Open navigation",
  );
  navigation.classList.toggle("is-open", expanded);
});
navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".site-header")) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menuButton.getAttribute("aria-expanded") === "true"
  ) {
    closeMenu();
    menuButton.focus();
  }
});
window.matchMedia("(min-width: 601px)").addEventListener("change", closeMenu);

let copyReset;
$("#copy-email").addEventListener("click", async () => {
  clearTimeout(copyReset);
  try {
    await navigator.clipboard.writeText(email);
    $("#copy-email").textContent = "COPIED ✓";
    $("#copy-status").textContent = "Email address copied to clipboard.";
  } catch {
    $("#copy-email").textContent = "SELECT EMAIL TO COPY";
    const selection = window.getSelection();
    const range = document.createRange();
    range.setStart($(".email-link").firstChild, 0);
    range.setEnd($(".email-link").firstChild, email.length);
    selection.removeAllRanges();
    selection.addRange(range);
    $("#copy-status").textContent =
      `Clipboard unavailable. Select and copy ${email}, or use the email link.`;
  }
  copyReset = setTimeout(() => {
    $("#copy-email").textContent = "COPY EMAIL";
  }, 3000);
});
