// data/enhancement-logic.js

export const SLOT_ICONS = {
  square: "⬜",        // +1 base
  circle: "⚪",        // +1 + elementos
  diamond: "🔷",       // círculo + status negativos
  diamond_plus: "🔷➕", // círculo + status positivos
  hex: "⬢"
};

export const ACTION_BASE_RULES = {
  attack: {
    square: ["attack"],
    circle: ["attack", "elements", "wild_elements"],
    diamond: ["poison", "wound", "curse", "muddle", "immobilize"],
    diamond_plus: ["bless", "strengthen", "ward"]
  },

  move: {
    square: ["move"],
    circle: ["move", "elements", "wild_elements"],
    diamond_plus: ["jump"]
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

  summon_stat: {
    square: ["summon_hp", "summon_attack", "summon_move", "summon_range"]
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

  // Attack nunca recebe move / heal / jump
  if (action.type === "attack") {
    result = result.filter(
      e => !["move", "heal", "jump"].includes(e)
    );
  }

  // Move nunca recebe attack / heal
  if (action.type === "move") {
    result = result.filter(
      e => !["attack", "heal"].includes(e)
    );
  }

  // Heal só aceita bônus positivos
  if (action.type === "heal") {
    result = result.filter(
      e =>
        e === "heal" ||
        ["bless", "strengthen", "ward", "elements", "wild_elements"].includes(e)
    );
  }

  // Teleport nunca recebe jump
  if (action.type === "teleport") {
    result = result.filter(e => e !== "jump");
  }

  // Se já tiver jump base, não pode comprar jump
  if (action.jump === true) {
    result = result.filter(e => e !== "jump");
  }

  return result;
}
