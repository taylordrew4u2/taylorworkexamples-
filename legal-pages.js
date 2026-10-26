import { legalBusiness, websiteTerms } from "./legal-content.js";
import { clientCare } from "./client-care.js";
import { launchOfferPaymentTerms, launchOfferContentChangeTerms } from "./seo-offer.js";
import { escape } from "./render-projects.js";

// Server-rendered policies: native links work without scripts or extra services.
export function renderLegalPages({ frame, intro, local }) {
  const emailLink = (route, label = legalBusiness.email) => `<a class="text-link" href="mailto:${legalBusiness.email}">${escape(label)}</a>`;
  const links = [
    ["/privacy/", "Privacy policy"],
    ["/terms/", "Website terms"],
    ["/guarantee/", "Guarantee, refunds & support"],
  ];
  const render = (page, sections) => {
    const contents = `<nav class="legal-toc" aria-label="On this page"><h2>On this page</h2><ol>${sections.map(({ id, heading }) => `<li><a href="#${escape(id)}">${escape(heading)}</a></li>`).join("")}</ol></nav>`;
    const body = sections.map(({ id, heading, paragraphs = [], extra = "" }) => `<section class="page-section legal-section" id="${escape(id)}" tabindex="-1"><h2>${escape(heading)}</h2>${paragraphs.map((paragraph) => `<p>${escape(paragraph)}</p>`).join("")}${extra}</section>`).join("");
    const related = `<nav class="legal-related" aria-label="Related policies"><h2>Related policies</h2>${links.filter(([route]) => route !== page.path).map(([route, label]) => `<a href="${local(page.path, route.slice(1))}">${escape(label)} <span aria-hidden="true">→</span></a>`).join("")}</nav>`;
    return { ...page, legal: true, modified: legalBusiness.updated, breadcrumbs: [{ name: page.label, path: page.path }], html: frame({ ...page, legal: true, breadcrumbs: [{ name: page.label, path: page.path }] },
      intro("4u Digital · POLICIES", page.heading, page.summary) +
      `<div class="legal-business"><p>4u Digital is operated by <strong>${escape(legalBusiness.name)}</strong>.</p><p>Last updated <time datetime="${legalBusiness.updated}">October 26, 2026</time></p></div>` +
      `<div class="legal-layout">${contents}<div class="legal-body">${body}${related}</div></div>`),
    };
  };
  const privacy = {
    path: "/privacy/", label: "Privacy policy", title: "Privacy Policy | 4u Digital", heading: "Privacy policy.",
    description: "How TaylorDrew4u LLC, operating as 4u Digital, handles project inquiries, private planner answers and uploads, device drafts, and consultation links.",
    summary: "What happens to your information when you explore 4u Digital, email an inquiry, share a project brief, or follow a consultation link.",
  };
  const privacySections = [
    { id: "booking-and-inquiries", heading: "Bookings and email inquiries.", paragraphs: [
      "Booking links open the 4u Digital booking page on briefbooth.com in a new tab. You enter your consultation and scheduling details there. This portfolio does not submit a booking form or receive those details through its own form. Review the information and policies provided by BriefBooth before submitting your booking.",
      "General project inquiry links prepare an email to admin@customtechbuilt4u.com. You choose whether to send it through your email service.",
      "Inquiry drafts include the public 4u Digital page where the request began. This helps 4u Digital understand what interested you. The page reference contains no search terms, tracking parameters, or form details.",
    ] },
    { id: "project-planner", heading: "Your private project planner.", paragraphs: [
      "The project planner sends your answers and optional reference files to 4u Digital only when you choose Send my project brief. Supabase processes the submission and Brevo sends it to admin@customtechbuilt4u.com through the business email service. Briefs are private and are not published in the portfolio.",
      "Server copies of answers are retained for up to 30 days. Upload copies are removed after the email provider accepts the message; uploads awaiting delivery are retained for up to seven days. Email copies can remain in the business mailbox for project correspondence. You can request removal by emailing admin@customtechbuilt4u.com.",
      "Saving a draft on your device is optional. Device drafts do not contain your uploaded files, and can be cleared in the planner. Do not submit passwords, payment-card details, private customer records or material you do not have permission to share. We use limited submission counts and a temporary, hashed network identifier to reduce automated abuse, not to track browsing.",
    ], extra: `<a class="text-link" href="${local(privacy.path, "project-brief/")}">View the optional project planner <span aria-hidden="true">→</span></a>` },
    { id: "kickoff-brief", heading: "Your existing-client kickoff brief.", paragraphs: [
      "The project kickoff form keeps your answers in the current browser tab while you fill it out. It does not submit them to 4u Digital’s server or save them in browser storage. Leaving or refreshing the page can clear your answers.",
      "Reviewing the brief does not send it. You can open a draft in your email app, copy it to your clipboard, or download a text file to your device. 4u Digital receives the brief only when you send the email to admin@customtechbuilt4u.com. Long briefs can be copied or downloaded for use with your email service.",
    ] },
    { id: "cookies-and-storage", heading: "Cookies, device storage and site access.", paragraphs: [
      "Inquiry emails include a reference to the public page where your request began. 4u Digital uses that reference to understand which services and projects interested you.",
      "Visitor and contact-click analytics are disabled. This portfolio does not collect your project description, booking details, email body, or search input for analytics. It adds no analytics cookies or visitor identifiers. For email inquiries and kickoff briefs, you choose whether to send your draft. Consultation details entered on BriefBooth are handled through its booking process.",
      "The optional planner draft uses local storage on your device. It is separate from submitting a brief and can be cleared from the planner. Vercel hosts the primary site, and GitHub Pages hosts the legacy portfolio address. Hosting infrastructure processes technical connection information, such as IP addresses and request details, to deliver and protect the site.",
    ] },
    { id: "contact", heading: "Questions or requests about your information.", paragraphs: [
      "TaylorDrew4u LLC is responsible for the personal information you submit to 4u Digital through this site. Email admin@customtechbuilt4u.com to ask about your information, request a correction, or request removal. Information you choose to send by email is handled through the business email service.",
    ], extra: emailLink(privacy.path, "Email a privacy question or request") },
  ];
  const terms = { ...websiteTerms, label: "Website terms" };
  const termsSections = websiteTerms.sections.map((section) => ({ ...section,
    extra: section.id === "published-promises" ? `<a class="text-link" href="${local(terms.path, "guarantee/")}">Read the guarantee, refunds &amp; support policy <span aria-hidden="true">→</span></a>` : section.id === "submissions" ? `<a class="text-link" href="${local(terms.path, "privacy/")}">How project information is handled <span aria-hidden="true">→</span></a>` : section.id === "updates" ? emailLink(terms.path, "Ask about these terms") : "",
  }));
  const guarantee = {
    path: "/guarantee/", label: "Guarantee, refunds & support", title: "Guarantee, Refunds & Support | 4u Digital", heading: "Guarantee, refunds & support.",
    description: "The existing 4u Digital 30-day money-back guarantee after launch, included reasonable changes, optional support, code ownership, and website-offer benefits.",
    summary: "Every project includes our 30-day money-back guarantee after the completed product launches. Here are the refund, change, support, and ownership commitments that apply to your project.",
  };
  const guaranteeSections = [
    ...clientCare.sections.map(({ id, title, text }) => ({ id, heading: title, paragraphs: [text], extra: id === "guarantee" ? emailLink(guarantee.path, "Email to request your refund") : "" })),
    { id: "website-offer-payment", heading: "Website-offer payments and design-review refund.", paragraphs: [
      "The following additional payment and design-review refund terms apply to the NYC website offer. They do not replace the 30-day money-back guarantee after launch.",
      launchOfferPaymentTerms,
    ], extra: `<a class="text-link" href="${local(guarantee.path, "offer/")}">Read the website offer, eligibility and full scope <span aria-hidden="true">→</span></a>` },
    { id: "website-offer-content", heading: "Extra content changes in the website offer.", paragraphs: [launchOfferContentChangeTerms] },
    { id: "contact", heading: "Questions about your project or a refund?", paragraphs: [
      "Email admin@customtechbuilt4u.com. The 30-day refund request period starts when your completed product launches, as described above. Our website terms do not limit the guarantee above or any statutory rights you have.",
    ], extra: emailLink(guarantee.path, "Email 4u Digital") },
  ];
  return [render(privacy, privacySections), render(terms, termsSections), render(guarantee, guaranteeSections)];
}
