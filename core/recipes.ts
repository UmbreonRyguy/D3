import type { Item } from "./rules.ts";

export type RecipeId = "sword" | "raft" | "sail" | "makeshiftBoat";
export type Craftable = "sword" | "raft" | "sail" | "makeshift boat";

export type Recipe = {
  id: RecipeId;
  name: string;
  inputs: Partial<Record<Item, number>>;
  outputs: {
    item: Craftable;
    quantity: number;
  };
  capstone: boolean;
};

export const RECIPES: Recipe[] = [
  {
    id: "sword",
    name: "Sword",
    inputs: { stick: 2, fiber: 2 },
    outputs: { item: "sword", quantity: 1 },
    capstone: false,
  },
  {
    id: "raft",
    name: "Raft",
    inputs: { stick: 4, fiber: 3 },
    outputs: { item: "raft", quantity: 1 },
    capstone: false,
  },
  {
    id: "sail",
    name: "Sail",
    inputs: { fiber: 3, leaf: 4 },
    outputs: { item: "sail", quantity: 1 },
    capstone: false,
  },
  {
    id: "makeshiftBoat",
    name: "Makeshift Boat",
    inputs: { raft: 1, sail: 1 },
    outputs: { item: "makeshift boat", quantity: 1 },
    capstone: true,
  },
];
