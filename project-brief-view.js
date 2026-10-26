import { briefSteps, briefFields } from "./project-brief-schema.js";
import { briefPalettes } from "./project-brief-palettes.js";
import { briefDesignSamples, briefFontSamples, renderDesignSample } from "./project-brief-designs.js";

const escape = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));

function projectIcon(type) {
  const shapes = {
    website: '<rect x="3" y="5" width="26" height="22" rx="3"/><path d="M3 12h26M8 8.5h1m3 0h1M8 17h10m-10 5h16"/>',
    app: '<rect x="8" y="2" width="16" height="28" rx="4"/><path d="M13 6h6m-7 6h8m-8 5h8m-5 9h2"/>',
    software: '<rect x="3" y="5" width="26" height="22" rx="3"/><path d="M11 5v22M16 11h8m-8 5h5m-5 5h8M6 11h2m-2 5h2m-2 5h2"/>',
    mixed: '<rect x="2" y="5" width="22" height="18" rx="3"/><rect x="19" y="12" width="11" height="18" rx="2" fill="white"/><path d="M2 11h17m4 15h3"/>',
    unsure: '<path d="M28 14c0 6-5 11-12 11h-5l-7 4 2-8a10 10 0 0 1-3-7C3 8 9 3 16 3s12 5 12 11Z"/><path d="M12 11a4 4 0 0 1 8 0c0 3-4 3-4 6m0 3v.5"/>',
  };
  return `<span class="brief-project-icon" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" focusable="false">${shapes[type] || shapes.unsure}</svg></span>`;
}

function renderPalettes() {
  return `<div class="brief-palette-picker"><p class="brief-hint">These are a few starting points to react to. Pick one, make your own palette below, or leave the colors open for discussion. Nothing here is a final design decision.</p><div class="brief-palette-grid" role="group" aria-label="Color palette starting points">${briefPalettes.map((selection) => `<button type="button" class="brief-palette" data-brief-palette="${selection.id}" aria-pressed="false" aria-describedby="brief-palette-colors-${selection.id}"><span class="brief-palette-title">${escape(selection.name)}<span class="brief-palette-check" aria-hidden="true">↗</span></span><span class="brief-palette-swatches" aria-hidden="true">${selection.colors.map((color) => `<i style="background-color:${color.hex}"></i>`).join("")}</span><span class="brief-palette-action">Use as a starting point</span><span id="brief-palette-colors-${selection.id}" class="brief-visually-hidden">${selection.colors.map((color) => `${color.name}, ${color.hex}`).join("; ")}</span></button>`).join("")}</div><div id="brief-selected-palette" class="brief-selected-palette" hidden><div><p id="brief-selected-palette-name"></p><button id="brief-clear-palette" type="button" class="brief-text-button">Clear palette</button></div><ul id="brief-selected-palette-colors"></ul><p class="brief-hint">These colors will be included as inspiration. You can change the palette, add your own colors, or describe what you would do differently.</p></div></div>`;
}

function renderStyleField(field, common, id, hint, marker) {
  const visual = field.options.filter((option) => briefDesignSamples[option.value]);
  const other = field.options.filter((option) => !briefDesignSamples[option.value]);
  const card = (option) => {
    const index = field.options.indexOf(option);
    return `<label class="brief-style-card" for="${id}-${index}"><span class="brief-style-card-top"><input id="${id}-${index}" type="checkbox" ${common} value="${escape(option.value)}"><span>${escape(option.label)}</span><span class="brief-style-selected" aria-hidden="true">✓</span></span>${renderDesignSample(option.value)}<span class="brief-style-description">${escape(briefDesignSamples[option.value].detail)}</span><span class="brief-style-caption" aria-hidden="true">Website + app illustration</span></label>`;
  };
  return `<fieldset class="brief-field brief-choice-field brief-style-field" data-field-container="${field.id}"><legend>${escape(field.label)} ${marker}</legend>${hint}<div class="brief-style-grid">${visual.slice(0, 2).map(card).join("")}</div><details class="brief-visual-more" data-brief-reveal-selection><summary>See ${visual.length - 2} more visual directions <span aria-hidden="true">＋</span></summary><div class="brief-style-grid">${visual.slice(2).map(card).join("")}</div></details><div class="brief-options">${other.map((option) => {
    const index = field.options.indexOf(option);
    return `<label class="brief-option brief-style-open" for="${id}-${index}"><input id="${id}-${index}" type="checkbox" ${common} value="${escape(option.value)}"><span>${escape(option.label)}</span></label>`;
  }).join("")}</div><p id="${id}-error" class="brief-field-error" hidden></p></fieldset>`;
}

