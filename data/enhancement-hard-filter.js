/* ==========================
   G2 + G3 — HARD FILTER + REASONS
========================== */

export function hardFilterEnhancementsWithReasons({
  action,
  allowed,
  used
}) {
  const reasons = {};
  let result = [...allowed];

  function remove(enh, reason) {
    if (result.includes(enh)) {
      reasons[enh] = reason;
      result = result.filter(e => e !== enh);
    }
  }

  // 1️⃣ LOSS
  if (action.loss) {
    ["jump", "teleport", "area_hex"].forEach(e =>
      remove(e, "Not allowed on LOSS actions")
    );
  }

  // 2️⃣ Element vs Wild
  if (used.includes("elements")) {
    remove("wild_elements", "Element already applied");
  }

  if (used.includes("wild_elements")) {
    remove("elements", "Wild element already applied");
  }

  // 3️⃣ No duplicates
  ["jump", "teleport", "area_hex", "elements", "wild_elements"].forEach(e => {
    if (used.includes(e)) {
      remove(e, "Cannot be applied more than once");
    }
  });

  // 4️⃣ Teleport special rule
  if (action.type === "teleport") {
    result.forEach(e => {
      if (e !== "teleport") {
        remove(e, "Teleport only allows +1");
      }
    });
  }

  // 5️⃣ AoE only
  if (!action.hexes || action.hexes < 1) {
    remove("area_hex", "Only available for AoE actions");
  }

  return { allowed: result, reasons };
}
