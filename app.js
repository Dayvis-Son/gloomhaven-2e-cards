// app.js
import {
  SLOT_ICONS,
  ACTION_BASE_RULES,
  applyConditionalFilters
} from "./data/enhancement-logic.js";

let classes = [];
let cards = [];
let enhancements = {};

let selectedClass = null;
let selectedCard = null;
let selectedAction = null;

const classListEl = document.getElementById("class-list");
const cardListEl = document.getElementById("card-list");
const cardDetailEl = document.getElementById("card-detail");
const cardNameEl = document.getElementById("card-name");

const topActionsEl = document.getElementById("top-actions");
const bottomActionsEl = document.getElementById("bottom-actions");

const enhancementSelectEl = document.getElementById("enhancement-select");
const costOutputEl = document.getElementById("cost-output");
const totalCostEl = document.getElementById("card-total-cost");

let appliedEnhancements = [];
let totalCost = 0;

/* -------------------- LOAD DATA -------------------- */

async function loadData() {
  classes = await fetch("./data/classes.json").then(r => r.json());
  cards = await fetch("./data/cards.json").then(r => r.json());
  enhancements = await fetch("./data/enhancements.json").then(r => r.json());

  renderClasses();
}

loadData();

/* -------------------- RENDER CLASSES -------------------- */

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
  renderCards();
}

/* -------------------- RENDER CARDS -------------------- */

function renderCards() {
  cardListEl.innerHTML = "";
  cards
    .filter(c => c.class === selectedClass)
    .forEach(card => {
      const li = document.createElement("li");
      li.textContent = card.name;
      li.onclick = () => selectCard(card);
      cardListEl.appendChild(li);
    });
}

function selectCard(card) {
  selectedCard = card;
  appliedEnhancements = [];
  totalCost = 0;
  updateTotalCost();

  cardNameEl.textContent = card.name;
  cardDetailEl.style.display = "block";

  renderActions(card.top, topActionsEl);
  renderActions(card.bottom, bottomActionsEl);
}

/* -------------------- ACTIONS -------------------- */

function renderActions(actions, container) {
  container.innerHTML = "";

  actions.forEach(action => {
    const row = document.createElement("div");
    row.className = "action-row";

    const label = document.createElement("span");
    label.textContent = `${action.type.toUpperCase()} ${action.value ?? ""}`;

    const slots = document.createElement("span");
    slots.className = "slots";

    if (action.slots) {
      action.slots.forEach(s => {
        const icon = document.createElement("span");
        icon.textContent = SLOT_ICONS[s] ?? s;
        slots.appendChild(icon);
      });
    }

    const btn = document.createElement("button");
    btn.textContent = "Enhance";
    btn.onclick = () => selectAction(action);

    row.appendChild(label);
    row.appendChild(slots);
    row.appendChild(btn);

    container.appendChild(row);
  });
}

function selectAction(action) {
  selectedAction = action;
  buildEnhancementOptions();
}

/* -------------------- ENHANCEMENTS -------------------- */

function buildEnhancementOptions() {
  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.innerHTML = "";

  if (!selectedAction) return;

  const rules = ACTION_BASE_RULES[selectedAction.type];
  if (!rules) return;

  let possible = [];

  Object.entries(rules).forEach(([slot, list]) => {
    list.forEach(e => {
      possible.push({ enhancement: e, slot });
    });
  });

  let enhancementKeys = possible.map(p => p.enhancement);
  enhancementKeys = applyConditionalFilters(selectedAction, enhancementKeys);

  enhancementKeys.forEach(key => {
    const rule = possible.find(p => p.enhancement === key);
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = `${SLOT_ICONS[rule.slot]} ${key}`;
    enhancementSelectEl.appendChild(opt);
  });
}

/* -------------------- COST LOGIC -------------------- */

function calculateAreaHexCost(baseHexes) {
  return Math.ceil(200 / baseHexes);
}

enhancementSelectEl.addEventListener("change", () => {
  costOutputEl.innerHTML = "";
  const enh = enhancementSelectEl.value;
  if (!enh) return;

  // AREA HEX
  if (enh === "area_hex") {
    costOutputEl.innerHTML = `
      <label>
        Base hexes:
        <select id="area-hex-count">
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
      </label>
      <div id="area-hex-cost"></div>
      <button id="apply-area">Apply</button>
    `;

    const hexSelect = document.getElementById("area-hex-count");
    const costEl = document.getElementById("area-hex-cost");
    const applyBtn = document.getElementById("apply-area");

    function update() {
      costEl.textContent =
        "Cost: " + calculateAreaHexCost(hexSelect.value) + "g";
    }

    hexSelect.onchange = update;
    update();

    applyBtn.onclick = () => {
      const cost = calculateAreaHexCost(hexSelect.value);
      appliedEnhancements.push("area_hex");
      totalCost += cost;
      updateTotalCost();
    };

    return;
  }

  const cost = enhancements[enh]?.single?.["1"];
  if (!cost) {
    costOutputEl.textContent = "No cost data";
    return;
  }

  costOutputEl.innerHTML = `
    Cost: ${cost}g
    <br />
    <button id="apply-enh">Apply</button>
  `;

  document.getElementById("apply-enh").onclick = () => {
    appliedEnhancements.push(enh);
    totalCost += cost;
    updateTotalCost();
  };
});

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
    costOutputEl.innerHTML = "";
    enhancementSelectEl.value = "";
  });
