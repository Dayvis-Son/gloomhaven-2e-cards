// data/enhancement-logic.js

export const SLOT_ICONS = {
  square: "⬜",
  circle: "⚪",
  triangle: "🔺",
  triangle_plus: "🔺➕",
  hex: "⬢"
};

export const ACTION_BASE_RULES = {
  attack: {
    square: ["attack"],
    circle: ["attack", "elements", "wild_elements"],
    triangle: ["poison", "wound", "curse", "muddle", "immobilize"],
    triangle_plus: ["bless", "strengthen", "ward"]
  },

  move: {
    square: ["move", "jump"],
    circle: ["move", "jump", "elements", "wild_elements"]
  },

  heal: {
    square: ["heal"],
    circle: ["heal", "elements", "wild_elements"],
    triangle_plus: ["bless", "strengthen", "ward"]
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
    triangle_plus: ["bless", "strengthen", "ward"]
  },

  summon_stat: {
    square: ["summon_hp", "summon_atk", "summon_move", "summon_range"]
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

  // 🚫 Attack nunca pode ter heal, move ou jump
  if (action.type === "attack") {
    result = result.filter(
      e => !["heal", "move", "jump"].includes(e)
    );
  }

  // 🚫 Move nunca pode ter attack ou heal
  if (action.type === "move") {
    result = result.filter(
      e => !["attack", "heal"].includes(e)
    );
  }

  // 🚫 Heal só pode ser heal + bônus positivos
  if (action.type === "heal") {
    result = result.filter(
      e =>
        e === "heal" ||
        ["bless", "strengthen", "ward", "elements", "wild_elements"].includes(e)
    );
  }

  // 🚫 Teleport nunca pode ter jump
  if (action.type === "teleport") {
    result = result.filter(e => e !== "jump");
  }

  // 🚫 Jump se a ação já tiver jump base
  if (action.jump === true) {
    result = result.filter(e => e !== "jump");
  }

  return result;
}
