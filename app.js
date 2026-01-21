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
let currentAction = null;

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
  cardDetailEl.style.display = "block";
  cardNameEl.textContent = card.name;

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
  currentAction = action;
  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "";

  const rulesByType = ACTION_BASE_RULES[action.type];
  if (!rulesByType) return;

  let allowed = [];

  action.enhancement_slots.forEach(slot => {
    const options = rulesByType[slot];
    if (options) allowed.push(...options);
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
  if (!currentAction) return;
  const enh = enhancementSelectEl.value;
  if (!enh) return;

  const base = enhancementCosts[enh]?.single?.["1"];
  if (!base) {
    costOutputEl.textContent = "No cost data";
    return;
  }

  let cost = base;

  // Loss: divide SOMENTE o valor base
  if (currentAction.loss) {
    cost = Math.ceil(cost / 2);
  }

  costOutputEl.textContent = `Cost: ${cost}g`;
});
