// data/enhancement-logic.js

export const SLOT_ICONS = {
  square: "⬜",
  circle: "⚪",
  diamond: "🔷",
  diamond_plus: "🔷➕",
  hex: "⬢"
};

/**
 * ACTION_BASE_RULES
 * Define O QUE cada símbolo libera por tipo de ação
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
    square: ["summon_hp", "summon_attack", "summon_move", "summon_range"]
  },

  area: {
    hex: ["area_hex"]
  }
};

/**
 * HARD RULES
 * Filtros finais que nunca podem ser quebrados
 */
export function applyConditionalFilters(action, enhancements) {
  let result = [...enhancements];

  // 🚫 Attack nunca recebe Move, Heal ou Jump
  if (action.type === "attack") {
    result = result.filter(
      e => !["move", "heal", "jump"].includes(e)
    );
  }

  // 🚫 Move nunca recebe Attack ou Heal
  if (action.type === "move") {
    result = result.filter(
      e => !["attack", "heal"].includes(e)
    );
  }

  // 🚫 Heal só recebe Heal, elementos e buffs positivos
  if (action.type === "heal") {
    result = result.filter(
      e =>
        e === "heal" ||
        ["elements", "wild_elements", "bless", "strengthen", "ward"].includes(e)
    );
  }

  // 🚫 Push / Pull / Pierce nunca podem ser adicionados a outras ações
  if (!["push", "pull", "pierce"].includes(action.type)) {
    result = result.filter(
      e => !["push", "pull", "pierce"].includes(e)
    );
  }

  // 🚫 Jump não aparece se a ação já tiver Jump base
  if (action.jump === true) {
    result = result.filter(e => e !== "jump");
  }

  return result;
}
