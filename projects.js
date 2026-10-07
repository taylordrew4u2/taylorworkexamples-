// Public project inventory verified against GitHub on 2026-10-06.
// Featured client-facing examples and live links verified on 2026-10-07.
// Sources stay alongside each entry so portfolio claims remain traceable.
export const email = "taylordrew4u@gmail.com";

// experiment marks focused utilities and development projects for the tools filter.
export const projects = [
  {
    id: "Showrunner-ICanRunAShow",
    title: "I Can Run A Show",
    category: "web",
    summary:
      "A live-show workspace for booking performers, collecting signed contracts, and running cue timers and walk-on music from a phone.",
    stack: ["React", "TypeScript", "Vite", "Turso", "PWA", "Web Crypto"],
    features: [
      "Offline show planning and full-screen live mode",
      "On-device photo, PDF, and text schedule import",
      "Client-side encrypted shows and media",
      "Shareable contract signing and live viewer",
    ],
    repoUrl: "https://github.com/taylordrew4u2/Showrunner-ICanRunAShow",
    demoUrl: "https://icanrunashow.com",
    demoLabel: "Live site",
    image: "./assets/showrunner.webp",
    imageAlt:
      "I Can Run A Show live control interface with a countdown and soundboard",
    portrait: false,
    tone: "sage",
    badge: "LIVE WEB APP",
    experiment: false,
    sources: [
      "https://github.com/taylordrew4u2/Showrunner-ICanRunAShow",
      "https://api.github.com/repos/taylordrew4u2/Showrunner-ICanRunAShow",
      "https://github.com/taylordrew4u2/Showrunner-ICanRunAShow/blob/main/README.md",
    ],
    clientSummary:
      "A web application for event producers to manage performers, schedules, contracts, music, and live show cues.",
    demonstrates: [
      "Application workflow design",
      "Offline-capable interfaces",
      "Client-side data encryption",
      "Contract-signing and API workflows",
    ],
    projectType: "Web application",
    challenge:
      "Bring booking, paperwork, and live show operation into one interface that can work without a reliable venue connection.",
    build:
      "A React and TypeScript PWA with encrypted persistence, on-device schedule import, contract signing, and a full-screen cue timer and soundboard.",
  },
  {
    id: "The-Bit-Binder",
    title: "The BitBinder",
    category: "ios",
    summary:
      "A native iOS notebook for stand-up comedians: capture ideas, record and transcribe sets, import source material, and organize stage-ready set lists.",
    stack: [
      "Swift",
      "SwiftUI",
      "SwiftData",
      "CloudKit",
      "AVFoundation",
      "Speech",
      "Vision",
    ],
    features: [
      "On-device transcription and OCR import",
      "Reviewable multi-format import pipeline",
      "Private iCloud sync, backups, and trash recovery",
      "Writing assistant with local and optional AI backends",
    ],
    repoUrl: "https://github.com/taylordrew4u2/The-Bit-Binder",
    demoUrl: "https://apps.apple.com/us/app/the-bitbinder/id6756085897",
    demoLabel: "App Store",
    image: "./assets/bitbinder.webp",
    imageAlt: "The BitBinder iPhone home screen",
    portrait: true,
    tone: "peach",
    badge: "APP STORE",
    experiment: false,
    sources: [
      "https://github.com/taylordrew4u2/The-Bit-Binder",
      "https://api.github.com/repos/taylordrew4u2/The-Bit-Binder",
      "https://github.com/taylordrew4u2/The-Bit-Binder/blob/main/README.md",
    ],
    clientSummary:
      "An iOS app for comedians to capture material, record and transcribe sets, import notes, and build performance set lists.",
    demonstrates: [
      "Native iOS development",
      "Audio recording and transcription",
      "On-device text import",
      "Private cloud sync",
      "App Store delivery",
    ],
    projectType: "iOS app",
    challenge:
      "Organize material spread across notes, recordings, photos, and PDFs in a single native app.",
    build:
      "A SwiftUI app with SwiftData and CloudKit, audio recording, speech recognition, OCR and document import, a review queue, and set-list tools.",
  },
  {
    id: "the-trip-handler",
    title: "The Trip Handler",
    category: "web",
    summary:
      "A group-trip platform with private invitations, applications, approvals, lodging, meals, itineraries, shared expenses, and Stripe payments.",
    stack: [
      "Next.js",
      "TypeScript",
      "Prisma",
      "PostgreSQL",
      "Stripe",
      "NextAuth",
    ],
    features: [
      "Invite links and approval workflow",
      "Beds, meals, itinerary, and expense coordination",
      "Stripe Checkout and signed webhook handling",
    ],
    repoUrl: "https://github.com/taylordrew4u2/the-trip-handler",
    demoUrl: "https://the-trip-handler.vercel.app",
    demoLabel: "Live site",
    image: "./assets/triphandler.webp",
    imageAlt:
      "The Trip Handler trip dashboard with shared planning information",
    portrait: false,
    tone: "blue",
    badge: "LIVE WEB APP",
    experiment: false,
    sources: [
      "https://github.com/taylordrew4u2/the-trip-handler",
      "https://api.github.com/repos/taylordrew4u2/the-trip-handler",
      "https://github.com/taylordrew4u2/the-trip-handler/blob/main/README.md",
    ],
    clientSummary:
      "A web application for organizers to invite a group, approve participants, plan a trip, and collect payments.",
    demonstrates: [
      "Authentication and permissions",
      "Multi-step approval workflows",
      "Database-backed coordination",
      "Stripe payment integration",
    ],
    projectType: "Web application",
    challenge:
      "Coordinate applications, lodging, meals, schedules, expenses, and participant payments in one shared trip workspace.",
    build:
      "A Next.js application with private invitations, organizer approvals, PostgreSQL and Prisma, lodging and itinerary tools, and Stripe Checkout with signed webhooks.",
  },
  {
    id: "Role-Call",
    title: "RoleCall",
    category: "web",
    summary:
      "A full-stack filmmaking workspace that turns screenplays into cast and shot lists, then brings the crew together to plan roles and schedules.",
    stack: ["Next.js", "TypeScript", "Clerk", "Drizzle", "PostgreSQL"],
    features: [
      "Script-to-cast and shot-list workflows",
      "Project invites and access control",
      "Shared roles and shoot scheduling",
    ],
    repoUrl: "https://github.com/taylordrew4u2/Role-Call",
    demoUrl: "https://rolecall.space",
    demoLabel: "Live site",
    image: "./assets/rolecall.svg",
    imageAlt: "RoleCall dashboard UI preview with project and series cards",
    portrait: false,
    tone: "lavender",
    badge: "UI PREVIEW",
    experiment: false,
    sources: [
      "https://github.com/taylordrew4u2/Role-Call",
      "https://api.github.com/repos/taylordrew4u2/Role-Call",
      "https://github.com/taylordrew4u2/Role-Call/blob/main/README.md",
    ],
  },
  {
    id: "Bill-Spilt",
    title: "BillSpilt",
    category: "web",
    summary:
      "An installable roommate expense app that works offline, protects personal numbers, and settles household debts with fewer payments.",
    stack: ["Next.js", "React", "TypeScript", "PostgreSQL", "Dexie", "PWA"],
    features: [
      "Shared expenses and household balances",
      "Debt settlement planning",
      "Offline persistence and sync",
    ],
    repoUrl: "https://github.com/taylordrew4u2/Bill-Spilt",
    demoUrl: "https://billspilt.com",
    demoLabel: "Live site",
    image: "./assets/billspilt.webp",
    imageAlt: "BillSpilt household balances screen on a phone",
    portrait: true,
    tone: "yellow",
    badge: "LIVE WEB APP",
    experiment: false,
    sources: [
      "https://github.com/taylordrew4u2/Bill-Spilt",
      "https://api.github.com/repos/taylordrew4u2/Bill-Spilt",
      "https://github.com/taylordrew4u2/Bill-Spilt/blob/main/README.md",
    ],
  },
  {
    id: "MyGigCalendar",
    title: "My Gig Calendar",
    category: "ios",
    summary:
      "A native calendar for live performers that syncs gigs across devices, publishes a fan calendar, and turns show details into promotional flyers.",
    stack: [
      "Swift",
      "SwiftUI",
      "Core Data",
      "CloudKit",
      "EventKit",
      "StoreKit",
    ],
    features: [
      "Private gig sync and public fan calendar",
      "Shareable promotional flyers",
      "iCalendar feed and system calendar integration",
    ],
    repoUrl: "https://github.com/taylordrew4u2/MyGigCalendar",
    demoUrl: "https://apps.apple.com/us/app/my-gig-calendar/id6760590068",
    demoLabel: "App Store",
    image: "./assets/gigcalendar.webp",
    imageAlt: "My Gig Calendar public calendar on a phone",
    portrait: true,
    tone: "blue",
    badge: "APP STORE",
    experiment: false,
    sources: [
      "https://github.com/taylordrew4u2/MyGigCalendar",
      "https://api.github.com/repos/taylordrew4u2/MyGigCalendar",
      "https://github.com/taylordrew4u2/MyGigCalendar/blob/main/README.md",
    ],
    clientSummary:
      "An iOS app for live performers to manage their gigs, publish dates for fans, and create promotional flyers.",
    demonstrates: [
      "Native iOS development",
      "Device and cloud sync",
      "Public web integration",
      "Calendar feeds",
      "App Store delivery",
    ],
    projectType: "iOS app",
    challenge:
      "Let a performer manage gig information across their devices, a fan calendar, calendar subscriptions, and promotional assets.",
    build:
      "A SwiftUI app using Core Data and CloudKit, a public web calendar, an iCalendar feed, and flyer generation.",
  },
  {
    id: "bleepkit",
    title: "BleepKit",
    category: "ios",
    summary:
      "An iOS tool for social creators with on-device transcription, captions, profanity detection, and censor layers.",
    stack: ["Swift"],
    features: [
      "On-device transcription and captions",
      "Profanity detection and censor layers",
    ],
    repoUrl: "https://github.com/taylordrew4u2/bleepkit",
    demoUrl: null,
    demoLabel: "Live site",
    image: null,
    imageAlt: "",
    portrait: false,
    tone: "peach",
    badge: "SOURCE AVAILABLE",
    experiment: true,
    sources: [
      "https://github.com/taylordrew4u2/bleepkit",
      "https://api.github.com/repos/taylordrew4u2/bleepkit",
    ],
  },
  {
    id: "dictype",
    title: "DicType",
    category: "desktop",
    summary:
      "A native macOS dictation app that types spoken text into other applications one character at a time with a natural cadence.",
    stack: ["Swift", "SwiftUI"],
    features: [
      "Streaming dictation",
      "Real synthesized keystrokes",
      "Configurable typing cadence",
    ],
    repoUrl: "https://github.com/taylordrew4u2/dictype",
    demoUrl: null,
    demoLabel: "Live site",
    image: null,
    imageAlt: "",
    portrait: false,
    tone: "lavender",
    badge: "SOURCE AVAILABLE",
    experiment: true,
    sources: [
      "https://github.com/taylordrew4u2/dictype",
      "https://api.github.com/repos/taylordrew4u2/dictype",
      "https://github.com/taylordrew4u2/dictype/blob/main/README.md",
    ],
  },
  {
    id: "HealYourHeart",
    title: "Heal Your Heart",
    category: "ios",
    summary:
      "A native iOS project for guided spoken exercises using Apple on-device frameworks.",
    stack: ["Swift"],
    features: ["Guided spoken exercises", "Apple on-device processing"],
    repoUrl: "https://github.com/taylordrew4u2/HealYourHeart",
    demoUrl: null,
    demoLabel: "Live site",
    image: null,
    imageAlt: "",
    portrait: false,
    tone: "lavender",
    badge: "SOURCE AVAILABLE",
    experiment: true,
    sources: [
      "https://github.com/taylordrew4u2/HealYourHeart",
      "https://api.github.com/repos/taylordrew4u2/HealYourHeart",
      "https://github.com/taylordrew4u2/HealYourHeart/blob/main/README.md",
    ],
  },
  {
    id: "laugh-extractor",
    title: "Laugh Extractor",
    category: "desktop",
    summary:
      "A macOS audio tool that extracts clean audience laughter from a stand-up recording into separate files.",
    stack: ["Swift"],
    features: [
      "Audience-laughter detection",
      "Separate audio file per laugh",
      "Local processing and export formats",
    ],
    repoUrl: "https://github.com/taylordrew4u2/laugh-extractor",
    demoUrl: null,
    demoLabel: "Live site",
    image: null,
    imageAlt: "",
    portrait: false,
    tone: "yellow",
    badge: "SOURCE AVAILABLE",
    experiment: true,
    sources: [
      "https://github.com/taylordrew4u2/laugh-extractor",
      "https://api.github.com/repos/taylordrew4u2/laugh-extractor",
      "https://github.com/taylordrew4u2/laugh-extractor/blob/main/README.md",
    ],
  },
  {
    id: "Laugh-Map",
    title: "Laugh Map",
    category: "ios",
    summary:
      "An iOS app that lines up on-device Whisper transcription with audience response in a recorded stand-up set.",
    stack: ["Swift", "Whisper", "C", "C++"],
    features: ["On-device set transcription", "Audience-response alignment"],
    repoUrl: "https://github.com/taylordrew4u2/Laugh-Map",
    demoUrl: null,
    demoLabel: "Live site",
    image: null,
    imageAlt: "",
    portrait: false,
    tone: "blue",
    badge: "SOURCE AVAILABLE",
    experiment: true,
    sources: [
      "https://github.com/taylordrew4u2/Laugh-Map",
      "https://api.github.com/repos/taylordrew4u2/Laugh-Map",
    ],
  },
  {
    id: "markvegas",
    title: "Mark Vegas Art Portfolio",
    category: "web",
    summary:
      "An editorial portfolio for an animator with a media mosaic, editable profile, portfolio management, and theme controls.",
    stack: ["HTML", "CSS", "JavaScript", "Turso", "Vercel Blob"],
    features: [
      "Image and video portfolio CRUD",
      "Password-protected admin",
      "Theme selection and direct media uploads",
    ],
    repoUrl: "https://github.com/taylordrew4u2/markvegas",
    demoUrl: "https://markvegas.vercel.app",
    demoLabel: "Live website",
    image: "./assets/markvegas.webp",
    imageAlt:
      "The live Mark Vegas portfolio website showing artwork in its media grid",
    portrait: false,
    tone: "sage",
    badge: "LIVE WEBSITE",
    experiment: false,
    sources: [
      "https://github.com/taylordrew4u2/markvegas",
      "https://api.github.com/repos/taylordrew4u2/markvegas",
      "https://github.com/taylordrew4u2/markvegas/blob/main/README.md",
    ],
    clientSummary:
      "An editable portfolio website for an animator to present image and video work, a profile, and contact details.",
    demonstrates: [
      "Visual website design",
      "Owner-editable content",
      "Image and video uploads",
      "Database-backed site features",
    ],
    projectType: "Website",
    challenge:
      "Present visual work while giving the site owner control over their profile, portfolio, and theme.",
    build:
      "An editorial media grid with a password-protected admin, portfolio editing, Turso data storage, and Vercel Blob uploads.",
  },
  {
    id: "micro-short-website",
    title: "Micro-short Film Website",
    category: "web",
    summary:
      "A cinematic promotional website for the short film Oh Shit, Did We Just Kill a Guy?, with festival recognition, stills, cast, and crew.",
    stack: ["HTML", "CSS", "JavaScript", "Vercel"],
    features: [
      "Responsive film promotion",
      "Festival and award gallery",
      "Cast, crew, and contact sections",
    ],
    repoUrl: "https://github.com/taylordrew4u2/micro-short-website",
    demoUrl: "https://micro-short-website.vercel.app",
    demoLabel: "Live site",
    image: "./assets/microshort.webp",
    imageAlt: "The promotional homepage for Oh Shit, Did We Just Kill a Guy?",
    portrait: false,
    tone: "peach",
    badge: "LIVE WEB APP",
    experiment: false,
    sources: [
      "https://github.com/taylordrew4u2/micro-short-website",
      "https://api.github.com/repos/taylordrew4u2/micro-short-website",
      "https://github.com/taylordrew4u2/micro-short-website/blob/main/README.md",
    ],
  },
  {
    id: "mystorydailjournal",
    title: "My Story: Daily Journal",
    category: "ios",
    summary:
      "A native journaling project built around daily records, fast capture, context signals, and a product spec maintained in the repository.",
    stack: ["Swift", "SwiftUI", "CloudKit"],
    features: [
      "Daily journal and capture workflows",
      "Context-based digest generation",
      "Documented build milestones",
    ],
    repoUrl: "https://github.com/taylordrew4u2/mystorydailjournal",
    demoUrl: null,
    demoLabel: "Live site",
    image: null,
    imageAlt: "",
    portrait: false,
    tone: "peach",
    badge: "SOURCE AVAILABLE",
    experiment: true,
    sources: [
      "https://github.com/taylordrew4u2/mystorydailjournal",
      "https://api.github.com/repos/taylordrew4u2/mystorydailjournal",
      "https://github.com/taylordrew4u2/mystorydailjournal/blob/main/README.md",
    ],
    notes:
      "In development. The repository documents uncompiled areas and remaining implementation work.",
  },
  {
    id: "nycstandupopenmicmaster",
    title: "NYC Open Mic Master List",
    category: "web",
    summary:
      "A self-updating open-mic directory with source polling, a five-borough map, public corrections, and host accounts.",
    stack: ["Python", "FastAPI", "PostgreSQL", "JavaScript", "Docker"],
    features: [
      "Scheduled source ingestion and review queue",
      "Custom map over OpenStreetMap tiles",
      "Verified host listing management",
    ],
    repoUrl: "https://github.com/taylordrew4u2/nycstandupopenmicmaster",
    demoUrl: null,
    demoLabel: "Live site",
    image: "./assets/openmic.webp",
    imageAlt:
      "NYC Open Mic Master List directory with borough map and listings",
    portrait: false,
    tone: "sage",
    badge: "SOURCE AVAILABLE",
    experiment: false,
    sources: [
      "https://github.com/taylordrew4u2/nycstandupopenmicmaster",
      "https://api.github.com/repos/taylordrew4u2/nycstandupopenmicmaster",
      "https://github.com/taylordrew4u2/nycstandupopenmicmaster/blob/main/README.md",
    ],
  },
  {
    id: "Open-Micer-Timer",
    title: "Open Micer Timer",
    category: "ios",
    summary:
      "A SwiftUI stage timer for open mics that tracks time on stage and gives the performer the light.",
    stack: ["Swift", "SwiftUI"],
    features: ["Stage countdown", "Performer timing cue"],
    repoUrl: "https://github.com/taylordrew4u2/Open-Micer-Timer",
    demoUrl: null,
    demoLabel: "Live site",
    image: null,
    imageAlt: "",
    portrait: false,
    tone: "yellow",
    badge: "SOURCE AVAILABLE",
    experiment: true,
    sources: [
      "https://github.com/taylordrew4u2/Open-Micer-Timer",
      "https://api.github.com/repos/taylordrew4u2/Open-Micer-Timer",
    ],
  },
  {
    id: "PinsAndNeedlesComedyWebsite",
    title: "Pins & Needles Comedy",
    category: "web",
    summary:
      "A public website and control center for a New York comedy show, connecting audience submissions and live stage operations.",
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
    features: [
      "Public show page and editable content",
      "Live control center",
      "Audience submissions and stage workflow",
    ],
    repoUrl: "https://github.com/taylordrew4u2/PinsAndNeedlesComedyWebsite",
    demoUrl: "https://pinsandneedlescomedy.com",
    demoLabel: "Live website",
    image: "./assets/pinsneedles.webp",
    imageAlt:
      "The Pins & Needles Comedy homepage with show branding and navigation",
    portrait: false,
    tone: "peach",
    badge: "LIVE WEBSITE",
    experiment: false,
    sources: [
      "https://github.com/taylordrew4u2/PinsAndNeedlesComedyWebsite",
      "https://api.github.com/repos/taylordrew4u2/PinsAndNeedlesComedyWebsite",
      "https://github.com/taylordrew4u2/PinsAndNeedlesComedyWebsite/blob/main/README.md",
    ],
    clientSummary:
      "A website for a live comedy show, with editable public content and tools for producers to manage audience submissions during the show.",
    demonstrates: [
      "Public website development",
      "Admin content editing",
      "Audience submission workflows",
      "Live dashboard and display integration",
    ],
    projectType: "Website",
    challenge:
      "Connect a public show website to private producer controls and a public live audience display.",
    build:
      "A Next.js website with an admin, scheduled submission access, a show-control dashboard, and a separate projector display.",
  },
  {
    id: "CONTROLLEREVENT",
    title: "Pins & Needles Show Controller",
    category: "desktop",
    summary:
      "A live audio controller and run-of-show manager with performer cues, countdowns, and an optional public web viewer.",
    stack: ["TypeScript", "CSS", "JavaScript"],
    features: [
      "Performer library and lineup builder",
      "Live audio and countdown control",
      "Optional audience-facing web viewer",
    ],
    repoUrl: "https://github.com/taylordrew4u2/CONTROLLEREVENT",
    demoUrl: null,
    demoLabel: "Live site",
    image: null,
    imageAlt: "",
    portrait: false,
    tone: "sage",
    badge: "SOURCE AVAILABLE",
    experiment: true,
    sources: [
      "https://github.com/taylordrew4u2/CONTROLLEREVENT",
      "https://api.github.com/repos/taylordrew4u2/CONTROLLEREVENT",
      "https://github.com/taylordrew4u2/CONTROLLEREVENT/blob/main/README.md",
    ],
  },
  {
    id: "comedysub",
    title: "Pins & Needles Submissions",
    category: "web",
    summary:
      "A full-stack submission and booking platform where comedians apply through a public form and organizers manage applicants and lineups.",
    stack: ["Next.js", "React", "TypeScript", "PostgreSQL", "Vercel Blob"],
    features: [
      "Validated public application form",
      "Admin applicant pipeline and lineup booking",
      "Printable lineup and email drafts",
    ],
    repoUrl: "https://github.com/taylordrew4u2/comedysub",
    demoUrl: null,
    demoLabel: "Live site",
    image: null,
    imageAlt: "",
    portrait: false,
    tone: "blue",
    badge: "SOURCE AVAILABLE",
    experiment: false,
    sources: [
      "https://github.com/taylordrew4u2/comedysub",
      "https://api.github.com/repos/taylordrew4u2/comedysub",
      "https://github.com/taylordrew4u2/comedysub/blob/main/README.md",
    ],
  },
  {
    id: "usbmic",
    title: "SobStage",
    category: "desktop",
    summary:
      "A cross-platform recorder that combines up to eight USB microphones into separate audio tracks, a summed mix, and one live monitor mix.",
    stack: ["C++17", "JUCE", "CMake", "CoreAudio", "WASAPI", "ALSA"],
    features: [
      "Independent-clock drift correction",
      "Multitrack recording and live monitoring",
      "Crash recovery and loudness export",
    ],
    repoUrl: "https://github.com/taylordrew4u2/usbmic",
    demoUrl: null,
    demoLabel: "Live site",
    image: "./assets/sobstage.webp",
    imageAlt:
      "SobStage desktop recorder with microphone channels and recording controls",
    portrait: false,
    tone: "dark",
    badge: "SOURCE AVAILABLE",
    experiment: true,
    sources: [
      "https://github.com/taylordrew4u2/usbmic",
      "https://api.github.com/repos/taylordrew4u2/usbmic",
      "https://github.com/taylordrew4u2/usbmic/blob/main/README.md",
    ],
    notes:
      "Release candidate. Physical-microphone validation is still in progress.",
  },
  {
    id: "staybusy",
    title: "StayBusy",
    category: "ios",
    summary:
      "An ADHD-first solo-trip schedule app with a clear Now / Next view, visible open time, and a day-by-day itinerary.",
    stack: ["Swift", "SwiftUI", "SwiftData", "MapKit"],
    features: [
      "Proportional daily timeline",
      "Map pins and leave-by details",
      "Multi-day trip density overview",
    ],
    repoUrl: "https://github.com/taylordrew4u2/staybusy",
    demoUrl: null,
    demoLabel: "Live site",
    image: null,
    imageAlt: "",
    portrait: false,
    tone: "peach",
    badge: "SOURCE AVAILABLE",
    experiment: true,
    sources: [
      "https://github.com/taylordrew4u2/staybusy",
      "https://api.github.com/repos/taylordrew4u2/staybusy",
      "https://github.com/taylordrew4u2/staybusy/blob/main/README.md",
    ],
  },
  {
    id: "taylosite",
    title: "Personal website",
    category: "web",
    summary:
      "A retro desktop-window personal website with a full admin panel for editing copy, links, photos, dates, and colors.",
    stack: ["JavaScript", "Node.js", "CSS", "Vercel Blob"],
    features: [
      "Server-rendered pages without a build step",
      "Editable site content and media",
      "Desktop-window interaction design",
    ],
    repoUrl: "https://github.com/taylordrew4u2/taylosite",
    demoUrl: "https://taylordrewcomedy.com",
    demoLabel: "Live site",
    image: null,
    imageAlt: "",
    portrait: false,
    tone: "blue",
    badge: "LIVE WEB APP",
    experiment: false,
    sources: [
      "https://github.com/taylordrew4u2/taylosite",
      "https://api.github.com/repos/taylordrew4u2/taylosite",
      "https://github.com/taylordrew4u2/taylosite/blob/main/README.md",
    ],
  },
  {
    id: "tlcmassagewellness",
    title: "TLC Massage Wellness",
    category: "web",
    summary:
      "A booking website with an owner-editable admin panel for site content, treatments, staff, intake questions, and appointment requests.",
    stack: ["Next.js", "TypeScript", "PostgreSQL", "Vercel Blob"],
    features: [
      "Treatment-aware booking requests",
      "Accept or decline workflow",
      "Editable public content and team",
    ],
    repoUrl: "https://github.com/taylordrew4u2/tlcmassagewellness",
    demoUrl: null,
    demoLabel: "Live site",
    image: null,
    imageAlt: "",
    portrait: false,
    tone: "sage",
    badge: "SOURCE AVAILABLE",
    experiment: false,
    sources: [
      "https://github.com/taylordrew4u2/tlcmassagewellness",
      "https://api.github.com/repos/taylordrew4u2/tlcmassagewellness",
      "https://github.com/taylordrew4u2/tlcmassagewellness/blob/main/README.md",
    ],
  },
  {
    id: "vlognudge",
    title: "VlogNudge",
    category: "ios",
    summary:
      "An ADHD-aware video journal that uses on-device context to nudge creators to film one short clip at a time.",
    stack: [
      "Swift",
      "SwiftUI",
      "SwiftData",
      "CloudKit",
      "ActivityKit",
      "WidgetKit",
    ],
    features: [
      "Deterministic context-aware reminder scoring",
      "Local notification scheduling",
      "Live Activity and widgets",
      "Photos album capture workflow",
    ],
    repoUrl: "https://github.com/taylordrew4u2/vlognudge",
    demoUrl: null,
    demoLabel: "Live site",
    image: null,
    imageAlt: "",
    portrait: false,
    tone: "dark",
    badge: "SOURCE AVAILABLE",
    experiment: true,
    sources: [
      "https://github.com/taylordrew4u2/vlognudge",
      "https://api.github.com/repos/taylordrew4u2/vlognudge",
      "https://github.com/taylordrew4u2/vlognudge/blob/main/README.md",
    ],
  },
];

const featuredIds = [
  "markvegas",
  "The-Bit-Binder",
  "PinsAndNeedlesComedyWebsite",
  "Showrunner-ICanRunAShow",
  "the-trip-handler",
  "MyGigCalendar",
];
export const featuredProjects = featuredIds.map((id) =>
  projects.find((project) => project.id === id),
);

/** Return projects matching a platform (or tools) and every search term. */
export function filterProjects(collection, category = "all", query = "") {
  const selectedCategory = category.trim().toLowerCase();
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

  return collection.filter((project) => {
    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "tools"
        ? project.experiment === true
        : project.category === selectedCategory);
    const searchText = [
      project.id,
      project.title,
      project.summary,
      project.category,
      ...project.stack,
    ]
      .join(" ")
      .toLowerCase();
    return matchesCategory && terms.every((term) => searchText.includes(term));
  });
}
