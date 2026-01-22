/* ==========================
   G1 — ENHANCEMENT VALIDATOR
========================== */

export function validateEnhancement({
  action,
  enhancement,
  usedEnhancements,
  cardLevel
}) {
  const errors = [];

  // 1️⃣ Slot overflow
  if (usedEnhancements.length >= action.enhancement_slots.length) {
    errors.push("No enhancement slots available");
  }

  // 2️⃣ Loss restrictions
  if (action.loss) {
    const forbiddenOnLoss = ["jump", "teleport", "area_hex"];
    if (forbiddenOnLoss.includes(enhancement)) {
      errors.push("This enhancement cannot be used on a LOSS action");
    }
  }

  // 3️⃣ Element rules
  const hasElement = usedEnhancements.includes("elements");
  const hasWild = usedEnhancements.includes("wild_elements");

  if (
    (enhancement === "elements" && hasWild) ||
    (enhancement === "wild_elements" && hasElement)
  ) {
    errors.push("Cannot combine Element and Wild Element on the same action");
  }

  // 4️⃣ Duplicate illegal enhancements
  const noDuplicate = [
    "jump",
    "teleport",
    "area_hex",
    "elements",
    "wild_elements"
  ];

  if (noDuplicate.includes(enhancement) && usedEnhancements.includes(enhancement)) {
    errors.push("This enhancement cannot be applied more than once");
  }

  // 5️⃣ Teleport special rule (Quadrado = +1 only)
  if (enhancement === "teleport" && action.shape === "square") {
    if (usedEnhancements.includes("teleport")) {
      errors.push("Teleport on Square can only be applied once (+1)");
    }
  }

  // 6️⃣ Area Hex must have hex data
  if (enhancement === "area_hex") {
    if (!action.hexes || action.hexes < 1) {
      errors.push("Area Hex enhancement requires a valid AoE pattern");
    }
  }

  return errors;
}
