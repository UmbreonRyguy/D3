import { assertEquals } from "@std/assert";
import { RECIPES } from "./recipes.ts";
import { unreachableRecipes } from "./can_reach.ts";

Deno.test("all real recipes are eventually reachable", () => {
  const unreachable = unreachableRecipes(Object.values(RECIPES));
  assertEquals(unreachable, []);
});

Deno.test("a recipe requiring its own output is unreachable", () => {
  const broken = [{
    outputs: { item: "sunstone", quantity: 1 },
    inputs: { sunstone: 1 },
  }];
  const unreachable = unreachableRecipes(broken);
  assertEquals(unreachable.map((recipe) => recipe.outputs.item), ["sunstone"]);
});
