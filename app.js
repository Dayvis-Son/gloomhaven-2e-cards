const classListEl = document.getElementById("class-list");
const cardListEl = document.getElementById("card-list");
const contentTitleEl = document.getElementById("content-title");

const cardDetailEl = document.getElementById("card-detail");
const cardNameEl = document.getElementById("card-name");
const actionListEl = document.getElementById("action-list");
const enhancementSelectEl = document.getElementById("enhancement-select");
const costOutputEl = document.getElementById("cost-output");

let allCards = [];
let enhancementCosts = {};
let currentCard = null;
let currentAction = null;

fetch("data/enhancements.json")
  .then(r => r.json())
  .then(data => enhancementCosts = data);

fetch("data/cards.json")
  .then(r => r.json())
  .then(cards => allCards = cards);

fetch("data/classes.json")
  .then(r => r.json())
  .then(classes => {
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
  actionListEl.innerHTML = "";
  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "Select an action.";

  card.actions.forEach(action => {
    const li = document.createElement("li");
    const btn = document.createElement("button");

    btn.textContent = `${action.type.toUpperCase()} (${action.multi ? "Multi" : "Single"})`;

    btn.onclick = () => selectAction(action);

    li.appendChild(btn);
    actionListEl.appendChild(li);
  });
}

function selectAction(action) {
  currentAction = action;
  enhancementSelectEl.innerHTML = `<option value="">Select enhancement</option>`;
  costOutputEl.textContent = "Select an enhancement.";

  Object.keys(enhancementCosts).forEach(key => {
    // regra simples inicial: enhancement só vale se existir custo
    if (enhancementCosts[key][action.multi ? "multi" : "single"]) {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = key.replace(/_/g, " ").toUpperCase();
      enhancementSelectEl.appendChild(opt);
    }
  });
}

enhancementSelectEl.addEventListener("change", () => {
  if (!currentAction || !enhancementSelectEl.value) return;

  const enhancement = enhancementSelectEl.value;
  const level = currentCard.level;
  const mode = currentAction.multi ? "multi" : "single";

  const cost = enhancementCosts[enhancement]?.[mode]?.[level];

  costOutputEl.textContent = cost
    ? `Enhancement cost: ${cost} gold`
    : "This enhancement cannot be applied.";
});
