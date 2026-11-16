import {
  type Command,
  type GameState,
  missingFor,
  RECIPES,
} from "../core/mod.ts";

export class RecipeBook {
  private buttons: HTMLButtonElement[] = [];

  constructor(
    private list: HTMLUListElement,
    private state: GameState,
    private craft: (command: Command) => void,
  ) {
    for (const recipe of RECIPES) {
      const li = document.createElement("li");
      const button = document.createElement("button");

      button.type = "button";
      button.addEventListener("click", (event) => {
        this.craft({
          type: "craft",
          recipe: recipe.id,
        });

        if (event.detail > 0) button.blur();
      });

      li.append(button);
      this.list.append(li);
      this.buttons.push(button);
    }

    this.update();
  }

  update(): void {
    RECIPES.forEach((recipe, index) => {
      const missing = missingFor(recipe, this.state.inventory);
      const button = this.buttons[index];

      if (Object.keys(missing).length === 0) {
        button.textContent = `Craft ${recipe.name}`;
      } else {
        const details = Object.entries(missing)
          .map(([item, quantity]) => `${quantity} ${item}`)
          .join(", ");

        button.textContent = `${recipe.name} (Missing: ${details})`;
      }

      button.disabled = Object.keys(missing).length > 0;
    });
  }
}
