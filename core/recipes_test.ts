import { assertEquals } from "@std/assert";
import { apply, newGame } from "./rules.ts";
import { RECIPES } from "./recipes.ts";
import { MATERIALS } from "./materials.ts";

Deno.test("every recipe input has a source", () => {
  const available = new Set<string>(MATERIALS);
  let changed = true;

  while (changed) {
    changed = false;

    for (const recipe of Object.values(RECIPES)) {
      const ready = Object.keys(recipe.inputs).every((item) =>
        available.has(item)
      );

      if (ready && !available.has(recipe.outputs.item)) {
        available.add(recipe.outputs.item);
        changed = true;
      }
    }
  }

  for (const recipe of Object.values(RECIPES)) {
    for (const input of Object.keys(recipe.inputs)) {
      assertEquals(
        available.has(input),
        true,
        `${recipe.outputs.item} needs ${input}, but nothing provides it`,
      );
    }
  }
});

Deno.test("crafting a sword consumes materials", () => {
  const state = newGame(121);

  state.inventory = { stick: 2, fiber: 2 };

  const events = apply(state, { type: "craft", recipe: "sword" });

  assertEquals(state.inventory, { sword: 1 });
  assertEquals(events[0].type, "crafted");
});

Deno.test("failed craftting does not change inventory", () => {
  const state = newGame(121);

  state.inventory = { stick: 1 };

  const before = JSON.stringify(state);

  const events = apply(state, { type: "craft", recipe: "sword" });

  assertEquals(JSON.stringify(state), before);
  assertEquals(events[0].type, "craftFailed");
});

Deno.test("crafting events keep independent inventory copies", () => {
  const state = newGame(121);
  state.inventory = { stick: 4, fiber: 4 };

  const first = apply(state, { type: "craft", recipe: "sword" });

  const saved = JSON.stringify(first);

  apply(state, { type: "craft", recipe: "sword" });

  assertEquals(JSON.stringify(first), saved);
});
