// Small original layout illustrations for discussing a direction, never finished client designs.
export const briefDesignSamples = Object.freeze({
  clean: Object.freeze({ name: "Clean", site: "Room to breathe.", app: "Your day", detail: "Open space, clear type, and a simple structure." }),
  warm: Object.freeze({ name: "Warm", site: "Feel right at home.", app: "Welcome back", detail: "Soft shapes, gentle spacing, and a welcoming feel." }),
  bold: Object.freeze({ name: "Bold", site: "MAKE IT HAPPEN.", app: "LET’S GO.", detail: "Strong contrast, big statements, and confident layouts." }),
  premium: Object.freeze({ name: "Refined", site: "Considered. Crafted.", app: "Every detail", detail: "Fine lines, elegant type, and carefully placed details." }),
  playful: Object.freeze({ name: "Playful", site: "A little more joy.", app: "Pick your day", detail: "Rounded shapes, lively composition, and a lighter mood." }),
  professional: Object.freeze({ name: "Professional", site: "A clearer way forward.", app: "Your overview", detail: "Calm structure, consistent sections, and clear next steps." }),
  practical: Object.freeze({ name: "Practical", site: "Everything in one place.", app: "Today’s tasks", detail: "Useful lists, visible controls, and information up front." }),
});

export const briefFontSamples = Object.freeze({
  modern: Object.freeze({ text: "A clear beginning.", description: "Clean, geometric, and direct." }),
  friendly: Object.freeze({ text: "Good to see you.", description: "Open, relaxed, and approachable." }),
  editorial: Object.freeze({ text: "A story worth telling.", description: "Expressive, with a magazine-like feel." }),
  classic: Object.freeze({ text: "Made to feel timeless.", description: "Traditional, familiar, and composed." }),
  technical: Object.freeze({ text: "Everything, in order.", description: "Precise, structured, and functional." }),
  unsure: Object.freeze({ text: "Let’s explore together.", description: "You can leave the font direction open." }),
});

export function renderDesignSample(value) {
  const design = briefDesignSamples[value];
  if (!design) return "";
  return `<span class="brief-style-samples brief-style-${value}" aria-hidden="true"><span class="brief-mini-site"><span class="brief-mini-chrome"><i></i><i></i><i></i></span><span class="brief-mini-page"><span class="brief-mini-nav"><b>YOUR BRAND</b><i></i><i></i></span><span class="brief-mini-layout"><span class="brief-mini-heading">${design.site}</span><span class="brief-mini-copy"><i></i><i></i></span><span class="brief-mini-action">Explore ↗</span><span class="brief-mini-blocks"><i></i><i></i><i></i></span><span class="brief-mini-table"><i></i><i></i><i></i></span></span></span></span><span class="brief-mini-phone"><span class="brief-mini-speaker"></span><span class="brief-mini-app"><span class="brief-mini-app-title">${design.app}</span><span class="brief-mini-app-feature"></span><span class="brief-mini-app-rows"><i></i><i></i><i></i></span><span class="brief-mini-app-tabbar"><i></i><i></i><i></i></span></span></span></span>`;
}
