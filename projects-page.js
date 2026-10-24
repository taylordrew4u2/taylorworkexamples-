const controls = document.querySelector("#project-browser-controls");
const search = document.querySelector("#project-browser-search");
const count = document.querySelector("#project-browser-count");
const empty = document.querySelector("#project-browser-empty");
const reset = document.querySelector("#project-browser-reset");
const cards = [...document.querySelectorAll("#project-index-grid [data-project-id]")];
const buttons = [...document.querySelectorAll("[data-project-filter]")];

if (controls && search && count && empty && reset && cards.length) {
  let selectedType = "all";
  const normalize = (value) => value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
  const searchableCards = cards.map((card) => ({
    element: card,
    type: card.dataset.projectType,
    text: normalize(card.dataset.projectSearch || ""),
  }));

  function update() {
    const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const card of searchableCards) {
      const matches = (selectedType === "all" || selectedType === card.type) &&
        terms.every((term) => card.text.includes(term));
      card.element.hidden = !matches;
      if (matches) visible++;
    }
    count.textContent = `${visible} of ${cards.length} projects`;
    empty.hidden = visible !== 0;
    for (const button of buttons) {
      button.setAttribute("aria-pressed", String(button.dataset.projectFilter === selectedType));
    }
  }

  controls.addEventListener("click", (event) => {
    const button = event.target.closest("[data-project-filter]");
    if (!button) return;
    selectedType = button.dataset.projectFilter;
    update();
  });
  search.addEventListener("input", update);
  reset.addEventListener("click", () => {
    search.value = "";
    selectedType = "all";
    update();
    search.focus();
  });
  update();
  controls.hidden = false;
}
