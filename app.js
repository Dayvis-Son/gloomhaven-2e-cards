import {
  ACTION_BASE_RULES,
  applyConditionalFilters,
  SLOT_ICONS
} from "./data/enhancement-logic.js";

import { validateCard } from "./data/card-validator.js";

/* =========================
   CONSTANTES E ELEMENTOS
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
const validationPanelEl = document.getElementById("validation-panel");

/* =========================
   ESTADO
========================= */

let allCards = [];
let enhancementCosts = {};
let currentCard = null;
let currentAction = null;

const usedSlots = new WeakMap();        // action -> [enhancements]
const cardEnhancements = new WeakMap(); // card -> [{action, enhancement, cost}]

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

  updateTotalCost(card);
  renderCardPreview(card);
  runValidation();
}

/* =========================
   RENDER ACTIONS
========================= */

function renderActions(actions, container) {
  container.innerHTML = "";

  actions.forEach(action => {
    if (!action.enhanceable || !action.enhancement_slots) return;

    const row = document.createElement("div");
    row.className = "action-row";

    const btn = document.createElement("button");
    const symbols = action.enhancement_slots
      .map(s => SLOT_SYMBOLS[s] || "")
      .join(" ");

    btn.textContent = `${symbols} ${action.type.toUpperCase()}`;
    btn.onclick = () => selectAction(action);

    const slots = document.createElement("div");
    slots.className = "slots";

    const used = usedSlots.get(action) || [];

    action.enhancement_slots.forEach((slot, i) => {
      const s = document.createElement("span");
      s.textContent = SLOT_ICONS[slot] || "?";
      if (i < used.length) s.classList.add("used");
      slots.appendChild(s);
    });

    const applied = document.createElement("div");
    applied.className = "applied-enhancements";

    if (used.length === 0) {
      applied.textContent = "No enhancements applied";
    } else {
      used.forEach((e, index) => {
        const tag = document.createElement("span");
        tag.textContent = `${getEnhancementIcon(e)} ${e.replace("_", " ").toUpperCase()}`;
        tag.title = "Click to remove";
        tag.onclick = () => removeEnhancement(action, index);
        applied.appendChild(tag);
      });
    }

    row.appendChild(btn);
    row.appendChild(slots);
    row.appendChild(applied);
    container.appendChild(row);
  });
}

/* =========================
   SELEÇÃO DE AÇÃO
========================= */

function selectAction(action) {
  currentAction = action;

  if (!usedSlots.has(action)) {
    usedSlots.set(action, []);
  }

  const remaining =
    action.enhancement_slots.length - usedSlots.get(action).length;

  enhancementSelectEl.innerHTML = "";

  if (remaining <= 0) {
    enhancementSelectEl.innerHTML = `<option>No slots remaining</option>`;
    enhancementSelectEl.disabled = true;
    return;
  }

  enhancementSelectEl.disabled = false;
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

    const slot = action.enhancement_slots.find(s =>
      ACTION_BASE_RULES[action.type]?.[s]?.includes(e)
    );

    const slotIcon = SLOT_ICONS[slot] ?? "";
    opt.textContent = `${slotIcon} ${e.replace("_", " ").toUpperCase()}`;
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

  let base = 0;

  // AREA HEX (regra especial)
  if (enh === "area_hex") {
    const hexes = currentAction.hexes || 1;
    base = Math.ceil(200 / hexes);
  } else {
    base = enhancementCosts[enh]?.single?.["1"];
    if (!base) return;
  }

  if (currentAction.multi && !currentAction.loss) base *= 2;
  if (currentAction.loss) base = Math.ceil(base / 2);

  let total = base;
  if (typeof currentCard.level === "number" && currentCard.level > 1) {
    total += (currentCard.level - 1) * 25;
  }

  usedSlots.get(currentAction).push(enh);

  cardEnhancements.get(currentCard).push({
    action: currentAction,
    enhancement: enh,
    cost: total
  });

  enhancementSelectEl.value = "";
  costOutputEl.innerHTML = `<strong>Total cost: ${total}g</strong>`;

  updateTotalCost(currentCard);
  renderActions(currentCard.top, topActionsEl);
  renderActions(currentCard.bottom, bottomActionsEl);
  renderCardPreview(currentCard);
  runValidation();
});

/* =========================
   REMOVE ENHANCEMENT
========================= */

function removeEnhancement(action, index) {
  const used = usedSlots.get(action);
  const enh = used[index];
  used.splice(index, 1);

  const list = cardEnhancements.get(currentCard);
  const i = list.findIndex(
    e => e.action === action && e.enhancement === enh
  );
  if (i !== -1) list.splice(i, 1);

  updateTotalCost(currentCard);
  renderActions(currentCard.top, topActionsEl);
  renderActions(currentCard.bottom, bottomActionsEl);
  renderCardPreview(currentCard);
  runValidation();
}

/* =========================
   PREVIEW
========================= */

function renderCardPreview(card) {
  topPreviewEl.innerHTML = "";
  bottomPreviewEl.innerHTML = "";

  const render = (actions, el) => {
    actions.forEach(a => {
      const div = document.createElement("div");
      div.textContent = `${a.type.toUpperCase()} ${(usedSlots.get(a) || [])
        .map(getEnhancementIcon)
        .join(" ")}`;
      el.appendChild(div);
    });
  };

  render(card.top, topPreviewEl);
  render(card.bottom, bottomPreviewEl);
}

/* =========================
   TOTAL
========================= */

function updateTotalCost(card) {
  const total = (cardEnhancements.get(card) || []).reduce(
    (s, e) => s + e.cost,
    0
  );
  document.getElementById("card-total-cost").textContent = `${total}g`;
}

/* =========================
   VALIDATION (F5)
========================= */

function runValidation() {
  if (!validationPanelEl || !currentCard) return;

  const errors = validateCard(
    currentCard,
    cardEnhancements.get(currentCard) || []
  );

  validationPanelEl.innerHTML = "";

  if (errors.length === 0) {
    validationPanelEl.style.display = "none";
    return;
  }

  validationPanelEl.style.display = "block";
  errors.forEach(err => {
    const div = document.createElement("div");
    div.textContent = `⚠️ ${err}`;
    validationPanelEl.appendChild(div);
  });
}

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
    area_hex: "⬢",
    elements: "🔥",
    wild_elements: "🌈"
  }[e] || "•";
}

/* =========================
   RESET
========================= */

resetBtnEl.addEventListener("click", () => {
  if (!currentCard) return;

  cardEnhancements.set(currentCard, []);

  [...currentCard.top, ...currentCard.bottom].forEach(action => {
    usedSlots.delete(action);
  });

  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "";
  currentAction = null;

  updateTotalCost(currentCard);
  renderActions(currentCard.top, topActionsEl);
  renderActions(currentCard.bottom, bottomActionsEl);
  renderCardPreview(currentCard);
  runValidation();
});