function renderFontField(field, common, id, hint, marker) {
  return `<fieldset class="brief-field brief-choice-field" data-field-container="${field.id}"><legend>${escape(field.label)} ${marker}</legend>${hint}<details class="brief-visual-more brief-font-explorer" data-brief-reveal-selection><summary><span>Compare a few font directions</span><span class="brief-font-teaser" aria-hidden="true">Aa <i>Aa</i> <code>Aa</code></span></summary><p class="brief-hint">These are real type samples to help explain the feeling you like. The final font can be worked out together.</p><div class="brief-font-grid">${field.options.map((option, index) => {
    const sample = briefFontSamples[option.value] || briefFontSamples.unsure;
    return `<label class="brief-font-card brief-font-${option.value}" for="${id}-${index}"><span class="brief-font-card-top"><input id="${id}-${index}" type="radio" ${common} value="${escape(option.value)}"><span>${escape(option.label)}</span></span><span class="brief-font-sample">${escape(sample.text)}</span><span class="brief-font-description">${escape(sample.description)}</span></label>`;
  }).join("")}</div></details><p id="${id}-error" class="brief-field-error" hidden></p></fieldset>`;
}

function renderField(field) {
  const id = `brief-${field.id}`;
  const hint = field.hint ? `<p id="${id}-hint" class="brief-hint">${escape(field.hint)}</p>` : "";
  const descriptions = `${field.hint ? `${id}-hint ` : ""}${id}-error`;
  const marker = `<span class="brief-optional">${field.required ? "Required" : "Optional"}</span>`;
  const common = `name="${escape(field.id)}" data-brief-field="${escape(field.id)}" aria-describedby="${descriptions}"`;
  const limit = field.maxLength ? ` maxlength="${field.maxLength}"` : "";
  if (field.id === "brandMood") return renderStyleField(field, common, id, hint, marker);
  if (field.id === "fontStyle") return renderFontField(field, common, id, hint, marker);
  let control;
  if (["radio", "checkboxes"].includes(field.type)) {
    control = `<fieldset class="brief-field brief-choice-field" data-field-container="${escape(field.id)}"><legend>${escape(field.label)} ${marker}</legend>${hint}<div class="brief-options ${field.id === "projectType" ? "brief-project-options" : ""}">${field.options.map((option, index) => `<label class="brief-option" for="${id}-${index}"><input id="${id}-${index}" type="${field.type === "radio" ? "radio" : "checkbox"}" ${common} value="${escape(option.value)}"${field.required ? " required" : ""}>${field.id === "projectType" ? projectIcon(option.value) : ""}<span>${escape(option.label)}</span><span class="brief-choice-mark" aria-hidden="true">${field.type === "radio" ? "↗" : "+"}</span></label>`).join("")}</div><p id="${id}-error" class="brief-field-error" hidden></p></fieldset>`;
  } else {
    const attributes = `id="${id}" ${common}${limit}${field.required ? " required" : ""}${field.placeholder ? ` placeholder="${escape(field.placeholder)}"` : ""}`;
    const autocomplete = { contactName: "name", contactEmail: "email", company: "organization", businessName: "organization" }[field.id] || "off";
    const input = field.type === "textarea" || field.type === "colors"
      ? `<textarea ${attributes} rows="${field.type === "colors" ? 2 : 3}"></textarea>`
      : `<input ${attributes} type="${field.type === "email" ? "email" : "text"}" autocomplete="${autocomplete}"${field.type === "url" ? ' inputmode="url"' : ""}>`;
    const colorPicker = field.type === "colors" ? `<div class="brief-custom-palette"><h3>Or make your own palette.</h3><p class="brief-hint">Add colors you like, type their names, or describe a reference photo. You can keep exploring and change your mind.</p><div class="brief-color-tools"><label for="brief-color-picker">Choose a color<input id="brief-color-picker" type="color" value="#ffffff" aria-label="Choose a project color"></label><button id="brief-add-color" class="brief-text-button" type="button">Add to my colors</button></div><div id="brief-color-swatches" class="brief-color-swatches" aria-label="Your selected project colors"></div></div>` : "";
    control = `<div class="brief-field" data-field-container="${escape(field.id)}"><label for="${id}">${escape(field.label)} ${marker}</label>${hint}${field.type === "colors" ? `${renderPalettes()}<p class="brief-color-note-label">Your own colors, changes, or notes</p>` : ""}${input}${colorPicker}<p id="${id}-error" class="brief-field-error" hidden></p></div>`;
  }
  return control;
}

