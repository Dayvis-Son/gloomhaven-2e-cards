// app.js
import {
  SLOT_ICONS,
  ACTION_BASE_RULES,
  applyConditionalFilters
} from "./data/enhancement-logic.js";

/* ---------------- STATE ---------------- */

let classes = [];
let cards = [];
let costs = {};

let currentCard = null;
let currentAction = null;

const usedSlots = new WeakMap();
let applied = [];
let total = 0;

/* ---------------- ELEMENTS ---------------- */

const classListEl = document.getElementById("class-list");
const cardListEl = document.getElementById("card-list");
const cardDetailEl = document.getElementById("card-detail");
const cardNameEl = document.getElementById("card-name");

const topActionsEl = document.getElementById("top-actions");
const bottomActionsEl = document.getElementById("bottom-actions");

const enhancementSelectEl = document.getElementById("enhancement-select");
const costOutputEl = document.getElementById("cost-output");
const totalCostEl = document.getElementById("card-total-cost");

const topPreviewEl = document.getElementById("top-preview");
const bottomPreviewEl = document.getElementById("bottom-preview");

const resetBtn = document.getElementById("reset-card-enhancements");

/* ---------------- LOAD ---------------- */

Promise.all([
  fetch("./data/classes.json").then(r => r.json()),
  fetch("./data/cards.json").then(r => r.json()),
  fetch("./data/enhancements.json").then(r => r.json())
]).then(([c, ca, co]) => {
  classes = c;
  cards = ca;
  costs = co;
  renderClasses();
});

/* ---------------- UI ---------------- */

function renderClasses() {
  classListEl.innerHTML = "";
  classes.forEach(cls => {
    const li = document.createElement("li");
    li.textContent = cls.name;
    li.onclick = () => showCards(cls.id);
    classListEl.appendChild(li);
  });
}

function showCards(classId) {
  cardListEl.innerHTML = "";
  cardDetailEl.style.display = "none";

  cards.filter(c => c.class === classId).forEach(card => {
    const li = document.createElement("li");
    li.textContent = card.name;
    li.onclick = () => showCard(card);
    cardListEl.appendChild(li);
  });
}

function showCard(card) {
  currentCard = card;
  applied = [];
  total = 0;
  usedSlots.clear?.();

  cardNameEl.textContent = card.name;
  cardDetailEl.style.display = "block";

  renderActions(card.top, topActionsEl);
  renderActions(card.bottom, bottomActionsEl);
  renderPreview();
  updateTotal();
}

/* ---------------- ACTIONS ---------------- */

function renderActions(actions, el) {
  el.innerHTML = "";

  actions.forEach(action => {
    if (!usedSlots.has(action)) usedSlots.set(action, []);

    const row = document.createElement("div");
    row.className = "action-row";

    const btn = document.createElement("button");
    btn.textContent = `${action.type.toUpperCase()} ${action.value ?? ""}`;
    btn.onclick = () => selectAction(action);

    const slots = document.createElement("span");
    action.slots.forEach((s, i) => {
      const ic = document.createElement("span");
      ic.textContent = SLOT_ICONS[s];
      if (i < usedSlots.get(action).length) ic.style.opacity = "0.3";
      slots.appendChild(ic);
    });

    row.appendChild(btn);
    row.appendChild(slots);
    el.appendChild(row);
  });
}

/* ---------------- ENHANCEMENTS ---------------- */

function selectAction(action) {
  currentAction = action;
  enhancementSelectEl.innerHTML = `<option value="">Select</option>`;
  costOutputEl.innerHTML = "";

  if (usedSlots.get(action).length >= action.slots.length) return;

  let pool = [];
  action.slots.forEach(s => {
    ACTION_BASE_RULES[action.type]?.[s]?.forEach(e =>
      pool.push({ e, s })
    );
  });

  const allowed = applyConditionalFilters(
    action,
    pool.map(p => p.e)
  );

  [...new Set(pool.map(p => p.e))].forEach(e => {
    const p = pool.find(x => x.e === e);
    const o = document.createElement("option");
    o.value = e;
    o.textContent = `${SLOT_ICONS[p.s]} ${e}`;
    if (!allowed.includes(e)) o.disabled = true;
    enhancementSelectEl.appendChild(o);
  });
}

/* ---------------- APPLY ---------------- */

enhancementSelectEl.onchange = () => {
  const enh = enhancementSelectEl.value;
  if (!enh || !currentAction) return;

  let cost = 0;

  if (enh === "area_hex") {
    cost = Math.ceil(200 / (currentAction.hexes || 1));
  } else {
    cost = costs[enh]?.single?.["1"] ?? 0;
  }

  usedSlots.get(currentAction).push(enh);
  applied.push({ action: currentAction, enh });
  total += cost;

  enhancementSelectEl.value = "";
  renderPreview();
  updateTotal();
};

/* ---------------- PREVIEW ---------------- */

function renderPreview() {
  topPreviewEl.innerHTML = "";
  bottomPreviewEl.innerHTML = "";

  const render = (actions, el) => {
    actions.forEach(a => {
      const row = document.createElement("div");
      row.className = "action-preview";

      const base = document.createElement("span");
      base.textContent = `${a.type.toUpperCase()} ${a.value ?? ""}`;

      const icons = document.createElement("span");
      applied
        .filter(e => e.action === a)
        .forEach(e => {
          const ic = document.createElement("span");
          ic.textContent = enhancementIcon(e.enh);
          ic.onclick = () => removeEnhancement(a, e.enh);
          ic.style.cursor = "pointer";
          icons.appendChild(ic);
        });

      row.appendChild(base);
      row.appendChild(icons);
      el.appendChild(row);
    });
  };

  render(currentCard.top, topPreviewEl);
  render(currentCard.bottom, bottomPreviewEl);
}

/* ---------------- REMOVE ---------------- */

function removeEnhancement(action, enh) {
  const i = applied.findIndex(e => e.action === action && e.enh === enh);
  if (i === -1) return;

  applied.splice(i, 1);
  usedSlots.get(action).pop();
  renderPreview();
  updateTotal();
}

/* ---------------- HELPERS ---------------- */

function enhancementIcon(e) {
  return {
    attack: "⚔️",
    move: "👣",
    heal: "💚",
    jump: "🦘",
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
    ward: "🛡️➕",
    push: "➡️",
    pull: "⬅️",
    pierce: "📌",
    area_hex: "⬢",
    elements: "🔥",
    wild_elements: "🌈",
    summon_hp: "❤️",
    summon_attack: "⚔️",
    summon_move: "👣",
    summon_range: "🎯"
  }[e] || "•";
}

function updateTotal() {
  totalCostEl.textContent = `${total}g`;
}

/* ---------------- RESET ---------------- */

resetBtn.onclick = () => {
  applied = [];
  total = 0;
  usedSlots.clear?.();
  renderPreview();
  updateTotal();
};

/* ---------------- PRINT (7️⃣) ---------------- */

const printBtn = document.createElement("button");
printBtn.textContent = "Print Card";
printBtn.style.marginTop = "10px";
printBtn.onclick = () => window.print();
cardDetailEl.appendChild(printBtn);
