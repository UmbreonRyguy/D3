import { assertEquals } from "@std/assert";
import { isPassable } from "./terrain.ts";
import { materialAt, terrainAt } from "./mod.ts";
import { apply, newGame } from "./rules.ts";

Deno.test("water is blocked without a boat", () => {
  assertEquals(isPassable("water", {}), false);
});

Deno.test("water is accessible with a makeshift boat", () => {
  assertEquals(isPassable("water", { "makeshift boat": 1 }), true);
});

Deno.test("rock remains blocked even with a boat", () => {
  assertEquals(isPassable("rock", { "makeshift boat": 1 }), false);
});

Deno.test("water terrain can provide stone", () => {
  let found = false;
  for (let y = -500; y <= 500 && !found; y++) {
    for (let x = -500; x <= 500; x++) {
      if (
        terrainAt(121, x, y) === "water" && materialAt(121, x, y) === "stone"
      ) {
        found = true;
        break;
      }
    }
  }
  assertEquals(found, true);
});

Deno.test("player can gather stone after entering water", () => {
  const seed = 121;
  let start: { x: number; y: number } | null = null;
  let direction: "north" | "south" | "east" | "west" = "east";

  // find land beside water with stone
  search:
  for (let y = -500; y <= 500; y++) {
    for (let x = -500; x <= 500; x++) {
      if (
        terrainAt(seed, x, y) !== "water" || materialAt(seed, x, y) !== "stone"
      ) continue;
      const neighbors = [
        { x: x - 1, y, direction: "east" as const },
        { x: x + 1, y, direction: "west" as const },
        { x, y: y - 1, direction: "south" as const },
        { x, y: y + 1, direction: "north" as const },
      ];
      for (const neighbor of neighbors) {
        if (isPassable(terrainAt(seed, neighbor.x, neighbor.y), {})) {
          start = { x: neighbor.x, y: neighbor.y };
          direction = neighbor.direction;
          break search;
        }
      }
    }
  }
  if (!start) throw new Error("No suitable water found");
  const state = newGame(seed);
  state.player = start;
  state.inventory["makeshift boat"] = 1;

  const events = apply(state, { type: "move", direction });
  assertEquals(state.inventory.stone, 1);
  assertEquals(events.map((event) => event.type), ["moved", "pickedUp"]);
});
