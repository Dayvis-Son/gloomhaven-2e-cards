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
    triangle: ["immobilize", "curse", "poison", "wound", "muddle"],
    triangle_plus: ["bless", "strengthen", "ward"]
  },

  heal: {
    square: ["heal"],
    circle: ["heal", "elements", "wild_elements"],
    triangle_plus: ["bless", "strengthen", "ward"]
  },

  move: {
    square: ["move", "jump"],
    circle: ["move", "jump", "elements", "wild_elements"]
  },

  teleport: {
    square: ["move"],
    circle: ["move", "elements", "wild_elements"]
  },

  retaliate: {
    square: ["retaliate"],
    triangle_plus: ["bless", "strengthen", "ward"]
  },

  shield: {
    square: ["shield"]
  },

  area: {
    hex: ["area_hex"]
  },

  range: {
    square: ["range"]
  },

  target: {
    square: ["target"]
  },

  summon: {
    square: ["summon_hp", "summon_attack", "summon_move", "summon_range"]
  }
};

export function applyConditionalFilters(action, options) {
  // Jump não aparece se já existir
  if (action.jump) {
    options = options.filter(o => o !== "jump");
  }

  // Attack nunca pode receber move/heal/jump
  if (action.type === "attack") {
    options = options.filter(
      o => !["move", "jump", "heal"].includes(o)
    );
  }

  // Move só move/jump
  if (action.type === "move") {
    options = options.filter(
      o => ["move", "jump", "elements", "wild_elements"].includes(o)
    );
  }

  return options;
}
