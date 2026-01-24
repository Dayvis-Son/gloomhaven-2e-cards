// data/enhancement-logic.js

/**
 * Símbolos oficiais de slot
 */
export const SLOT_ICONS = {
  square: "⬜",        // +1
  circle: "⚪",        // +1 + elementos
  diamond: "🔷",       // circle + status negativos
  diamond_plus: "🔷➕",// circle + status positivos
  hex: "⬢"            // área
};

/**
 * Regras base por tipo de ação
 * Define O QUE cada símbolo libera
 */
export const ACTION_BASE_RULES = {
  // ======================
  // ATAQUE
  // ======================
  attack: {
    square: ["attack"],
    circle: ["attack", "elements", "wild_elements"],
    diamond: ["poison", "wound", "curse", "muddle", "immobilize"],
    diamond_plus: ["bless", "strengthen", "ward"]
  },

  // ======================
  // MOVE
  // ======================
  move: {
    square: ["move"],
    circle: ["move", "elements", "wild_elements", "jump"]
  },

  teleport: {
    square: ["move"],
    circle: ["move", "elements", "wild_elements"]
  },

  // ======================
  // HEAL
  // ======================
  heal: {
    square: ["heal"],
    circle: ["heal", "elements", "wild_elements"],
    diamond_plus: ["bless", "strengthen", "ward"]
  },

  // ======================
  // RANGE / TARGET
  // ======================
  range: {
    square: ["range"]
  },

  target: {
    square: ["target"]
  },

  // ======================
  // DEFENSIVOS
  // ======================
  shield: {
    square: ["shield"]
  },

  retaliate: {
    square: ["retaliate"],
    diamond_plus: ["bless", "strengthen", "ward"]
  },

  // ======================
  // PUSH / PULL / PIERCE
  // (ações existentes, apenas upgrade +1)
  // ======================
  push: {
    square: ["push"]
  },

  pull: {
    square: ["pull"]
  },

  pierce: {
    square: ["pierce"]
  },

  // ======================
  // SUMMONS (stats apenas +1)
  // ======================
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

  // ======================
  // ÁREA
  // ======================
  area: {
    hex: ["area_hex"]
  }
};

/**
 * Filtros condicionais finais (hard rules)
 * Aqui garantimos que nada ilegal passe
 */
export function applyConditionalFilters(action, enhancements) {
  let result = [...enhancements];

  // 🚫 Attack não pode receber move, heal ou jump
  if (action.type === "attack") {
    result = result.filter(
      e => !["move", "heal", "jump"].includes(e)
    );
  }

  // 🚫 Move não pode receber attack ou heal
  if (action.type === "move") {
    result = result.filter(
      e => !["attack", "heal"].includes(e)
    );
  }

  // 🚫 Heal só aceita heal + bônus positivos
  if (action.type === "heal") {
    result = result.filter(
      e =>
        e === "heal" ||
        ["bless", "strengthen", "ward", "elements", "wild_elements"].includes(e)
    );
  }

  // 🚫 Teleport nunca pode ganhar jump
  if (action.type === "teleport") {
    result = result.filter(e => e !== "jump");
  }

  // 🚫 Não permitir adicionar Jump se já existe Jump base
  if (action.jump === true) {
    result = result.filter(e => e !== "jump");
  }

  // 🚫 Push / Pull / Pierce NÃO podem ser adicionados a outras ações
  if (
    ["attack", "move", "heal", "range", "target"].includes(action.type)
  ) {
    result = result.filter(
      e => !["push", "pull", "pierce"].includes(e)
    );
  }

  return result;
}
