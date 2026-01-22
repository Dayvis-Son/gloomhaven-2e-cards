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

const topPreviewEl = document.getElementById("top-preview");
const bottomPreviewEl = document.getElementById("bottom-preview");


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
  renderCardPreview(card);
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

 let base = 0;

// AREA HEX (regra especial)
if (enh === "area_hex") {
  const hexes = currentAction.hexes || 1;
  base = Math.ceil(200 / hexes);
} else {
  base = enhancementCosts[enh]?.single?.["1"];
  if (!base) {
    costOutputEl.textContent = "No cost data";
    return;
  }
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

  costOutputEl.innerHTML = `<strong>Total cost: ${total}g</strong>`;


  cardEnhancements.get(currentCard).push({
  action: currentAction,
  enhancement: enh,
  cost: total
});

updateTotalCost(currentCard);
renderCardPreview(currentCard);

showCard(currentCard);


  
});

function removeEnhancement(action, index) {
  const list = usedSlots.get(action);
  if (!list) return;

  const removedEnh = list[index];
  list.splice(index, 1);

  // remover do total da carta
  const cardList = cardEnhancements.get(currentCard);
  const idx = cardList.findIndex(
    e => e.action === action && e.enhancement === removedEnh
  );

  if (idx !== -1) {
    cardList.splice(idx, 1);
  }

  updateTotalCost(currentCard);

  // reset seleção
  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "";
  currentAction = null;

  // re-render apenas ações
  topActionsEl.innerHTML = "";
  bottomActionsEl.innerHTML = "";
  renderActions(currentCard.top, topActionsEl);
  renderActions(currentCard.bottom, bottomActionsEl);
  renderCardPreview(currentCard);

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

function updateTotalCost(card) {
  const list = cardEnhancements.get(card) || [];
  const total = list.reduce((sum, e) => sum + e.cost, 0);

  const el = document.getElementById("card-total-cost");
  if (el) {
    el.textContent = `${total}g`;
  }
}

function renderCardPreview(card) {
  topPreviewEl.innerHTML = "";
  bottomPreviewEl.innerHTML = "";

  const renderSide = (actions, container) => {
    actions.forEach(action => {
      const row = document.createElement("div");
      row.className = "action-preview";

      const base = document.createElement("span");
      base.textContent = `${action.type.toUpperCase()} ${action.value ?? ""}`;

      const enh = document.createElement("span");
      enh.className = "enh";

      const applied = usedSlots.get(action) || [];
      enh.textContent =
        applied.length > 0
          ? applied.map(e => getEnhancementIcon(e)).join(" ")
          : "";

      row.appendChild(base);
      row.appendChild(enh);
      container.appendChild(row);
    });
  };

  renderSide(card.top, topPreviewEl);
  renderSide(card.bottom, bottomPreviewEl);
}
