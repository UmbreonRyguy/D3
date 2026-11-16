import { MATERIALS, terrainForMaterial } from "./materials.ts";
import { isPassable } from "./terrain.ts";

type ReachabilityRecipe = {
  inputs: object;
  outputs: {
    item: string;
    quantity: number;
  };
};

export function unreachableRecipes(
  recipes: readonly ReachabilityRecipe[],
): ReachabilityRecipe[] {
  const reached = new Set<string>();
  const made = new Set<ReachabilityRecipe>();

  function inventoryFromReached(): Partial<Record<string, number>> {
    const inventory: Partial<Record<string, number>> = {};
    for (const item of reached) inventory[item] = 1;
    return inventory;
  }

  function addAccessibleMaterials(): boolean {
    let added = false;
    const inventory = inventoryFromReached();

    for (const material of MATERIALS) {
      const terrain = terrainForMaterial(material);

      if (isPassable(terrain, inventory) && !reached.has(material)) {
        reached.add(material);
        added = true;
      }
    }
    return added;
  }

  addAccessibleMaterials();

  let changed = true;
  while (changed) {
    changed = false;

    for (const recipe of recipes) {
      if (made.has(recipe)) continue;

      const ready = Object.keys(recipe.inputs).every((item) =>
        reached.has(item)
      );

      if (!ready) continue;

      made.add(recipe);

      if (!reached.has(recipe.outputs.item)) {
        reached.add(recipe.outputs.item);
        changed = true;
      }

      if (addAccessibleMaterials()) changed = true;
    }
  }

  return recipes.filter((recipe) => !made.has(recipe));
}
