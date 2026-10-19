import { email, projects, featuredProjects, filterProjects } from "./public-projects.js?v=49";
import { escape, enquiryURL, tags, sourceLink, labels, external, projectIcon, projectWorkflows, previewImages, isProductCover, dialogVisual, renderFeaturedProjects, renderArchiveProjects } from "./render-projects.js?v=49";
import { dialogSizes } from "./responsive-images.js?v=49";
import { trackContact } from "./analytics.js?v=49";
import { renderRangeProof } from "./range-proof.js?v=49";
import { bookingURL } from "./booking.js?v=49";

const $ = (selector) => document.querySelector(selector);
document.documentElement.classList.add("js-enabled");
document.querySelectorAll(".enquiry-link").forEach((link) => {
  link.href = enquiryURL(link.dataset.enquiry);
});
if (!$("#range-proof").children.length) $("#range-proof").innerHTML = renderRangeProof();

// The build supplies this markup before JavaScript. Only source previews need a fallback render.
if (!$("#featured-projects").children.length) {
  $("#featured-projects").innerHTML = renderFeaturedProjects(featuredProjects);
}

function changeShowcaseImage(event) {
  const choice = event.target.closest("[data-gallery]");
  if (!choice) return;
  const project = projects.find((item) => item.id === choice.dataset.gallery);
  const frame = project?.gallery?.[Number(choice.dataset.screen)];
  if (!frame) return;
  const story = choice.closest(".case-study, .supporting-card.has-gallery, .archive-card");
  story.querySelectorAll("[data-gallery]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button === choice));
  });
  const screen = story.querySelector(".case-screen, .supporting-screen, .archive-preview");
  const productCover = isProductCover(frame);
  screen.classList.toggle("portrait", frame.portrait === true);
  screen.classList.toggle("product-cover", productCover);
  if (productCover) {
    screen.style.setProperty("--product-cover-ratio", `${frame.width} / ${frame.height}`);
  } else {
    screen.style.removeProperty("--product-cover-ratio");
  }
  screen.classList.toggle("paired", Boolean(frame.companion || frame.workflow));
  if (story.classList.contains("archive-card")) {
    screen.classList.toggle("source-overview", (frame.imageKind || project.imageKind) === "project-overview");
  }
  screen.innerHTML = `<span class="visual-badge mono">${escape(project.badge)}</span>${previewImages(frame)}<span class="preview-arrow" aria-hidden="true">↗</span>`;
  story.querySelector(".screen-caption").textContent = frame.caption;
  story.querySelector(".showcase-original").href = frame.image;
  if (story.classList.contains("archive-card")) {
    const suppliedArtwork = frame.sourceKind === "owner-supplied-product-artwork";
    story.querySelector(".image-kind").textContent = suppliedArtwork ? "Supplied product artwork" : frame.imageLabel || project.imageLabel;
    story.querySelector(".preview-context").textContent = suppliedArtwork
      ? "Owner-supplied promotional artwork; original colors and full-resolution pixels preserved."
      : frame.previewContext || project.previewContext;
  }
}
$("#featured-projects").addEventListener("click", changeShowcaseImage);
$("#archive-projects").addEventListener("click", changeShowcaseImage);

$("#year").textContent = new Date().getFullYear();

let activeFilter = "all";
function renderArchive() {
  const visible = filterProjects(
    projects,
    activeFilter,
    $("#project-search").value,
  );
  $("#archive-projects").innerHTML = renderArchiveProjects(visible);
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
  const source = project.documentationUrl || project.repoUrl;
  const caseStudy = project.challenge
    ? `<div class="dialog-case"><section><h3>The need</h3><p>${escape(project.challenge)}</p></section><section><h3>What I built</h3><p>${escape(project.build)}</p></section></div>`
    : "";
  const technical = `<div class="technical-content"><div class="project-tags">${tags(project.stack)}</div><ul>${project.features.map((item) => `<li>${escape(item)}</li>`).join("")}</ul>${sourceLink(project, "View source code", "text-link")}</div>`;
  const bookingAction = `<a class="button button-dark" data-booking-link href="${escape(bookingURL)}" ${external}>Book a consultation <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>`;
  const bookingIntro = `<div class="dialog-booking-intro">${bookingAction}</div>`;
  $("#dialog-content").innerHTML =
    `<div class="project-identity dialog-identity">${projectIcon(project)}<h2 id="dialog-title" class="dialog-title">${escape(project.title)}</h2></div><p class="mono dialog-category">${escape(project.projectType || labels[project.category])}</p><p class="dialog-summary">${escape(project.purpose || project.clientSummary || project.summary)}</p>${bookingIntro}${projectWorkflows(project)}${project.demonstrates ? `<div class="project-tags capability-tags">${tags(project.demonstrates)}</div>` : ""}${image}${caseStudy}<details class="technical-details"><summary>Technical details</summary>${technical}</details>${project.notes ? `<p class="dialog-note">${escape(project.notes)}</p>` : ""}<p class="client-ownership-note">Your custom code is 100% yours. Client work and code stay out of this public portfolio unless you give permission.</p><div class="dialog-actions">${bookingAction}<a class="button button-outline project-enquiry" href="${escape(enquiryURL("general", project.title))}">Email about a similar project <span aria-hidden="true">↗</span></a>${project.demoUrl ? `<a class="button button-outline" href="${escape(project.demoUrl)}" ${external}>${escape(project.demoLabel || "See it live")} <span aria-hidden="true">↗</span></a>` : ""}</div><p class="dialog-source">${sourceLink(project, "Project documentation", "", source)}</p>`;
  const storyLink = document.createElement("a");
  storyLink.className = "button button-outline dialog-story-link";
  storyLink.href = project.caseUrl;
  storyLink.textContent = "Full project story";
  const storyArrow = document.createElement("span");
  storyArrow.setAttribute("aria-hidden", "true");
  storyArrow.textContent = "↗";
  storyLink.append(storyArrow);
  $(".dialog-actions").insertBefore(storyLink, $(".project-enquiry"));
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
  preview.innerHTML = previewImages(frame, dialogSizes);
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
window.matchMedia("(min-width: 901px)").addEventListener("change", closeMenu);

let copyReset;
$("#copy-email").addEventListener("click", async () => {
  clearTimeout(copyReset);
  try {
    await navigator.clipboard.writeText(email);
    trackContact("email-copy");
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
