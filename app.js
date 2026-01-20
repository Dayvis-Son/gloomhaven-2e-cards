const classListEl = document.getElementById("class-list");
const cardListEl = document.getElementById("card-list");
const contentTitleEl = document.getElementById("content-title");

const cardDetailEl = document.getElementById("card-detail");
const cardNameEl = document.getElementById("card-name");
const topActionsEl = document.getElementById("top-actions");
const bottomActionsEl = document.getElementById("bottom-actions");

const enhancementSelectEl = document.getElementById("enhancement-select");
const costOutputEl = document.getElementById("cost-output");

const elementChoiceEl = document.getElementById("element-choice");
const elementSelectEl = document.getElementById("element-select");

let allCards = [];
let enhancementCosts = {};
let enhancementRules = {};
let currentCard = null;
let currentAction = null;

Promise.all([
  fetch("data/enhancements.json").then(r => r.json()),
  fetch("data/enhancement-rules.json").then(r => r.json()),
  fetch("data/cards.json").then(r => r.json()),
  fetch("data/classes.json").then(r => r.json())
]).then(([costs, rules, cards, classes]) => {
  enhancementCosts = costs;
  enhancementRules = rules;
  allCards = cards;

  classes.forEach(cls => {
    const li = document.createElement("li");
    li.textContent = cls.name;
    li.onclick = () => showCardsForClass(cls);
    classListEl.appendChild(li);
  });
});

function showCardsForClass(cls) {
  contentTitleEl.textContent = `${cls.name} Cards`;
  cardListEl.innerHTML = "";
  cardDetailEl.style.display = "none";

  allCards
    .filter(c => c.class === cls.id)
    .forEach(card => {
      const li = document.createElement("li");
      li.textContent = `${card.name} (Level ${card.level})`;
      li.onclick = () => showCard(card);
      cardListEl.appendChild(li);
    });
}

function showCard(card) {
  currentCard = card;
  currentAction = null;

  cardDetailEl.style.display = "block";
  cardNameEl.textContent = `${card.name} (Level ${card.level})`;

  topActionsEl.innerHTML = "";
  bottomActionsEl.innerHTML = "";
  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "Select an action.";

  renderActions(card.top, topActionsEl);
  renderActions(card.bottom, bottomActionsEl);
}

function renderActions(actions, container) {
  actions.forEach(action => {
    if (!action.enhanceable) return;

    const li = document.createElement("li");
    const btn = document.createElement("button");

    btn.textContent = `${action.type.toUpperCase()} ${action.value} (${action.multi ? "Multi" : "Single"})`;
    btn.onclick = () => selectAction(action);

    li.appendChild(btn);
    container.appendChild(li);
  });
}

function selectAction(action) {
  currentAction = action;

  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "Select an enhancement.";
  elementChoiceEl.style.display = "none";

  const allowed = enhancementRules[action.type] || [];

  allowed.forEach(enh => {
    const opt = document.createElement("option");
    opt.value = enh;
    opt.textContent = enh.replace("_", " ").toUpperCase();
    enhancementSelectEl.appendChild(opt);
  });
}

enhancementSelectEl.addEventListener("change", () => {
  const enh = enhancementSelectEl.value;

  if (!enh || !currentAction) {
    costOutputEl.textContent = "";
    elementChoiceEl.style.display = "none";
    return;
  }

  // Elementos (normal e wild)
  if (enh === "elements" || enh === "wild_elements") {
    elementChoiceEl.style.display = "block";

    const cost = enh === "wild_elements" ? 150 : 100;
    costOutputEl.textContent = `Cost: ${cost}g`;
    return;
  }

  elementChoiceEl.style.display = "none";

  const typeCosts = enhancementCosts[enh];
  if (!typeCosts) {
    costOutputEl.textContent = "No cost data.";
    return;
  }

  const mode = currentAction.multi ? "multi" : "single";
  const value = currentAction.value;

  const cost = typeCosts[mode]?.[value];

  if (!cost) {
    costOutputEl.textContent = "Invalid cost.";
    return;
  }

  costOutputEl.textContent = `Cost: ${cost}g`;
});

elementSelectEl.addEventListener("change", () => {
  if (enhancementSelectEl.value === "wild_elements") {
    costOutputEl.textContent += ` — Element: ${elementSelectEl.value.toUpperCase()}`;
  }
});
