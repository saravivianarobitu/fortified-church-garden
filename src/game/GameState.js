import { createSoil } from './Soil.js';
export const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
export class GameState {
  constructor({ seed = 1, eventsEnabled = true } = {}) {
    this.seed = seed >>> 0;
    this.randomState = this.seed;
    this.eventsEnabled = eventsEnabled;
    this.currentEvent = null;
    this.eventHistory = [];
    this.eventCheckedYear = 0;
    this.year = 1;
    this.seasonIndex = 0;
    this.population = 10;
    this.food = 15;
    this.compost = 3;
    this.selected = 0;
    this.yearsFed = 0;
    this.yearsSurvived = 0;
    this.totalFoodProduced = 0;
    this.yearFoodProduced = 0;
    this.annualReports = [];
    this.status = 'playing';
    this.endReason = '';
    this.heritage = 0;
    this.heritageNote = 'Earn care points through rotations, healthy soil, and shared food. A game meter, not a UNESCO rating.';
    this.lesson = null;
    this.plots = Array.from({ length: 16 }, (_, index) => ({
      id: index, soil: createSoil(index), crop: null, previousCrop: null,
      history: [], composted: false, growthStage: null, growthSeasons: 0, drySeasons: 0, seasonalEffect: null,
    }));
  }
  get season() { return SEASONS[this.seasonIndex]; }
  reset({ seed = this.seed } = {}) { Object.assign(this, new GameState({ seed, eventsEnabled: this.eventsEnabled })); }
  get selectedPlot() { return this.plots[this.selected]; }
  get averageFertility() { return this.plots.reduce((sum, plot) => sum + plot.soil.fertility, 0) / this.plots.length; }
}
