import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../src/game/GameState.js';
import { CROPS } from '../src/game/Crop.js';
import { plant, compost, water, harvest, advanceSeason, harvestPreview, rotationEffect, soilQuality } from '../src/game/GameRules.js';

test('starting plots are deterministic and complete', () => {
  const state = new GameState({ eventsEnabled: false });
  assert.deepEqual(state, new GameState({ eventsEnabled: false }));
  assert.equal(state.food, 15);
  assert.equal(new Set(state.plots.map(plot => plot.id)).size, 16);
  for (const plot of state.plots) {
    assert.ok(plot.soil.fertility >= 60 && plot.soil.fertility <= 85);
    assert.ok(plot.soil.moisture >= 50 && plot.soil.moisture <= 80);
    assert.equal(plot.previousCrop, null);
    assert.equal(plot.growthStage, null);
    assert.equal(plot.composted, false);
  }
});

test('complete farming year: all crops grow twice, harvest manually, feed winter, recover in spring', () => {
  const state = new GameState({ eventsEnabled: false });
  const cropIds = Object.keys(CROPS);
  for (const plot of state.plots) {
    state.selected = plot.id;
    plot.soil.fertility = 80;
    plot.soil.moisture = 80;
    assert.ok(plant(state, cropIds[plot.id % 4]));
    assert.equal(plot.growthStage, 'Seed');
    assert.equal(plant(state, 'wheat'), null);
    assert.equal(harvest(state), null);
  }
  advanceSeason(state);
  assert.equal(state.season, 'Summer');
  assert.ok(state.plots.every(plot => plot.growthStage === 'Sprout'));
  assert.equal(harvest(state), null);
  assert.equal(state.food, 15);
  advanceSeason(state);
  assert.equal(state.season, 'Autumn');
  assert.ok(state.plots.every(plot => plot.growthStage === 'Mature'));
  assert.equal(state.food, 15);
  const beforeBlockedAdvance = structuredClone(state);
  assert.match(advanceSeason(state), /Harvest/);
  assert.deepEqual({ ...state }, beforeBlockedAdvance);
  for (const plot of state.plots) {
    state.selected = plot.id;
    const cropId = plot.crop;
    const foodBefore = state.food;
    harvest(state);
    assert.equal(state.food - foodBefore, CROPS[cropId].yield);
    assert.equal(plot.soil.fertility, 80 + CROPS[cropId].fertility);
    assert.equal(plot.previousCrop, cropId);
    assert.equal(plot.history.length, 1);
    assert.equal(plot.crop, null);
    assert.equal(plot.growthStage, null);
    assert.equal(harvest(state), null);
  }
  assert.equal(state.food, 51);
  advanceSeason(state);
  assert.equal(state.food, 51);
  assert.equal(state.yearsFed, 0);
  assert.equal(plant(state, 'wheat'), null);
  advanceSeason(state);
  assert.equal(state.year, 2);
  assert.equal(state.season, 'Spring');
  assert.equal(state.compost, 5);
  assert.equal(state.food, 41);
  assert.equal(state.yearsSurvived, 1);
  assert.equal(state.plots[0].soil.fertility, 63);
  assert.equal(state.plots[3].soil.fertility, 96);
});

test('only spring accepts planting; invalid actions leave state unchanged', () => {
  const state = new GameState({ eventsEnabled: false });
  assert.equal(plant(state, 'unknown'), null);
  for (const seasonIndex of [1, 2, 3]) {
    state.seasonIndex = seasonIndex;
    const before = structuredClone(state);
    assert.equal(plant(state, 'wheat'), null);
    assert.equal(harvest(state), null);
    assert.deepEqual({ ...state }, before);
  }
});

