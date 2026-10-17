import { CROPS } from './Crop.js';
import { clamp } from './Soil.js';
import { LESSONS } from './Heritage.js';
import { eventHarvestEffect, triggerSeasonalEvent } from './SeasonalEvents.js';

function awardHeritage(state, points, reason) {
  const previous = state.heritage;
  state.heritage = clamp(previous + points);
  state.heritageNote = `${reason} +${state.heritage - previous} Village Heritage. Care points do not change victory conditions.`;
}

export const CHALLENGE = Object.freeze({ years: 5, annualFood: 10, victoryFertility: 60, minimumFertility: 20, compostGain: 20, winterCompost: 2, winterRecovery: 1 });

export function soilQuality(fertility) {
  if (fertility >= 80) return { label: 'Excellent soil', color: '#739b57', multiplier: 1 };
  if (fertility >= 60) return { label: 'Healthy soil', color: '#739b57', multiplier: 0.85 };
  if (fertility >= 40) return { label: 'Degraded soil', color: '#cfac4c', multiplier: 0.65 };
  if (fertility >= 20) return { label: 'Poor soil', color: '#c57351', multiplier: 0.45 };
  return { label: 'Severely depleted soil', color: '#b95648', multiplier: 0.25 };
}

export function rotationEffect(plot, cropId) {
  const previous = CROPS[plot.previousCrop];
  const crop = CROPS[cropId];
  if (!previous || !crop) return { fertility: 0, message: 'A fresh start: no previous crop to rotate.' };
  if (plot.previousCrop === cropId && ['wheat', 'potatoes'].includes(cropId)) {
    return { fertility: -8, message: `Warning: repeated ${crop.name.toLowerCase()} cultivation is exhausting this soil (8 extra fertility lost).` };
  }
  if (previous.family === crop.family) return { fertility: 0, message: 'Same crop family: no rotation benefit. Try a different family next year.' };
  const benefit = plot.previousCrop === 'beans' ? 6 : plot.previousCrop === 'clover' ? 8 : 1;
  return { fertility: benefit, message: `Good rotation after ${previous.name.toLowerCase()}: ${benefit} fertility saved${plot.previousCrop === 'beans' ? ' through the nitrogen benefit' : ''}.` };
}

export const canPlant = state => state.status === 'playing' && state.season === 'Spring' && !state.selectedPlot.crop;
export const canHarvest = (state, plot = state.selectedPlot) => state.status === 'playing' && state.season === 'Autumn' && Boolean(plot.crop) && plot.growthStage === 'Mature';
export const canCompost = state => state.status === 'playing' && state.compost > 0 && !state.selectedPlot.composted && state.selectedPlot.soil.fertility < 100;
export const canWater = state => state.status === 'playing' && ['Spring', 'Summer'].includes(state.season) && state.selectedPlot.soil.moisture < 100;
export const harvestPending = state => state.season === 'Autumn' && state.plots.some(plot => canHarvest(state, plot));

export function harvestPreview(plot) {
  if (!plot.crop) return null;
  const crop = CROPS[plot.crop];
  const rotation = rotationEffect(plot, plot.crop);
  const moistureMultiplier = 1 - plot.drySeasons * 0.25;
  const event = eventHarvestEffect(plot);
  const baseFood = crop.yield ? Math.max(1, Math.floor(crop.yield * soilQuality(plot.soil.fertility).multiplier * moistureMultiplier)) : 0;
  const food = crop.yield ? Math.max(1, baseFood + event.bonus) : 0;
  const fertility = clamp(plot.soil.fertility + crop.fertility + rotation.fertility);
  return { food, fertility, fertilityChange: fertility - plot.soil.fertility, rotation, event };
}

export function cropTooltip(plot, cropId) {
  const crop = CROPS[cropId];
  return `${crop.yield} base food; ${crop.fertility > 0 ? '+' : ''}${crop.fertility} fertility; needs ${crop.moisture}% moisture; ${crop.duration} seasons to maturity. ${rotationEffect(plot, cropId).message}`;
}

export function plant(state, cropId) {
  if (!CROPS[cropId] || !canPlant(state)) return null;
  const plot = state.selectedPlot;
  plot.crop = cropId;
  plot.growthStage = 'Seed';
  plot.growthSeasons = 0;
  plot.drySeasons = 0;
  if (plot.previousCrop === cropId) state.lesson = LESSONS.monoculture;
  return `${CROPS[cropId].name} planted in plot ${plot.id + 1}. Harvest in autumn. ${rotationEffect(plot, cropId).message}`;
}

export function harvest(state) {
  if (!canHarvest(state)) return null;
  const plot = state.selectedPlot;
  const result = harvestPreview(plot);
  const crop = CROPS[plot.crop];
  state.food += result.food;
  state.totalFoodProduced += result.food;
  state.yearFoodProduced += result.food;
  plot.soil.fertility = result.fertility;
  if (result.rotation.fertility > 0) {
    awardHeritage(state, 1, 'A different crop family harvested.');
    state.lesson = LESSONS.rotation;
  }
  plot.history.push({ crop: plot.crop, year: state.year, season: state.season, food: result.food, fertilityChange: result.fertilityChange, drySeasons: plot.drySeasons, event: plot.seasonalEffect });
  plot.previousCrop = plot.crop;
  plot.seasonalEffect = null;
  plot.crop = null;
  plot.growthStage = null;
  plot.growthSeasons = 0;
  plot.drySeasons = 0;
  return `${crop.name} harvested: +${result.food} food, ${result.fertilityChange >= 0 ? '+' : ''}${result.fertilityChange} fertility. ${result.rotation.message}`;
}

