// data/enhancement-logic.js

export const SLOT_ICONS = {
  square: "⬜",
  circle: "⚪",
  diamond: "🔷",
  diamond_plus: "🔷➕",
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
    square: ["move"],
    circle: ["jump", "elements", "wild_elements"]
  },

  heal: {
    square: ["heal"],
    circle: ["elements", "wild_elements"],
    diamond_plus: ["bless", "strengthen", "ward"]
  },

  range: { square: ["range"] },
  target: { square: ["target"] },
  shield: { square: ["shield"] },

  retaliate: {
    square: ["retaliate"],
    diamond_plus: ["bless", "strengthen", "ward"]
  },

  push: { square: ["push"] },
  pull: { square: ["pull"] },
  pierce: { square: ["pierce"] },

  summon_stat: {
    square: ["summon_hp", "summon_attack", "summon_move", "summon_range"]
  },

  area: {
    hex: ["area_hex"]
  }
};

export function applyConditionalFilters(action, enhancements) {
  let r = [...enhancements];

  if (action.type === "attack")
    r = r.filter(e => !["heal", "move", "jump"].includes(e));

  if (action.type === "move")
    r = r.filter(e => !["attack", "heal"].includes(e));

  if (action.type === "heal")
    r = r.filter(e =>
      ["heal", "bless", "strengthen", "ward", "elements", "wild_elements"].includes(e)
    );

  if (action.jump === true)
    r = r.filter(e => e !== "jump");

  return r;
}
