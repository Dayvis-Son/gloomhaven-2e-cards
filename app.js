const classListEl = document.getElementById("class-list");
const cardListEl = document.getElementById("card-list");
const contentTitleEl = document.getElementById("content-title");

const cardDetailEl = document.getElementById("card-detail");
const cardNameEl = document.getElementById("card-name");
const actionListEl = document.getElementById("action-list");
const cardLevelEl = document.getElementById("card-level");
const costOutputEl = document.getElementById("cost-output");

let allCards = [];
let enhancementCosts = {};

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
  cardDetailEl.style.display = "block";
  cardNameEl.textContent = card.name;
  actionListEl.innerHTML = "";
  costOutputEl.textContent = "Select an action and enhancement.";

  cardLevelEl.innerHTML = "";
  for (let i = 1; i <= 9; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `Level ${i}`;
    cardLevelEl.appendChild(opt);
  }

  card.actions.forEach(action => {
    const li = document.createElement("li");

    const btn = document.createElement("button");
    btn.textContent = `${action.type.toUpperCase()} (${action.multi ? "Multi" : "Single"})`;

    btn.onclick = () => calculateCost(action);

    li.appendChild(btn);
    actionListEl.appendChild(li);
  });
}

function calculateCost(action) {
  const level = cardLevelEl.value;
  const type = action.type;

  if (!enhancementCosts[type]) {
    costOutputEl.textContent = "This action cannot be enhanced.";
    return;
  }

  const costData = enhancementCosts[type];
  const mode = action.multi ? "multi" : "single";

  const cost = costData[mode]?.[level];

  costOutputEl.textContent = cost
    ? `Enhancement cost: ${cost} gold`
    : "No cost data available.";
}
