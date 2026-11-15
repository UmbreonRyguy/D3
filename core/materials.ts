import { gridValue, type Terrain, terrainAt } from "./terrain.ts";

//material types
export type Material = "stick";

//spawn based on chance
const KINDS: Record<Material, { terrain: Terrain; chance: number }> = {
  stick: { terrain: "forest", chance: 0.1 },
};

const NAMES = Object.keys(KINDS) as Material[];

export function materialAt(
  seed: number,
  x: number,
  y: number,
): Material | null {
  for (const name of NAMES) {
    const { terrain, chance } = KINDS[name];
    if (terrainAt(seed, x, y) !== terrain) continue;
    if (gridValue(seed + 3, x, y) < chance) return name;
  }
  return null;
}
