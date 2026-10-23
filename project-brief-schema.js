// Shared browser/server definitions for a project brief. This is not an appointment form.
const choice = (value, label) => ({ value, label });
const unsure = choice("not_sure", "Not sure yet — help me decide");
const website = ["website", "mixed", "unsure"];
const app = ["app", "mixed", "unsure"];
const software = ["software", "mixed", "unsure"];

const definitions = [
  {
    id: "idea", title: "Start with your idea", description: "A rough idea is enough. Describe the business problem in your own words; you can skip anything you have not decided.",
    fields: [
      { id: "projectType", label: "What are you thinking of building?", type: "radio", required: true, options: [choice("website", "A website"), choice("app", "An app"), choice("software", "Custom software or an internal tool"), choice("mixed", "A combination of these"), choice("unsure", "I'm not sure — I need help working it out")] },
      { id: "businessName", label: "What is your business or organization called?", type: "text", maxLength: 160, placeholder: "A working name is fine." },
      { id: "idea", label: "What would you like to build or make easier?", type: "textarea", maxLength: 3000, hint: "Tell me the problem, the idea, or the thing that frustrates you. No technical language needed." },
      { id: "audience", label: "Who will use it, and what will they need from it?", type: "textarea", maxLength: 1800, placeholder: "Customers, staff, members, patients, students, or someone else…" },
      { id: "outcome", label: "What would make this project a success for you?", type: "textarea", maxLength: 1800, hint: "For example: more enquiries, less admin, easier ordering, or giving customers something they cannot do today." },
      { id: "projectName", label: "Does the project have a name?", type: "text", maxLength: 160, advanced: true },
    ],
  },
  {
    id: "experience", title: "Picture someone using it", description: "Walk through one real situation. This often reveals more than a long list of features.",
    fields: [
      { id: "devices", label: "Where should people be able to use it?", type: "checkboxes", options: [choice("phone", "On a phone"), choice("tablet", "On a tablet"), choice("desktop_browser", "In a computer's web browser"), choice("desktop_app", "As an installed computer app"), choice("shared_screen", "On a shared screen, kiosk, or display"), unsure] },
      { id: "workflow", label: "What should someone be able to do, from beginning to end?", type: "textarea", maxLength: 3000, placeholder: "A customer opens the site, finds a service, sends a request, and receives an update…", hint: "Include what happens before and after they use it, including anything your team does by hand." },
      { id: "userRoles", label: "Will different people need different views or permissions?", type: "textarea", maxLength: 1800, placeholder: "Customers see their own orders; staff manage requests; the owner sees reports…" },
      { id: "experiencePriorities", label: "What should using it feel like?", type: "checkboxes", options: [choice("simple", "Very simple and easy to learn"), choice("fast", "Fast for repeat tasks"), choice("guided", "Guided, with helpful explanations"), choice("visual", "Visual, with photos or previews"), choice("powerful", "Detailed controls for experienced users"), unsure] },
      { id: "accessibility", label: "Are there accessibility, reading, or ease-of-use needs to plan for?", type: "textarea", maxLength: 1800, advanced: true, hint: "For example: screen readers, keyboard use, larger text, captions, clear language, or an audience that finds technology difficult." },
      { id: "languages", label: "Does it need other languages, currencies, time zones, or regional formats?", type: "textarea", maxLength: 1200, advanced: true },
    ],
  },
  {
    id: "project", title: "Shape your project", description: "Choose only what sounds useful. These are conversation starters, not commitments to a bigger project.",
    fields: [
      { id: "websitePurpose", label: "What should your website help people do?", type: "checkboxes", projectTypes: website, options: [choice("learn", "Understand the business and services"), choice("contact", "Get in touch or request a quote"), choice("book", "Reach a booking service"), choice("buy", "Buy products or place orders"), choice("visit", "Find a location, hours, or directions"), choice("explore", "Browse work, menus, listings, or a catalog"), unsure] },
      { id: "websitePages", label: "Which pages or content areas might you need?", type: "checkboxes", projectTypes: website, options: [choice("home", "Home"), choice("about", "About the business or team"), choice("services", "Services and pricing"), choice("products", "Products or shop"), choice("gallery", "Gallery, work, or portfolio"), choice("menu", "Menu"), choice("contact", "Contact and location"), choice("faq", "Common questions"), choice("articles", "Articles, news, or resources"), choice("other", "Something else — describe it in your priorities"), unsure] },
      { id: "websiteFeatures", label: "Does the website need anything beyond information pages?", type: "checkboxes", projectTypes: website, options: [choice("forms", "Enquiry or quote forms"), choice("booking", "A booking connection or custom booking flow"), choice("payments", "Payments or checkout"), choice("members", "Customer accounts or a members area"), choice("updates", "A way for me or my staff to update content"), choice("search", "Search or filtering"), choice("simple", "Just a good website for now"), unsure] },
      { id: "searchLocations", label: "What do customers search for, and which places do you serve?", type: "textarea", maxLength: 1800, projectTypes: website, advanced: true, hint: "Share services, neighborhoods, cities, or the kinds of searches you want the site to answer. Search placement cannot be guaranteed." },
      { id: "appPlatforms", label: "Where would you like the app to run?", type: "checkboxes", projectTypes: app, options: [choice("ios", "iPhone / iPad"), choice("android", "Android"), choice("web", "In a web browser"), choice("mac", "Mac"), choice("windows", "Windows"), unsure] },
      { id: "appDistribution", label: "How should people get access to the app?", type: "radio", projectTypes: app, options: [choice("public", "A public app people can download"), choice("private", "Private access for customers, members, or staff"), choice("link", "A link they can open in their browser"), unsure], hint: "App store and third-party requirements can affect the plan; we can discuss those before agreeing scope." },
      { id: "appCapabilities", label: "Could the app need any device features?", type: "checkboxes", projectTypes: app, advanced: true, options: [choice("camera", "Camera or photo library"), choice("notifications", "Notifications"), choice("location", "Maps or location"), choice("offline", "Useful when the internet is unavailable"), choice("audio", "Audio, microphone, or media playback"), choice("bluetooth", "Bluetooth or connected equipment"), choice("none", "No special device features"), unsure] },
      { id: "existingTools", label: "What tools, spreadsheets, or manual processes are you using now?", type: "textarea", maxLength: 2400, projectTypes: software, hint: "Explain what works and where things get slow, duplicated, or confusing." },
      { id: "softwareTasks", label: "Which tasks should the software handle or connect?", type: "textarea", maxLength: 2400, projectTypes: software, placeholder: "Track inventory, assign jobs, organize records, prepare reports, or keep customers updated…" },
      { id: "softwareAccess", label: "How should your team access the software?", type: "radio", projectTypes: software, options: [choice("browser", "Through a web browser"), choice("installed", "Installed on their computers"), choice("mobile", "On phones or tablets"), choice("multiple", "Across several of these"), unsure] },
      { id: "reports", label: "What should you be able to search, measure, export, or report on?", type: "textarea", maxLength: 2000, projectTypes: software, advanced: true },
    ],
  },
  {
    id: "features", title: "Decide what matters most", description: "A focused first version is often the clearest starting point. You do not have to choose every possibility.",
    fields: [
      { id: "priorities", label: "What are your must-haves, nice-to-haves, and things that can wait?", type: "textarea", maxLength: 3000, hint: "Even one must-have is useful. Mention anything from the previous choices you want to explain." },
      { id: "featureIdeas", label: "Would any of these help your customers or team?", type: "checkboxes", options: [choice("status", "Track the status of a request or order"), choice("reminders", "Send reminders or progress updates"), choice("uploads", "Collect files or photos"), choice("approvals", "Let someone approve or review work"), choice("dashboard", "Bring important information into one dashboard"), choice("automation", "Reduce repetitive admin"), choice("none", "None of these for now"), unsure], hint: "Select only what solves a real problem. These choices help us discuss options, not add features automatically." },
      { id: "integrations", label: "Does it need to work with another tool or service?", type: "textarea", maxLength: 2200, placeholder: "Your payment provider, calendar, booking tool, email system, CRM, or existing software…", hint: "Names are enough. Do not share passwords, API keys, or private account access." },
      { id: "dataImport", label: "Do existing records, products, accounts, or files need to be moved across?", type: "textarea", maxLength: 1800, advanced: true, hint: "Describe the amount and format in general terms. Do not upload private customer records." },
      { id: "sensitiveData", label: "Will it handle personal, financial, health, or other sensitive information?", type: "textarea", maxLength: 1500, advanced: true, hint: "Describe the category only. Do not include real sensitive records, card details, or medical information." },
      { id: "permissions", label: "Who should be allowed to view, edit, approve, delete, or download information?", type: "textarea", maxLength: 1800, advanced: true },
      { id: "edgeCases", label: "What should happen when something changes or goes wrong?", type: "textarea", maxLength: 2000, advanced: true, placeholder: "A cancellation, refund, duplicate request, missed payment, unavailable product, or lost internet connection…" },
    ],
  },
  {
    id: "design", title: "Make it feel like your business", description: "Your project can use any colors you like. Share preferences, references, and things you definitely want to avoid.",
    fields: [
      { id: "brandReady", label: "Do you already have a visual brand or a design to work from?", type: "radio", options: [choice("brand", "I have a logo, colors, or brand guidelines"), choice("design", "I have designs, sketches, or Figma files"), choice("refresh", "I have something, but want to refresh it"), choice("start", "I'm starting from scratch"), unsure] },
      { id: "brandMood", label: "How should it look and feel?", type: "checkboxes", options: [choice("clean", "Clean and minimal"), choice("warm", "Warm and welcoming"), choice("bold", "Bold and expressive"), choice("premium", "Refined and premium"), choice("playful", "Playful and friendly"), choice("professional", "Calm and professional"), choice("practical", "Practical and information-focused"), unsure] },
      { id: "colors", label: "Which colors would you like to use?", type: "colors", maxLength: 500, placeholder: "Color names, hex codes, or “help me choose”…", hint: "For example: forest green and cream, #163D2A, or colors from a reference image." },
      { id: "avoidColors", label: "Are there colors or visual styles you do not want?", type: "text", maxLength: 500 },
      { id: "designReferences", label: "Are there websites, apps, or brands you like? What do you like about them?", type: "textarea", maxLength: 2500, placeholder: "Paste links and tell me about the layout, colors, photos, motion, or feeling you like." },
      { id: "logoTypography", label: "Any preferences for your logo, fonts, icons, or photography?", type: "textarea", maxLength: 1800, advanced: true },
      { id: "designDislikes", label: "What makes a website or app frustrating for you or your customers?", type: "textarea", maxLength: 1800, advanced: true, placeholder: "Tiny text, clutter, too many clicks, distracting movement, or anything else…" },
    ],
  },
  {
    id: "assets", title: "Share your content and references", description: "Add photos, a logo, screenshots, or other useful references here. Only upload material you are allowed to share, without private customer information.",
    fields: [
      { id: "contentReady", label: "How much of your content is ready?", type: "radio", options: [choice("ready", "Most of it is ready"), choice("some", "Some is ready, some needs work"), choice("help", "I need help deciding what content is needed"), choice("later", "I will provide it later"), unsure] },
      { id: "assetDetails", label: "What files or content do you already have, and what do we still need?", type: "textarea", maxLength: 2200, placeholder: "Logo, product photos, service descriptions, prices, menus, written copy, sketches, or designs…" },
      { id: "contentHelp", label: "Where might you want help with content?", type: "checkboxes", options: [choice("structure", "Choosing pages and organizing information"), choice("writing", "Writing or refining text"), choice("images", "Choosing or preparing images"), choice("products", "Organizing products, services, or menus"), choice("migration", "Moving content from an existing site"), choice("none", "I can supply the content"), unsure] },
      { id: "assetCaptions", label: "What should I know about the files you are sharing?", type: "textarea", maxLength: 2200, advanced: true, hint: "Mention filenames, what they show, where you want them used, and whether they are inspiration or final assets." },
      { id: "contentSources", label: "Is there an existing site or a shareable folder with more material?", type: "textarea", maxLength: 1800, advanced: true, hint: "Paste view-only links you are comfortable sharing. Do not provide passwords or access tokens." },
      { id: "assetRights", label: "Do you know who owns or licenses the content and images?", type: "radio", advanced: true, options: [choice("owned", "My business owns them or has permission to use them"), choice("mixed", "Some may need permission or a license"), choice("new", "We need to create or find suitable material"), unsure] },
    ],
  },
  {
    id: "delivery", title: "Plan around your priorities", description: "A budget range or rough timeline helps shape useful options. It is fine to leave either open for discussion.",
    fields: [
      { id: "budgetRange", label: "Is there a budget range you would like me to work within?", type: "radio", options: [choice("under_1500", "Under $1,500"), choice("1500_3000", "$1,500–$3,000"), choice("3000_6000", "$3,000–$6,000"), choice("6000_12000", "$6,000–$12,000"), choice("12000_plus", "$12,000+"), choice("discuss", "I would like to discuss what is realistic"), unsure], hint: "This is a planning guide, not a quote. Scope and costs would be agreed before work starts." },
      { id: "timing", label: "What is driving your timeline?", type: "radio", options: [choice("exploring", "I'm exploring options"), choice("ready", "I am ready to start planning"), choice("deadline", "There is a specific event or deadline"), choice("flexible", "The timing is flexible"), unsure] },
      { id: "targetDate", label: "Is there a target launch date or an important deadline?", type: "text", maxLength: 350, placeholder: "A date, a season, or an event — and whether it is flexible." },
      { id: "decisionProcess", label: "Who will be involved in decisions and feedback?", type: "textarea", maxLength: 1800, placeholder: "Just me, my business partner, a manager, a wider team…" },
      { id: "budgetNotes", label: "Are there budget constraints or ongoing costs you want to discuss?", type: "textarea", maxLength: 1800, advanced: true, hint: "For example: an existing subscription to replace, payment milestones, or a limit on hosting costs." },
      { id: "reviewStyle", label: "How would you prefer to review work as it develops?", type: "radio", advanced: true, options: [choice("guided", "Walk me through it and help me decide"), choice("hands_on", "Give me something I can try and comment on"), choice("design", "Review designs first, then a working version"), choice("flexible", "Recommend a process for my project"), unsure] },
      { id: "ongoingSupport", label: "What might you need after launch?", type: "checkboxes", advanced: true, options: [choice("handover", "Code, deployment, and a clear handover"), choice("training", "Help learning how to manage it"), choice("content", "Occasional content updates"), choice("support", "Discuss optional maintenance or support"), choice("roadmap", "Plan future features"), unsure] },
    ],
  },
  {
    id: "details", title: "The things that are easy to miss", description: "These prompts can uncover important details. Answer the ones that matter to your project and leave the rest for our conversation.",
    fields: [
      { id: "successMeasures", label: "How will we know the finished product does what you need?", type: "textarea", maxLength: 2200, hint: "Describe a few things you want to test, or the result you want your customers or team to achieve." },
      { id: "securityPrivacy", label: "Are there business rules, privacy expectations, or approval requirements we should discuss?", type: "textarea", maxLength: 1800, hint: "A general description is enough. Specialist legal, regulatory, or security needs should be identified during planning." },
      { id: "anythingElse", label: "What have I not asked that you wish I knew?", type: "textarea", maxLength: 3000, placeholder: "A worry, a non-negotiable, a small detail, or an idea you are not sure is possible…" },
      { id: "ownership", label: "Do you already own a domain, hosting account, or app store account?", type: "textarea", maxLength: 1500, advanced: true, hint: "List account types and who manages them, without sharing credentials. You own the custom code built for your project; access and deployment handover are agreed with you." },
      { id: "constraints", label: "Are there existing systems, physical spaces, policies, or equipment the project must fit?", type: "textarea", maxLength: 1800, advanced: true, placeholder: "A reception desk, shared tablet, shop floor, an older computer, your company processes…" },
      { id: "futurePlans", label: "If the first version works well, what might you want to add later?", type: "textarea", maxLength: 1800, advanced: true },
    ],
  },
  {
    id: "contact", title: "Where can I reply?", description: "Review your answers before you send them to 4u Digital. This sends a project brief; it does not book an appointment or commit you to a project.",
    fields: [
      { id: "contactName", label: "Your name", type: "text", required: true, maxLength: 160 },
      { id: "contactEmail", label: "Your email address", type: "email", required: true, maxLength: 254, hint: "Use the address where you would like a reply about your project." },
      { id: "businessWebsite", label: "An existing business website, if you have one", type: "url", maxLength: 2048, placeholder: "yourbusiness.com", advanced: true },
      { id: "replyContext", label: "Anything that would help me respond to your brief?", type: "textarea", maxLength: 1200, advanced: true, placeholder: "Questions you would like answered first, pronunciation of your name, or who to include in the next conversation…" },
    ],
  },
];

