// data/card-validator.js

export function validateCard(card, cardEnhancements) {
  const errors = [];

  (cardEnhancements || []).forEach(({ action, enhancement }) => {
    const type = action.type;

    // ATTACK
    if (type === "attack") {
      if (["heal", "move", "jump"].includes(enhancement)) {
        errors.push(`Attack cannot have ${enhancement.toUpperCase()}`);
      }
    }

    // MOVE
    if (type === "move") {
      if (["attack", "heal"].includes(enhancement)) {
        errors.push(`Move cannot have ${enhancement.toUpperCase()}`);
      }
    }

    // HEAL
    if (type === "heal") {
      if (["attack", "move", "jump"].includes(enhancement)) {
        errors.push(`Heal cannot have ${enhancement.toUpperCase()}`);
      }
    }

    // TELEPORT
    if (type === "teleport") {
      if (enhancement === "jump") {
        errors.push("Teleport cannot receive Jump");
      }
    }

    // AREA HEX
    if (enhancement === "area_hex" && type !== "attack") {
      errors.push("Area Hex only allowed on Attack actions");
    }
  });

  return errors;
}
