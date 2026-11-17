// The only folder allowed to import Phaser, and for one job: drawing the grid.
// Input, the HUD, sound, and the order of events all live outside it.
import Phaser from "phaser";
import type {
  Cell,
  GameEvent,
  GameState,
  Material,
  Terrain,
} from "../../core/mod.ts";
import { materialAt, terrainAt } from "../../core/mod.ts";

export const CELL_SIZE = 32;
const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 600;
const WALK_MS = 120;
const BUMP_MS = 60;
const PICKUP_MS = 160;
const MARKER_COLOR = 0xf5e6a8;
const BUMP_COLOR = 0xe0533d;
const STICK_COLOR = 0xa97c50;
const LOG_COLOR = 0x8a5f36;
const LOG_END_COLOR = 0xb08a5a;
const LEAF_COLOR = 0xa8c66c;
const LEAF_STEM_COLOR = 0x6b7a3a;
const FIBER_COLOR = 0xd9d38a;
const STONE_COLOR = 0xb0aca3;
const STONE_DARK_COLOR = 0x948f85;

const TERRAIN_COLORS: Record<Terrain, number> = {
  grass: 0x5d9e4a,
  forest: 0x2f6b3a,
  water: 0x2d5f9e,
  rock: 0x6e6a66,
};

// How each material is drawn, around its own origin, so that tweens of position
// and scale move and shrink the drawing itself. Item kinds are data: a new
// material is a row here, beside its row in core/materials.ts.
const DRAW: Record<Material, (item: Phaser.GameObjects.Graphics) => void> = {
  // A twig.
  stick: (item) => {
    item.lineStyle(3, STICK_COLOR);
    item.lineBetween(-7, 4, 7, -4);
    item.lineStyle(2, STICK_COLOR);
    item.lineBetween(2, -1, 6, 3);
  },
  // A cut log lying across the cell.
  log: (item) => {
    item.fillStyle(LOG_COLOR);
    item.fillRoundedRect(-11, -4, 22, 9, 4);
    item.fillStyle(LOG_END_COLOR);
    item.fillCircle(-8, 0, 2.5);
    item.fillCircle(8, 0, 2.5);
  },
  // A leaf, pointing away from its stem.
  leaf: (item) => {
    item.fillStyle(LEAF_COLOR);
    item.fillEllipse(2, -2, 13, 7);
    item.lineStyle(2, LEAF_STEM_COLOR);
    item.lineBetween(-4, 4, -1, 1);
  },
  // A tuft of dry fibers.
  fiber: (item) => {
    item.lineStyle(2, FIBER_COLOR);
    item.lineBetween(-5, 4, -3, -4);
    item.lineBetween(-1, 4, 0, -6);
    item.lineBetween(3, 4, 5, -3);
  },
  // A pebble, with a smaller one beside it.
  stone: (item) => {
    item.fillStyle(STONE_COLOR);
    item.fillCircle(-1, -1, 6);
    item.fillStyle(STONE_DARK_COLOR);
    item.fillCircle(5, 3, 3.5);
  },
};

// Enough cells to cover the view, plus a margin so that the camera can lag behind
// the player without showing an unpainted edge.
const CELLS_ACROSS = 16;
const CELLS_DOWN = 13;

function cellCenter({ x, y }: Cell): Cell {
  return {
    x: x * CELL_SIZE + CELL_SIZE / 2,
    y: y * CELL_SIZE + CELL_SIZE / 2,
  };
}

function cellKey({ x, y }: Cell): string {
  return `${x},${y}`;
}

// One output of the presenter. It shows events; it decides nothing.
// Humble Object: http://xunitpatterns.com/Humble%20Object.html
export class GridView extends Phaser.Scene {
  private readonly seed: number;
  private readonly start: Cell;
  // Cells whose material is already in the pack, started as a copy of the state
  // at hand-off and kept up to date by played events only.
  private readonly collected: Set<string>;
  // The ground materials in view, by cell. Ground materials ask the core again
  // as the camera moves; the collected set is the only thing carried forward.
  private readonly groundItems = new Map<string, Phaser.GameObjects.Graphics>();
  private ground!: Phaser.GameObjects.Graphics;
  private marker!: Phaser.GameObjects.Arc;

  constructor(state: GameState) {
    super("grid");
    this.seed = state.seed;
    this.start = { ...state.player };
    this.collected = new Set(state.collected.map(cellKey));
  }

  create() {
    this.ground = this.add.graphics();
    const { x, y } = cellCenter(this.start);
    this.marker = this.add.circle(x, y, CELL_SIZE * 0.35, MARKER_COLOR);
    this.marker.setDepth(2);
    this.cameras.main.startFollow(this.marker, true, 0.2, 0.2);
    this.drawCellsAround(this.start);
    this.fitToDisplay();
  }

