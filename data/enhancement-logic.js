// data/enhancement-logic.js

export const SLOT_ICONS = {
  square: "⬜",
  circle: "⚪",
  diamond: "🔷",
  diamond_plus: "🔷➕",
  hex: "⬢"
};

/**
 * Regras base:
 * - Square = +1 do próprio atributo
 * - Circle = elementos
 * - Diamond = circle + status negativos
 * - Diamond+ = circle + status positivos
 */
export const ACTION_BASE_RULES = {
  attack: {
    square: ["attack"],
    circle: ["elements", "wild_elements"],
    diamond: ["poison", "wound", "muddle", "curse", "immobilize"],
    diamond_plus: ["bless", "strengthen", "ward"]
  },

  move: {
    square: ["move", "jump"],
    circle: ["elements", "wild_elements"]
  },

  heal: {
    square: ["heal"],
    circle: ["elements", "wild_elements"],
    diamond_plus: ["bless", "strengthen", "ward"]
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
    diamond_plus: ["bless", "strengthen", "ward"]
  },

  push: {
    square: ["push"]
  },

  pull: {
    square: ["pull"]
  },

  pierce: {
    square: ["pierce"]
  },

  summon_stat: {
    square: [
      "summon_hp",
      "summon_attack",
      "summon_move",
      "summon_range"
    ]
  },

  area: {
    hex: ["area_hex"]
  }
};

/**
 * Filtros condicionais (hard rules finais)
 */
export function applyConditionalFilters(action, enhancements) {
  let result = [...enhancements];

  // Attack não pode receber upgrade de Move / Heal / Jump
  if (action.type === "attack") {
    result = result.filter(
      e => !["move", "heal", "jump"].includes(e)
    );
  }

  // Move não pode receber Attack / Heal
  if (action.type === "move") {
    result = result.filter(
      e => !["attack", "heal"].includes(e)
    );
  }

  // Heal só aceita heal + bônus positivos
  if (action.type === "heal") {
    result = result.filter(
      e =>
        e === "heal" ||
        ["bless", "strengthen", "ward", "elements", "wild_elements"].includes(e)
    );
  }

  // Jump não pode ser aplicado se a ação já tem jump base
  if (action.jump === true) {
    result = result.filter(e => e !== "jump");
  }

  return result;
}