function renderFields(fields) {
  const rendered = new Set();
  return fields.map((field) => {
    if (rendered.has(field.id)) return "";
    const group = field.group;
    if (group?.startsWith("reference")) {
      const related = fields.filter((entry) => entry.group === group);
      related.forEach((entry) => rendered.add(entry.id));
      return `<section class="brief-reference-group" data-brief-field-group="${group}"><h3>Something you like ${group.replace("reference", "")}</h3><p class="brief-hint">A website, app, image, or brand that caught your eye. Tell me which parts appeal to you; it does not need to match your whole project.</p><div class="brief-fields">${related.map(renderField).join("")}</div></section>`;
    }
    if (group === "social") {
      const related = fields.filter((entry) => entry.group === group);
      related.forEach((entry) => rendered.add(entry.id));
      const platformMarks = { socialInstagram: "IG", socialFacebook: "f", socialTikTok: "♪", socialYouTube: "▷", socialLinkedIn: "in", socialX: "X", socialPinterest: "P", socialOther: "↗" };
      return `<details class="brief-social-fields brief-visual-more" data-brief-field-group="social" data-brief-reveal-selection><summary><span>Your social pages, if useful</span><span class="brief-optional">Optional</span></summary><p class="brief-hint">Add only the accounts you want connected or considered for the website. A handle or public link is enough. You can leave every row blank.</p><div class="brief-social-rows">${related.map((entry) => `<div class="brief-social-row"><span class="brief-social-mark" aria-hidden="true">${platformMarks[entry.id] || "↗"}</span>${renderField(entry)}</div>`).join("")}</div></details>`;
    }
    return renderField(field);
  }).join("");
}

function renderMediaEmail() {
  return `<aside class="brief-media-email" aria-labelledby="brief-media-email-title"><span class="brief-media-email-icon" aria-hidden="true">↗</span><div><h3 id="brief-media-email-title">Photos or videos that aren’t online?</h3><p>You can email them directly to <a id="brief-media-email-address" href="mailto:admin@customtechbuilt4u.com">admin@customtechbuilt4u.com</a>. Include your business or project name so I can match them to your brief.</p><div class="brief-media-email-actions"><a id="brief-media-email" class="brief-button brief-button-secondary" href="mailto:admin@customtechbuilt4u.com?subject=4u%20Digital%20project%20photos%20and%20videos">Email photos & videos ↗</a><button id="brief-media-copy" type="button" class="brief-text-button">Copy email address</button></div><p id="brief-media-copy-status" class="brief-hint" role="status"></p><p class="brief-hint">This is optional and can wait until after you send the brief. Videos go by email, not through this upload form. For files too large to email, send a view-only folder link instead. If you use webmail, copy the address and attach your files there.</p></div></aside>`;
}

function renderUploader() {
  return `<section class="brief-upload" aria-labelledby="brief-upload-title"><div class="brief-upload-heading"><span class="brief-upload-icon" aria-hidden="true">↥</span><div><h3 id="brief-upload-title">Show me what you have in mind.</h3><p>Photos, logos, sketches, screenshots, or a PDF. Your images stay in full color.</p></div></div><div id="brief-dropzone" class="brief-dropzone"><label class="brief-button brief-button-secondary brief-file-label" for="brief-files">Choose photos or PDFs<input id="brief-files" type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf" aria-describedby="brief-file-help brief-file-error"></label><p id="brief-file-help">Up to 6 files. JPG, PNG, WebP, or PDF. 5 MB per file, 8 MB combined. You can also paste a shared-folder link in your answers.</p></div><p id="brief-file-error" class="brief-field-error" role="status" hidden></p><p id="brief-file-count" class="brief-hint" aria-live="polite">No files added. This is optional.</p><ul id="brief-file-list" class="brief-file-list"></ul><p class="brief-hint">Only upload files you have permission to share. Leave out passwords, payment details, and private customer or health records.</p></section>`;
}