function freezeField(field, stepId) {
  const options = field.options?.map((option) => Object.freeze({ ...option }));
  return Object.freeze({
    ...field, stepId,
    ...(options ? { options: Object.freeze(options) } : {}),
    ...(field.projectTypes ? { projectTypes: Object.freeze([...field.projectTypes]) } : {}),
  });
}

export const briefFields = Object.freeze(definitions.flatMap((step) => step.fields.map((field) => freezeField(field, step.id))));
export const briefSteps = Object.freeze(definitions.map(({ fields, ...step }) => Object.freeze({ ...step, fields: Object.freeze(fields.map((field) => field.id)) })));
export const maxBriefLength = 60000;

const fieldsById = new Map(briefFields.map((field) => [field.id, field]));
const emailPattern = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/u;

function invalid(field, message, ErrorType = TypeError) {
  return Object.assign(new ErrorType(message), { field: typeof field === "string" ? field : field.id });
}

function normalizeText(field, value) {
  if (typeof value !== "string") throw invalid(field, `${field.label} must be text.`);
  const limit = field.maxLength ?? 3000;
  if (value.length > limit) throw invalid(field, `${field.label} must be ${limit} characters or fewer.`, RangeError);
  const controls = field.type === "textarea" ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u : /[\u0000-\u001F\u007F-\u009F]/u;
  if (controls.test(value)) throw invalid(field, `${field.label} contains an unsupported control character.`);
  if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value)) {
    throw invalid(field, `${field.label} contains malformed text. Please remove or retype the affected character.`);
  }
  const text = value.replace(/\r\n?/gu, "\n").trim();
  if (!text) return "";
  if (field.type === "email") {
    const local = text.split("@")[0];
    if (!emailPattern.test(text) || local.length > 64 || local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
      throw invalid(field, "Please enter a valid email address so I can reply.");
    }
  }
  if (field.type === "url") {
    let url;
    try { url = new URL(/^[a-z][a-z\d+.-]*:/iu.test(text) ? text : `https://${text}`); }
    catch { throw invalid(field, "Please use a website address such as yourbusiness.com."); }
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || /\s/u.test(text) || !url.hostname.includes(".")) {
      throw invalid(field, "Please use a public http or https website address, without a password.");
    }
    if (url.href.length > limit) throw invalid(field, `${field.label} must be ${limit} characters or fewer.`, RangeError);
    return url.href;
  }
  return text;
}

