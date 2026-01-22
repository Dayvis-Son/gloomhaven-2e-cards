import {
  ACTION_BASE_RULES,
  applyConditionalFilters,
  SLOT_ICONS
} from "./data/enhancement-logic.js";

import { validateEnhancement } from "./data/enhancement-validator.js";


/* =======================
   CONSTANTS & ELEMENTS
======================= */

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
const exportBtnEl = document.getElementById("export-card");

/* =======================
   STATE
======================= */

let allCards = [];
let enhancementCosts = {};
let currentCard = null;
let currentAction = null;

let usedSlots = new WeakMap();      // action → [enhancements]
let cardEnhancements = new WeakMap(); // card → [{ action, enhancement, cost }]

/* =======================
   LOAD DATA
======================= */

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

/* =======================
   UI FLOW
======================= */

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

  loadCardState(card);

  cardDetailEl.style.display = "block";
  cardNameEl.textContent = `${card.name} (Level ${card.level})`;

  topActionsEl.innerHTML = "";
  bottomActionsEl.innerHTML = "";

  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  enhancementSelectEl.disabled = true;
  costOutputEl.textContent = "";

  renderActions(card.top, topActionsEl);
  renderActions(card.bottom, bottomActionsEl);

  updateTotalCost(card);
  renderCardPreview(card);
}

/* =======================
   ACTIONS RENDER
======================= */

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

/* =======================
   SELECT ACTION
======================= */

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

    const slot = action.enhancement_slots.find(s =>
      ACTION_BASE_RULES[action.type]?.[s]?.includes(e)
    );

    opt.textContent = `${SLOT_ICONS[slot] || ""} ${e.toUpperCase()}`;
    opt.title = getEnhancementHelp(e, action.type);

    enhancementSelectEl.appendChild(opt);
  });
}

/* =======================
   APPLY ENHANCEMENT
======================= */

enhancementSelectEl.addEventListener("change", () => {
  if (!currentAction || !currentCard) return;

  const enh = enhancementSelectEl.value;
  if (!enh) return;

  // 🔒 G1 — VALIDATION
  const used = usedSlots.get(currentAction) || [];

  const errors = validateEnhancement({
    action: currentAction,
    enhancement: enh,
    usedEnhancements: used,
    cardLevel: currentCard.level
  });

  if (errors.length > 0) {
    costOutputEl.innerHTML = `
      <div class="validation-error">
        <strong>Invalid enhancement:</strong><br>
        ${errors.join("<br>")}
      </div>
    `;
    enhancementSelectEl.value = "";
    return;
  }


  let base = 0;

  // 🔷 REGRA ESPECIAL HEX (E3 / “4”)
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

  cardEnhancements.get(currentCard).push({
    action: currentAction,
    enhancement: enh,
    cost: total
  });

  saveCardState(currentCard);

  enhancementSelectEl.value = "";
  enhancementSelectEl.blur();

  costOutputEl.innerHTML = `<strong>Total cost: ${total}g</strong>`;

  updateTotalCost(currentCard);
  renderActions(currentCard.top, topActionsEl);
  renderActions(currentCard.bottom, bottomActionsEl);
  renderCardPreview(currentCard);
});

/* =======================
   REMOVE ENHANCEMENT
======================= */

function removeEnhancement(action, index) {
  const used = usedSlots.get(action);
  const enh = used[index];
  used.splice(index, 1);

  const list = cardEnhancements.get(currentCard);
  const i = list.findIndex(e => e.action === action && e.enhancement === enh);
  if (i !== -1) list.splice(i, 1);

  saveCardState(currentCard);
  showCard(currentCard);
}

/* =======================
   TOTAL & PREVIEW
======================= */

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

/* =======================
   EXPORT (F6)
======================= */

