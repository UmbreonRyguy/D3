import { gridValue, type Terrain, terrainAt } from "./terrain.ts";

export type Material = "stick" | "leaf" | "log" | "fiber" | "stone";

const KINDS: Record<
  Material,
  { terrain: Terrain; chance: number; offset: number }
> = {
  stick: { terrain: "forest", chance: 0.1, offset: 3 },
  leaf: { terrain: "forest", chance: 0.12, offset: 4 },
  log: { terrain: "forest", chance: 0.04, offset: 5 },
  fiber: { terrain: "grass", chance: 0.08, offset: 6 },
  stone: { terrain: "water", chance: 0.06, offset: 7 },
};

const NAMES = Object.keys(KINDS) as Material[];

export function materialAt(
  seed: number,
  x: number,
  y: number,
): Material | null {
  for (const name of NAMES) {
    const { terrain, chance, offset } = KINDS[name];
    if (terrainAt(seed, x, y) !== terrain) continue;
    if (gridValue(seed + offset, x, y) < chance) return name;
  }
  return null;
}

export const MATERIALS = Object.keys(KINDS) as Material[];

export function terrainForMaterial(material: Material): Terrain {
  return KINDS[material].terrain;
}