/** Validate all supplied values, then keep only answered questions for the selected project type. */
export function normalizeBrief(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input) || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) {
    throw new TypeError("Your project brief must be a set of answers.");
  }
  const normalized = {};
  let totalLength = 0;
  for (const key of Object.keys(input)) {
    if (!fieldsById.has(key)) throw invalid(key, "Your brief contains an unknown question. Please reload the page and try again.");
  }
  for (const field of briefFields) {
    if (!Object.hasOwn(input, field.id)) {
      if (field.required) throw invalid(field, `Please complete ${field.label.toLowerCase()}.`);
      continue;
    }
    const value = input[field.id];
    let answer;
    if (field.type === "checkboxes") {
      if (!Array.isArray(value)) throw invalid(field, `${field.label} must be a list of choices.`);
      const allowed = new Set(field.options.map((option) => option.value));
      if (value.length > allowed.size || new Set(value).size !== value.length || value.some((entry) => typeof entry !== "string" || !allowed.has(entry))) {
        throw invalid(field, `${field.label} contains an unsupported or repeated choice.`);
      }
      // Stable order makes reviews and email summaries independent of click order.
      answer = field.options.filter((option) => value.includes(option.value)).map((option) => option.value);
    } else {
      answer = normalizeText(field, value);
      if (field.type === "radio" && answer && !field.options.some((option) => option.value === answer)) throw invalid(field, `${field.label} contains an unsupported choice.`);
    }
    if (field.required && !answer.length) throw invalid(field, `Please complete ${field.label.toLowerCase()}.`);
    totalLength += Array.isArray(answer) ? answer.join("").length : answer.length;
    if (totalLength > maxBriefLength) throw invalid(field, "Your brief is too long to send at once. Please shorten your answers or describe additional material in a shareable reference link.", RangeError);
    if (answer.length) normalized[field.id] = answer;
  }
  for (const field of briefFields) {
    if (field.projectTypes && !field.projectTypes.includes(normalized.projectType)) delete normalized[field.id];
  }
  return normalized;
}

/** Human-readable plain text. Escape this text separately before inserting it into HTML. */
export function formatBriefText(input = {}) {
  const answers = normalizeBrief(input);
  const sections = briefSteps.flatMap((step) => {
    const lines = step.fields.flatMap((id) => {
      if (!Object.hasOwn(answers, id)) return [];
      const field = fieldsById.get(id);
      const value = answers[id];
      const labelFor = (entry) => field.options?.find((option) => option.value === entry)?.label ?? entry;
      const display = Array.isArray(value) ? value.map((entry) => `- ${labelFor(entry)}`).join("\n") : labelFor(value);
      return [`${field.label}\n${display}`];
    });
    return lines.length ? [`${step.title}\n${"─".repeat(step.title.length)}\n\n${lines.join("\n\n")}`] : [];
  });
  return `4u Digital project brief\n\n${sections.join("\n\n")}`;
}
