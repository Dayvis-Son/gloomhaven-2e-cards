const classListEl = document.getElementById("class-list");
const cardListEl = document.getElementById("card-list");
const contentTitleEl = document.getElementById("content-title");

let allCards = [];

fetch("data/cards.json")
  .then(res => res.json())
  .then(cards => {
    allCards = cards;
  });

fetch("data/classes.json")
  .then(res => res.json())
  .then(classes => {
    classes.forEach(cls => {
      const li = document.createElement("li");
      li.textContent = cls.name;
      li.dataset.id = cls.id;

      li.addEventListener("click", () => {
        showCardsForClass(cls);
      });

      classListEl.appendChild(li);
    });
  });

function showCardsForClass(cls) {
  contentTitleEl.textContent = `${cls.name} Cards`;
  cardListEl.innerHTML = "";

  const cards = allCards.filter(c => c.class === cls.id);

  if (cards.length === 0) {
    cardListEl.innerHTML = "<li>No cards available.</li>";
    return;
  }

  cards.forEach(card => {
    const li = document.createElement("li");
    li.textContent = `${card.name} (Level ${card.level})`;
    cardListEl.appendChild(li);
  });
}
