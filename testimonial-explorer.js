// Progressive enhancement: the three featured quotes and native disclosure stay
// readable when JavaScript is unavailable. Only visitors on smaller screens get
// the manual, swipeable rail; nothing advances without their input.
export function initTestimonialExplorer() {
  const section = document.querySelector("#testimonials");
  if (!section || section.classList.contains("feedback-ready")) return;
  const rail = section.querySelector(":scope > .testimonial-grid");
  const controls = section.querySelector(".feedback-controls");
  const cards = rail ? Array.from(rail.querySelectorAll(":scope > .testimonial-card")) : [];
  const previous = controls?.querySelector("[data-feedback-prev]");
  const next = controls?.querySelector("[data-feedback-next]");
  const position = controls?.querySelector(".feedback-position");
  const showAll = controls?.querySelector("[data-feedback-all]");
  const more = section.querySelector(".testimonial-more");
  const summary = more?.querySelector("summary");
  if (!rail || cards.length < 2 || !controls || !previous || !next || !position || !showAll || !more || !summary) return;

  const mobile = window.matchMedia("(max-width: 900px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let current = 0;

  function offsets() {
    const railLeft = rail.getBoundingClientRect().left + rail.clientLeft;
    const limit = Math.max(0, rail.scrollWidth - rail.clientWidth);
    return cards.map((card) => Math.max(0, Math.min(limit,
      card.getBoundingClientRect().left - railLeft + rail.scrollLeft)));
  }

  function update() {
    if (!mobile.matches) return;
    const positions = offsets();
    current = positions.reduce((closest, offset, index) =>
      Math.abs(offset - rail.scrollLeft) < Math.abs(positions[closest] - rail.scrollLeft)
        ? index : closest, 0);
    const label = `${current + 1} of ${cards.length}`;
    if (position.textContent !== label) position.textContent = label;
    previous.disabled = current === 0;
    next.disabled = current === cards.length - 1;
  }

  function move(index) {
    if (!mobile.matches) return;
    const selected = Math.max(0, Math.min(cards.length - 1, index));
    rail.scrollTo({
      left: offsets()[selected],
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }

  function updateMode() {
    if (mobile.matches) {
      rail.tabIndex = 0;
      rail.setAttribute("role", "region");
      rail.setAttribute("aria-label", "Client testimonials");
      update();
    } else {
      rail.removeAttribute("tabindex");
      rail.removeAttribute("role");
      rail.removeAttribute("aria-label");
    }
  }

  previous.addEventListener("click", () => move(current - 1));
  next.addEventListener("click", () => move(current + 1));
  rail.addEventListener("scroll", update, { passive: true });
  rail.addEventListener("keydown", (event) => {
    if (event.target !== rail || !mobile.matches || event.altKey || event.ctrlKey || event.metaKey) return;
    const destinations = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: cards.length - 1 };
    if (!(event.key in destinations)) return;
    event.preventDefault();
    move(destinations[event.key]);
  });
  showAll.addEventListener("click", () => {
    more.open = true;
    // Native focus brings the disclosure into view without a competing smooth
    // scroll or a delayed focus change that could steal the visitor's place.
    summary.focus();
  });
  window.addEventListener("resize", updateMode, { passive: true });
  section.classList.add("feedback-ready");
  controls.hidden = false;
  updateMode();
}
