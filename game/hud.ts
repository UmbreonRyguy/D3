import {
  type GameEvent,
  type GameState,
  type Inventory,
  terrainAt,
} from "../core/mod.ts";

function element(id: string): HTMLElement {
  return document.getElementById(id)!;
}

function describe(event: GameEvent): string {
  switch (event.type) {
    case "moved":
      return `moved to ${event.to.x}, ${event.to.y}`;
    case "blocked":
      if (event.terrain === "water") {
        return "You need a makeshift boat to cross the water.";
      }
      return `blocked by ${event.terrain} at ${event.toward.x}, ${event.toward.y}`;
    case "pickedUp":
      return `picked up a ${event.material}`;
    case "crafted":
      return `crafted ${event.output}`;
    case "craftFailed":
      return `cannot craft ${event.output}; missing ${
        Object.entries(event.missing)
          .map(([item, quantity]) => `${quantity} ${item}`)
          .join(", ")
      }`;
    case "gameOver":
      return "You built the Makeshift Boat and can now Escape!";
  }
}

// The readout, as ordinary page elements that CSS can style and that assistive
// tools can read. It changes only as events play.
export class Hud {
  private readonly seed: number;

  constructor(state: GameState) {
    this.seed = state.seed;
    this.showPosition(state.player.x, state.player.y);
    this.showInventory(state.inventory);
  }

  show(event: GameEvent) {
    element("live").textContent = describe(event);
    if (event.type === "moved") this.showPosition(event.to.x, event.to.y);
    if (event.type === "pickedUp" || event.type === "crafted") {
      this.showInventory(event.inventory);
    }
    if (event.type === "gameOver") {
      element("ending-banner").hidden = false;
    }
  }

  private showPosition(x: number, y: number) {
    element("position").textContent = `${x}, ${y}`;
    element("terrain").textContent = terrainAt(this.seed, x, y);
  }

  private showInventory(inventory: Inventory) {
    const held = Object.entries(inventory)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([material, count]) => `${material} ×${count ?? 0}`);
    element("inventory").textContent = held.join(", ") || "empty";
  }
}
