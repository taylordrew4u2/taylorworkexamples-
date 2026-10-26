import { clientCare } from "../client-care.js";

const afterLaunchCare = `For 4u Digital projects: ${clientCare.changes.text} ${clientCare.support.text}`;

export const pricingNotes = [
  {
    slug: "hourly-vs-fixed-price-development",
    title: "Hourly or fixed price: how should a website be priced?",
    metaTitle: "Hourly vs Fixed-Price Development | 4u Digital",
    description: "Compare hourly, fixed-price, and retainer arrangements for a business website, including unclear scope, review points, and the work each can cover.",
    summary: "The right pricing arrangement depends on how clearly the work can be described and how often you expect to need changes.",
    intro: "Hourly and fixed-price development can both suit a business website. The useful question is how clearly the work can be described before it starts. A five-page site with supplied copy is a different pricing conversation from rebuilding a site whose content and features are still undecided.",
    sections: [
      {
        heading: "Hourly work needs useful checkpoints",
        paragraphs: [
          "Hourly work bills for time spent. It can fit an investigation, such as finding why an existing website form has stopped sending messages. The amount of work may be hard to judge until someone checks the current setup.",
          "Ask how time is recorded, when spending is reviewed, and what happens if the estimate changes. A checkpoint lets you decide whether to continue once the problem is better understood.",
        ],
      },
      {
        heading: "A fixed price needs a clear scope",
        paragraphs: [
          "A fixed price is easier to assess when the proposal describes the pages, content, functions, and review work included. For a small business site, that might mean service pages, supplied photographs, a contact form, and layouts for phones.",
          "Check the assumptions too. Who supplies the copy? Can staff edit it later? Does a booking button link to an existing service, or does the project include building a booking system? Those choices change the work.",
        ],
      },
      {
        heading: "Recurring work may suit a retainer",
        paragraphs: [
          "A retainer is a possible arrangement for repeated work, such as regular website updates. Its usefulness depends on what the recurring payment covers and whether the business has enough ongoing work to justify it.",
          "Ask about included work, availability, unused time, and larger requests. These are common pricing approaches to discuss; the proposal for your project should state the actual arrangement and its boundaries.",
        ],
      },
    ],
    faq: [
      {
        question: "Is fixed price always the safer choice?",
        answer: "It provides a price for the agreed work. Read the scope and assumptions carefully, because an unclear brief can still leave important parts of the website outside the proposal.",
      },
      {
        question: "Can different parts use different arrangements?",
        answer: "That is possible. Investigation might be handled separately from a defined build. Any combination should explain what each part covers before the work starts.",
      },
    ],
    serviceSlugs: ["website-development", "custom-software-development"],
    projectIds: ["PinsAndNeedlesComedyWebsite"],
    published: "2026-10-19",
    modified: "2026-10-19",
    topic: "pricing",
    format: "note",
    closing: "For a 4u Digital project discussion, bring your current website or a rough outline of the pages and functions you need.",
  },
  {
    slug: "why-website-quotes-vary",
    title: "Why can two quotes for a website be so different?",
    metaTitle: "Why Website Quotes Vary | 4u Digital",
    description: "Understand why website quotes differ by content, editing tools, forms, accounts, and launch work, then compare proposals against the same clear brief.",
    summary: "Two proposals can describe a website while including very different work. Compare the responsibilities behind the total before deciding.",
    intro: "A website quote can look surprisingly high or low beside another one. Start by checking whether both cover the same job. Even a request for a five-page business website leaves questions about writing, photographs, editing, forms, and the work needed to put the finished site online.",
    sections: [
      {
        heading: "Page count leaves out content work",
        paragraphs: [
          "Five pages of finished text and approved photographs are different from five pages that still need organizing and writing. A developer may also need to sort older material, resize images, or rebuild pages from an existing site.",
          "Write down what you already have and what needs creating. Identify who supplies service descriptions and checks business details. A proposal can then explain the content work included and what you need to provide.",
        ],
      },
      {
        heading: "Similar screens can hide different jobs",
        paragraphs: [
          "A contact form that sends an email is a smaller task than a private workspace where staff review requests and change their status. Both might begin with a page that looks like a simple form.",
          "Editing tools also need their own scope. Changing a phone number, adding services, and rearranging whole page layouts are different levels of control. Describe the updates you expect to make so each quote covers the same editing needs.",
        ],
      },
      {
        heading: "Compare launch and handover responsibilities",
        paragraphs: [
          "Check whether the proposal includes connecting the domain, reviewing phone layouts, checking forms, and explaining how to use any editing tools. If an existing site is being replaced, ask which pages and addresses need to carry over.",
          "Ongoing hosting and maintenance should also be identified. A lower build quote may leave more work with you. Use one written brief when requesting proposals, then ask about any missing item before comparing the totals.",
        ],
      },
    ],
    faq: [
      {
        question: "Does a higher quote mean a better website?",
        answer: "Price alone cannot tell you that. Review relevant work and ask how the proposed pages and functions solve your business needs. Clear scope makes that discussion more useful.",
      },
      {
        question: "What should a short website brief include?",
        answer: "Describe your business, intended visitors, required pages, and what visitors should do. Include your existing website, available content, editing needs, and any services the site must connect to.",
      },
    ],
    serviceSlugs: ["website-development", "web-app-development"],
    projectIds: ["PinsAndNeedlesComedyWebsite", "BriefBooth.com"],
    published: "2026-10-19",
    modified: "2026-10-19",
    topic: "pricing",
    format: "note",
    closing: "Bring that brief to a 4u Digital project discussion, even if some answers are still rough. The open questions help define the scope.",
  },
  {
    slug: "website-app-ongoing-costs",
    title: "What costs continue after a website or app launches?",
    metaTitle: "Website and App Ongoing Costs | 4u Digital",
    description: "Plan for domain renewals, hosting, business email, maintenance, and service accounts after launch, with clear ownership and responsibilities for each.",
    summary: "The build is one part of the budget. List the services and upkeep the finished website or app will need before agreeing the project.",
    intro: "A website can be finished while several costs continue. The domain still needs renewing, the site needs somewhere to run, and someone needs to maintain it. A small information site may have a short list. A website or app with accounts and shared records may depend on more services.",
    sections: [
      {
        heading: "List the services the website uses",
        paragraphs: [
          "Start with the domain, hosting, and any business email accounts. They may come from separate providers with separate renewals. Check what the business already owns before opening another account or moving an existing service.",
          "Some features also use service accounts for shared data or email notifications. Ask which services are necessary for the proposed website, who pays for them, and whether their costs depend on usage. Keep those costs visible beside the build price.",
        ],
      },
      {
        heading: "Define what maintenance means",
        paragraphs: [
          "Maintenance can include keeping software components current, checking a form after a service changes, or investigating a fault. Content updates are another kind of work. Replacing a photograph and adding a new staff approval process need different effort.",
          "Ask what ongoing work is included, what needs a separate request, and who handles it. A site that you can edit yourself still needs a plan for technical changes. Provider charges are identified separately from development and support.",
          afterLaunchCare,
        ],
      },
      {
        heading: "Keep account access understandable",
        paragraphs: [
          "Record which account controls each service, where renewal notices go, and who can make changes. A domain renewal sent to an old inbox is an avoidable administrative problem.",
          "If you already have a website, bring the hosting and domain information to the discussion. Confirm how business email is connected before changing the setup. This helps identify the ongoing services that can stay and the ones a new build would need.",
        ],
      },
    ],
    faq: [
      {
        question: "Will every website need the same services?",
        answer: "No. The services depend on what the site does. A public information site and an app with staff accounts can have different hosting, maintenance, and service account needs.",
      },
      {
        question: "Should ongoing costs appear in the proposal?",
        answer: "Ask for the expected services and maintenance responsibilities to be identified. Provider charges and future work can change, so check which costs are estimates and who receives each bill.",
      },
    ],
    serviceSlugs: ["website-development", "web-app-development", "app-development"],
    projectIds: ["PinsAndNeedlesComedyWebsite", "MyGigCalendar"],
    published: "2026-10-19",
    modified: "2026-10-26",
    topic: "pricing",
    format: "note",
    closing: "For a 4u Digital discussion, bring any existing domain, hosting, and email details alongside the website changes you want to make.",
  },
  {
    slug: "project-changes-and-pricing",
    title: "How do website changes affect a project price?",
    metaTitle: "Project Changes and Website Pricing | 4u Digital",
    description: "See how added pages, editing needs, and workflow changes affect website scope, and how a clear change discussion can keep project decisions practical.",
    summary: "A useful change request explains what should be different and why. Review its effect on the agreed work before deciding to add it.",
    intro: "Seeing an early website can reveal something the original brief missed. You might need another service page, a clearer inquiry form, or a way to update opening hours yourself. Changes are easier to discuss when the original scope is clear and the new request has a specific purpose.",
    sections: [
      {
        heading: "Describe the change as a visitor task",
        paragraphs: [
          "Instead of asking to make a page more useful, explain what a visitor needs to do. Perhaps customers need to choose a service before sending an inquiry. Include an example of the information you want to receive.",
          "That detail helps separate a wording adjustment from a change to how the website works. A new field may also need validation, an email update, and a check that the message reaches the right person.",
        ],
      },
      {
        heading: "Check what else the request touches",
        paragraphs: [
          "Adding a page can involve writing, navigation, phone layouts, and an editing screen. Adding staff accounts affects who can see or change information. The visible screen is only part of the request.",
          "Review the change against the agreed scope. Is it a correction to something already specified, a replacement for an existing feature, or additional work? The answer helps explain whether the price or planned sequence needs revisiting under the project's agreed arrangement.",
        ],
      },
      {
        heading: "Choose what belongs in this version",
        paragraphs: [
          "A useful idea can still wait. If the website's immediate job is explaining services and receiving inquiries, a private customer dashboard may belong in a later phase. Write it down so it can be discussed without quietly expanding the current build.",
          "Another option is to trade one planned feature for another, if the effort and dependencies allow it. Record the decision, updated scope, and any pricing effect before the changed work begins. Keep one current version of that agreement for everyone to refer to.",
        ],
      },
    ],
    faq: [
      {
        question: "Does every small edit need a new price?",
        answer: `${afterLaunchCare} Review edits during development and work outside those commitments are agreed in your contract before the changed work begins.`,
      },
      {
        question: "How can I reduce avoidable changes?",
        answer: "Review real examples early. Check the proposed pages against your services, use a sample inquiry, and collect feedback from the person who will maintain the content.",
      },
    ],
    serviceSlugs: ["website-development", "custom-software-development"],
    projectIds: ["PinsAndNeedlesComedyWebsite", "the-trip-handler"],
    published: "2026-10-19",
    modified: "2026-10-26",
    topic: "pricing",
    format: "note",
    closing: "Bring the current website and the task you want to change to a 4u Digital discussion.",
  },
];