test('rotation penalties and legume benefits affect harvest fertility', () => {
  for (const [previous, crop, expectedChange] of [
    ['wheat', 'wheat', -26], ['potatoes', 'potatoes', -23],
    ['beans', 'wheat', -12], ['clover', 'potatoes', -7],
    ['wheat', 'potatoes', -14], ['beans', 'beans', -5], ['clover', 'clover', 15],
  ]) {
    const state = new GameState({ eventsEnabled: false });
    const plot = state.selectedPlot;
    plot.previousCrop = previous;
    plot.soil.fertility = 80;
    plot.soil.moisture = 80;
    plant(state, crop);
    advanceSeason(state); advanceSeason(state);
    assert.equal(harvestPreview(plot).fertilityChange, expectedChange);
    harvest(state);
    assert.equal(plot.soil.fertility, 80 + expectedChange);
    assert.equal(plot.previousCrop, crop);
  }
  assert.match(rotationEffect({ previousCrop: 'wheat' }, 'wheat').message, /Warning/);
  assert.match(rotationEffect({ previousCrop: 'beans' }, 'wheat').message, /nitrogen/);
});

test('drought reduces production but never prevents autumn maturity; watering prevents stress', () => {
  const dry = new GameState({ eventsEnabled: false });
  const watered = new GameState({ eventsEnabled: false });
  for (const state of [dry, watered]) {
    state.selectedPlot.soil.fertility = 100;
    state.selectedPlot.soil.moisture = 0;
    plant(state, 'wheat');
  }
  water(watered); water(watered);
  advanceSeason(dry); advanceSeason(watered);
  water(watered);
  advanceSeason(dry); advanceSeason(watered);
  assert.equal(dry.selectedPlot.growthStage, 'Mature');
  assert.equal(dry.selectedPlot.drySeasons, 2);
  assert.equal(harvestPreview(dry.selectedPlot).food, 2);
  assert.equal(harvestPreview(watered.selectedPlot).food, 4);
  assert.equal(water(dry), null);
});

test('soil tiers reduce yields and fertility never leaves its bounds', () => {
  for (const [fertility, expectedFood, label] of [[100, 4, 'Excellent soil'], [60, 3, 'Healthy soil'], [40, 2, 'Degraded soil'], [20, 1, 'Poor soil'], [0, 1, 'Severely depleted soil']]) {
    const state = new GameState({ eventsEnabled: false });
    const plot = state.selectedPlot;
    plot.soil.fertility = fertility;
    plot.soil.moisture = 100;
    plant(state, 'wheat');
    advanceSeason(state); advanceSeason(state);
    assert.equal(soilQuality(fertility).label, label);
    assert.equal(harvestPreview(plot).food, expectedFood);
    harvest(state);
    assert.ok(plot.soil.fertility >= 0 && plot.soil.fertility <= 100);
  }
});

test('compost supply, per-year limits, and water caps are enforced', () => {
  const state = new GameState({ eventsEnabled: false });
  state.selectedPlot.soil.fertility = 95;
  assert.ok(compost(state));
  assert.equal(state.selectedPlot.soil.fertility, 100);
  assert.equal(compost(state), null);
  for (const selected of [1, 2]) { state.selected = selected; assert.ok(compost(state)); }
  state.selected = 4;
  assert.equal(compost(state), null);
  state.selectedPlot.soil.moisture = 99;
  water(state);
  assert.equal(state.selectedPlot.soil.moisture, 100);
  assert.equal(water(state), null);
  advanceSeason(state);
  assert.ok(state.plots[0].composted);
  state.selected = 0;
  assert.equal(compost(state), null);
});

test('three-winter goal is achievable with crop rotation and deterministic care', () => {
  const state = new GameState({ eventsEnabled: false });
  const sequence = ['wheat', 'potatoes', 'beans', 'clover'];
  for (let year = 0; year < 3; year++) {
    for (const plot of state.plots) {
      state.selected = plot.id;
      plant(state, sequence[(plot.id + year) % 4]);
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
    advanceSeason(state);
    assert.equal(state.yearsFed, year + 1);
  }
  assert.equal(state.year, 4);
  assert.ok(state.plots.every(plot => plot.history.length === 3));
});

test('a food shortfall ends the game without negative storage', () => {
  const state = new GameState({ eventsEnabled: false });
  state.food = 3;
  advanceSeason(state); advanceSeason(state); advanceSeason(state); advanceSeason(state);
  assert.equal(state.food, 0);
  assert.equal(state.yearsFed, 0);
  advanceSeason(state);
  assert.equal(plant(state, 'wheat'), null);
  assert.equal(state.status, 'lost');
});
