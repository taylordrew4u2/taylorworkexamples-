import { escape } from "./render-projects.js";

export function renderKickoffForm() {
  const field = (name, label, { required = false, type = "text", limit = 160, multiline = false, hint = "", autocomplete = "off" } = {}) => {
    const id = `kickoff-${name}`;
    const attrs = `id="${id}" name="${name}" maxlength="${limit}"${required ? " required" : ""}${hint ? ` aria-describedby="${id}-help"` : ""}`;
    return `<div class="kickoff-field${multiline ? " kickoff-field-wide" : ""}"><label for="${id}">${escape(label)}${required ? ' <span aria-hidden="true">*</span>' : ""}</label>${multiline ? `<textarea ${attrs} rows="3"></textarea>` : `<input ${attrs} type="${type}" autocomplete="${autocomplete}" />`}${hint ? `<p id="${id}-help" class="kickoff-hint">${escape(hint)}</p>` : ""}</div>`;
  };
  return `<form id="kickoff-form" class="kickoff-form" aria-label="Project kickoff brief" hidden>
    <div class="kickoff-form-intro"><p class="eyebrow">EXISTING CLIENTS · AGREED PROJECT DETAILS</p><h2>Record what we’ve agreed.</h2><p>Use this after we’ve discussed working together. Review the details, then email them when ready. Fields marked * are required. Everything else can be worked through together.</p></div>
    <fieldset class="kickoff-group"><legend><span class="kickoff-step" aria-hidden="true">01</span>Your business</legend><div class="kickoff-fields">
      ${field("company", "Business name", { required: true, autocomplete: "organization" })}
      ${field("contactName", "Your name", { required: true, autocomplete: "name" })}
      ${field("contactEmail", "Business email", { required: true, type: "email", limit: 254, autocomplete: "email" })}
      ${field("projectName", "Project name (optional)")}
    </div></fieldset>
    <fieldset class="kickoff-group"><legend><span class="kickoff-step" aria-hidden="true">02</span>The first version</legend><p class="kickoff-group-help">Think about one useful task your customers or team should be able to finish.</p><div class="kickoff-fields">
      ${field("problem", "What needs to work better?", { required: true, multiline: true, limit: 1600, hint: "Who will use it, what do they do today, and what gets in the way?" })}
      ${field("workflow", "What should someone be able to do? (optional)", { multiline: true, limit: 1600, hint: "Describe one task from start to finish, such as requesting an appointment or placing an order." })}
      ${field("included", "Included in the first version (optional)", { multiline: true, limit: 1200 })}
      ${field("excluded", "Save for later (optional)", { multiline: true, limit: 1200, hint: "Features or ideas that can wait until another version." })}
      ${field("success", "How will we know it works? (optional)", { multiline: true, limit: 1200, hint: "For example: a customer requests an available appointment and staff can review it. We’ll agree the actual checks together." })}
      ${field("budget", "Budget range (optional)")}
      ${field("targetDate", "Target date or timing (optional)")}
    </div></fieldset>
    <fieldset class="kickoff-group"><legend><span class="kickoff-step" aria-hidden="true">03</span>Decisions and feedback</legend><div class="kickoff-fields">
      ${field("approver", "Who gives final approval? (optional)", { multiline: true, limit: 1200, hint: "Name the person who can approve scope, price, and the finished work." })}
      ${field("feedback", "How should we handle feedback? (optional)", { multiline: true, limit: 1200, hint: "Who gathers comments, and where should we record decisions and the next review?" })}
    </div></fieldset>
    <fieldset class="kickoff-group"><legend><span class="kickoff-step" aria-hidden="true">04</span>Assets and handover</legend><div class="kickoff-fields">
      ${field("assets", "Content and assets (optional)", { multiline: true, limit: 1200, hint: "List any copy, images, menus, or brand files, who will supply and approve them, and their permitted use." })}
      ${field("accounts", "Existing tools and account owners (optional)", { multiline: true, limit: 1200, hint: "List tools and account owners only. Arrange access separately; leave out passwords, payment details, and customer records." })}
      ${field("handover", "Handover and ongoing responsibilities (optional)", { multiline: true, limit: 1200, hint: "What needs to be handed over, and who will handle launch, content updates, or agreed support?" })}
    </div></fieldset>
    <div class="kickoff-form-actions"><button class="button button-dark" type="submit">Review your brief <span aria-hidden="true">↘</span></button><p>Answers aren’t saved after leaving or refreshing the page. Copy or download the finished brief to keep it. Scope, price, and a start date are agreed separately.</p></div>
  </form>
  <p id="kickoff-status" class="kickoff-status" role="status" aria-live="polite"></p>
  <section id="kickoff-review" class="kickoff-review" aria-labelledby="kickoff-review-title" hidden><p class="eyebrow">REVIEW BEFORE YOU SEND</p><h2 id="kickoff-review-title">Your brief is ready to review.</h2><p>Check the details below. Open the email draft and send it from your email app to <strong>admin@customtechbuilt4u.com</strong>, or copy or download the brief for webmail.</p>
    <label for="kickoff-summary">Your project brief</label><textarea id="kickoff-summary" rows="14" readonly spellcheck="false"></textarea>
    <p id="kickoff-email-limit" class="kickoff-hint" hidden>This brief is long for an email link. Copy or download it, then paste or attach it in an email to admin@customtechbuilt4u.com.</p>
    <div class="kickoff-review-actions"><a id="kickoff-email" class="button button-dark" href="mailto:admin@customtechbuilt4u.com">Open email draft <span aria-hidden="true">↗</span></a><button id="kickoff-copy" class="button button-outline" type="button">Copy brief</button><button id="kickoff-download" class="text-link" type="button">Download brief</button><a id="kickoff-edit" class="text-link" href="#kickoff-form">Edit your answers <span aria-hidden="true">↑</span></a></div>
    <p class="kickoff-review-note">Your brief has not been sent from this page. I’ll reply by email to work through the details with you.</p>
  </section>`;
}
