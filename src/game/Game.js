import { GameState } from './GameState.js';
import { FarmGrid } from './FarmGrid.js';
import { plant, compost, water, harvest, advanceSeason } from './GameRules.js';
import { UIManager } from '../ui/UIManager.js';
import { Notifications } from '../ui/Notifications.js';
export class Game {
  constructor() {
    this.state = new GameState({ seed: crypto.getRandomValues(new Uint32Array(1))[0] });
    this.notifications = new Notifications(document.querySelector('#notifications'));
    this.grid = new FarmGrid(document.querySelector('#farm'), this.state, () => this.render());
    this.ui = new UIManager(this.state, {
      plant: id => this.act(() => plant(this.state, id), 'plant'),
      compost: () => this.act(() => compost(this.state), 'compost'),
      water: () => this.act(() => water(this.state)),
      harvest: () => {
        const foodBefore = this.state.food;
        const message = harvest(this.state);
        if (message) this.grid.showHarvest(this.state.selected, this.state.food - foodBefore);
        this.act(() => message);
      },
      advance: () => { this.act(() => advanceSeason(this.state)); this.grid.animateGrowth(); },
      restart: () => this.restart(),
    });
    this.render();
    this.welcome();
  }
  welcome() { this.notifications.show('Care for the village for five years. Each winter ends with a 10-food meal. Finish Year 5 with food to spare and at least 60% average fertility.'); }
  restart() {
    this.state.reset({ seed: crypto.getRandomValues(new Uint32Array(1))[0] });
    this.ui.heritageBook.reset();
    if (this.grid.animationFrame !== null) cancelAnimationFrame(this.grid.animationFrame);
    this.grid.animationFrame = null;
    this.grid.floatingHarvest = null;
    this.grid.growthStarted = 0;
    this.grid.resetEffects();
    document.querySelector('#notifications').replaceChildren();
    this.render();
    this.welcome();
    this.grid.canvas.focus();
  }
  act(action, effect) {
    const message = action();
    if (message) {
      this.notifications.show(message);
      if (effect) this.grid.showEffect(effect);
    }
    this.render();
  }
  render() { this.grid.render(); this.ui?.render(); }
}
