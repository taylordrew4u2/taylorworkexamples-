import { email, projects } from "./public-projects.js?v=50";
import { escape, enquiryURL, tags, sourceLink, labels, external, projectIcon, projectWorkflows, previewImages, dialogVisual } from "./render-projects.js?v=50";
import { dialogSizes } from "./responsive-images.js?v=50";
import { trackContact } from "./analytics.js?v=50";
import { bookingURL } from "./booking.js?v=50";
import "./navigation.js?v=50";

const $ = (selector) => document.querySelector(selector);
document.querySelectorAll(".enquiry-link").forEach((link) => {
  link.href = enquiryURL(link.dataset.enquiry);
});
$("#year").textContent = new Date().getFullYear();

// Older portfolio links still lead visitors to the complete collection.
function followLegacyProjectLink() {
  const target = {
    "#work": "./work/",
    "#project-archive": "./work/",
    "#app-store-proof": "./work/#app-store-proof",
  }[window.location.hash];
  if (target) window.location.replace(target);
}
followLegacyProjectLink();
window.addEventListener("hashchange", followLegacyProjectLink);

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
  storyLink.className = "text-link dialog-story-link";
  storyLink.href = project.caseUrl;
  storyLink.textContent = "View full project";
  storyLink.setAttribute("aria-label", `View full project: ${project.title}`);
  const storyArrow = document.createElement("span");
  storyArrow.setAttribute("aria-hidden", "true");
  storyArrow.textContent = "↗";
  storyLink.append(storyArrow);
  $(".dialog-booking-intro").append(storyLink);
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
