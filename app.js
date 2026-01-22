import {
  ACTION_BASE_RULES,
  applyConditionalFilters,
  SLOT_ICONS
} from "./data/enhancement-logic.js";

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

let allCards = [];
let enhancementCosts = {};
let currentCard = null;
let currentAction = null;
let usedSlots = new WeakMap();
let cardEnhancements = new WeakMap();


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
  cardEnhancements.set(card, []);
updateTotalCost(card);
  currentCard = card;
  cardDetailEl.style.display = "block";
  cardNameEl.textContent = `${card.name} (Level ${card.level})`;

  topActionsEl.innerHTML = "";
  bottomActionsEl.innerHTML = "";
  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.innerHTML = "";

  renderActions(card.top, topActionsEl);
  renderActions(card.bottom, bottomActionsEl);
}

function renderActions(actions, container) {
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
const icon = getEnhancementIcon(e);
tag.textContent = `${icon} ${e.replace("_", " ").toUpperCase()}`;

  tag.style.cursor = "pointer";
  tag.title = "Click to remove";

  tag.onclick = () => {
    removeEnhancement(action, index);
  };

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

  if (!usedSlots.has(action)) {
    usedSlots.set(action, []);
  }

  const remaining =
    action.enhancement_slots.length - usedSlots.get(action).length;

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

  let base = enhancementCosts[enh]?.single?.["1"];
  if (!base) {
    costOutputEl.textContent = "No cost data";
    return;
  }

  // MULTI (apenas se não for LOSS)
  if (currentAction.multi && !currentAction.loss) {
    base *= 2;
  }

  // LOSS sempre divide o valor base
  if (currentAction.loss) {
    base = Math.ceil(base / 2);
  }

  let total = base;

  // LEVEL (a partir do 2)
  if (typeof currentCard.level === "number" && currentCard.level > 1) {
    total += (currentCard.level - 1) * 25;
  }

  usedSlots.get(currentAction).push(enh);

  costOutputEl.innerHTML = `Total cost: <strong>${total}g</strong>`;

  cardEnhancements.get(currentCard).push({
  action: currentAction,
  enhancement: enh,
  cost: total
});

updateTotalCost(currentCard);

  
  showCard(currentCard);
});

function removeEnhancement(action, index) {
  const list = usedSlots.get(action);
  if (!list) return;

  list.splice(index, 1);

  // reset UI
  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "";
  currentAction = null;

  // re-render card to refresh slots + list
  showCard(currentCard);
}

function getEnhancementIcon(enh) {
  if (enh === "attack") return "⚔️";
  if (enh === "move") return "👣";
  if (enh === "heal") return "💚";
  if (enh === "shield") return "🛡️";
  if (enh === "retaliate") return "🔁";

  if (enh === "poison") return "☠️";
  if (enh === "wound") return "🩸";
  if (enh === "curse") return "🧿";
  if (enh === "muddle") return "💫";
  if (enh === "immobilize") return "⛓️";

  if (enh === "bless") return "✨";
  if (enh === "strengthen") return "💪";
  if (enh === "ward") return "🛡️+";

  if (enh === "jump") return "🦘";
  if (enh === "area_hex") return "⬢";

  if (enh === "elements") return "🔥❄️💨🌱✨🌑";
  if (enh === "wild_elements") return "🌈";

  return "•";
}
