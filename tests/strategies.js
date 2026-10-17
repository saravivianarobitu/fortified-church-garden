import { GameState } from '../src/game/GameState.js';
import { plant, water, compost, harvest, advanceSeason } from '../src/game/GameRules.js';

export function simulate(chooseCrop, useCompost = false, options = { eventsEnabled: false }) {
  const state = new GameState(options);
  while (state.status === 'playing') {
    for (const plot of state.plots) {
      state.selected = plot.id;
      const crop = chooseCrop(state.year, plot);
      if (crop) plant(state, crop);
      while (plot.soil.moisture < 80) water(state);
    }
    advanceSeason(state);
    for (const plot of state.plots) {
      state.selected = plot.id;
      while (plot.soil.moisture < 80) water(state);
    }
    advanceSeason(state);
    for (const plot of state.plots) { state.selected = plot.id; harvest(state); }
    advanceSeason(state);
    if (useCompost) {
      for (const plot of [...state.plots].sort((first, second) => first.soil.fertility - second.soil.fertility)) {
        state.selected = plot.id;
        compost(state);
      }
    }
    advanceSeason(state);
  }
  return state;
}

export function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return ['wheat', 'potatoes', 'beans', 'clover'][Math.floor(value / 4294967296 * 4)];
  };
}

export const sensible = (year, plot) => ['wheat', 'beans', 'clover'][(year + plot.id) % 3];
