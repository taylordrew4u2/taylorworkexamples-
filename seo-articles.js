import { websiteNotes } from "./content/website-notes.js";
import { pricingNotes } from "./content/pricing-notes.js";
import { businessNotes } from "./content/business-notes.js";
import { industryWebsiteNotes } from "./content/industry-website-notes.js";

const guides = [
  {
    slug: "freelance-developer-vs-agency",
    title: "Freelance developer or agency: which fits your build?",
    metaTitle: "Freelance Developer vs Agency: Choosing a Fit | 4u Digital",
    description: "Compare a direct developer relationship with an agency team by communication, scope, specialist needs, and ongoing responsibilities.",
    summary: "A direct developer relationship can fit a focused website or app project. An agency team may suit work that needs several specialists at once.",
    intro: "Hiring a freelance developer can give you direct contact with the person designing and writing the software. That is useful when your business needs a focused build and clear decisions. Choosing between a freelancer and an agency should still depend on the project, the people required, and the responsibilities after launch.",
    sections: [
      {
        heading: "Direct communication connects the question to the build",
        paragraphs: [
          "At 4u Digital, the discussion about what your business needs connects directly to the design and code. You can explain a difficult task, review a screen, or ask how a change affects the scope with the developer doing the work.",
          "That relationship is most useful when decisions are clear. Identify who approves the work, how feedback is collected, and what must be agreed before changes are built. Direct contact still needs a practical review process and realistic availability.",
        ],
      },
      {
        heading: "Compare the scope and responsibilities behind the price",
        paragraphs: [
          "A useful quote describes what is included: pages, workflows, integrations, testing, and launch work. It should also explain what is outside the initial build. Comparing that detail helps you understand the value of a proposal without relying on the size of the business providing it.",
          "My portfolio includes native apps such as The BitBinder and full-stack work such as The Trip Handler. Those examples let you inspect actual product workflows and source evidence. They show the kind of implementation you can discuss with 4u Digital, without promising an identical price or outcome.",
        ],
      },
      {
        heading: "An agency team can fit work that needs several disciplines",
        paragraphs: [
          "An agency can be a suitable choice when a project needs several specialists working together, a large ongoing workload, or broader campaign and brand work alongside development. Ask who handles each discipline and who is responsible for the finished system.",
          "A focused developer engagement can fit a clearly scoped website, app, or business tool. Before choosing either arrangement, discuss ongoing maintenance, service accounts, handover, and the availability needed after launch. The right choice is the one that matches the work and the working relationship you need.",
        ],
      },
    ],
    faq: [
      {
        question: "Is a freelancer always cheaper or faster?",
        answer: "No. Price and delivery depend on scope, complexity, availability, and the people involved. Compare proposals for the same work and responsibilities. Neither a freelancer nor an agency can be judged from that label alone.",
      },
      {
        question: "What should I ask before hiring a developer?",
        answer: "Ask who writes the code, how reviews work, what the quote includes, and how changes are handled. Also agree who maintains the software and pays for hosting or external services after launch.",
      },
    ],
    serviceSlugs: ["website-development", "custom-software-development"],
    projectIds: ["The-Bit-Binder", "the-trip-handler"],
    modified: "2026-10-23",
    closing: "Start with a 4u Digital video consultation through BriefBooth. If you are unsure what to build, or the software needs to fit a particular space or workflow, an NYC in-person consultation can help us work it out. Bring the task you want to solve and any existing website or app. A finished technical plan is not required.",
  },
  {
    slug: "diy-vs-custom-website",
    title: "When does a DIY website need custom development?",
    metaTitle: "DIY Website vs Custom Development: When to Build | 4u Digital",
    description: "A website builder can suit basic business information. Learn when editing needs, bookings, permissions, or connected workflows justify custom development.",
    summary: "A website builder can handle a straightforward information site. Custom development becomes useful when the business needs particular actions, rules, or connections.",
    intro: "A DIY website can be a sensible starting point for a business that needs a few public pages and a contact route. Custom development is worth considering when visitors or staff need to complete tasks that the existing setup handles awkwardly. Start by identifying the missing function rather than assuming every website needs rebuilding.",
    sections: [
      {
        heading: "A simple information site can suit a website builder",
        paragraphs: [
          "If the website mainly explains services, displays photographs, and provides contact details, a builder may cover the task. The business still needs accurate content, suitable images, and someone who can keep the information current. A template does not make those decisions for you.",
          "An existing booking or ordering service may also meet a straightforward need. Check how it fits the website and your daily process before commissioning a replacement. A useful custom build should have a clear job that the current tools are not performing well.",
        ],
      },
      {
        heading: "Custom development can connect the public site to daily work",
        paragraphs: [
          "A custom website can connect visitor actions to a defined business workflow. An appointment request might need treatment details, a staff review, and an accepted or declined status. Editable service information and staff controls may also need rules that match how the business operates.",
          "Pins & Needles Comedy connects public pages with audience submissions and producer controls. That portfolio example shows how a website can include operational functions alongside its public information. It is not a salon client project or a claim about measured sales results.",
        ],
      },
      {
        heading: "Plan the parts that need changing",
        paragraphs: [
          "Bring the existing website and show where people get stuck. We can review its useful content, contact steps, editing process, and connected services. Some parts may remain while a particular workflow or public section is rebuilt. The scope should explain those boundaries.",
          "Compare the build cost with the responsibilities that follow it. Hosting, editing access, external services, and maintenance all need a plan. Page structure and metadata can be improved as part of a website project, but search placement and new customer inquiries cannot be guaranteed.",
        ],
      },
    ],
    faq: [
      {
        question: "Do I need to replace my whole website?",
        answer: "Not necessarily. We can identify which content and functions still work, then scope the parts that need changing. Access to the current setup and any connected services affects what can be retained or integrated.",
      },
      {
        question: "What makes a custom website worth discussing?",
        answer: "A specific problem is a useful starting point: an awkward booking process, confusing pages, difficult editing, or information that needs moving between tools. Explain the current task and what should happen instead.",
      },
    ],
    serviceSlugs: ["website-development", "web-app-development"],
    projectIds: ["PinsAndNeedlesComedyWebsite"],
    modified: "2026-10-23",
    closing: "Start with a 4u Digital video consultation through BriefBooth. If you are unsure what to build, or the software needs to fit a particular space or workflow, an NYC in-person consultation can help us work it out. Bring your current website and the part you want to improve. We can discuss a focused change or a wider rebuild.",
  },
  {
    slug: "salon-booking-website",
    modified: "2026-10-16",
    title: "What should a salon booking website actually do?",
    metaTitle: "Planning a Salon Booking Website | 4u Digital",
    description: "Plan salon services, staff, appointment durations, requests, confirmations, and optional reminders or deposits before choosing a booking website build.",
    summary: "A salon booking website needs rules for services, staff, and time. Decide how an appointment becomes confirmed before designing the booking screen.",
    intro: "A salon booking website should reflect how the business actually schedules appointments. A treatment list and a calendar are only parts of that process. 4u Digital can help define a tailored booking workflow around your services and staff. Related portfolio work shows public-facing information, scheduling, and operator controls that can help explain the parts of a booking system.",
    sections: [
      {
        heading: "Define the service and staff rules first",
        paragraphs: [
          "A booking workflow needs the details that affect an appointment: the chosen service, its duration, eligible staff, and the times that can be offered. If preparation or cleanup affects availability, include it in the rules. The business should decide what the customer needs to select and what staff handle later.",
          "Staff availability needs a source that people can maintain. Decide who changes working hours, marks time unavailable, and updates service information. If another calendar or booking service already handles that work, check its access and connection options before planning a replacement.",
        ],
      },
      {
        heading: "Distinguish a booking request from a confirmed appointment",
        paragraphs: [
          "A request workflow lets staff review the details before accepting the appointment. An automatic confirmation workflow needs availability and conflict rules that can make that decision. The customer should understand which step has happened and what they need to do next.",
          "Pins & Needles Comedy connects a public website to audience submissions and producer controls. My Gig Calendar publishes saved dates to a public calendar. These related examples can help explain customer-facing information, scheduling, and operator workflows. They are not salon client projects or proof of appointment availability checks; your booking rules would be designed for your business.",
        ],
      },
      {
        heading: "Scope reminders, deposits, and appointment changes deliberately",
        paragraphs: [
          "If reminders are needed, define the message, destination, timing, and what happens when an appointment changes. If deposits are needed, agree the amount rules and when payment affects confirmation. Email, messaging, and payment services can add their own setup work and costs.",
          "Cancellation and rescheduling rules also belong in the booking plan. Decide what customers can change themselves and when staff must review a change. The first version can focus on a complete request-and-review process, with additional features considered separately once their requirements are clear.",
        ],
      },
    ],
    faq: [
      {
        question: "Can the website confirm appointments automatically?",
        answer: "That can be part of the scope if availability, duration, staff, and conflict rules can be defined. A simpler first version may collect requests for staff review. The customer-facing wording should match the chosen workflow.",
      },
      {
        question: "Do reminders and deposits have to be included?",
        answer: "No. Include them when they serve the business process, and define their behavior and service costs. They should not be assumed from the phrase booking website or promised before the requirements are understood.",
      },
    ],
    serviceSlugs: ["salon-booking-app-development", "website-development", "web-app-development"],
    projectIds: ["PinsAndNeedlesComedyWebsite", "MyGigCalendar"],
    modified: "2026-10-23",
    closing: "Start with a 4u Digital video consultation through BriefBooth. If you are unsure what to build, or the software needs to fit a particular space or workflow, an NYC in-person consultation can help us work it out. Bring your services, current booking process, and what you want customers or staff to do differently. A rough outline is enough to begin.",
  },
  {
    slug: "restaurant-ordering-app",
    modified: "2026-10-16",
    title: "Plan the restaurant order before building the app",
    metaTitle: "Planning a Restaurant Ordering App | 4u Digital",
    description: "Define menu options, pickup or delivery, order acceptance, staff handling, payments, and POS access before building a restaurant ordering app.",
    summary: "An ordering app needs a complete path from menu choice to accepted order. Customer screens and restaurant operations should be planned together.",
    intro: "A restaurant ordering app needs to match what happens after someone presses the order button. The menu, fulfillment process, payment status, and staff response all affect the build. 4u Digital can help plan those steps around your restaurant. Related portfolio work demonstrates web-app coordination and payment integration, giving you concrete examples to discuss when defining your ordering workflow.",
    sections: [
      {
        heading: "Make the menu and fulfillment choices explicit",
        paragraphs: [
          "The menu needs rules for item options, variants, and availability. A size or extra ingredient may change the order details and price. Decide who updates those choices and how the customer sees unavailable items. Existing menu data may be reusable if its format and access are suitable.",
          "Choose pickup, delivery, or both according to the intended first version. Each needs its own information, timing rules, and staff handling. Delivery adds decisions about destinations and fulfillment. A native Apple app and a browser ordering flow are different delivery options; the customer task should guide that choice.",
        ],
      },
      {
        heading: "Give staff a clear order-acceptance process",
        paragraphs: [
          "An order needs a defined status and a place where staff can review it. Decide how an order is accepted, returned, or cancelled, and what the customer is told. A kitchen or counter view should reflect the actual handoff rather than adding another screen without a working process.",
          "The Trip Handler provides a separate portfolio example of approvals, shared records, and payment status connected to an application workflow. Its payment integration is relevant evidence for discussing similar implementation needs. Restaurant menu and fulfillment requirements would still need their own scope and review.",
        ],
      },
      {
        heading: "Check payment and POS access before promising a connection",
        paragraphs: [
          "Decide when payment happens relative to order acceptance, and how incomplete payments or cancelled orders are handled. A payment-provider integration needs clear amount and status rules. A customer reaching checkout does not by itself mean an order is accepted or a payment is confirmed.",
          "A point-of-sale connection depends on the system's available access, documentation, and account setup. Confirm those details before including the integration. Hosting, payment-service costs, staff access, and maintenance also belong in the scope.",
        ],
      },
    ],
    faq: [
      {
        question: "Can an ordering app connect to my current POS?",
        answer: "That depends on the POS system's supported connection methods and the access available to your business. Share the system you use so the integration can be assessed before it is promised or priced into the build.",
      },
      {
        question: "Should pickup and delivery launch together?",
        answer: "Only if both workflows are defined and belong in the first scope. A pickup-only version may provide a clearer starting boundary. Delivery should have explicit destination, timing, and fulfillment rules when included.",
      },
    ],
    serviceSlugs: ["restaurant-ordering-app-development", "web-app-development", "app-development"],
    projectIds: ["the-trip-handler"],
    modified: "2026-10-23",
    closing: "Start with a 4u Digital video consultation through BriefBooth. If you are unsure what to build, or the software needs to fit a particular space or workflow, an NYC in-person consultation can help us work it out. Bring your current ordering process, menu setup, and POS system. We can discuss which part needs a custom build.",
  },
  {
    slug: "spreadsheet-to-business-software",
    title: "When a spreadsheet needs a business workflow",
    metaTitle: "From Spreadsheet to Business Software | 4u Digital",
    description: "Plan shared records, permissions, review steps, imports, and exports before replacing a spreadsheet with custom business software.",
    summary: "A spreadsheet can be useful until the work needs defined roles and handoffs. Start with one complete task before deciding what software to build.",
    intro: "Moving a spreadsheet into software should begin with the work people perform around it. Who enters a record, who checks it, and what happens after a decision? Custom business software can give those steps a defined interface and access rules. Start by mapping your current spreadsheet process, then decide which steps need shared records, approvals, or a clearer interface.",
    sections: [
      {
        heading: "Describe a complete task using a real example",
        paragraphs: [
          "A spreadsheet may already suit a simple record list managed by one person. Software becomes worth discussing when several people need different actions, status changes, or coordinated decisions. Show one example record and follow it through the current process, including the messages or documents used alongside it.",
          "Define the input, the review, and the result someone needs to check. A request might be submitted by a team member and approved by an organizer. Exceptions matter too: missing information, a rejected request, or a record that needs correcting should have an understandable next step.",
        ],
      },
      {
        heading: "Design shared records and permissions together",
        paragraphs: [
          "A business tool needs rules for who can see and change each record. Signing in identifies the user; permissions govern the work they may do. Decide which information is shared, which is private, and who can change a status or reverse a decision.",
          "I Can Run A Show brings performer bookings, agreements, and production controls into a shared workflow. The Trip Handler shows shared records and organizer approvals. Use these application patterns as examples when defining the import rules, permissions, and review steps your spreadsheet process needs.",
        ],
      },
      {
        heading: "Plan imports and exports before retiring the spreadsheet",
        paragraphs: [
          "Existing records need a clear destination. If migration is included, map the old columns to the new fields and identify missing, duplicated, or inconsistent data. Agree how a sample import is reviewed before the full transfer. The migration work should be visible in the scope.",
          "Decide how records can be exported and who maintains the system. An export format may be needed for reporting, backup, or another tool. Keep the first build focused on a useful workflow, with additional dashboards or connections scoped later.",
        ],
      },
    ],
    faq: [
      {
        question: "Do we have to replace every spreadsheet?",
        answer: "No. Some lists or reports may continue to work well. Identify the task that needs better permissions or handoffs, then decide which records belong in the new system and which tools can remain.",
      },
      {
        question: "Can existing records be moved into the software?",
        answer: "A migration can be scoped after reviewing the available files, fields, and data quality. It needs mapping, validation, and a review plan. An import should not be assumed to work before the existing material is assessed.",
      },
    ],
    serviceSlugs: ["custom-software-development", "web-app-development"],
    projectIds: ["Showrunner-ICanRunAShow", "the-trip-handler"],
    modified: "2026-10-23",
    closing: "Start with a 4u Digital video consultation through BriefBooth. If you are unsure what to build, or the software needs to fit a particular space or workflow, an NYC in-person consultation can help us work it out. Bring the task your spreadsheet supports and a description of who uses it. We can identify a practical first workflow to build.",
  },
  {
    slug: "first-version-app-features",
    title: "Choose app features around one useful first version",
    metaTitle: "Planning First-Version App Features and MVP Scope | 4u Digital",
    description: "Define an app's first useful task, users, accounts, payments, review criteria, and maintenance responsibilities before adding more features.",
    summary: "A first version should let someone complete a useful task. Feature choices follow from that task, its users, and what a successful result looks like.",
    intro: "A minimum viable product, or MVP, needs a clear purpose and a complete user workflow. A long feature list does not provide that boundary. 4u Digital can help turn an app idea into a scoped first version by defining the task, the decisions it requires, and what belongs in the initial build. A finished technical specification is not required.",
    sections: [
      {
        heading: "Follow one user through one complete task",
        paragraphs: [
          "Start with who uses the app and what they need to accomplish. Describe the starting information, the actions they take, and the result they can check. A notebook workflow might capture material and make it retrievable. A request workflow might submit details and receive a reviewed status.",
          "The BitBinder demonstrates native notebook and reviewable-import workflows. The Trip Handler demonstrates invitations and approvals within shared planning. Those examples can help make a proposed task concrete. Each portfolio page explains its available product evidence and sample-data context.",
        ],
      },
      {
        heading: "Include accounts and payments when the task requires them",
        paragraphs: [
          "Accounts belong in the first version when identity, private information, or permissions are needed for the task. A public information page may need a different approach. Decide which users can create, read, and change records, and what happens when access ends or a request is rejected.",
          "Payments need their own workflow if money changes access or status. Define the amount rules and how confirmed, incomplete, or cancelled transactions are handled. A payment screen should not be added merely because it appears on a feature checklist. The same applies to optional notifications, sharing, and dashboards.",
        ],
      },
      {
        heading: "Agree review criteria and ongoing responsibilities",
        paragraphs: [
          "The scope should say what successful behavior looks like and which examples will be used to review it. Test the intended devices and the paths that matter, including missing information or failed requests. Features that rely on external services need suitable access and failure handling.",
          "Identify what can wait and how changes will be discussed. Hosting, service costs, maintenance, and distribution work need an agreed arrangement. Define the initial build's price and scope, with future features considered separately.",
        ],
      },
    ],
    faq: [
      {
        question: "Can we change the feature list during development?",
        answer: "Changes can be discussed, but they may affect the agreed scope, price, or schedule. It helps to separate a requirement needed for the core task from an additional idea that can be considered later.",
      },
      {
        question: "Does an MVP have a fixed price or launch date?",
        answer: "No. MVP describes a scope approach, not a standard package. The workflow, platform, integrations, and testing requirements determine the work. Price and delivery expectations need to be agreed for the specific project.",
      },
    ],
    serviceSlugs: ["app-development", "web-app-development"],
    projectIds: ["The-Bit-Binder", "the-trip-handler"],
    modified: "2026-10-23",
    closing: "Start with a 4u Digital video consultation through BriefBooth. If you are unsure what to build, or the software needs to fit a particular space or workflow, an NYC in-person consultation can help us work it out. Bring your app idea, intended users, and the first task it should handle. We can work through the scope together.",
  },
];

export const articleTopics = [
  { id: "websites", title: "Just need a website?", label: "Websites", description: "Start with the pages, content, and contact options your business needs." },
  { id: "business-websites", title: "A website for your kind of business.", label: "By business", description: "Practical starting points for salons, restaurants, and local shops that need a straightforward website." },
  { id: "pricing", title: "Understand the price.", label: "Pricing", description: "Compare quotes, pricing arrangements, changes, and the costs after launch." },
  { id: "planning", title: "Plan the right build.", label: "Planning", description: "Prepare for the conversation, choose useful features, and think through the work behind the screen." },
];

export const articles = [...websiteNotes, ...industryWebsiteNotes, ...pricingNotes, ...businessNotes, ...guides].map((article) => ({
  ...article,
  topic: article.topic || (article.slug === "diy-vs-custom-website" ? "websites" : "planning"),
}));

export const homepageArticles = ["simple-business-website", "why-website-quotes-vary", "what-to-bring-to-a-developer"]
  .map((slug) => articles.find((article) => article.slug === slug));
