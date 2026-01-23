import {
  ACTION_BASE_RULES,
  applyConditionalFilters
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
    btn.textContent = action.type.toUpperCase();
    btn.onclick = () => selectAction(action);

    row.appendChild(btn);
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

  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
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
    opt.textContent = e.replace("_", " ").toUpperCase();
    enhancementSelectEl.appendChild(opt);
  });
}

enhancementSelectEl.addEventListener("change", () => {
  if (!currentAction || !currentCard) return;

  const enh = enhancementSelectEl.value;
  if (!enh) return;

  const base = enhancementCosts[enh]?.single?.["1"];
  if (!base) return;

  let total = base;
  if (currentCard.level > 1) {
    total += (currentCard.level - 1) * 25;
  }

  usedSlots.get(currentAction).push(enh);
  cardEnhancements.get(currentCard).push({
    action: currentAction,
    enhancement: enh,
    cost: total
  });

  costOutputEl.innerHTML = `<strong>Total cost: ${total}g</strong>`;

  updateTotalCost(currentCard);
  renderCardPreview(currentCard);

  enhancementSelectEl.value = "";
});

function updateTotalCost(card) {
  const total = (cardEnhancements.get(card) || []).reduce(
    (s, e) => s + e.cost,
    0
  );
  document.getElementById("card-total-cost").textContent = `${total}g`;
}

/**
 * =========================
 * PREVIEW COM VALOR FINAL
 * =========================
 */
function renderCardPreview(card) {
  topPreviewEl.innerHTML = "";
  bottomPreviewEl.innerHTML = "";

  const render = (actions, el) => {
    actions.forEach(action => {
      const enhs = usedSlots.get(action) || [];

      const plusCount = enhs.filter(isPlusOne).length;
      const baseValue = action.value ?? null;

      const div = document.createElement("div");
      div.className = "action-preview";

      let text = action.type.toUpperCase();

      if (baseValue !== null && plusCount > 0) {
        text += ` ${baseValue} → ${baseValue + plusCount}`;
      } else if (baseValue !== null) {
        text += ` ${baseValue}`;
      }

      const effects = enhs
        .filter(e => !isPlusOne(e))
        .map(getEnhancementIcon)
        .join(" ");

      div.textContent = `${text} ${effects}`;
      el.appendChild(div);
    });
  };

  render(card.top, topPreviewEl);
  render(card.bottom, bottomPreviewEl);
}

function isPlusOne(e) {
  return [
    "attack",
    "move",
    "heal",
    "range",
    "target",
    "shield",
    "retaliate",
    "push",
    "pull",
    "pierce",
    "summon_hp",
    "summon_attack",
    "summon_move",
    "summon_range"
  ].includes(e);
}

function getEnhancementIcon(e) {
  return {
    poison: "☠️",
    wound: "🩸",
    curse: "🧿",
    muddle: "💫",
    immobilize: "⛓️",
    bless: "✨",
    strengthen: "💪",
    ward: "🛡️",
    jump: "🦘",
    elements: "🔥",
    wild_elements: "🌈",
    area_hex: "⬢"
  }[e] || "";
}

resetBtnEl.addEventListener("click", () => {
  if (!currentCard) return;

  cardEnhancements.set(currentCard, []);
  [...currentCard.top, ...currentCard.bottom].forEach(a =>
    usedSlots.delete(a)
  );

  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "";

  updateTotalCost(currentCard);
  renderCardPreview(currentCard);
});
