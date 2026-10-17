import { CROPS } from './Crop.js';
import { clamp } from './Soil.js';

export const EVENTS = [
  { id: 'drought', name: 'Summer drought', weight: 15, icon: 'sun', advice: 'Water thirsty plots before advancing to autumn. Free watering prevents further drought damage.' },
  { id: 'rain', name: 'Heavy rainfall', weight: 15, icon: 'rain', advice: 'Rain saves watering, but fragile soil needs care. Compost and restorative rotations help rebuild depleted plots.' },
  { id: 'favorable', name: 'Favorable weather', weight: 10, icon: 'rainbow', advice: 'Keep the marked plots watered to make the most of their harvest.' },
  { id: 'compost', name: 'A shared compost gift', weight: 10, icon: 'basket', advice: 'Two extra baskets are yours to save or use. The once-per-plot yearly limit still applies.' },
  { id: 'pests', name: 'Pest outbreak', weight: 10, icon: 'beetle', advice: 'Boost affected plots to 80% fertility before harvest to avoid the penalty. Rotate crop families next spring.' },
  { id: 'healthy', name: 'Healthy soil bonus', weight: 10, icon: 'sprout', advice: 'Keep the marked plots at 80% fertility or higher at harvest. Compost can help them qualify.' },
];

export function nextRandom(state) {
  state.randomState = (Math.imul(state.randomState, 1664525) + 1013904223) >>> 0;
  return state.randomState / 4294967296;
}

export function chooseEvent(roll) {
  let threshold = 0;
  for (const event of EVENTS) {
    threshold += event.weight / 100;
    if (roll < threshold) return event;
  }
  return null;
}

export function triggerSeasonalEvent(state) {
  if (!state.eventsEnabled || state.status !== 'playing' || state.season !== 'Summer' || state.eventCheckedYear === state.year) return null;
  state.eventCheckedYear = state.year;
  const definition = chooseEvent(nextRandom(state));
  if (!definition) {
    state.currentEvent = null;
    return 'A quiet summer: no special event this year.';
  }
  const foodPlots = state.plots.filter(plot => plot.crop && CROPS[plot.crop].yield > 0);
  let affected = [];
  let effect = '';
  if (definition.id === 'drought' || definition.id === 'rain') {
    const change = definition.id === 'drought' ? -20 : 20;
    for (const plot of state.plots) plot.soil.moisture = clamp(plot.soil.moisture + change);
    effect = `${change > 0 ? '+' : ''}${change} moisture on every plot, in addition to normal seasonal weather.`;
    if (definition.id === 'rain') {
      affected = state.plots.filter(plot => plot.soil.fertility < 20);
      for (const plot of affected) plot.soil.fertility = clamp(plot.soil.fertility - 3);
      effect += ` Erosion removed up to 3 fertility from ${affected.length} severely depleted plots (below 20%).`;
    }
  } else if (definition.id === 'compost') {
    state.compost += 2;
    effect = '+2 compost added to the village supply.';
  } else {
    const candidates = definition.id === 'pests'
      ? foodPlots.filter(plot => plot.previousCrop && CROPS[plot.previousCrop].family === CROPS[plot.crop].family)
      : definition.id === 'healthy'
        ? [...foodPlots].sort((first, second) => second.soil.fertility - first.soil.fertility || first.id - second.id)
        : foodPlots;
    affected = candidates.slice(0, 4);
    for (const plot of affected) plot.seasonalEffect = definition.id;
    effect = definition.id === 'pests'
      ? `Up to −1 food on each of ${affected.length} repeatedly cultivated plots; no loss if fertility reaches 80%. Food crops still produce at least 1.`
      : definition.id === 'healthy'
        ? `Up to +1 food on each of ${affected.length} marked plots, only if fertility is at least 80% at harvest.`
        : `+1 food at harvest on each of ${affected.length} marked food-crop plots.`;
    if (!affected.length) effect += ' No planted food crops qualify this year.';
  }
  state.currentEvent = { id: definition.id, year: state.year, affected: affected.map(plot => plot.id), effect };
  state.eventHistory.push({ ...state.currentEvent, affected: [...state.currentEvent.affected] });
  return `${definition.name}: ${effect} ${definition.advice}`;
}

export function eventHarvestEffect(plot) {
  if (plot.seasonalEffect === 'favorable') return { bonus: 1, text: 'Favorable weather: +1 food.' };
  if (plot.seasonalEffect === 'healthy') return { bonus: plot.soil.fertility >= 80 ? 1 : 0, text: 'Healthy soil event: +1 food if fertility is at least 80% at harvest.' };
  if (plot.seasonalEffect === 'pests') return { bonus: plot.soil.fertility < 80 ? -1 : 0, text: 'Pest event: −1 food unless fertility reaches 80%; minimum harvest is 1.' };
  return { bonus: 0, text: 'No event modifier on this plot.' };
}
