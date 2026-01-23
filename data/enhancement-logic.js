// data/enhancement-logic.js

export const SLOT_ICONS = {
  square: "⬜",
  circle: "⚪",
  diamond: "◆",
  diamond_plus: "◆➕",
  hex: "⬢"
};

export const ACTION_BASE_RULES = {
  attack: {
    square: ["attack"],
    circle: ["elements", "wild_elements"],
    diamond: ["poison", "wound", "curse", "muddle", "immobilize"],
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

  // ações base que só recebem +1
  push: {
    square: ["push"]
  },

  pull: {
    square: ["pull"]
  },

  pierce: {
    square: ["pierce"]
  },

  summon: {
    square: ["summon_hp", "summon_attack", "summon_move", "summon_range"]
  },

  area: {
    hex: ["area_hex"]
  }
};

/**
 * Filtros finais (hard rules)
 */
export function applyConditionalFilters(action, enhancements) {
  let result = [...enhancements];

  // Push / Pull / Pierce nunca podem ser adicionados a outras ações
  if (!["push", "pull", "pierce"].includes(action.type)) {
    result = result.filter(
      e => !["push", "pull", "pierce"].includes(e)
    );
  }

  // Jump não pode se a ação já tiver jump
  if (action.jump === true) {
    result = result.filter(e => e !== "jump");
  }

  return result;
}
