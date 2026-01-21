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
let appliedEnhancements = [];

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
  appliedEnhancements = [];

  cardDetailEl.style.display = "block";
  cardNameEl.textContent = `${card.name} (Level ${card.level})`;

  topActionsEl.innerHTML = "";
  bottomActionsEl.innerHTML = "";
  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "Select an action.";
  elementChoiceEl.style.display = "none";

  renderActions(card.top, topActionsEl, "TOP");
  renderActions(card.bottom, bottomActionsEl, "BOTTOM");
}

function renderActions(actions, container, label) {
  actions.forEach(action => {
    if (!action.enhanceable || !action.slots || action.slots.length === 0) return;

    const li = document.createElement("li");
    const btn = document.createElement("button");

    btn.textContent = `${label} — ${action.type.toUpperCase()} (${action.slots.length} slots)`;
    btn.onclick = () => selectAction(action);

    li.appendChild(btn);
    container.appendChild(li);
  });
}

function selectAction(action) {
  currentAction = action;
  appliedEnhancements = [];

  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "Select an enhancement.";
  elementChoiceEl.style.display = "none";

  updateEnhancementOptions();
}

function updateEnhancementOptions() {
  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;

  const usedSlots = appliedEnhancements.map(e => e.slot);
  const freeSlots = [...currentAction.slots];

  usedSlots.forEach(slot => {
    const index = freeSlots.indexOf(slot);
    if (index !== -1) freeSlots.splice(index, 1);
  });

  if (freeSlots.length === 0) {
    costOutputEl.textContent = "No enhancement slots available.";
    return;
  }

  const allowed = enhancementRules[currentAction.type] || [];

  allowed.forEach(enh => {
    const slotType = getSlotTypeForEnhancement(enh);
    if (freeSlots.includes(slotType)) {
      const opt = document.createElement("option");
      opt.value = enh;
      opt.textContent = enh.replace("_", " ").toUpperCase();
      enhancementSelectEl.appendChild(opt);
    }
  });
}

function getSlotTypeForEnhancement(enh) {
  if (enh === "area_hex") return "hex";
  if (enh === "wild_elements" || enh === "elements") return "triangle";
  return "circle";
}

enhancementSelectEl.addEventListener("change", () => {
  const enh = enhancementSelectEl.value;
  if (!enh || !currentAction) return;

  const slotType = getSlotTypeForEnhancement(enh);

  const freeSlots = [...currentAction.slots];
  appliedEnhancements.forEach(e => {
    const i = freeSlots.indexOf(e.slot);
    if (i !== -1) freeSlots.splice(i, 1);
  });

  if (!freeSlots.includes(slotType)) {
    costOutputEl.textContent = "No compatible slots available.";
    return;
  }

  appliedEnhancements.push({ enhancement: enh, slot: slotType });

  const base = enhancementCosts[enh];
  if (base == null) {
    costOutputEl.textContent = "No cost data.";
    return;
  }

  let cost = base;

  if (currentAction.multi && !currentAction.loss) {
    cost *= 2;
  }

  if (currentAction.loss) {
    cost /= 2;
  }

  costOutputEl.textContent =
    `Applied: ${appliedEnhancements.length} | Last cost: ${cost}g`;

  if (enh === "wild_elements") {
    elementChoiceEl.style.display = "block";
  } else {
    elementChoiceEl.style.display = "none";
  }

  updateEnhancementOptions();
});

elementSelectEl.addEventListener("change", () => {
  if (enhancementSelectEl.value === "wild_elements") {
    costOutputEl.textContent +=
      ` — Element: ${elementSelectEl.value.toUpperCase()}`;
  }
});
