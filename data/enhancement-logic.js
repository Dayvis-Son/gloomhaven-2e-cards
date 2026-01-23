// data/enhancement-logic.js

export const SLOT_ICONS = {
  square: "⬜",
  circle: "⚪",
  diamond: "🔷",
  diamond_plus: "🔷➕",
  hex: "⬢"
};

/**
 * SLOT MEANINGS (oficial):
 * square        = +1 no valor da ação existente
 * circle        = elementos
 * diamond       = circle + status negativos
 * diamond_plus  = circle + status positivos
 */
export const ACTION_BASE_RULES = {
  attack: {
    square: ["attack"],
    circle: ["elements", "wild_elements"],
    diamond: [
      "poison",
      "wound",
      "curse",
      "muddle",
      "immobilize"
    ],
    diamond_plus: ["bless", "strengthen", "ward"]
  },

  move: {
    square: ["move"],
    circle: ["jump", "elements", "wild_elements"]
  },

  heal: {
    square: ["heal"],
    circle: ["elements", "wild_elements"],
    diamond_plus: ["bless", "strengthen", "ward"]
  },

  teleport: {
    square: ["move"],
    circle: ["elements", "wild_elements"]
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

  /**
   * Push / Pull / Pierce
   * Só aparecem se a ação já existir na carta
   * Square = +1 no valor
   */
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
 * Filtros condicionais finais (hard rules)
 */
export function applyConditionalFilters(action, enhancements) {
  let result = [...enhancements];

  // 🚫 Teleport nunca pode Jump
  if (action.type === "teleport") {
    result = result.filter(e => e !== "jump");
  }

  // 🚫 Não permitir Jump se já houver Jump base
  if (action.jump === true) {
    result = result.filter(e => e !== "jump");
  }

  // 🚫 Push / Pull / Pierce nunca podem ser adicionados a outra ação
  if (!["push", "pull", "pierce"].includes(action.type)) {
    result = result.filter(
      e => !["push", "pull", "pierce"].includes(e)
    );
  }

  return result;
}
