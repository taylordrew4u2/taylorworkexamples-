export function initWorkExplorer(root = document) {
  const choices = root.querySelector("#work .work-filter");
  const status = root.querySelector("#work-filter-status");
  const cards = [...root.querySelectorAll("#featured-projects [data-work-type]")];
  if (!choices || !status || !cards.length) return;

  const updateCount = () => {
    const selected = choices.querySelector('input[name="work-type"]:checked')?.value || "all";
    const count = cards.filter((card) => selected === "all" || card.dataset.workType === selected).length;
    status.textContent = `${count} featured ${count === 1 ? "project" : "projects"}`;
  };
  choices.addEventListener("change", (event) => {
    if (event.target.matches('input[name="work-type"]')) updateCount();
  });
  updateCount();
  status.hidden = false;
}
