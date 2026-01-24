// app.js
import {
  SLOT_ICONS,
  ACTION_BASE_RULES,
  applyConditionalFilters
} from "./data/enhancement-logic.js";

let classes = [];
let cards = [];
let enhancementCosts = {};

let selectedClass = null;
let selectedCard = null;
let selectedAction = null;

let appliedEnhancements = [];
let totalCost = 0;

/* -------------------- ELEMENTS -------------------- */

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

/* -------------------- LOAD DATA -------------------- */

async function loadData() {
  classes = await fetch("./data/classes.json").then(r => r.json());
  cards = await fetch("./data/cards.json").then(r => r.json());
  enhancementCosts = await fetch("./data/enhancements.json").then(r => r.json());

  renderClasses();
}

loadData();

/* -------------------- CLASSES -------------------- */

function renderClasses() {
  classListEl.innerHTML = "";
  classes.forEach(cls => {
    const li = document.createElement("li");
    li.textContent = cls.name;
    li.onclick = () => selectClass(cls.id);
    classListEl.appendChild(li);
  });
}

function selectClass(classId) {
  selectedClass = classId;
  cardListEl.innerHTML = "";
  cardDetailEl.style.display = "none";

  cards
    .filter(c => c.class === selectedClass)
    .forEach(card => {
      const li = document.createElement("li");
      li.textContent = card.name;
      li.onclick = () => selectCard(card);
      cardListEl.appendChild(li);
    });
}

/* -------------------- CARD -------------------- */

function selectCard(card) {
  selectedCard = card;
  appliedEnhancements = [];
  totalCost = 0;

  cardNameEl.textContent = card.name;
  cardDetailEl.style.display = "block";
  updateTotalCost();

  renderActions(card.top, topActionsEl);
  renderActions(card.bottom, bottomActionsEl);
  renderPreview();
}

/* -------------------- ACTION LIST -------------------- */

function renderActions(actions, container) {
  container.innerHTML = "";

  actions.forEach(action => {
    const row = document.createElement("div");
    row.className = "action-row";

    const label = document.createElement("span");
    label.textContent = `${action.type.toUpperCase()} ${action.value ?? ""}`;

    const slots = document.createElement("span");
    slots.className = "slots";

    (action.slots || []).forEach(s => {
      const icon = document.createElement("span");
      icon.textContent = SLOT_ICONS[s] ?? s;
      slots.appendChild(icon);
    });

    const btn = document.createElement("button");
    btn.textContent = "Enhance";
    btn.onclick = () => {
      selectedAction = action;
      buildEnhancementOptions();
    };

    row.appendChild(label);
    row.appendChild(slots);
    row.appendChild(btn);

    container.appendChild(row);
  });
}

/* -------------------- ENHANCEMENTS -------------------- */

function buildEnhancementOptions() {
  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.innerHTML = "";

  if (!selectedAction) return;

  const rules = ACTION_BASE_RULES[selectedAction.type] || {};
  const pool = [];

  Object.entries(rules).forEach(([slot, list]) => {
    list.forEach(e => pool.push({ e, slot }));
  });

  const allowed = applyConditionalFilters(
    selectedAction,
    pool.map(p => p.e)
  );

  [...new Set(pool.map(p => p.e))].forEach(enh => {
    const data = pool.find(p => p.e === enh);
    const opt = document.createElement("option");

    opt.value = enh;
    opt.textContent = `${SLOT_ICONS[data.slot]} ${enh}`;

    if (!allowed.includes(enh)) {
      opt.disabled = true;
      opt.textContent += " (not allowed)";
    }

    enhancementSelectEl.appendChild(opt);
  });
}

/* -------------------- COST & APPLY -------------------- */

function areaHexCost(hexes) {
  return Math.ceil(200 / hexes);
}

enhancementSelectEl.addEventListener("change", () => {
  costOutputEl.innerHTML = "";
  const enh = enhancementSelectEl.value;
  if (!enh || !selectedAction) return;

  if (enh === "area_hex") {
    costOutputEl.innerHTML = `
      Hexes:
      <select id="hex-count">
        <option>1</option><option>2</option><option>3</option>
        <option>4</option><option>5</option>
      </select>
      <button id="apply">Apply</button>
      <div id="hex-cost"></div>
    `;

    const hexSel = document.getElementById("hex-count");
    const costEl = document.getElementById("hex-cost");

    const update = () =>
      (costEl.textContent =
        "Cost: " + areaHexCost(hexSel.value) + "g");

    hexSel.onchange = update;
    update();

    document.getElementById("apply").onclick = () => {
      appliedEnhancements.push({
        action: selectedAction,
        enhancement: enh,
        cost: areaHexCost(hexSel.value)
      });
      totalCost += areaHexCost(hexSel.value);
      updateTotalCost();
      renderPreview();
    };

    return;
  }

  const cost = enhancementCosts[enh]?.single?.["1"];
  if (!cost) return;

  costOutputEl.innerHTML = `
    Cost: ${cost}g
    <button id="apply">Apply</button>
  `;

  document.getElementById("apply").onclick = () => {
    appliedEnhancements.push({
      action: selectedAction,
      enhancement: enh,
      cost
    });
    totalCost += cost;
    updateTotalCost();
    renderPreview();
  };
});

/* -------------------- PREVIEW -------------------- */

function renderPreview() {
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

      const icons = appliedEnhancements
        .filter(e => e.action === action)
        .map(e => e.enhancement)
        .join(" ");

      enh.textContent = icons;

      row.appendChild(base);
      row.appendChild(enh);
      container.appendChild(row);
    });
  };

  renderSide(selectedCard.top, topPreviewEl);
  renderSide(selectedCard.bottom, bottomPreviewEl);
}

/* -------------------- TOTAL -------------------- */

function updateTotalCost() {
  totalCostEl.textContent = `${totalCost}g`;
}

/* -------------------- RESET -------------------- */

document
  .getElementById("reset-card-enhancements")
  .addEventListener("click", () => {
    appliedEnhancements = [];
    totalCost = 0;
    updateTotalCost();
    renderPreview();
    costOutputEl.innerHTML = "";
    enhancementSelectEl.value = "";
  });
