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
  loadCardState(card);
  
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
        tag.textContent = `${getEnhancementIcon(e)} ${e.toUpperCase()}`;
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

  if (!usedSlots.has(action)) {
    usedSlots.set(action, []);
  }

  const remaining =
    action.enhancement_slots.length - usedSlots.get(action).length;

if (remaining <= 0) {
  enhancementSelectEl.innerHTML = `<option>No slots remaining</option>`;
  enhancementSelectEl.disabled = true;
  return;
}

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

  // descobrir qual slot libera esse enhancement
  const slot = action.enhancement_slots.find(s =>
    ACTION_BASE_RULES[action.type]?.[s]?.includes(e)
  );

  const slotIcon = SLOT_ICONS[slot] ?? "";
  opt.textContent = `${slotIcon} ${e.replace("_", " ").toUpperCase()}`;
opt.title = getEnhancementHelp(e, action.type);
  enhancementSelectEl.appendChild(opt);
});

}

enhancementSelectEl.addEventListener("change", () => {
  if (!currentAction || !currentCard) return;

  const enh = enhancementSelectEl.value;
  if (!enh) return;

  let base = 0;

  // ✅ REGRA ESPECIAL (E3 / “4”)
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
  if (currentCard.level > 1) {
    total += (currentCard.level - 1) * 25;
  }

  usedSlots.get(currentAction).push(enh);
  enhancementSelectEl.value = "";
enhancementSelectEl.blur();

  cardEnhancements.get(currentCard).push({
    action: currentAction,
    enhancement: enh,
    cost: total
  });
saveCardState(currentCard);

  costOutputEl.innerHTML = `<strong>Total cost: ${total}g</strong>`;

  updateTotalCost(currentCard);
  renderActions(currentCard.top, topActionsEl);
  renderActions(currentCard.bottom, bottomActionsEl);
  renderCardPreview(currentCard);
});

function removeEnhancement(action, index) {
  const used = usedSlots.get(action);
  const enh = used[index];
  used.splice(index, 1);

  const list = cardEnhancements.get(currentCard);
  const i = list.findIndex(e => e.action === action && e.enhancement === enh);
  if (i !== -1) list.splice(i, 1);

  updateTotalCost(currentCard);
  showCard(currentCard);
  saveCardState(currentCard);

}

function updateTotalCost(card) {
  const total = (cardEnhancements.get(card) || []).reduce(
    (s, e) => s + e.cost,
    0
  );
  document.getElementById("card-total-cost").textContent = `${total}g`;
}

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

function getEnhancementHelp(enh, actionType) {
  const map = {
    attack: "Adds +1 Attack",
    heal: "Adds +1 Heal",
    move: "Adds +1 Move",
    jump: "Grants Jump",
    poison: "Applies Poison",
    wound: "Applies Wound",
    curse: "Applies Curse",
    bless: "Applies Bless",
    strengthen: "Applies Strengthen",
    ward: "Applies Ward",
    area_hex: "Adds an extra hex to AoE",
    elements: "Creates an element",
    wild_elements: "Creates any element"
  };

  return map[enh] ?? `Enhancement for ${actionType}`;
}

const STORAGE_KEY = "gloomhaven_enhancements";

function getStorage() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
}

function setStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getCardKey(card) {
  return `${card.class}|${card.name}|${card.level}`;
}

function saveCardState(card) {
  const store = getStorage();
  const key = getCardKey(card);

  store[key] = {
    enhancements: cardEnhancements.get(card) || [],
    slots: Array.from(usedSlots.entries()).map(([action, list]) => ({
      action,
      list
    }))
  };

  setStorage(store);
}

function loadCardState(card) {
  const store = getStorage();
  const key = getCardKey(card);

  if (!store[key]) return;

  const saved = store[key];

  // restaurar enhancements
  cardEnhancements.set(card, saved.enhancements || []);

  // restaurar slots
  usedSlots = new WeakMap();

  [...card.top, ...card.bottom].forEach(action => {
    const match = saved.slots.find(s =>
      s.action.type === action.type &&
      s.action.value === action.value
    );

    if (match) {
      usedSlots.set(action, [...match.list]);
    }
  });

  updateTotalCost(card);
}