exportBtnEl.addEventListener("click", () => {
  if (!currentCard) return;

  const enhancements = cardEnhancements.get(currentCard) || [];

  const buildActions = actions =>
    actions.map(a => ({
      type: a.type,
      enhancements: (usedSlots.get(a) || []).map(e => {
        const entry = enhancements.find(
          x => x.action === a && x.enhancement === e
        );
        return { id: e, cost: entry?.cost || 0 };
      })
    }));

  const exportData = {
    class: currentCard.class,
    card: currentCard.name,
    level: currentCard.level,
    totalCost: enhancements.reduce((s, e) => s + e.cost, 0),
    actions: {
      top: buildActions(currentCard.top),
      bottom: buildActions(currentCard.bottom)
    }
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `${currentCard.class}_${currentCard.name}_Lv${currentCard.level}.json`;

  a.click();
  URL.revokeObjectURL(url);
});

/* =======================
   HELPERS
======================= */

function getEnhancementIcon(e) {
  return {
    attack: "⚔️",
    move: "👣",
    heal: "💚",
    shield: "🛡️",
    poison: "☠️",
    wound: "🩸",
    curse: "🧿",
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

/* =======================
   STORAGE
======================= */

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
    slots: [...usedSlots.entries()].map(([action, list]) => ({
      type: action.type,
      list
    }))
  };

  setStorage(store);
}

function loadCardState(card) {
  const store = getStorage();
  const key = getCardKey(card);
  if (!store[key]) return;

  usedSlots = new WeakMap();
  cardEnhancements.set(card, store[key].enhancements || []);
}

/* =======================
   RESET
======================= */

resetBtnEl.addEventListener("click", () => {
  if (!currentCard) return;

  cardEnhancements.set(currentCard, []);
  [...currentCard.top, ...currentCard.bottom].forEach(a => usedSlots.delete(a));

  const store = getStorage();
  delete store[getCardKey(currentCard)];
  setStorage(store);

  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "";
  currentAction = null;

  showCard(currentCard);
});

/* =======================
   F7 — EXPORT IMAGE (PNG)
======================= */

const exportImageBtn = document.getElementById("export-image");

exportImageBtn.addEventListener("click", async () => {
  if (!currentCard) return;

  const cardEl = document.querySelector(".card-preview");

  if (!cardEl) {
    alert("Card preview not found");
    return;
  }

  const canvas = await html2canvas(cardEl, {
    backgroundColor: "#ffffff",
    scale: 2
  });

  const link = document.createElement("a");
  link.download = `${currentCard.class}_${currentCard.name}_Lv${currentCard.level}.png`;
  link.href = canvas.toDataURL("image/png");

  link.click();
});

/* =======================
   F7.1 — EXPORT PDF
======================= */

const exportPdfBtn = document.getElementById("export-pdf");

exportPdfBtn.addEventListener("click", async () => {
  if (!currentCard) return;

  const cardEl = document.querySelector(".card-preview");
  if (!cardEl) {
    alert("Card preview not found");
    return;
  }

  const canvas = await html2canvas(cardEl, {
    backgroundColor: "#ffffff",
    scale: 2
  });

  const imgData = canvas.toDataURL("image/png");

  const { jsPDF } = window.jspdf;

  // Tamanho A4 em mm
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const imgWidth = pageWidth - 40;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(
    imgData,
    "PNG",
    20,
    20,
    imgWidth,
    imgHeight
  );

  pdf.save(
    `${currentCard.class}_${currentCard.name}_Lv${currentCard.level}.pdf`
  );
});

/* =======================
   F8 — EXPORT / IMPORT JSON
======================= */

const exportJsonBtn = document.getElementById("export-json");
const importJsonBtn = document.getElementById("import-json");
const importJsonFile = document.getElementById("import-json-file");

/* ---------- EXPORT ---------- */
exportJsonBtn.addEventListener("click", () => {
  if (!currentCard) return;

  const data = {
    card: {
      class: currentCard.class,
      name: currentCard.name,
      level: currentCard.level
    },
    enhancements: cardEnhancements.get(currentCard) || [],
    slots: [...currentCard.top, ...currentCard.bottom].map(action => ({
      type: action.type,
      value: action.value,
      used: usedSlots.get(action) || []
    }))
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${currentCard.class}_${currentCard.name}_Lv${currentCard.level}.json`;
  a.click();
});

/* ---------- IMPORT ---------- */
importJsonBtn.addEventListener("click", () => {
  importJsonFile.click();
});

importJsonFile.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      importCardData(data);
    } catch {
      alert("Invalid JSON file");
    }
  };
  reader.readAsText(file);
});

function importCardData(data) {
  const card = allCards.find(
    c =>
      c.class === data.card.class &&
      c.name === data.card.name &&
      c.level === data.card.level
  );

  if (!card) {
    alert("Card not found in database");
    return;
  }

  // Reset estado
  cardEnhancements.set(card, []);
  [...card.top, ...card.bottom].forEach(a => usedSlots.delete(a));

  // Restaurar enhancements
  cardEnhancements.set(card, data.enhancements || []);

  // Restaurar slots
  data.slots.forEach(s => {
    const action = [...card.top, ...card.bottom].find(
      a => a.type === s.type && a.value === s.value
    );
    if (action) {
      usedSlots.set(action, [...s.used]);
    }
  });

  saveCardState(card);
  showCard(card);
}
