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
const cardTotalCostEl = document.getElementById("card-total-cost");

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
  contentTitleEl.textContent = className;
  cardListEl.innerHTML = "";
  cardDetailEl.style.display = "none";

  allCards
    .filter(c => c.class === classId)
    .forEach(card => {
      const li = document.createElement("li");
      li.textContent = `${card.name} (Lv ${card.level})`;
      li.onclick = () => showCard(card);
      cardListEl.appendChild(li);
    });
}

function showCard(card) {
  currentCard = card;
  cardDetailEl.style.display = "block";
  cardNameEl.textContent = card.name;

  if (!cardEnhancements.has(card)) {
    cardEnhancements.set(card, []);
  }

  topActionsEl.innerHTML = "";
  bottomActionsEl.innerHTML = "";
  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "";

  renderActions(card.top, topActionsEl);
  renderActions(card.bottom, bottomActionsEl);

  updateTotalCost(card);
}

function renderActions(actions, container) {
  actions.forEach(action => {
    if (!action.enhanceable || !action.enhancement_slots) return;

    if (!usedSlots.has(action)) {
      usedSlots.set(action, []);
    }

    const row = document.createElement("div");
    row.className = "action-row";

    const btn = document.createElement("button");

    const symbols = action.enhancement_slots
      .map(s => SLOT_ICONS[s] || "?")
      .join(" ");

    btn.textContent = `${symbols} ${action.type.toUpperCase()}`;
    btn.onclick = () => selectAction(action);

    const slots = document.createElement("div");
    slots.className = "slots";

    const used = usedSlots.get(action);

    action.enhancement_slots.forEach((_, i) => {
      const s = document.createElement("span");
      s.textContent = "⬜";
      if (i < used.length) s.classList.add("used");
      slots.appendChild(s);
    });

    const applied = document.createElement("div");
    applied.className = "applied-enhancements";

    if (used.length === 0) {
      applied.textContent = "No enhancements";
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

function selectAction(action) {
  currentAction = action;

  const used = usedSlots.get(action);
  const remaining = action.enhancement_slots.length - used.length;

  enhancementSelectEl.innerHTML = "";

  if (remaining <= 0) {
    enhancementSelectEl.innerHTML = `<option>No slots remaining</option>`;
    return;
  }

  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;

  const rules = ACTION_BASE_RULES[action.type];
  if (!rules) return;

  let allowed = [];

  action.enhancement_slots.forEach(slot => {
    if (rules[slot]) {
      allowed.push(...rules[slot]);
    }
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

  let cost = enhancementCosts[enh]?.single?.["1"];
  if (!cost) {
    costOutputEl.textContent = "No cost data";
    return;
  }

  usedSlots.get(currentAction).push(enh);

  cardEnhancements.get(currentCard).push({
    action: currentAction,
    enhancement: enh,
    cost
  });

  costOutputEl.innerHTML = `Cost: <strong>${cost}g</strong>`;

  updateTotalCost(currentCard);
  showCard(currentCard);
});

function removeEnhancement(action, index) {
  const list = usedSlots.get(action);
  if (!list) return;

  list.splice(index, 1);

  const cardList = cardEnhancements.get(currentCard);
  const idx = cardList.findIndex(
    e => e.action === action
  );
  if (idx !== -1) cardList.splice(idx, 1);

  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "";
  currentAction = null;

  showCard(currentCard);
}

function updateTotalCost(card) {
  const list = cardEnhancements.get(card) || [];
  const total = list.reduce((sum, e) => sum + e.cost, 0);
  cardTotalCostEl.textContent = `${total}g`;
}

function getEnhancementIcon(enh) {
  const map = {
    attack: "⚔️",
    move: "👣",
    heal: "💚",
    range: "🎯",
    target: "🎯+",
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
    push: "➡️",
    pull: "⬅️",
    pierce: "📌",
    elements: "🔥❄️💨🌱",
    wild_elements: "🌈",
    summon_hp: "❤️",
    summon_attack: "⚔️",
    summon_move: "👣",
    summon_range: "🎯",
    area_hex: "⬢"
  };

  return map[enh] || "•";
}
