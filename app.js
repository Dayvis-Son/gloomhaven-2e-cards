import {
  ACTION_BASE_RULES,
  applyConditionalFilters,
  SLOT_ICONS
} from "./data/enhancement-logic.js";

/* =========================
   ESTADO GLOBAL
========================= */

let allCards = [];
let enhancementCosts = {};
let currentCard = null;
let currentAction = null;

const usedSlots = new WeakMap();
const cardEnhancements = new WeakMap();

/* =========================
   ELEMENTOS DOM
========================= */

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
   LOAD INICIAL
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
   LISTAGEM
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

  if (!cardEnhancements.has(card)) {
    cardEnhancements.set(card, []);
  }

  cardDetailEl.style.display = "block";
  cardNameEl.textContent = `${card.name} (Level ${card.level})`;

  topActionsEl.innerHTML = "";
  bottomActionsEl.innerHTML = "";

  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "";

  renderActions(card.top, topActionsEl);
  renderActions(card.bottom, bottomActionsEl);

  renderCardPreview(card);
}

/* =========================
   ACTION LIST
========================= */

function renderActions(actions, container) {
  actions.forEach(action => {
    if (!action.enhancement_slots) return;

    if (!usedSlots.has(action)) {
      usedSlots.set(action, []);
    }

    const row = document.createElement("div");
    row.className = "action-row";

    const btn = document.createElement("button");
    btn.textContent = action.type.toUpperCase();
    btn.onclick = () => selectAction(action);

    const slots = document.createElement("div");
    slots.className = "slots";

    action.enhancement_slots.forEach((slot, i) => {
      const s = document.createElement("span");
      s.textContent = SLOT_ICONS[slot];
      if (i < usedSlots.get(action).length) s.classList.add("used");
      slots.appendChild(s);
    });

    row.appendChild(btn);
    row.appendChild(slots);
    container.appendChild(row);
  });
}

/* =========================
   PREVIEW (PASSO 1)
========================= */

function renderCardPreview(card) {
  topPreviewEl.innerHTML = "";
  bottomPreviewEl.innerHTML = "";

  renderPreviewHalf(card.top, topPreviewEl);
  renderPreviewHalf(card.bottom, bottomPreviewEl);
}

function renderPreviewHalf(actions, container) {
  actions.forEach(action => {
    const div = document.createElement("div");
    div.className = "action-preview";

    const applied = usedSlots.get(action) || [];

    let text = action.type.toUpperCase();

    if (action.value !== undefined) {
      text += ` ${action.value}`;
    }

    applied.forEach(e => {
      text += ` ${getEnhancementIcon(e)}(+1)`;
    });

    div.textContent = text;
    container.appendChild(div);
  });
}

/* =========================
   SELEÇÃO DE ACTION
========================= */

function selectAction(action) {
  currentAction = action;

  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;

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
    opt.textContent = `${getEnhancementIcon(e)} ${e.toUpperCase()}`;
    enhancementSelectEl.appendChild(opt);
  });
}

/* =========================
   APPLY ENHANCEMENT
========================= */

enhancementSelectEl.addEventListener("change", () => {
  if (!currentAction || !currentCard) return;

  const enh = enhancementSelectEl.value;
  if (!enh) return;

  usedSlots.get(currentAction).push(enh);
  enhancementSelectEl.value = "";

  renderActions(currentCard.top, topActionsEl);
  renderActions(currentCard.bottom, bottomActionsEl);
  renderCardPreview(currentCard);
});

/* =========================
   RESET
========================= */

resetBtnEl.addEventListener("click", () => {
  if (!currentCard) return;

  [...currentCard.top, ...currentCard.bottom].forEach(a =>
    usedSlots.set(a, [])
  );

  renderActions(currentCard.top, topActionsEl);
  renderActions(currentCard.bottom, bottomActionsEl);
  renderCardPreview(currentCard);
});

/* =========================
   ICONS
========================= */

function getEnhancementIcon(e) {
  return {
    attack: "⚔️",
    move: "👣",
    heal: "💚",
    shield: "🛡️",
    retaliate: "🔁",
    poison: "☠️",
    wound: "🩸",
    curse: "🧿",
    muddle: "💫",
    immobilize: "⛓️",
    bless: "✨",
    strengthen: "💪",
    ward: "🛡️+",
    jump: "🦘",
    range: "🎯",
    target: "🎯",
    push: "➡️",
    pull: "⬅️",
    pierce: "🗡️",
    area_hex: "⬢",
    elements: "🔥",
    wild_elements: "🌈"
  }[e] || "";
}
