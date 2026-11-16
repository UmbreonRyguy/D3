// The rules of the game. There is no clock here: a command updates the state at
// once, and the events it returns are a record of what happened. Whoever called
// apply() decides how, or whether, to show them over time.

import { type Material, materialAt } from "./materials.ts";
import { isPassable, type Terrain, terrainAt } from "./terrain.ts";

export type Cell = { x: number; y: number };

export type Direction = "north" | "south" | "east" | "west";

// What the player carries, counted by material. Absent materials are zero.
export type Inventory = Partial<Record<Material, number>>;

// Plain data that survives JSON. Terrain and ground materials are absent
// because the seed can recompute them: besides the seed, only what the player
// has caused belongs here — where they stand, what they carry, and which
// ground cells they have already gathered.
export type GameState = {
  seed: number;
  player: Cell;
  inventory: Inventory;
  collected: Cell[];
};

// Command: https://gameprogrammingpatterns.com/command.html
export type Command = { type: "move"; direction: Direction };

// Domain Event: https://martinfowler.com/eaaDev/DomainEvent.html
export type GameEvent =
  | { type: "moved"; from: Cell; to: Cell }
  | { type: "blocked"; at: Cell; toward: Cell; terrain: Terrain }
  | { type: "pickedUp"; at: Cell; material: Material; inventory: Inventory };

const STEPS: Record<Direction, Cell> = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
};

// Singleton, avoided on purpose: tests make as many games as they need. https://gameprogrammingpatterns.com/singleton.html
export function newGame(seed: number): GameState {
  return { seed, player: { x: 0, y: 0 }, inventory: {}, collected: [] };
}

// The single way in. It updates the state it is given and returns the events.
export function apply(state: GameState, command: Command): GameEvent[] {
  switch (command.type) {
    case "move":
      return move(state, command.direction);
  }
}

function move(state: GameState, direction: Direction): GameEvent[] {
  const step = STEPS[direction];
  // Events are retained and played back later, while state keeps changing. So an
  // event gets cells of its own, never an object that state still holds.
  // Aliasing Bug: https://martinfowler.com/bliki/AliasingBug.html
  // Cells in events act as a Value Object: https://martinfowler.com/bliki/ValueObject.html
  const from = { ...state.player };
  const to = { x: from.x + step.x, y: from.y + step.y };
  const terrain = terrainAt(state.seed, to.x, to.y);
  if (!isPassable(terrain)) {
    return [{ type: "blocked", at: from, toward: to, terrain }];
  }
  state.player.x = to.x;
  state.player.y = to.y;
  return [{ type: "moved", from, to }, ...pickUp(state, to)];
}

// Walking onto ground that carries a material gathers it. A cell is spent once
// it is gathered: state remembers it, so the same cell never pays out twice.
function pickUp(state: GameState, at: Cell): GameEvent[] {
  const material = materialAt(state.seed, at.x, at.y);
  if (material === null || isCollected(state, at)) return [];
  state.collected.push({ ...at });
  state.inventory[material] = (state.inventory[material] ?? 0) + 1;
  // The event carries the totals after the pickup, copied, so outputs can show
  // them without asking state, which is already moving on.
  return [{
    type: "pickedUp",
    at: { ...at },
    material,
    inventory: { ...state.inventory },
  }];
}

function isCollected(state: GameState, { x, y }: Cell): boolean {
  return state.collected.some((cell) => cell.x === x && cell.y === y);
}
