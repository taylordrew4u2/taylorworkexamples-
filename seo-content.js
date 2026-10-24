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
    title: "Custom website development",
    serviceLabel: "Websites",
    modified: "2026-10-24",
    metaTitle: "Custom Website Development for Your Business | 4u Digital",
    description: "Custom business websites with clear content, mobile layouts, and useful inquiry or booking flows. See 4u Digital projects and discuss your website.",
    heading: "Give your business a website people can use.",
    intro: "I design and build custom websites that explain your business and help customers get in touch. Bring a rough idea or an existing site you want to improve.",
    eyebrow: "CUSTOM WEBSITES",
    topic: "website",
    when: [
      {
        title: "Does your website explain what you do?",
        text: "A business website should explain what you offer, who it is for, and how to get in touch. I organize your services and examples into pages with a clear reading order, so a visitor can understand the business and choose a next step.",
      },
      {
        title: "Do you need a useful inquiry or booking flow?",
        text: "A website can collect the details you need before a conversation or appointment. We define what visitors submit, where requests go, and how you review them. A booking request and a confirmed appointment need different rules, so the scope distinguishes those workflows.",
      },
      {
        title: "Does your existing site need a clearer structure?",
        text: "A website rebuild can preserve useful material while changing confusing navigation, outdated layouts, or awkward contact steps. Bring the existing address and show me what frustrates you. We identify what needs rewriting or rebuilding before choosing the design and agreeing the scope.",
      },
    ],
    scope: [
      {
        title: "What content belongs on the website?",
        text: "Website scope starts with the pages, photographs, service details, and examples visitors need. Business facts and permission to use supplied material should be clear. We also decide who updates the content after launch and whether an editing screen belongs in the build.",
      },
      {
        title: "What should happen on a phone?",
        text: "The website needs usable navigation, readable content, and working forms on smaller screens. Keyboard navigation and clear labels also matter. The layout should let a visitor understand the page and complete the intended action on the device they already have.",
      },
      {
        title: "What needs connecting before launch?",
        text: "A website may need a domain, hosting, business email, or an existing booking service. We identify those connections, service costs, launch checks, and maintenance responsibilities. Page titles and descriptions can be included in the build; search placement is not guaranteed.",
      },
    ],
    projectIds: ["micro-short-website", "PinsAndNeedlesComedyWebsite"],
    proofIntro: "The Micro-short Film Website brings film artwork, cast, crew, and festival recognition into a focused promotional site. Pins & Needles Comedy connects a public website with producer controls and audience screens. Explore both projects through their original website captures and clearly labeled product artwork.",
    faq: [
      {
        question: "Do I need finished website copy before contacting you?",
        answer: "No. Tell me what your business offers and what visitors should do on the website. Existing copy, photographs, and examples help define the pages, but a finished plan is not required to start the conversation.",
      },
      {
        question: "Can you work with a domain I already own?",
        answer: "Yes. An existing domain can be part of the website plan. We need to understand its current hosting and email connections before changing it, and agree which setup work belongs in the project.",
      },
      {
        question: "How is a custom website priced?",
        answer: "Website pricing depends on the number of pages, content work, editing tools, and functions such as inquiries or bookings. We agree the scope and price before building rather than quoting from the appearance of the homepage alone.",
      },
      {
        question: "Can I change the website after launch?",
        answer: `Yes. We agree which content you can update yourself. ${afterLaunchSummary}`,
      },
    ],
  },
  {
    slug: "web-app-development",
    title: "Web app development",
    serviceLabel: "Web apps",
    modified: "2026-10-23",
    metaTitle: "Web App Development for Business Workflows | 4u Digital",
    description: "Custom web applications for accounts, approvals, shared records, and payments. See 4u Digital workflow projects and discuss the app your business needs.",
    heading: "Bring the work into one place.",
    intro: "I build web apps that bring shared records, approvals, and team tasks into one place. We’ll start with your current process and agree what belongs in the first version.",
    eyebrow: "WEB APPLICATIONS",
    topic: "web-app",
    when: [
      {
        title: "Are requests getting passed between people?",
        text: "A web application can give a request a defined path: submit details, review them, approve or return the request, and show its status. We map the handoffs before building screens, including who can change a decision and what happens when information is missing.",
      },
      {
        title: "Do several people need the same information?",
        text: "A shared workspace can bring schedules, documents, comments, and records together with access appropriate to each person. A team member may need a working view while an organizer needs project controls. We define the actions and permissions around the information people share.",
      },
      {
        title: "Does a payment need to change a workflow?",
        text: "A payment flow may need to update a participant's status after confirmed checkout. We define what is charged, where the amount comes from, and how payment status affects the next step. Payment-provider accounts, service costs, and incomplete payments belong in that discussion.",
      },
    ],
    scope: [
      {
        title: "Who can see and change each record?",
        text: "Web-app permissions need rules for each role and action. Signing in identifies a person; access checks determine what that person may do. We work through record ownership, membership, invitations, and approval rights alongside the interface, including private information and administrative controls.",
      },
      {
        title: "What happens when the data changes?",
        text: "Shared records need rules for edits, status changes, and conflicting information. We identify each record's source, what needs saving, and what people should see after an update. Offline use or synchronization becomes an explicit requirement when the workflow needs it.",
      },
      {
        title: "Which existing services must the app use?",
        text: "A web app may connect to sign-in services, email notifications, payment providers, or an existing database. We check available access before scoping a connection. Hosting, service costs, and failure handling need a plan too, so each integration serves a defined task.",
      },
    ],
    projectIds: ["BriefBooth.com", "the-trip-handler", "Showrunner-ICanRunAShow", "Bill-Spilt"],
    proofIntro: "BriefBooth brings client intake, availability, and consultation requests into a booking platform used by 4u Digital. The Trip Handler demonstrates invitations, approvals, shared planning, and Stripe payment integration. I Can Run A Show combines booking, contract signing, and live-show controls. BillSpilt demonstrates shared expenses and settlement planning. Their galleries distinguish sample app captures from product artwork.",
    faq: [
      {
        question: "How is a web app different from a website?",
        answer: "A website mainly publishes information and guides visitors to an action. A web app manages ongoing tasks and data, often with accounts or roles. A single project can contain both public pages and a private workspace.",
      },
      {
        question: "Can a web app work on a phone?",
        answer: "Yes. A web app can have layouts designed for phone and desktop browsers. If installation or offline behavior matters, we should define those requirements separately rather than assuming they follow from a mobile layout.",
      },
      {
        question: "Can we build only the first part of the workflow?",
        answer: "Yes. We can scope a first version around a complete useful task, such as submitting and reviewing a request. That gives the project a clear boundary while identifying other features that might be considered later.",
      },
      {
        question: "What should I bring to a web-app discussion?",
        answer: "Bring an example of the task, the people involved, and the information they use. An existing form or spreadsheet is helpful. Describe exceptions too, such as a rejected request, a cancelled booking, or an incorrect payment status.",
      },
    ],
  },
  {
    slug: "app-development",
    title: "iPhone, iPad, and Mac app development",
    serviceLabel: "Apple apps",
    modified: "2026-10-23",
    metaTitle: "iPhone, iPad & Mac App Development | 4u Digital",
    description: "Native iPhone, iPad, and Mac apps built around useful workflows. See 4u Digital notebooks, calendars, and desktop tools, then discuss your app idea.",
    heading: "Put your workflow on the devices people use.",
    intro: "I design and build native apps for iPhone, iPad, and Mac. We’ll choose the Apple devices and one useful task to focus on before planning the first release.",
    eyebrow: "APPLE APP DEVELOPMENT",
    topic: "software",
    when: [
      {
        title: "Do people need to capture information as they work?",
        text: "A native app can organize notes, recordings, or imported text around a repeated task. Capture needs a useful destination, such as a searchable library or review queue. We identify what someone records, what they check, and how they find the material again.",
      },
      {
        title: "Does the task belong beside the calendar?",
        text: "A scheduling app can connect private records with information someone chooses to publish. A performer managing dates needs a different view from a fan checking appearances. We define what stays private, what can be shared, and how updates reach any public page.",
      },
      {
        title: "Does the work happen inside a Mac workflow?",
        text: "A Mac utility can serve a desktop task, such as working with audio or interacting with other applications. We decide how the tool opens, what it reads or changes, and how someone can stop an action. Permissions should be explained clearly.",
      },
    ],
    scope: [
      {
        title: "Which Apple devices need to be supported?",
        text: "An iPhone screen, iPad workspace, and Mac window need different layout and interaction decisions. We choose the project's devices and identify which features are shared or device-specific. Testing should cover the intended devices, with support boundaries agreed before the build.",
      },
      {
        title: "What should work without a connection?",
        text: "Local storage can keep information on the device. Cloud synchronization adds decisions about accounts, conflicts, backups, and recovery. We define which actions work offline and what happens when connectivity returns. The app should make saved and shared information understandable to its user.",
      },
      {
        title: "What does release and maintenance involve?",
        text: "A working app and a public release need separate planning. We discuss testing, distribution, product information, and submission work in the scope. Permissions and external services may affect features or costs. Maintenance, compatibility work, and later features need an agreed arrangement.",
      },
    ],
    projectIds: ["The-Bit-Binder", "MyGigCalendar", "Open-Micer-Timer"],
    proofIntro: "The BitBinder demonstrates native notebook, import, and set-list workflows. My Gig Calendar connects a native calendar to public dates and promotional material. Open Micer Timer provides a native stage countdown with clear visual cues. Project pages identify the available app captures, product artwork, and source evidence for each example.",
    faq: [
      {
        question: "Should my idea be an app or a web app?",
        answer: "Choose a native app when the task benefits from Apple device features or a dedicated device experience. Choose a web app when browser access suits the users and workflow. We can compare those requirements before committing to a platform.",
      },
      {
        question: "Can the app have a public website too?",
        answer: "Yes. A native app can work alongside public web pages or shared data services. My Gig Calendar is a portfolio example of an app with a public fan calendar. The connection needs its own scope and access rules.",
      },
      {
        question: "Do I need every feature ready for the first release?",
        answer: "No. The first release can focus on one complete workflow. We can identify supporting features and future ideas separately so the initial app has a clear purpose and the build has an agreed boundary.",
      },
      {
        question: "Can you promise an app-store approval date?",
        answer: "No. Public distribution involves steps beyond writing the app. We can define the preparation and submission work included in the project, but an external review decision or approval date is not something I can guarantee.",
      },
    ],
  },
  {
    slug: "custom-software-development",
    title: "Custom software development",
    serviceLabel: "Custom software",
    modified: "2026-10-23",
    metaTitle: "Custom Software Development for Your Business | 4u Digital",
    description: "Custom software for document workflows, internal tools, data services, and desktop utilities. See 4u Digital examples and discuss the task you need to solve.",
    heading: "Build software around the way you work.",
    intro: "I build custom software for internal tools, desktop tasks, and connections between existing systems. Show me the work you want to improve, and we’ll define a practical scope.",
    eyebrow: "CUSTOM BUSINESS SOFTWARE",
    topic: "software",
    when: [
      {
        title: "Do documents need to become usable records?",
        text: "Custom software can turn submitted information into structured records that people can review and use. An intake form can become an approval queue with a clear status for each request. We define the input format, how a person checks the result, and how missing details or errors are handled.",
      },
      {
        title: "Does an internal task need a specialist tool?",
        text: "A custom utility can focus on recording a session, reviewing a saved report, or managing a task with its own controls. We identify where the tool will run and which equipment or services it depends on. Those details shape the interface and testing plan.",
      },
      {
        title: "Does information need to move between systems?",
        text: "A data service can connect records, search, or imports to an existing workflow. We check available formats and access methods, then define the source of truth and how failed updates are reported. Connections are scoped around verified access and the limits of existing systems.",
      },
    ],
    scope: [
      {
        title: "What is the complete task to build first?",
        text: "A useful software scope describes an input, the actions taken on it, and a result someone can check. We also work through exceptions and decisions that depend on a person. Examples of real work help establish the complete task the first version must support.",
      },
      {
        title: "Where will the software and data live?",
        text: "Custom software may run in a browser, on a desktop, or behind an existing interface. Users, device requirements, and data access guide that choice. We discuss storage and recovery alongside the screens. Hardware dependencies need suitable testing on the intended setup.",
      },
      {
        title: "How will the result be reviewed and maintained?",
        text: "We agree review criteria tied to the task, suitable sample records, and how issues are reported. Existing data needs a migration or import plan when relevant. Maintenance, access to external services, and later changes also belong in the discussion about scope and price.",
      },
    ],
    projectIds: ["usbmic", "the-trip-handler", "Showrunner-ICanRunAShow"],
    proofIntro: "SobStage demonstrates desktop recording tools and saved-take interfaces; its gallery identifies virtual-microphone captures and pending physical microphone validation. The Trip Handler shows shared records and organizer approvals. I Can Run A Show connects agreements, scheduling, and live controls in a working production workflow.",
    faq: [
      {
        question: "How is custom software different from a web app?",
        answer: "Custom software describes the tailored work, not a single platform. A web app is one way to deliver it. The project may instead need a desktop utility or a data service, depending on how the task is performed.",
      },
      {
        question: "Should I replace the tools my business already uses?",
        answer: "Only where a replacement serves the task. We can review the existing process and identify what works, what needs connecting, and what is missing. An existing tool may be sufficient for part of the project.",
      },
      {
        question: "Can you assess an unfinished idea?",
        answer: "Yes. Describe one task and show an example of its current input and result. You do not need to write a technical specification first. We can identify the questions that need answering before a build can be scoped.",
      },
      {
        question: "What determines the software price?",
        answer: "The price depends on the workflow, data, integrations, target environment, and testing requirements. We agree the scope and price before building. External service costs and a maintenance arrangement should be considered separately from the initial development work.",
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
  title: "Do you need a website, a web app, or custom software?",
  metaTitle: "Website, Web App, or Software? A Practical Guide | 4u Digital",
  description: "Compare websites, web apps, native Apple apps, and custom software by the task, users, and device requirements. Find a practical starting point with 4u Digital.",
  intro: "Choose the build by the task people need to complete. A website explains a business; a web app manages ongoing work; a native app serves a device workflow. Custom software can use any of those forms. Bring 4u Digital the problem and an example before choosing the technology.",
  rows: [
    {
      type: "Website",
      when: "Choose a website when visitors need to understand your services, view your work, or contact you. Public information and a clear next step are the priority. A request form can be included.",
      example: "Pins & Needles Comedy combines a public show website with producer controls and audience submissions.",
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
      example: "SobStage brings multiple microphone inputs, recording controls, and saved-take tools into a desktop application; its project notes explain the available demo evidence.",
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
