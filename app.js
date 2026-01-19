fetch("data/enhancements.json")
  .then(response => {
    if (!response.ok) {
      throw new Error("Failed to load enhancements.json");
    }
    return response.json();
  })
  .then(data => {
    console.log("Enhancement data loaded:", data);

    const status = document.getElementById("status");
    status.textContent = `Enhancement data loaded successfully (${Object.keys(data).length} enhancements)`;
    status.style.color = "#7CFC9A";
  })
  .catch(error => {
    console.error(error);
    const status = document.getElementById("status");
    status.textContent = "Error loading enhancement data.";
    status.style.color = "#FF6B6B";
  });
