import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../src/game/GameState.js';
import { plant, water, compost, harvest, advanceSeason, harvestPreview } from '../src/game/GameRules.js';
import { EVENTS, chooseEvent, nextRandom, triggerSeasonalEvent } from '../src/game/SeasonalEvents.js';
import { simulate, sensible } from './strategies.js';

function seedFor(id) {
  for (let seed = 0; seed < 10000; seed++) {
    const state = new GameState({ seed });
    if ((chooseEvent(nextRandom(state))?.id ?? null) === id) return seed;
  }
  throw new Error(`No seed found for ${id}`);
}

function plantedState(eventId, crop = 'wheat') {
  const state = new GameState({ seed: seedFor(eventId) });
  for (const plot of state.plots) {
    state.selected = plot.id;
    plot.soil.fertility = 80;
    plot.soil.moisture = 100;
    plant(state, crop);
  }
  state.selected = 0;
  return state;
}

test('seeded event probabilities include all six events and 30% quiet years', () => {
  assert.equal(EVENTS.reduce((sum, event) => sum + event.weight, 0), 70);
  const counts = Object.fromEntries([...EVENTS.map(event => [event.id, 0]), ['quiet', 0]]);
  const state = new GameState({ seed: 234567 });
  for (let draw = 0; draw < 20000; draw++) counts[chooseEvent(nextRandom(state))?.id ?? 'quiet'] += 1;
  for (const event of [...EVENTS, { id: 'quiet', weight: 30 }]) assert.ok(Math.abs(counts[event.id] / 200 - event.weight) < 2);
  assert.deepEqual(simulate(sensible, false, { seed: 99 }), simulate(sensible, false, { seed: 99 }));
});

test('events roll once on summer arrival, including quiet years; cannot trigger after game over', () => {
  for (const id of [...EVENTS.map(event => event.id), null]) {
    const state = new GameState({ seed: seedFor(id) });
    assert.equal(triggerSeasonalEvent(state), null);
    advanceSeason(state);
    assert.equal(state.currentEvent?.id ?? null, id);
    const snapshot = structuredClone(state);
    assert.equal(triggerSeasonalEvent(state), null);
    assert.deepEqual({ ...state }, snapshot);
    advanceSeason(state); advanceSeason(state); advanceSeason(state);
    assert.equal(state.currentEvent, null);
    assert.ok(state.plots.every(plot => plot.seasonalEffect === null));
    assert.equal(state.eventHistory.length, id ? 1 : 0);
    state.status = 'lost';
    state.seasonIndex = 1;
    assert.equal(triggerSeasonalEvent(state), null);
  }
});

test('summer drought removes 20 additional moisture and can be countered before growth', () => {
  const state = plantedState('drought');
  state.selectedPlot.soil.moisture = 50;
  advanceSeason(state);
  assert.equal(state.selectedPlot.soil.moisture, 10);
  assert.equal(state.selectedPlot.drySeasons, 0);
  water(state);
  advanceSeason(state);
  assert.equal(state.selectedPlot.drySeasons, 0);
  assert.equal(harvestPreview(state.selectedPlot).food, 4);
  const ignored = plantedState('drought');
  ignored.selectedPlot.soil.moisture = 50;
  advanceSeason(ignored); advanceSeason(ignored);
  assert.equal(harvestPreview(ignored.selectedPlot).food, 3);
});

test('rain clamps moisture and erodes only severely depleted soil by at most three', () => {
  const state = plantedState('rain');
  state.plots[0].soil.fertility = 2;
  state.plots[1].soil.fertility = 19;
  state.plots[2].soil.fertility = 20;
  advanceSeason(state);
  assert.equal(state.plots[0].soil.fertility, 0);
  assert.equal(state.plots[1].soil.fertility, 16);
  assert.equal(state.plots[2].soil.fertility, 20);
  assert.ok(state.plots.every(plot => plot.soil.moisture === 100));
  assert.equal(state.status, 'playing');
});

test('favorable weather adds at most four food and never gives clover a food yield', () => {
  const state = plantedState('favorable');
  advanceSeason(state); advanceSeason(state);
  assert.equal(state.currentEvent.affected.length, 4);
  assert.equal(harvestPreview(state.plots[0]).food, 5);
  assert.equal(harvestPreview(state.plots[4]).food, 4);
  const foodBefore = state.food;
  for (const plot of state.plots) { state.selected = plot.id; harvest(state); }
  assert.equal(state.food - foodBefore, 68);
  assert.equal(harvest(state), null);
  const clover = plantedState('favorable', 'clover');
  advanceSeason(clover); advanceSeason(clover);
  assert.equal(clover.currentEvent.affected.length, 0);
  assert.equal(harvestPreview(clover.selectedPlot).food, 0);
});

test('compost gifts add exactly two and preserve annual application limits', () => {
  const state = plantedState('compost');
  compost(state);
  advanceSeason(state);
  assert.equal(state.compost, 4);
  assert.equal(compost(state), null);
});

test('pests target at most four repeated plots and compost can prevent their penalty', () => {
  const state = plantedState('pests');
  for (const plot of state.plots) { plot.previousCrop = 'wheat'; plot.soil.fertility = 60; }
  state.plots[0].previousCrop = 'beans';
  advanceSeason(state);
  assert.deepEqual(state.currentEvent.affected, [1, 2, 3, 4]);
  assert.equal(harvestPreview(state.plots[1]).food, 2);
  state.selected = 1;
  compost(state);
  assert.equal(harvestPreview(state.selectedPlot).food, 4);
  state.plots[2].soil.fertility = 0;
  assert.equal(harvestPreview(state.plots[2]).food, 1);
  assert.equal(state.plots[0].seasonalEffect, null);
});

test('healthy soil bonus is conditional at harvest and can be earned with compost', () => {
  const state = plantedState('healthy');
  for (const plot of state.plots) plot.soil.fertility = 70;
  advanceSeason(state);
  assert.equal(state.currentEvent.affected.length, 4);
  assert.equal(harvestPreview(state.selectedPlot).food, 3);
  compost(state);
  advanceSeason(state);
  assert.equal(harvestPreview(state.selectedPlot).food, 5);
  harvest(state);
  assert.equal(state.selectedPlot.seasonalEffect, null);
});

test('500 seeded five-year campaigns preserve sensible wins and monoculture consequences', () => {
  for (let index = 1; index <= 500; index++) {
    const seed = Math.imul(index, 2654435761) >>> 0;
    const winner = simulate(sensible, false, { seed });
    assert.equal(winner.status, 'won', `Rotation failed seed ${seed}`);
    assert.ok(winner.eventHistory.length <= 5);
    assert.equal(new Set(winner.eventHistory.map(event => event.year)).size, winner.eventHistory.length);
    assert.ok(winner.food > 0);
    assert.equal(simulate(() => 'wheat', true, { seed }).status, 'lost');
  }
});

test('restart clears event effects and allows reproducible or fresh campaigns', () => {
  const state = plantedState('pests');
  advanceSeason(state);
  state.reset();
  assert.deepEqual(state, new GameState({ seed: seedFor('pests') }));
  state.reset({ seed: 2468 });
  assert.deepEqual(state, new GameState({ seed: 2468 }));
});
