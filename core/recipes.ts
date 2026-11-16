// What a craft makes. A row has an output and the inputs it consumes, and the
// table below is the one place a recipe exists. The table's keys are the
// vocabulary of crafting: TypeScript reads them as the Craftable union, so a
// craft command can only name a row that exists, the rule's lookup by name is
// total, and a new recipe teaches every other part its new name on its own.

import type { Inventory } from "./rules.ts";

const TABLE = {
  // A raft: logs lashed together with fibers.
  raft: { output: "raft", inputs: { log: 2, fiber: 3 } },
  // A sail: leaves woven onto fibers.
  sail: { output: "sail", inputs: { leaf: 4, fiber: 2 } },
  // A sword: a stone blade lashed to a stick handle.
  sword: { output: "sword", inputs: { stick: 2, stone: 1, fiber: 1 } },
  // A makeshift boat: the raft, rigged with its sail.
  "makeshift boat": { output: "makeshift boat", inputs: { raft: 1, sail: 1 } },
} as const;

// The things a craft can make.
export type Craftable = keyof typeof TABLE;

export type Recipe = {
  // The thing the row makes, in its own name.
  output: Craftable;
  // What the craft consumes, in whole counts.
  inputs: Inventory;
};

// The recipe table, by the name of the thing each row makes.
export const RECIPES: Record<Craftable, Recipe> = TABLE;
