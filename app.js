import {
  ACTION_BASE_RULES,
  applyConditionalFilters,
  SLOT_ICONS
} from "./data/enhancement-logic.js";

const classListEl = document.getElementById("class-list");
const cardListEl = document.getElementById("card-list");
const contentTitleEl = document.getElementById("content-title");

const cardDetailEl = document.getElementById("card-detail");
const cardNameEl = document.getElementById("card-name");
const topActionsEl = document.getElementById("top-actions");
const bottomActionsEl = document.getElementById("bottom-actions");

const enhancementSelectEl = document.getElementById("enhancement-select");
const costOutputEl = document.getElementById("cost-output");

const topPreviewEl = document.getElementById("top-preview");
const bottomPreviewEl = document.getElementById("bottom-preview");
const cardImageEl = document.getElementById("card-image");

const resetBtnEl = document.getElementById("reset-card-enhancements");

let allCards = [];
let enhancementCosts = {};
let currentCard = null;
let currentAction = null;

const usedSlots = new WeakMap();
const cardEnhancements = new WeakMap();

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

  if (!cardEnhancements.has(card)) {
    cardEnhancements.set(card, []);
  }

  cardDetailEl.style.display = "block";
  cardNameEl.textContent = `${card.name} (Level ${card.level})`;

  if (card.image) {
    cardImageEl.src = card.image;
    cardImageEl.style.display = "block";
  } else {
    cardImageEl.style.display = "none";
  }

  topActionsEl.innerHTML = "";
  bottomActionsEl.innerHTML = "";
  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "";

  renderActions(card.top, topActionsEl);
  renderActions(card.bottom, bottomActionsEl);

  renderCardPreview(card);
  updateTotalCost(card);
}

function renderActions(actions, container) {
  actions.forEach(action => {
    if (!action.enhanceable || !action.enhancement_slots) return;

    const row = document.createElement("div");
    row.className = "action-row";

    const btn = document.createElement("button");
    btn.textContent = action.type.toUpperCase();
    btn.onclick = () => selectAction(action);

    const used = usedSlots.get(action) || [];

    const applied = document.createElement("div");
    applied.className = "applied-enhancements";
    applied.textContent =
      used.length === 0
        ? "No enhancements applied"
        : used.map(e => e.toUpperCase()).join(", ");

    row.appendChild(btn);
    row.appendChild(applied);
    container.appendChild(row);
  });
}

function selectAction(action) {
  currentAction = action;

  if (!usedSlots.has(action)) usedSlots.set(action, []);

  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  enhancementSelectEl.disabled = false;

  const rules = ACTION_BASE_RULES[action.type];
  if (!rules) return;

  let allowed = [];
  action.enhancement_slots.forEach(slot => {
    if (rules[slot]) allowed.push(...rules[slot]);
  });

  allowed = [...new Set(allowed)];
  allowed = applyConditionalFilters(action, allowed);

  allowed.forEach(e => {
    const opt = document.createElement("option");
    opt.value = e;
    opt.textContent = e.replace("_", " ").toUpperCase();
    enhancementSelectEl.appendChild(opt);
  });
}

enhancementSelectEl.addEventListener("change", () => {
  if (!currentAction || !currentCard) return;

  const enh = enhancementSelectEl.value;
  if (!enh) return;

  let cost = 0;

  if (enh === "area_hex") {
    const hexes = currentAction.hexes || 1;
    cost = Math.ceil(200 / hexes);
  } else {
    cost = enhancementCosts[enh]?.single?.["1"];
    if (!cost) return;
  }

  usedSlots.get(currentAction).push(enh);
  cardEnhancements.get(currentCard).push({
    action: currentAction,
    enhancement: enh,
    cost
  });

  costOutputEl.innerHTML = `<strong>${cost}g</strong>`;
  enhancementSelectEl.value = "";

  renderCardPreview(currentCard);
  updateTotalCost(currentCard);
});

function renderCardPreview(card) {
  topPreviewEl.innerHTML = "";
  bottomPreviewEl.innerHTML = "";

  const render = (actions, el) => {
    actions.forEach(a => {
      const div = document.createElement("div");
      div.textContent = `${a.type.toUpperCase()} ${(usedSlots.get(a) || []).join(" ")}`;
      el.appendChild(div);
    });
  };

  render(card.top, topPreviewEl);
  render(card.bottom, bottomPreviewEl);
}

function updateTotalCost(card) {
  const total = (cardEnhancements.get(card) || []).reduce(
    (s, e) => s + e.cost,
    0
  );
  document.getElementById("card-total-cost").textContent = `${total}g`;
}

resetBtnEl.addEventListener("click", () => {
  if (!currentCard) return;

  cardEnhancements.set(currentCard, []);
  [...currentCard.top, ...currentCard.bottom].forEach(a => usedSlots.delete(a));

  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "";
  updateTotalCost(currentCard);
  showCard(currentCard);
});
