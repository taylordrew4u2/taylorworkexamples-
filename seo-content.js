import { afterLaunchSummary } from "./client-care.js";

export const site = {
  origin: "https://customtechbuilt4u.com",
  brand: "4u Digital",
  email: "admin@customtechbuilt4u.com",
  published: "2026-10-14",
  modified: "2026-10-19",
  analyticsEnabled: false,
  googleSiteVerification: "ToeKeLBKtkzU6usikyPh_H5UyaYv8bVZJp1JjyhzzVM",
};

export const services = [
  {
    slug: "website-development",
    title: "Websites",
    serviceLabel: "Websites",
    modified: "2026-11-20",
    metaTitle: "Custom Website Development for Your Business | 4u Digital",
    description: "Websites for businesses and personal projects, including portfolios, inquiries, and bookings. See examples from 4u Digital.",
    heading: "Websites.",
    intro: "I build websites that show what you do and make it easy to get in touch, book, or shop. New sites and redesigns are welcome.",
    eyebrow: "WEBSITES",
    topic: "website",
    when: [
      {
        title: "Show what you do",
        text: "Present your services, work, and contact details in pages people can find and understand.",
      },
      {
        title: "Take inquiries and bookings",
        text: "Collect the details you need from customers. We decide whether a booking needs your approval or can be confirmed automatically.",
      },
      {
        title: "Improve an existing site",
        text: "Keep useful content and fix confusing navigation, outdated design, or awkward contact forms.",
      },
    ],
    scope: [
      {
        title: "Pages and content",
        text: "We choose the pages, copy, and images, check permission to use them, and agree how you will update the site.",
      },
      {
        title: "Phone and keyboard use",
        text: "The site needs readable pages, clear navigation, and working forms on phones and computers, including keyboard access.",
      },
      {
        title: "Setup and running costs",
        text: "We agree the domain, hosting, email, booking connections, and ongoing costs before building. Page titles and descriptions can be included; search rankings are not guaranteed.",
      },
    ],
    projectIds: ["micro-short-website", "PinsAndNeedlesComedyWebsite"],
    proofIntro: "Micro-short presents a film, cast, crew, and festival recognition. Pins & Needles Comedy combines a show website with producer controls and audience screens. Both are personal projects.",
    faq: [
      {
        question: "Do I need finished copy?",
        answer: "No. Bring your idea, any existing content, and examples you like. We can work out the pages together.",
      },
      {
        question: "Can I use my existing domain?",
        answer: "Yes. We check its hosting and email setup before changing anything, then agree what setup work is included.",
      },
      {
        question: "How much does a website cost?",
        answer: "The price depends on the pages, content, and features. You receive an agreed scope and price before the build.",
      },
      {
        question: "Can I change the website after launch?",
        answer: `Yes. We agree which content you can update yourself. ${afterLaunchSummary}`,
      },
    ],
  },
  {
    slug: "web-app-development",
    title: "Web apps",
    serviceLabel: "Web apps",
    modified: "2026-11-20",
    metaTitle: "Web App Development for Business Workflows | 4u Digital",
    description: "Custom tools that work in a browser, including booking systems, customer portals, and shared team tools. See 4u Digital projects.",
    heading: "Web apps.",
    intro: "I build tools people use in a web browser: booking systems, customer portals, and shared team tools.",
    eyebrow: "WEB APPS",
    topic: "web-app",
    when: [
      {
        title: "Manage requests",
        text: "Let people submit details, review them in one place, and see whether a request is waiting, approved, or declined.",
      },
      {
        title: "Work from shared information",
        text: "Bring schedules, documents, and records together. Give each person access to the information and controls they need.",
      },
      {
        title: "Connect payments",
        text: "Keep confirmed payments connected to the right booking or record. We agree provider costs and what happens when payment fails.",
      },
    ],
    scope: [
      {
        title: "Accounts and access",
        text: "We agree who can view, add, or change information, including private records and administrator controls.",
      },
      {
        title: "Saving and sharing",
        text: "We plan how edits are saved and shared, including conflicting changes. Offline use is included only when agreed in the scope.",
      },
      {
        title: "Existing services",
        text: "We check whether your email, payment service, or database supports the connections you need, then agree setup and running costs.",
      },
    ],
    projectIds: ["BriefBooth.com", "nycstandupopenmicmaster", "the-trip-handler", "Showrunner-ICanRunAShow", "Bill-Spilt"],
    proofIntro: "Examples include consultation booking, an open-mic directory, group-trip planning, show management, and shared expenses. These are personal projects; their galleries label demo screens and product artwork.",
    faq: [
      {
        question: "What is a web app?",
        answer: "A website usually presents information. A web app lets people complete ongoing tasks, such as managing bookings or shared records, in their browser.",
      },
      {
        question: "Will it work on a phone?",
        answer: "Yes, with layouts designed for phone and desktop browsers. Installation and offline use need to be agreed separately.",
      },
      {
        question: "Can we start small?",
        answer: "Yes. We can build one complete task first, such as submitting and reviewing a request, and discuss other features later.",
      },
      {
        question: "What should I bring?",
        answer: "Show me how you do the task now. A form or spreadsheet helps, along with examples of what happens when something goes wrong.",
      },
    ],
  },
  {
    slug: "app-development",
    title: "iPhone, iPad & Mac apps",
    serviceLabel: "Apple apps",
    modified: "2026-11-20",
    metaTitle: "iPhone, iPad & Mac App Development | 4u Digital",
    description: "Apps for iPhone, iPad, and Mac, including writing, scheduling, and desktop tools. Explore 4u Digital examples and discuss your app.",
    heading: "iPhone, iPad & Mac apps.",
    intro: "I design and build apps for iPhone, iPad, and Mac. We choose the devices and features your first release needs.",
    eyebrow: "APPLE APPS",
    topic: "software",
    when: [
      {
        title: "Capture and organize",
        text: "Save notes, recordings, or imported text in a library people can search and use.",
      },
      {
        title: "Manage schedules",
        text: "Keep dates and details together, with clear choices about what stays private and what is shared publicly.",
      },
      {
        title: "Build a Mac tool",
        text: "Create a desktop tool for a specific task, such as working with audio. We agree any device permissions or connections to other apps.",
      },
    ],
    scope: [
      {
        title: "Supported devices",
        text: "We choose which iPhones, iPads, or Macs to support and test the app for those devices.",
      },
      {
        title: "Saved data and offline use",
        text: "We agree what stays on the device, what syncs between devices, and what works without an internet connection.",
      },
      {
        title: "Release and support",
        text: "We agree testing, distribution, submission work, and any service costs. Future features and maintenance are discussed separately.",
      },
    ],
    projectIds: ["The-Bit-Binder", "MyGigCalendar", "Open-Micer-Timer"],
    proofIntro: "The BitBinder organizes jokes and set lists. My Gig Calendar manages and shares show dates. Open Micer Timer runs a stage countdown. Their galleries include app screenshots and labeled product artwork.",
    faq: [
      {
        question: "Do I need an app or a web app?",
        answer: "An app can use Apple device features and provide a dedicated experience. A web app runs in a browser. We can work out which fits your users and task.",
      },
      {
        question: "Can the app have a website too?",
        answer: "Yes. My Gig Calendar is one example, with an app and public fan calendar. We agree what information is shared and how the two connect.",
      },
      {
        question: "Do I need every feature at launch?",
        answer: "No. We can focus the first release on the main task and leave other ideas for later.",
      },
      {
        question: "Can you guarantee an App Store approval date?",
        answer: "No. We agree the preparation and submission work, but Apple's review decision and timing are outside my control.",
      },
    ],
  },
  {
    slug: "custom-software-development",
    title: "Custom software",
    serviceLabel: "Custom software",
    modified: "2026-11-20",
    metaTitle: "Custom Software Development for Your Business | 4u Digital",
    description: "Custom software for internal tools, document tasks, and connections between existing systems. See examples and discuss your project with 4u Digital.",
    heading: "Custom software.",
    intro: "I build tools for tasks your existing software does not handle well, from managing records to connecting systems.",
    eyebrow: "CUSTOM SOFTWARE",
    topic: "software",
    when: [
      {
        title: "Organize submitted information",
        text: "Turn forms or documents into records you can review and use, with a way to correct missing or incorrect details.",
      },
      {
        title: "Build a tool for one job",
        text: "Create controls for a specific task, such as recording a session or reviewing a report, using the devices and equipment it needs.",
      },
      {
        title: "Connect existing systems",
        text: "Move information between tools where their access and formats allow it. We agree how to handle failed updates.",
      },
    ],
    scope: [
      {
        title: "The first task",
        text: "Show me how the job works now, including exceptions. We agree what the first version needs to do and how you will check the result.",
      },
      {
        title: "Devices and data",
        text: "We choose where the tool runs, how information is stored and recovered, and which equipment needs testing.",
      },
      {
        title: "Launch and upkeep",
        text: "We agree how existing data will be imported, how issues are reported, and what future maintenance will involve.",
      },
    ],
    projectIds: ["FreeScript", "usbmic", "nycstandupopenmicmaster", "the-trip-handler", "Showrunner-ICanRunAShow"],
    proofIntro: "These personal projects cover screenplay writing, recording, directory updates, trip planning, and show management. SobStage is a desktop release candidate; physical microphone validation is still pending.",
    faq: [
      {
        question: "How is this different from a web app?",
        answer: "Custom software is built for your needs. It might run in a browser, on a desktop, or behind another tool; a web app is one option.",
      },
      {
        question: "Do I need to replace my current tools?",
        answer: "Not necessarily. We look at what already works and whether a connection or a smaller addition would solve the problem.",
      },
      {
        question: "What if my idea is unfinished?",
        answer: "That is fine. Show me one task you want to improve. You do not need a technical specification to start.",
      },
      {
        question: "How is custom software priced?",
        answer: "The price depends on the task, data, connections, and testing needed. We agree the scope and price before building, including any separate service or maintenance costs.",
      },
    ],
  },
  {
    slug: "salon-booking-app-development",
    title: "Salon booking app development",
    serviceLabel: "Salon bookings",
    modified: "2026-10-23",
    guideSlug: "salon-booking-website",
    metaTitle: "Custom Salon Booking Apps & Websites | 4u Digital",
    description: "Custom salon booking websites and apps for services, staff, appointment requests, and schedule management. Discuss your booking workflow with 4u Digital.",
    heading: "Make booking fit the way your salon works.",
    intro: "I design and build salon booking websites and apps around your services and staff. Bring your current booking process, and we’ll work out which parts need a custom build.",
    eyebrow: "SALON BOOKING WEBSITES & APPS",
    topic: "salon",
    when: [
      {
        title: "Let customers choose the right service",
        text: "A booking flow can explain each service, collect the details your team needs, and offer eligible staff. We define durations, preparation time, and any choices that change the appointment before designing the calendar. Customers should know whether they are sending a request or securing a confirmed time.",
      },
      {
        title: "Give your team a useful schedule",
        text: "A staff view can bring appointment requests, confirmed bookings, unavailable time, and service details together. We decide who can accept a request, change a schedule, or update the treatment list. If rooms or equipment affect availability, those constraints belong alongside staff hours.",
      },
      {
        title: "Handle changes without losing the details",
        text: "Rescheduling and cancellation need clear rules for customers and staff. We can scope customer change requests, staff review, and notifications that match the appointment's status. The workflow should show what changed and which action is still needed, rather than leaving your team to reconstruct it from messages.",
      },
    ],
    scope: [
      {
        title: "Requests or automatic confirmation?",
        text: "A request-and-review flow lets your team check an appointment before accepting it. Automatic confirmation needs reliable availability, conflict checks, and rules for the service, staff, and resources involved. We choose the approach around how your salon works, then define the behavior customers and staff will review.",
      },
      {
        title: "What should connect to your existing tools?",
        text: "Bring the calendar or booking service you already use. We check its supported access before promising a connection or replacing it. Reminders, deposits, and payments can be scoped when useful, with clear confirmation rules and provider costs. Customer information and staff access also need a defined handling plan.",
      },
      {
        title: "What makes a useful first version?",
        text: "A first version could cover choosing a service, requesting a time, and reviewing the request in a staff workspace. We agree the necessary screens, who maintains the service list, and how exceptions are handled. The scope and price are settled before building; hosting and maintenance need an arrangement too.",
      },
    ],
    projectIds: ["MyGigCalendar", "PinsAndNeedlesComedyWebsite"],
    proofIntro: "My Gig Calendar shows native scheduling connected to a public calendar. Pins & Needles Comedy connects a public website to audience submissions and producer controls. These are related examples of scheduling, customer-facing information, and operator workflows; they are not salon client projects or evidence of automatic appointment confirmation.",
    faq: [
      {
        question: "Do salon customers need to download an app?",
        answer: "No. A booking website or web app can work in a phone browser. A native Apple app can be considered if customers or staff need a recurring device workflow. We choose the platform around how people will use the booking system.",
      },
      {
        question: "Can different services have different staff and durations?",
        answer: "Yes, those rules can be part of the build. We need your service list, which staff can provide each service, appointment lengths, and any preparation or cleanup time. Shared rooms or equipment can affect availability as well.",
      },
      {
        question: "Can I keep my current booking system?",
        answer: "Possibly. Your website could direct customers to it, or a custom workflow might connect to supported features. Share the system you use so its access and limits can be assessed before we agree an integration.",
      },
      {
        question: "How do I discuss a salon booking project?",
        answer: "Book your first video consultation through the 4u Digital page on BriefBooth. Bring your current booking process and what you want to improve. If you are unsure what you need or the software depends on your space or workflow, we can arrange an in-person consultation in Manhattan, Brooklyn, or parts of Queens. Travel farther afield is discussed in advance. A rough outline is enough to start.",
      },
    ],
  },
  {
    slug: "restaurant-ordering-app-development",
    title: "Restaurant ordering app development",
    serviceLabel: "Restaurant ordering",
    modified: "2026-10-23",
    guideSlug: "restaurant-ordering-app",
    metaTitle: "Custom Restaurant Ordering Apps & Websites | 4u Digital",
    description: "Custom restaurant ordering websites and apps for menus, pickup, staff order queues, and payment workflows. Plan your ordering system with 4u Digital.",
    heading: "Build an ordering flow your restaurant can run.",
    intro: "I design and build restaurant ordering websites and apps for customers and staff. Bring your menu and current ordering process, and we’ll plan how orders should be placed and handled.",
    eyebrow: "RESTAURANT ORDERING WEBSITES & APPS",
    topic: "restaurant",
    when: [
      {
        title: "Make the menu clear and manageable",
        text: "An ordering menu can support item options, sizes, extras, and availability rules. We define which choices change the price and what happens when an item sells out. A staff editing view can let authorized people update menu information, with the customer order preserving the choices made at checkout.",
      },
      {
        title: "Give each order a place in the queue",
        text: "A counter or kitchen workspace can show submitted orders and the next action for each one. We map who accepts an order, who prepares it, and how it becomes ready for pickup. Customer updates should reflect those real steps, including when the restaurant cannot accept an order.",
      },
      {
        title: "Match ordering to your fulfillment process",
        text: "Pickup ordering needs hours, timing choices, customer details, and a clear collection step. Delivery adds destination and fulfillment rules. We can scope either workflow around how your restaurant operates, including what staff do when capacity changes or an order needs correction.",
      },
    ],
    scope: [
      {
        title: "When is an order accepted and paid?",
        text: "A submitted order, an accepted order, and a confirmed payment are different events. We define their sequence, the amount calculation, and what happens when payment fails or an order is cancelled. Payment-provider access and charges need to be understood before checkout becomes part of the agreed build.",
      },
      {
        title: "Can your POS and menu data connect?",
        text: "Share the point-of-sale system and other tools your restaurant uses. We check available documentation and account access before scoping a connection. Menu imports, price updates, and order handoffs need a clear source of truth and a plan for failed updates. The connection should serve the staff process.",
      },
      {
        title: "Which ordering workflow should come first?",
        text: "A useful first version could focus on browser-based pickup orders and a staff acceptance queue. We agree menu rules, operating hours, roles, and the review examples before building. Delivery, loyalty features, or a native Apple app can be considered separately. Hosting, service costs, and maintenance belong in the project plan.",
      },
    ],
    projectIds: ["the-trip-handler", "Showrunner-ICanRunAShow"],
    proofIntro: "The Trip Handler demonstrates approval workflows, shared records, Stripe Checkout, and verified payment events. I Can Run A Show demonstrates organizer controls, agreements, and a coordinated schedule. These are related software capabilities from the portfolio, not restaurant client projects. Your menu, ordering queue, and fulfillment rules would be designed and reviewed for your own business.",
    faq: [
      {
        question: "Does restaurant ordering require a downloadable app?",
        answer: "No. A website or web app can let customers order from a phone browser. A native Apple app may suit a repeat-use requirement, but it needs its own scope. We can compare the options before choosing a platform.",
      },
      {
        question: "Can the ordering app connect to my current POS?",
        answer: "That depends on the POS system's supported connection methods and your account access. Tell 4u Digital which system you use. The integration can then be assessed before it is promised or included in the project price.",
      },
      {
        question: "Can we start with pickup orders only?",
        answer: "Yes. A first version can focus on pickup if that covers a complete useful task. We still need the menu choices, ordering hours, acceptance rules, payment approach, and what customers see when an order is ready or cannot be accepted.",
      },
      {
        question: "How do I discuss a restaurant ordering project?",
        answer: "Book your first video consultation through the 4u Digital page on BriefBooth. Bring your menu, current ordering process, and POS system if you use one. If you are unsure what you need or the software depends on your space or workflow, we can arrange an in-person consultation in Manhattan, Brooklyn, or parts of Queens. Travel farther afield is discussed in advance. A finished specification is not required.",
      },
    ],
  },
];

