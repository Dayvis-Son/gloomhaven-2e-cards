/* =====================================================
   ENHANCEMENT LOGIC — GLOOMHAVEN 2E
   ===================================================== */

/* -----------------------------
   BASE PER ACTION TYPE
----------------------------- */
export const ACTION_BASE_RULES = {
  attack: {
    square: ["attack"],
    circle: ["attack", "elements", "wild_elements"],
    triangle: [
      "attack",
      "elements", "wild_elements",
      "immobilize", "curse", "poison", "wound", "muddle"
    ],
    triangle_plus: [
      "attack",
      "elements", "wild_elements",
      "bless", "strengthen", "ward"
    ]
  },

  heal: {
    square: ["heal"],
    circle: ["heal", "elements", "wild_elements"],
    triangle_plus: ["heal", "elements", "wild_elements", "bless", "strengthen", "ward"]
  },

  move: {
    square: ["move", "jump"],
    circle: ["move", "jump", "elements", "wild_elements"]
  },

  teleport: {
    square: ["move"],
    circle: ["move", "elements", "wild_elements"]
  },

  range: {
    square: ["range"]
  },

  target: {
    square: ["target"]
  },

  shield: {
    square: ["shield"]
  },

  retaliate: {
    square: ["retaliate"],
    triangle_plus: ["retaliate", "bless", "strengthen", "ward"]
  },

  summon_hp: { square: ["summon_hp"] },
  summon_attack: { square: ["summon_attack"] },
  summon_move: { square: ["summon_move"] },
  summon_range: { square: ["summon_range"] },

  area_hex: {
    hex: ["area_hex"]
  }
};

/* -----------------------------
   CONDITIONAL FILTERS
----------------------------- */
export function applyConditionalFilters(action, options) {
  let result = [...options];

  // ❌ Jump não aparece se já existir na ação
  if (action.type === "move" || action.type === "teleport") {
    if (action.jump === true) {
      result = result.filter(o => o !== "jump");
    }
  }

  return result;
}
