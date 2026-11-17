import { apply, type Command, type GameEvent, newGame } from "./mod.ts";
import run from "./run.json" with { type: "json" };
import { assertEquals } from "@std/assert";

function playRun() {
  const state = newGame(run.seed);
  const events: GameEvent[] = [];

  for (const command of run.commands as Command[]) {
    events.push(...apply(state, command));
  }

  return { state, events };
}

Deno.test("Recorded run reaches end game state", () => {
  const test_run = playRun();

  assertEquals(test_run.state.gameOver, true);
});

Deno.test("Second run on same seed produced identical commands", () => {
  const first = playRun();

  const start = Date.now();
  while (Date.now() === start);

  const second = playRun();

  assertEquals(first, second);
});