export function compost(state) {
  if (!canCompost(state)) return null;
  const plot = state.selectedPlot;
  plot.soil.fertility = clamp(plot.soil.fertility + CHALLENGE.compostGain);
  plot.composted = true;
  state.compost -= 1;
  state.lesson = LESSONS.compost;
  return `Plot ${plot.id + 1} received compost. Fertility is now ${plot.soil.fertility}%.`;
}

export function water(state) {
  if (!canWater(state)) return null;
  state.selectedPlot.soil.moisture = clamp(state.selectedPlot.soil.moisture + 25);
  return `Plot ${state.selected + 1} watered. Moisture is now ${state.selectedPlot.soil.moisture}%. Water before advancing to avoid dry-season yield loss.`;
}

export function advanceSeason(state) {
  if (state.status !== 'playing') return null;
  if (harvestPending(state)) return 'Harvest your mature plots before welcoming winter.';
  let message = '';
  if (state.season === 'Spring' || state.season === 'Summer') {
    let stressed = 0;
    for (const plot of state.plots) {
      if (!plot.crop) continue;
      if (plot.soil.moisture < CROPS[plot.crop].moisture) { plot.drySeasons += 1; stressed += 1; }
      plot.growthSeasons = Math.min(CROPS[plot.crop].duration, plot.growthSeasons + 1);
      plot.growthStage = plot.growthSeasons === CROPS[plot.crop].duration ? 'Mature' : 'Sprout';
    }
    if (stressed) message += `${stressed} dry plots suffered a 25% yield multiplier reduction. `;
  }
  const recovering = state.season === 'Winter';
  if (recovering) {
    for (const plot of state.plots) plot.soil.fertility = clamp(plot.soil.fertility + CHALLENGE.winterRecovery);
    const available = state.food;
    const consumed = Math.min(available, CHALLENGE.annualFood);
    state.food -= consumed;
    const healthySoil = state.averageFertility >= CHALLENGE.victoryFertility;
    const fedVillage = available >= CHALLENGE.annualFood;
    if (healthySoil || fedVillage) {
      awardHeritage(state, (healthySoil ? 4 : 0) + (fedVillage ? 4 : 0), `${healthySoil ? 'Healthy soil at year end. ' : ''}${fedVillage ? 'The village shared a full meal.' : ''}`);
      state.lesson = LESSONS.year;
    }
    state.annualReports.push({ year: state.year, produced: state.yearFoodProduced, available, consumed, remaining: state.food, fertility: state.averageFertility });
    if (available < CHALLENGE.annualFood) {
      state.status = 'lost';
      state.endReason = `The village needed ${CHALLENGE.annualFood} food, but only ${available} remained at the end of Year ${state.year}.`;
    } else if (state.averageFertility < CHALLENGE.minimumFertility) {
      state.status = 'lost';
      state.endReason = 'Average fertility fell below 20%. The village soil can no longer sustain its future.';
    } else {
      state.yearsFed += 1;
      state.yearsSurvived += 1;
      if (state.year === CHALLENGE.years) {
        state.status = state.averageFertility >= CHALLENGE.victoryFertility && state.food > 0 ? 'won' : 'lost';
        state.endReason = state.status === 'won'
          ? 'Five years of careful hands and thoughtful harvests. Your village is nourished, and the soil has a future.'
          : `Five years survived, but the garden needs at least ${CHALLENGE.victoryFertility}% average fertility and food left after the final meal. ${state.averageFertility < CHALLENGE.victoryFertility ? 'The soil needs more restoration. ' : ''}${state.food === 0 ? 'The food store is empty.' : ''}`;
      }
    }
    if (state.status !== 'playing') return state.endReason;
    message += `Year ${state.year}: +${state.yearFoodProduced} harvested, −${consumed} consumed, ${state.food} food saved. `;
    state.year += 1;
    state.yearFoodProduced = 0;
    state.currentEvent = null;
    for (const plot of state.plots) { plot.composted = false; plot.seasonalEffect = null; }
  }
  state.seasonIndex = (state.seasonIndex + 1) % 4;
  if (state.season === 'Winter') {
    state.compost += CHALLENGE.winterCompost;
    message += `Winter brings ${CHALLENGE.winterCompost} compost. Prepare for the ${CHALLENGE.annualFood}-food annual meal before ending the year. `;
  }
  for (const plot of state.plots) {
    plot.soil.moisture = clamp(plot.soil.moisture + [25, -20, 10, 5][state.seasonIndex]);
  }
  const eventMessage = triggerSeasonalEvent(state);
  if (eventMessage) message += `${eventMessage} `;
  return message + `Welcome to ${state.season}, year ${state.year}.`;
}
