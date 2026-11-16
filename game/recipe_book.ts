import {
  type Command,
  type GameState,
  missingFor,
  type Recipe,
  RECIPES,
} from "../core/mod.ts";

// The recipe list in the HUD: one button per row of the recipe table, in table
// order. The book knows the core and the element it was given — the controller
// is nowhere in sight; the function it calls with a craft command was handed
// to it at birth.
//
// Buttons are kept and relabeled, never rebuilt and never disabled: a rebuilt
// button is a new element, and a keyboard player's focus would fall out of the
// list at every craft, while a disabled button cannot say what a craft is
// missing. The text does both jobs — what the row makes, and what is short.
export class RecipeBook {
  private readonly state: GameState;
  private readonly buttons: HTMLButtonElement[] = [];

  constructor(
    list: HTMLElement,
    state: GameState,
    send: (command: Command) => void,
  ) {
    this.state = state;
    for (const recipe of Object.values(RECIPES)) {
      const entry = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.addEventListener("click", (event) => {
        send({ type: "craft", recipe: recipe.output });
        // After a mouse click, give keys back to the game. Keyboard users
        // keep focus.
        if (event.detail > 0) button.blur();
      });
      entry.appendChild(button);
      list.appendChild(entry);
      this.buttons.push(button);
    }
    this.update();
  }

  // Relabels every button from what the player carries. Call only when the
  // player can see the whole core: after playback settles.
  update() {
    const recipes = Object.values(RECIPES);
    for (let index = 0; index < recipes.length; index++) {
      this.buttons[index].textContent = this.label(recipes[index]);
    }
  }

  private label(recipe: Recipe): string {
    const missing = missingFor(recipe, this.state.inventory);
    const need = Object.entries(missing)
      .map(([item, count]) => `${count} ${item}`)
      .join(", ");
    return need === ""
      ? `${recipe.output} — ready`
      : `${recipe.output} — needs ${need}`;
  }
}
