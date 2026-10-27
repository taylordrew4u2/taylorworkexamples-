import { clientCare } from "./client-care.js";

// Shared unchanged offer promises for the offer and public guarantee policy.
export const launchOfferPaymentTerms = "Half is paid at the start and half at launch. If the first design review, before any code is written, is not right, the deposit comes back.";
export const launchOfferContentChangeTerms = "This website offer also includes three months of content changes after launch, so hours, prices, and photos can settle in. That offer-specific benefit is in addition to the 30-day money-back guarantee and reasonable changes included with every project.";

export const launchOffer = {
  title: "Website offer for New York City businesses",
  metaTitle: "Website Offer for New York City Businesses | 4u Digital",
  description: "A custom website for $190, or $475 with booking or ordering built in, for the first ten eligible New York City business projects agreed by November 30, 2026. Subject to scope and capacity; the code is yours.",
  eyebrow: "THROUGH NOVEMBER 30 · FIRST TEN NEW YORK CITY BUSINESSES",
  heading: "A website you own, for $190.",
  intro: "A custom website for $190, or $475 with booking or ordering built in. Available for the first ten eligible New York City business projects agreed by November 30, 2026, subject to scope and capacity. Start with a consultation to discuss whether it fits your business.",
  modified: "2026-10-27",
  price: "190",
  validUntil: "2026-11-30",
  sections: [
    {
      heading: "What the $190 site includes.",
      text: `Up to five pages, built in code and laid out for phones first: what you do, your services or menu, hours, address, examples of your work, and a contact or request form that lands in your inbox. The domain and hosting are set up in your name. ${launchOfferContentChangeTerms}`,
    },
    {
      heading: "What $475 adds.",
      text: "Booking or ordering built into the same site. For a salon or studio, that is choosing a service and requesting a time, with a staff view to accept it. For a restaurant, that is a pickup menu with options and a staff order queue. For a school or program, that is enrollment, tour booking, or a waitlist. A first version covers one complete task; delivery, loyalty, or a native app can come later.",
    },
    {
      heading: "How it works.",
      text: `Start with a video consultation to discuss the fit. If seeing your space or workflow would help, we can arrange a visit in Manhattan, Brooklyn, or parts of Queens. A consultation does not commit you to a paid project. Before the build, we agree the scope, price, project start, and target launch date in writing, including the pages, form or booking flow, and who supplies the content and access. ${launchOfferPaymentTerms}`,
    },
    {
      heading: "What you own.",
      text: "The code, the domain, the hosting account, and your data. There is no monthly builder fee and no percentage on bookings or orders. After the first year, the domain renews in your name for about $20 a year, and hosting runs $0 to $10 a month depending on traffic.",
    },
  ],
  faq: [
    {
      question: "Why ten, and why November 30?",
      answer: "4u Digital is one developer, so the offer is limited to the first ten eligible New York City business projects agreed by November 30, 2026, subject to scope and capacity. A consultation is a discussion about fit; it does not reserve one of the ten projects or commit you to paid work. The scope, price, project start, and target launch date are agreed in writing before the build.",
    },
    {
      question: "When could my project start and launch?",
      answer: "We agree the project start and target launch date in writing before building. Timing depends on the scope, capacity, and when content and account access are available. The consultation helps identify those requirements; booking it does not promise a project start or launch date.",
    },
    {
      question: "What happens after November 30?",
      answer: "Websites and booking or ordering systems are still available at scope-based pricing. The price is agreed before building either way.",
    },
    {
      question: "I already have a website. Does the offer apply?",
      answer: "Yes. A rebuild of an existing site counts. Bring the current address and what frustrates you about it. Useful content carries over.",
    },
    {
      question: "Can the site connect to the booking tool I already use?",
      answer: "Often. The site can link to it, or a custom booking flow can replace it. Share the tool you use and its access can be checked before anything is promised.",
    },
    {
      question: "Do I need content ready?",
      answer: "No. Bring what you have, even a service list and a few photos. Missing content is identified at the start and who supplies it is agreed before building.",
    },
    ...clientCare.faq,
  ],
  bookingIntro: "Book a video consultation through BriefBooth to discuss whether the offer fits your business. A rough idea is enough to start, and the consultation does not commit you to a paid project. For project questions, email admin@customtechbuilt4u.com.",
  serviceSlugs: [
    "website-development",
    "salon-booking-app-development",
    "restaurant-ordering-app-development",
  ],
};
