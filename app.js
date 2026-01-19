const classListEl = document.getElementById("class-list");

fetch("data/classes.json")
  .then(res => res.json())
  .then(classes => {
    classes.forEach(cls => {
      const li = document.createElement("li");
      li.textContent = cls.name;
      li.dataset.id = cls.id;
      classListEl.appendChild(li);
    });
  })
  .catch(err => {
    console.error("Failed to load classes.json", err);
  });
