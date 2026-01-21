import { ACTION_BASE_RULES, applyConditionalFilters } from "./data/enhancement-logic.js";

const classListEl = document.getElementById("class-list");
const cardListEl = document.getElementById("card-list");
const contentTitleEl = document.getElementById("content-title");

const cardDetailEl = document.getElementById("card-detail");
const cardNameEl = document.getElementById("card-name");
const topActionsEl = document.getElementById("top-actions");
const bottomActionsEl = document.getElementById("bottom-actions");

const enhancementSelectEl = document.getElementById("enhancement-select");
const costOutputEl = document.getElementById("cost-output");

let allCards = [];
let enhancementCosts = {};
let currentCard = null;
let currentAction = null;
let usedSlots = new WeakMap();

Promise.all([
  fetch("data/cards.json").then(r => r.json()),
  fetch("data/classes.json").then(r => r.json()),
  fetch("data/enhancements.json").then(r => r.json())
]).then(([cards, classes, costs]) => {
  allCards = cards;
  enhancementCosts = costs;

  classes.forEach(cls => {
    const li = document.createElement("li");
    li.textContent = cls.name;
    li.onclick = () => showCards(cls.id, cls.name);
    classListEl.appendChild(li);
  });
});

function showCards(classId, className) {
  contentTitleEl.textContent = `${className} Cards`;
  cardListEl.innerHTML = "";
  cardDetailEl.style.display = "none";

  allCards
    .filter(c => c.class === classId)
    .forEach(card => {
      const li = document.createElement("li");
      li.textContent = `${card.name} (Level ${card.level})`;
      li.onclick = () => showCard(card);
      cardListEl.appendChild(li);
    });
}

function showCard(card) {
  currentCard = card;

  cardDetailEl.style.display = "block";
  cardNameEl.textContent = `${card.name} (Level ${card.level})`;

  topActionsEl.innerHTML = "";
  bottomActionsEl.innerHTML = "";
  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "";

  renderActions(card.top, topActionsEl);
  renderActions(card.bottom, bottomActionsEl);
}

function renderActions(actions, container) {
  actions.forEach(action => {
    if (!action.enhanceable || !action.enhancement_slots) return;

    const btn = document.createElement("button");
    btn.textContent = action.type.toUpperCase();
    btn.onclick = () => selectAction(action);
    container.appendChild(btn);
  });
}

function selectAction(action) {
  if (!usedSlots.has(action)) {
  usedSlots.set(action, []);
}

const remainingSlots =
  action.enhancement_slots.length - usedSlots.get(action).length;

if (remainingSlots <= 0) {
  enhancementSelectEl.innerHTML = `<option>No slots remaining</option>`;
  return;
}

  currentAction = action;
  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "";

  const rulesByType = ACTION_BASE_RULES[action.type];
  if (!rulesByType) return;

  let allowed = [];

  action.enhancement_slots.forEach(slot => {
    const opts = rulesByType[slot];
    if (opts) allowed.push(...opts);
  });

  allowed = [...new Set(allowed)];
  allowed = applyConditionalFilters(action, allowed);

  allowed.forEach(enh => {
    const opt = document.createElement("option");
    opt.value = enh;
    opt.textContent = enh.replace("_", " ").toUpperCase();
    enhancementSelectEl.appendChild(opt);
  });
}

enhancementSelectEl.addEventListener("change", () => {
  if (!currentAction || !currentCard) return;
  const enh = enhancementSelectEl.value;
  if (!enh) return;

  let breakdown = [];
  let baseCost = 0;

  // AREA HEX (regra especial)
  if (enh === "area_hex") {
    const hexes = currentAction.hexes || 1;
    baseCost = Math.ceil(200 / hexes);
    breakdown.push(`Base: 200 / ${hexes} = ${baseCost}`);
  } else {
    baseCost = enhancementCosts[enh]?.single?.["1"];
    if (!baseCost) {
      costOutputEl.textContent = "No cost data";
      return;
    }
    breakdown.push(`Base: ${baseCost}`);
  }

  // MULTI-TARGET
  let multiApplied = false;
  if (currentAction.multi && !currentAction.loss) {
    baseCost *= 2;
    multiApplied = true;
    breakdown.push(`Multi-target: x2`);
  }

  // LOSS
  if (currentAction.loss) {
    baseCost = Math.ceil(baseCost / 2);
    breakdown.push(`Loss: ÷2`);
  }

  let total = baseCost;

  // LEVEL (a partir do 2)
  if (typeof currentCard.level === "number" && currentCard.level > 1) {
    const levelCost = (currentCard.level - 1) * 25;
    total += levelCost;
    breakdown.push(`Level: +${levelCost}`);
  }

  // EXISTING ENHANCEMENT (placeholder)
  if (currentCard.has_enhancement) {
    total += 75;
    breakdown.push(`Existing enhancement: +75`);
  }

  breakdown.push(`Total: ${total}g`);
  usedSlots.get(currentAction).push(enh);


  costOutputEl.innerHTML = breakdown.join("<br>");
});