  // Phaser has no device-pixel setting of its own. So the canvas backing store is
  // CSS size times devicePixelRatio, the CSS size stays put, and a camera zoom lets
  // all drawing stay in logical pixels. The media query fires when the ratio changes:
  // a move to another monitor, or browser zoom. The view's CSS size is fixed, so plain
  // window resizes need nothing here.
  private fitToDisplay() {
    const ratio = globalThis.devicePixelRatio || 1;
    this.scale.resize(
      Math.round(VIEW_WIDTH * ratio),
      Math.round(VIEW_HEIGHT * ratio),
    );
    this.scale.canvas.style.width = `${VIEW_WIDTH}px`;
    this.scale.canvas.style.height = `${VIEW_HEIGHT}px`;
    this.cameras.main.setZoom(ratio);
    matchMedia(`(resolution: ${ratio}dppx)`).addEventListener(
      "change",
      () => this.fitToDisplay(),
      { once: true },
    );
  }

  show(event: GameEvent): Promise<void> {
    switch (event.type) {
      case "moved":
        this.drawCellsAround(event.to);
        return this.walk(event.to);
      case "blocked":
        return this.bump(event.at, event.toward);
      case "pickedUp":
        return this.takeMaterial(event.at);
      case "crafted":
      case "craftFailed":
        return Promise.resolve();
      case "gameOver":
        return Promise.resolve();
      default:
        event satisfies never;
        return Promise.resolve();
    }
  }

  private walk(to: Cell): Promise<void> {
    return new Promise((done) => {
      this.tweens.add({
        targets: this.marker,
        ...cellCenter(to),
        duration: WALK_MS,
        onComplete: () => done(),
      });
    });
  }

  // Lurch part of the way toward the blocked cell, flash, and come back.
  private bump(at: Cell, toward: Cell): Promise<void> {
    const start = cellCenter(at);
    const target = cellCenter(toward);
    this.marker.setFillStyle(BUMP_COLOR);
    return new Promise((done) => {
      this.tweens.add({
        targets: this.marker,
        x: start.x + (target.x - start.x) * 0.3,
        y: start.y + (target.y - start.y) * 0.3,
        duration: BUMP_MS,
        yoyo: true,
        onComplete: () => {
          this.marker.setFillStyle(MARKER_COLOR);
          done();
        },
      });
    });
  }

  // Paint only what is near the camera. Asking the core again costs little, and
  // the world itself is never stored.
  private drawCellsAround({ x: centerX, y: centerY }: Cell) {
    this.ground.clear();
    const wanted = new Map<
      string,
      { cell: Cell; material: Material }
    >();
    for (let y = centerY - CELLS_DOWN; y <= centerY + CELLS_DOWN; y++) {
      for (let x = centerX - CELLS_ACROSS; x <= centerX + CELLS_ACROSS; x++) {
        this.ground.fillStyle(TERRAIN_COLORS[terrainAt(this.seed, x, y)]);
        this.ground.fillRect(
          x * CELL_SIZE,
          y * CELL_SIZE,
          CELL_SIZE - 1,
          CELL_SIZE - 1,
        );
        const key = cellKey({ x, y });
        const material = materialAt(this.seed, x, y);
        if (material !== null && !this.collected.has(key)) {
          wanted.set(key, { cell: { x, y }, material });
        }
      }
    }
    // Materials that left the view go away; materials that came in are drawn.
    for (const [key, item] of this.groundItems) {
      if (!wanted.has(key)) {
        item.destroy();
        this.groundItems.delete(key);
      }
    }
    for (const [key, entry] of wanted) {
      if (!this.groundItems.has(key)) {
        this.groundItems.set(
          key,
          this.makeMaterial(entry.cell, entry.material),
        );
      }
    }
  }

  // Drawn around its own origin so that tweens of position and scale move and
  // shrink the drawing itself, not the world around it.
  private makeMaterial(
    cell: Cell,
    material: Material,
  ): Phaser.GameObjects.Graphics {
    const item = this.add.graphics();
    const { x, y } = cellCenter(cell);
    item.setPosition(x, y);
    item.setDepth(1);
    DRAW[material](item);
    return item;
  }

  // The gathered material lifts and fades, then its sprite goes for good.
  private takeMaterial(at: Cell): Promise<void> {
    this.collected.add(cellKey(at));
    const item = this.groundItems.get(cellKey(at));
    if (!item) return Promise.resolve();
    this.groundItems.delete(cellKey(at));
    const { x, y } = cellCenter(at);
    return new Promise((done) => {
      this.tweens.add({
        targets: item,
        x: x + CELL_SIZE * 0.15,
        y: y - CELL_SIZE * 0.4,
        scale: 0.2,
        angle: 40,
        alpha: 0,
        duration: PICKUP_MS,
        onComplete: () => {
          item.destroy();
          done();
        },
      });
    });
  }
}

// Resolves once Phaser has booted and the scene exists. Phaser's input and audio
// are off: this project only asks it to draw.
export function startGridView(
  parent: HTMLElement,
  state: GameState,
): Promise<GridView> {
  return new Promise((ready) => {
    const view = new GridView(state);
    new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: VIEW_WIDTH,
      height: VIEW_HEIGHT,
      backgroundColor: "#14161a",
      banner: false,
      audio: { noAudio: true },
      input: { keyboard: false, mouse: false, touch: false, gamepad: false },
      scene: view,
      callbacks: {
        postBoot: () => ready(view),
      },
    });
  });
}
