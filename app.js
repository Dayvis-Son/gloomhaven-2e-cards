import {
  ACTION_BASE_RULES,
  applyConditionalFilters,
  SLOT_ICONS
} from "./data/enhancement-logic.js";

/* =========================
   CONSTANTES & ELEMENTOS
========================= */

const SLOT_SYMBOLS = {
  square: "⬜",
  circle: "⚪",
  triangle: "🔺",
  triangle_plus: "🔺➕",
  hex: "⬢"
};

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

const resetBtnEl = document.getElementById("reset-card-enhancements");

/* =========================
   STATE
========================= */

let allCards = [];
let enhancementCosts = {};
let currentCard = null;
let currentAction = null;

let usedSlots = new WeakMap(); // runtime only
const cardEnhancements = new WeakMap();

/* =========================
   STORAGE
========================= */

const STORAGE_KEY = "gloomhaven_enhancements";

const getStorage = () =>
  JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

const setStorage = data =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const getCardKey = card =>
  `${card.class}|${card.name}|${card.level}`;

/* =========================
   LOAD DATA
========================= */

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

/* =========================
   UI FLOW
========================= */

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

  usedSlots = new WeakMap();
  cardEnhancements.set(card, []);

  loadCardState(card);

  cardDetailEl.style.display = "block";
  cardNameEl.textContent = `${card.name} (Level ${card.level})`;

  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "";

  renderActions(card.top, topActionsEl);
  renderActions(card.bottom, bottomActionsEl);

  updateTotalCost(card);
  renderCardPreview(card);
}

/* =========================
   ACTION RENDER
========================= */

function renderActions(actions, container) {
  container.innerHTML = "";

  actions.forEach((action, index) => {
    if (!action.enhanceable) return;

    const row = document.createElement("div");
    row.className = "action-row";

    const btn = document.createElement("button");
    btn.textContent = `${action.enhancement_slots
      .map(s => SLOT_SYMBOLS[s])
      .join(" ")} ${action.type.toUpperCase()}`;

    btn.onclick = () => selectAction(action);

    const applied = document.createElement("div");
    const used = usedSlots.get(action) || [];

    applied.textContent =
      used.length === 0
        ? "No enhancements"
        : used.map(getEnhancementIcon).join(" ");

    row.append(btn, applied);
    container.appendChild(row);
  });
}

/* =========================
   SELECT ACTION
========================= */

function selectAction(action) {
  currentAction = action;

  if (!usedSlots.has(action)) usedSlots.set(action, []);

  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;

  let allowed = [];
  ACTION_BASE_RULES[action.type] &&
    action.enhancement_slots.forEach(s => {
      allowed.push(...(ACTION_BASE_RULES[action.type][s] || []));
    });

  allowed = applyConditionalFilters(action, [...new Set(allowed)]);

  allowed.forEach(e => {
    const opt = document.createElement("option");
    opt.value = e;
    opt.textContent = e.replace("_", " ").toUpperCase();
    enhancementSelectEl.appendChild(opt);
  });
}

/* =========================
   APPLY ENHANCEMENT
========================= */

enhancementSelectEl.addEventListener("change", () => {
  if (!currentAction) return;
  const enh = enhancementSelectEl.value;
  if (!enh) return;

  let cost =
    enh === "area_hex"
      ? Math.ceil(200 / (currentAction.hexes || 1))
      : enhancementCosts[enh]?.single?.["1"];

  if (!cost) return;

  if (currentAction.multi && !currentAction.loss) cost *= 2;
  if (currentAction.loss) cost = Math.ceil(cost / 2);
  if (currentCard.level > 1) cost += (currentCard.level - 1) * 25;

  usedSlots.get(currentAction).push(enh);
  cardEnhancements.get(currentCard).push({ enh, cost });

  saveCardState(currentCard);
  updateTotalCost(currentCard);
  renderActions(currentCard.top, topActionsEl);
  renderActions(currentCard.bottom, bottomActionsEl);
  renderCardPreview(currentCard);
});

/* =========================
   PREVIEW + COST
========================= */

function updateTotalCost(card) {
  const total = (cardEnhancements.get(card) || []).reduce(
    (s, e) => s + e.cost,
    0
  );
  document.getElementById("card-total-cost").textContent = `${total}g`;
}

function renderCardPreview(card) {
  const render = (actions, el) => {
    el.innerHTML = "";
    actions.forEach(a => {
      el.innerHTML += `${a.type.toUpperCase()} ${(usedSlots.get(a) || [])
        .map(getEnhancementIcon)
        .join(" ")}<br>`;
    });
  };

  render(card.top, topPreviewEl);
  render(card.bottom, bottomPreviewEl);
}

/* =========================
   ICONS
========================= */

function getEnhancementIcon(e) {
  return {
    attack: "⚔️",
    move: "👣",
    heal: "💚",
    jump: "🦘",
    poison: "☠️",
    wound: "🩸",
    curse: "🧿",
    bless: "✨",
    strengthen: "💪",
    ward: "🛡️+",
    area_hex: "⬢",
    elements: "🔥",
    wild_elements: "🌈"
  }[e] || "•";
}

/* =========================
   STORAGE SAVE / LOAD
========================= */

function saveCardState(card) {
  const store = getStorage();
  const key = getCardKey(card);

  store[key] = {
    enhancements: cardEnhancements.get(card)
  };

  setStorage(store);
}

function loadCardState(card) {
  const store = getStorage();
  const data = store[getCardKey(card)];
  if (!data) return;

  cardEnhancements.set(card, data.enhancements);

  data.enhancements.forEach(({ enh }, i) => {
    const action = [...card.top, ...card.bottom][i];
    if (!usedSlots.has(action)) usedSlots.set(action, []);
    usedSlots.get(action).push(enh);
  });
}

/* =========================
   RESET (F4.1)
========================= */

resetBtnEl.onclick = () => {
  if (!currentCard) return;

  cardEnhancements.set(currentCard, []);
  usedSlots = new WeakMap();

  const store = getStorage();
  delete store[getCardKey(currentCard)];
  setStorage(store);

  showCard(currentCard);
};
