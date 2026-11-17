import { assertEquals } from "@std/assert";
import { apply, type Command, newGame } from "./mod.ts";

Deno.test("commands stop after the game ends", () => {
  const state = newGame(121);

  state.inventory = {
    raft: 1,
    sail: 1,
  };

  const endingEvents = apply(state, {
    type: "craft",
    recipe: "makeshiftBoat",
  });

  assertEquals(endingEvents[0]?.type, "crafted");
  assertEquals(endingEvents[1]?.type, "gameOver");
  assertEquals(state.gameOver, true);

  const commands: Command[] = [
    { type: "move", direction: "north" },
    { type: "move", direction: "south" },
    { type: "move", direction: "east" },
    { type: "move", direction: "west" },
    { type: "craft", recipe: "sword" },
    { type: "craft", recipe: "raft" },
    { type: "craft", recipe: "sail" },
    { type: "craft", recipe: "makeshiftBoat" },
  ];

  for (const command of commands) {
    const before = JSON.stringify(state);

    const events = apply(state, command);

    assertEquals(events, []);
    assertEquals(state, JSON.parse(before));
  }
});
