import {
  ACTION_BASE_RULES,
  applyConditionalFilters,
  SLOT_ICONS
} from "./data/enhancement-logic.js";

/* =========================
   STATE
========================= */

let allCards = [];
let enhancementCosts = {};
let currentCard = null;
let currentAction = null;

const usedSlots = new WeakMap();
const cardEnhancements = new WeakMap();

/* =========================
   DOM
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
const cardTotalEl = document.getElementById("card-total-cost");

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
   UI
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
  updateTotalCost(card);
}

/* =========================
   ACTION LIST
========================= */

function renderActions(actions, container) {
  actions.forEach(action => {
    if (!action.enhanceable || !action.enhancement_slots) return;

    if (!usedSlots.has(action)) {
      usedSlots.set(action, []);
    }

    const row = document.createElement("div");
    row.className = "action-row";

    const btn = document.createElement("button");
    btn.textContent = `${action.type.toUpperCase()} ${action.value ?? ""}`;
    btn.onclick = () => selectAction(action);

    row.appendChild(btn);
    container.appendChild(row);
  });
}

/* =========================
   SELECT ACTION
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
    opt.textContent = e.replace("_", " ").toUpperCase();
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

  const cost = enhancementCosts[enh]?.single?.["1"];
  if (!cost) return;

  usedSlots.get(currentAction).push(enh);

  cardEnhancements.get(currentCard).push({
    action: currentAction,
    enhancement: enh,
    cost
  });

  enhancementSelectEl.value = "";
  costOutputEl.innerHTML = `<strong>Cost: ${cost}g</strong>`;

  renderCardPreview(currentCard);
  updateTotalCost(currentCard);
});

/* =========================
   PREVIEW WITH SLOTS
========================= */

function renderCardPreview(card) {
  topPreviewEl.innerHTML = "";
  bottomPreviewEl.innerHTML = "";

  const render = (actions, el) => {
    actions.forEach(action => {
      const base = action.value ?? 0;
      const applied = usedSlots.get(action) || [];
      const slots = action.enhancement_slots || [];

      const plus = applied.filter(isPlusOneEnhancement).length;
      const finalValue = base + plus;

      const row = document.createElement("div");
      row.className = "action-preview";

      const label = document.createElement("span");
      label.textContent = `${action.type.toUpperCase()} ${base} → ${finalValue}`;

      const slotBox = document.createElement("span");
      slotBox.className = "slot-box";

      slots.forEach((slotType, index) => {
        const slot = document.createElement("span");
        slot.className = "slot";

        if (applied[index]) {
          slot.textContent = getEnhancementIcon(applied[index]);
          slot.style.cursor = "pointer";
          slot.title = "Click to remove";
          slot.onclick = () => removeEnhancement(action, index);
        } else {
          slot.textContent = SLOT_ICONS[slotType];
          slot.style.opacity = 0.4;
        }

        slotBox.appendChild(slot);
      });

      row.appendChild(label);
      row.appendChild(slotBox);
      el.appendChild(row);
    });
  };

  render(card.top, topPreviewEl);
  render(card.bottom, bottomPreviewEl);
}

/* =========================
   REMOVE
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

  renderCardPreview(currentCard);
  updateTotalCost(currentCard);
}

/* =========================
   TOTAL
========================= */

function updateTotalCost(card) {
  const total = (cardEnhancements.get(card) || [])
    .reduce((s, e) => s + e.cost, 0);

  cardTotalEl.textContent = `${total}g`;
}

/* =========================
   HELPERS
========================= */

function isPlusOneEnhancement(e) {
  return [
    "attack","move","heal","range","target","shield","retaliate",
    "push","pull","pierce",
    "summon_hp","summon_move","summon_attack","summon_range"
  ].includes(e);
}

function getEnhancementIcon(e) {
  return {
    attack: "⚔️",
    move: "👣",
    heal: "💚",
    range: "🎯",
    target: "🎯+",
    shield: "🛡️",
    retaliate: "🔁",
    push: "➡️",
    pull: "⬅️",
    pierce: "📌",
    jump: "🦘",
    poison: "☠️",
    wound: "🩸",
    curse: "🧿",
    muddle: "💫",
    immobilize: "⛓️",
    bless: "✨",
    strengthen: "💪",
    ward: "🛡️+",
    elements: "🔥",
    wild_elements: "🌈",
    area_hex: "⬢",
    summon_hp: "❤️",
    summon_attack: "⚔️",
    summon_move: "👣",
    summon_range: "🎯"
  }[e] || "•";
}
