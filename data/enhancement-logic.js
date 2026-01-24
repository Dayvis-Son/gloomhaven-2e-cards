// data/enhancement-logic.js

export const SLOT_ICONS = {
  square: "⬜",          // +1
  circle: "⚪",          // +1 ou elemento
  diamond: "🔷",         // tudo do circle + status negativos
  diamond_plus: "🔷➕",  // tudo do circle + status positivos
  hex: "⬢"              // área
};

export const ACTION_BASE_RULES = {
  attack: {
    square: ["attack"],
    circle: ["attack", "elements", "wild_elements"],
    diamond: ["poison", "wound", "curse", "muddle", "immobilize"],
    diamond_plus: ["bless", "strengthen", "ward"]
  },

  move: {
    square: ["move", "jump"],
    circle: ["move", "jump", "elements", "wild_elements"]
  },

  heal: {
    square: ["heal"],
    circle: ["heal", "elements", "wild_elements"],
    diamond_plus: ["bless", "strengthen", "ward"]
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

  summon_hp: {
    square: ["summon_hp"]
  },

  summon_attack: {
    square: ["summon_attack"]
  },

  summon_move: {
    square: ["summon_move"]
  },

  summon_range: {
    square: ["summon_range"]
  },

  area: {
    hex: ["area_hex"]
  }
};

/**
 * Hard rules finais
 */
export function applyConditionalFilters(action, enhancements) {
  let result = [...enhancements];

  // Attack nunca pode receber move, heal ou jump
  if (action.type === "attack") {
    result = result.filter(
      e => !["move", "heal", "jump"].includes(e)
    );
  }

  // Move nunca pode receber attack ou heal
  if (action.type === "move") {
    result = result.filter(
      e => !["attack", "heal"].includes(e)
    );
  }

  // Heal só aceita heal, elementos e status positivos
  if (action.type === "heal") {
    result = result.filter(
      e =>
        e === "heal" ||
        ["elements", "wild_elements", "bless", "strengthen", "ward"].includes(e)
    );
  }

  // Teleport nunca pode receber jump
  if (action.type === "teleport") {
    result = result.filter(e => e !== "jump");
  }

  // Se a ação já tem jump base, não permitir comprar jump
  if (action.jump === true) {
    result = result.filter(e => e !== "jump");
  }

  return result;
}