export const guide = {
  slug: "website-or-app",
  title: "Website, app, or business software?",
  metaTitle: "Website, Web App, or Software? A Practical Guide | 4u Digital",
  description: "Compare websites, web apps, native Apple apps, and custom software by the task, users, and device requirements. Find a practical starting point with 4u Digital.",
  intro: "Start with what people need to do. These four examples show where a website, web app, native app, or custom business software fits.",
  rows: [
    {
      type: "Website",
      when: "Choose a website when visitors need to understand your services, view your work, or contact you. Public information and a clear next step are the priority. A request form can be included.",
      example: "Micro-short Film Website presents film artwork, cast, crew, and contact information across five public views.",
      serviceSlug: "website-development",
    },
    {
      type: "Web application",
      when: "Choose a web app when people return to shared records and perform tasks in a browser. Accounts, roles, approvals, and payment status can be part of the workflow, alongside any public pages.",
      example: "The Trip Handler combines invitations, approvals, group planning, and payment integration.",
      serviceSlug: "web-app-development",
    },
    {
      type: "Native Apple app",
      when: "Choose a native iPhone, iPad, or Mac app when device features, local storage, or a dedicated interface serve the task. Specify the devices, permissions, and what needs to work without a connection.",
      example: "The BitBinder organizes writing material in a native app; My Gig Calendar connects gig records to public dates.",
      serviceSlug: "app-development",
    },
    {
      type: "Custom software",
      when: "Choose custom software for particular processing rules, integrations, or specialist controls. The result could be a browser tool, desktop utility, or data service. Define the input, actions, and result someone needs to check.",
      example: "SobStage is a desktop release candidate with multiple microphone inputs, recording controls, and saved-take tools. Physical microphone validation is still pending.",
      serviceSlug: "custom-software-development",
    },
  ],
  sections: [
    {
      heading: "Who needs to use the build?",
      text: "The users determine the access plan. Public visitors may need information, while customers or staff may need accounts and permissions. List who creates, reviews, and changes each record. Describe one person completing one task, including the handoff to anyone else.",
    },
    {
      heading: "What information and devices does the task depend on?",
      text: "Identify the information's source and what happens when it changes. A calendar, recording, spreadsheet, or existing service can create different requirements. Say what works offline and what needs sharing. The task should justify any additional platform or device work.",
    },
    {
      heading: "What belongs in the first version?",
      text: "Start with a complete task and agree what successful behavior looks like. Budget, integrations, testing, and maintenance need that boundary. Identify what can wait. An existing tool may cover part of the process, so custom code should have a specific job.",
    },
  ],
  faq: [
    {
      question: "Can one project include a website and an app?",
      answer: "Yes. My Gig Calendar is a portfolio example of a native app with a public calendar. Each part still needs its own users, data rules, and scope. Combining them does not remove those decisions.",
    },
    {
      question: "Do I need to pick a framework or write a specification?",
      answer: "No. Bring the problem, intended users, and an example of the current task. I can work through the technical choices once the requirements are understood. A rough idea is enough for an initial discussion.",
    },
    {
      question: "How do I start a conversation with 4u Digital?",
      answer: "Book your first video consultation through the 4u Digital page on BriefBooth, or email a general project inquiry to admin@customtechbuilt4u.com. Bring what your business does and what you want to build or improve. An existing website or example can help, but a finished plan is not required.",
    },
  ],
};

export const projectSlugs = {
  "pixelatedrecordsnyc-old-layout": "pixelated-records",
  FreeScript: "freescript",
  "BriefBooth.com": "briefbooth",
  "Showrunner-ICanRunAShow": "i-can-run-a-show",
  "The-Bit-Binder": "bitbinder",
  "the-trip-handler": "trip-handler",
  "Bill-Spilt": "bill-spilt",
  "Role-Call": "role-call",
  MyGigCalendar: "my-gig-calendar",
  bleepkit: "bleepkit",
  dictype: "dictype",
  "micro-short-website": "micro-short-film-website",
  nycstandupopenmicmaster: "nyc-open-mic-master-list",
  "Open-Micer-Timer": "open-micer-timer",
  PinsAndNeedlesComedyWebsite: "pins-and-needles-comedy",
  usbmic: "sobstage",
  tlcmassagewellness: "tlc-massage-wellness",
  vlognudge: "vlognudge",
};
