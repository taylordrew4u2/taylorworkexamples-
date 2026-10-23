// Owner-approved commitments shared by server-rendered public pages. This data
// is not a browser dependency and does not collect or submit client information.
const guarantee = {
  id: "guarantee",
  title: "30-day money-back guarantee.",
  text: "If you’re not satisfied with your completed product, you can request a full refund of the 4u Digital development fees paid for your project within 30 days after it launches. Email admin@customtechbuilt4u.com during that period to request your refund.",
};

const changes = {
  id: "changes",
  title: "Reasonable changes included.",
  text: "Reasonable changes are included during those 30 days after the completed product launches. Your individual contract explains what counts as a reasonable change and what would be new project scope, based on your specific needs.",
};

const support = {
  id: "support",
  title: "Optional six-month support.",
  text: "You can choose an optional six-month debugging and support arrangement. During that arrangement, changes are available at a 50% discount on the agreed standard rate. Its coverage, rates, and support details are agreed in your contract.",
};

const handover = {
  id: "handover",
  title: "Your code and deployment handover.",
  text: "You receive the code and deployment handover and are free to use your own software. Your custom code is 100% yours. Client work and code stay out of the public portfolio unless you give permission.",
};

const contract = {
  id: "contract",
  title: "A contract built around your project.",
  text: "Every contract is tailored to your specific needs and the terms you are comfortable with. We agree the scope, price, dates, changes, support, and handover in writing before the build.",
};

export const clientCare = {
  eyebrow: "CONFIDENCE BEFORE AND AFTER LAUNCH",
  heading: "Your product. Your code. Support after launch.",
  intro: "These commitments apply to every project, with the details agreed in writing before the build.",
  guarantee,
  changes,
  support,
  handover,
  contract,
  sections: [guarantee, changes, support, handover, contract],
  faq: [
    {
      question: "What does the 30-day money-back guarantee cover?",
      answer: `${guarantee.text} ${changes.text}`,
    },
    {
      question: "What support can I choose after launch?",
      answer: support.text,
    },
    {
      question: "Will I receive the code and deployment handover?",
      answer: `${handover.text} ${contract.text}`,
    },
  ],
};