export function renderProjectBrief() {
  const fields = new Map(briefFields.map((field) => [field.id, field]));
  return `<section id="project-brief" class="project-brief" aria-label="Guided project brief">
    <div id="brief-fallback" class="brief-fallback"><p>The guided form needs JavaScript. You can also send your project ideas and files to <a href="mailto:admin@customtechbuilt4u.com">admin@customtechbuilt4u.com</a>.</p></div>
    <form id="project-brief-form" class="brief-layout" novalidate hidden>
      <aside class="brief-sidebar"><a class="brief-brand" href="../"><img src="../assets/4u-digital-logo-mono.png" width="52" height="52" alt="4u Digital"><span>Your idea.<br><strong>Let’s make it real.</strong></span></a><p class="brief-sidebar-note">One question at a time. Nothing needs to be final.</p><details class="brief-section-menu"><summary>Jump to a section</summary><nav aria-label="Project brief sections"><ol class="brief-step-list">${briefSteps.map((step, index) => `<li><button type="button" class="brief-step-link" data-brief-go="${index}"${index === 0 ? ' aria-current="step"' : ""}><span class="brief-step-number">${String(index + 1).padStart(2, "0")}</span><span>${escape(step.title)}</span><span class="brief-step-check" aria-hidden="true"></span></button></li>`).join("")}<li><button type="button" class="brief-step-link" data-brief-review-link><span class="brief-step-number">${String(briefSteps.length + 1).padStart(2, "0")}</span><span>Review & send</span></button></li></ol></nav></details><details id="brief-draft-settings" class="brief-draft"><summary>Save or reset your brief</summary><label class="brief-draft-label"><input id="brief-save-draft" type="checkbox"><span>Save my answers on this device</span></label><p id="brief-draft-status">Optional. Files are never saved on this device by the form. Use a private device.</p><button id="brief-remove-draft" class="brief-text-button" type="button" hidden>Remove saved draft</button><button id="brief-clear" class="brief-text-button" type="button">Start over</button><div id="brief-clear-confirm" class="brief-clear-confirm" hidden><p>Clear your answers and selected files?</p><button id="brief-clear-yes" type="button" class="brief-button brief-button-secondary">Yes, clear this brief</button><button id="brief-clear-no" type="button" class="brief-text-button">Keep my answers</button></div></details></aside>
      <div class="brief-main"><div class="brief-progress"><div><p id="brief-progress-label">Step 1 of ${briefSteps.length + 1}</p><p id="brief-answered-count">Make it yours, one step at a time.</p></div><progress id="brief-progress-bar" max="${briefSteps.length + 1}" value="1" aria-label="Project brief progress"></progress></div><p id="brief-draft-restored" class="brief-notice" role="status" hidden></p><p id="brief-status" class="brief-notice" role="status" aria-live="polite" hidden></p><div class="brief-honey" aria-hidden="true"><label for="brief-company-url">Leave this field empty</label><input id="brief-company-url" name="company_url" tabindex="-1" autocomplete="off"></div>
      ${briefSteps.map((step, index) => {
        const stepFields = step.fields.map((id) => fields.get(id)).filter(Boolean);
        const basic = stepFields.filter((field) => !field.advanced);
        const advanced = stepFields.filter((field) => field.advanced);
        return `<section class="brief-panel" data-brief-step="${index}" aria-labelledby="brief-step-title-${index}"${index ? " hidden" : ""}><div class="brief-panel-heading"><p class="brief-eyebrow">${String(index + 1).padStart(2, "0")} / YOUR PROJECT, IN YOUR WORDS</p><h2 id="brief-step-title-${index}" tabindex="-1">${escape(step.title)}</h2><p>${escape(step.description)}</p></div><div class="brief-fields">${renderFields(basic)}</div>${step.id === "assets" ? `${renderMediaEmail()}${renderUploader()}` : ""}${advanced.length ? `<details class="brief-advanced"><summary><span>Go a little deeper</span><span class="brief-optional">${advanced.length} optional ${advanced.length === 1 ? "question" : "questions"}</span></summary><p class="brief-hint">These details can help shape a better first version. Answer what’s useful and leave the rest.</p><div class="brief-fields">${renderFields(advanced)}</div></details>` : ""}<div class="brief-panel-footer"><p><span aria-hidden="true">↳</span> You don’t need a finished plan.</p></div></section>`;
      }).join("")}
      <section id="brief-review" class="brief-panel brief-review" aria-labelledby="brief-review-title" hidden><div class="brief-panel-heading"><p class="brief-eyebrow">ONE LAST LOOK</p><h2 id="brief-review-title" tabindex="-1">This is your starting point.</h2><p>Check your answers and files. Nothing has been sent yet. This is an enquiry, not a booking or a commitment to a project.</p></div><div id="brief-review-content"></div><div class="brief-consent"><label for="brief-consent"><input id="brief-consent" type="checkbox" required aria-describedby="brief-consent-error"><span>I agree to send these details and files to 4u Digital so you can review my project and reply to me. <a href="../privacy/" target="_blank" rel="noopener noreferrer">Privacy details ↗</a></span></label><p id="brief-consent-error" class="brief-field-error" hidden></p></div><p class="brief-send-note">Your complete brief goes directly to <strong>admin@customtechbuilt4u.com</strong>. You won’t need to open an email app.</p></section>
      <div class="brief-question-tools"><button id="brief-review-early" class="brief-text-button" type="button">I’ve shared enough — finish up</button><label><input id="brief-extra-questions" type="checkbox"> Include extra detail questions</label></div><div id="brief-navigation" class="brief-navigation"><button id="brief-back" class="brief-button brief-button-secondary" type="button" hidden>← Back</button><div class="brief-navigation-next"><button id="brief-no-preference" class="brief-text-button" type="button" hidden>No preference</button><button id="brief-skip" class="brief-text-button" type="button" hidden>Skip for now</button><button id="brief-return-review" class="brief-button brief-button-secondary" type="button" hidden>Back to review</button><button id="brief-next" class="brief-button brief-button-primary" type="button">Continue <span aria-hidden="true">→</span></button><button id="brief-send" class="brief-button brief-button-primary" type="submit" hidden>Send my project brief <span aria-hidden="true">↗</span></button></div></div><p class="brief-bottom-note">Prefer to talk it through? <a href="https://briefbooth.com/book/4u-digital" data-booking-link target="_blank" rel="noopener noreferrer">Book a consultation ↗</a></p></div>
    </form><section id="brief-success" class="brief-success" tabindex="-1" aria-labelledby="brief-success-title" hidden><span class="brief-success-symbol" aria-hidden="true">✓</span><p class="brief-eyebrow">YOUR NEXT CHAPTER</p><h2 id="brief-success-title"></h2><p id="brief-success-message"></p><p id="brief-reference" class="brief-reference"></p><p>I’ll review what you’ve shared and get back to you using your contact email. Scope, timing, and price are agreed together before work starts.</p><p class="brief-already-booked">Already booked a consultation? You don’t need to book again. This planner simply adds context for our conversation.</p><div class="brief-success-actions"><a class="brief-button brief-button-primary" href="https://briefbooth.com/book/4u-digital" data-booking-link target="_blank" rel="noopener noreferrer">Book a consultation ↗</a><a class="brief-button brief-button-secondary" href="../work/">Explore the work →</a><button id="brief-success-download" class="brief-text-button" type="button">Download my brief</button></div><div class="brief-success-media"><h3>Show me your world.</h3><p>Send photos and videos of you performing, your restaurant, products, space, or anything else related to your project. The more relevant photos, the better.</p><a id="brief-success-media-email" class="brief-button brief-button-primary" href="mailto:admin@customtechbuilt4u.com">Send photos & videos ↗</a><p class="brief-hint">Opens your email to admin@customtechbuilt4u.com with your project and brief reference ready. Attach your photos there, or include a view-only folder link for a larger collection.</p></div></section>
    <noscript><p class="brief-hint">Tell me what your business does, what you need to work better, and any design ideas or examples. Unanswered questions are welcome.</p></noscript>
  </section>`;
}
