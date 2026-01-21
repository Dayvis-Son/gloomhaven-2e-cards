const classListEl = document.getElementById("class-list");
const cardListEl = document.getElementById("card-list");
const contentTitleEl = document.getElementById("content-title");
const elementChoiceEl = document.getElementById("element-choice");
const elementSelectEl = document.getElementById("element-select");

const cardDetailEl = document.getElementById("card-detail");
const cardNameEl = document.getElementById("card-name");
const topActionsEl = document.getElementById("top-actions");
const bottomActionsEl = document.getElementById("bottom-actions");

const enhancementSelectEl = document.getElementById("enhancement-select");
const costOutputEl = document.getElementById("cost-output");

let allCards = [];
let enhancementCosts = {};
let enhancementRules = {};
let currentCard = null;
let currentAction = null;

/* 🔹 O QUE CADA SLOT PERMITE */
const SLOT_RULES = {
  square: ["attack", "move", "heal", "jump"],
  circle: ["attack", "move", "heal", "jump", "elements", "wild_elements"],
  diamond: [
    "attack", "move", "heal", "jump",
    "poison", "wound", "muddle", "immobilize", "curse"
  ],
  diamond_plus: [
    "attack", "move", "heal", "jump",
    "bless", "strengthen", "ward", "invisible", "safeguard"
  ],
  hex: ["area_hex"]
};

Promise.all([
  fetch("data/enhancements.json").then(r => r.json()),
  fetch("data/enhancement-rules.json").then(r => r.json()),
  fetch("data/cards.json").then(r => r.json()),
  fetch("data/classes.json").then(r => r.json())
]).then(([costs, rules, cards, classes]) => {
  enhancementCosts = costs;
  enhancementRules = rules;
  allCards = cards;

  classes.forEach(cls => {
    const li = document.createElement("li");
    li.textContent = cls.name;
    li.onclick = () => showCardsForClass(cls);
    classListEl.appendChild(li);
  });
});

function showCardsForClass(cls) {
  contentTitleEl.textContent = `${cls.name} Cards`;
  cardListEl.innerHTML = "";
  cardDetailEl.style.display = "none";

  allCards.filter(c => c.class === cls.id)
    .forEach(card => {
      const li = document.createElement("li");
      li.textContent = `${card.name} (Level ${card.level})`;
      li.onclick = () => showCard(card);
      cardListEl.appendChild(li);
    });
}

function showCard(card) {
  currentCard = card;
  currentAction = null;

  cardDetailEl.style.display = "block";
  cardNameEl.textContent = `${card.name} (Level ${card.level})`;

  topActionsEl.innerHTML = "";
  bottomActionsEl.innerHTML = "";
  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "Select an action.";

  const renderActions = (actions, container) => {
    actions.forEach(action => {
      if (!action.enhanceable) return;

      const li = document.createElement("li");
      const btn = document.createElement("button");

      btn.textContent = `${action.type.toUpperCase()}`;
      btn.onclick = () => selectAction(action);

      li.appendChild(btn);
      container.appendChild(li);
    });
  };

  renderActions(card.top, topActionsEl);
  renderActions(card.bottom, bottomActionsEl);
}

function selectAction(action) {
  currentAction = action;

  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "Select an enhancement.";
  elementChoiceEl.style.display = "none";

  if (!action.enhancement_slots) return;

  const allowed = new Set();

  action.enhancement_slots.forEach(slot => {
    (SLOT_RULES[slot] || []).forEach(e => allowed.add(e));
  });

  allowed.forEach(enh => {
    const opt = document.createElement("option");
    opt.value = enh;
    opt.textContent = enh.replace("_", " ").toUpperCase();
    enhancementSelectEl.appendChild(opt);
  });
}

enhancementSelectEl.addEventListener("change", () => {
  const enh = enhancementSelectEl.value;
  if (!enh || !currentAction) return;

  const base = enhancementCosts[enh]?.single?.["1"];
  if (!base) {
    costOutputEl.textContent = "No cost data.";
    return;
  }

  let cost = base;

  // Loss divide base cost by 2
  if (currentAction.loss) {
    cost = Math.ceil(cost / 2);
  }

  costOutputEl.textContent = `Cost: ${cost}g`;

  if (enh === "wild_elements") {
    elementChoiceEl.style.display = "block";
  } else {
    elementChoiceEl.style.display = "none";
  }
});
