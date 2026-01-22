/* ==========================
   G2 — HARD FILTER
========================== */

export function hardFilterEnhancements({
  action,
  allowed,
  used
}) {
  let result = [...allowed];

  // 1️⃣ LOSS restrictions
  if (action.loss) {
    result = result.filter(e =>
      !["jump", "teleport", "area_hex"].includes(e)
    );
  }

  // 2️⃣ Element vs Wild Element
  if (used.includes("elements")) {
    result = result.filter(e => e !== "wild_elements");
  }

  if (used.includes("wild_elements")) {
    result = result.filter(e => e !== "elements");
  }

  // 3️⃣ No duplicates (hard rules)
  const noDuplicate = [
    "jump",
    "teleport",
    "area_hex",
    "elements",
    "wild_elements"
  ];

  result = result.filter(e =>
    !(noDuplicate.includes(e) && used.includes(e))
  );

  // 4️⃣ Teleport special case
  if (action.type === "teleport") {
    result = result.filter(e => e === "teleport");
  }

  // 5️⃣ Area Hex only if AoE exists
  if (!action.hexes || action.hexes < 1) {
    result = result.filter(e => e !== "area_hex");
  }

  return result;
}
