import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../src/game/GameState.js';
import { plant, water, compost, harvest, advanceSeason } from '../src/game/GameRules.js';
import { simulate, seededRandom, sensible } from './strategies.js';

test('sensible rotation wins five years even with several missed plantings', () => {
  for (const strategy of [sensible, (year, plot) => plot.id % 5 === 0 ? null : sensible(year, plot)]) {
    const state = simulate(strategy);
    assert.equal(state.status, 'won');
    assert.equal(state.yearsSurvived, 5);
    assert.equal(state.year, 5);
    assert.ok(state.averageFertility >= 60);
    assert.ok(state.food > 0);
    assert.equal(state.annualReports.length, 5);
    assert.equal(state.food, 15 + state.totalFoodProduced - 50);
    assert.ok(state.annualReports.every(report => report.consumed === 10));
  }
});

test('monoculture fails; limited compost helps but cannot rescue it', () => {
  for (const crop of ['wheat', 'potatoes']) {
    const bare = simulate(() => crop);
    const aided = simulate(() => crop, true);
    assert.equal(bare.status, 'lost');
    assert.equal(aided.status, 'lost');
    assert.ok(aided.yearsSurvived >= bare.yearsSurvived);
    assert.ok(aided.totalFoodProduced >= bare.totalFoodProduced);
  }
});

test('unplanned planting frequently misses the final soil target', () => {
  let losses = 0;
  for (let seed = 1; seed <= 100; seed++) {
    const state = simulate(seededRandom(seed));
    if (state.status === 'lost') losses += 1;
    assert.ok(state.food >= 0);
  }
  assert.ok(losses >= 30, `Only ${losses}/100 random strategies lost`);
});

test('compost accumulates in winter and stays limited to once per plot per year', () => {
  const state = new GameState({ eventsEnabled: false });
  state.selectedPlot.soil.fertility = 50;
  compost(state);
  assert.equal(state.selectedPlot.soil.fertility, 70);
  assert.equal(state.compost, 2);
  advanceSeason(state); advanceSeason(state); advanceSeason(state);
  assert.equal(state.compost, 4);
  assert.equal(compost(state), null);
  advanceSeason(state);
  assert.equal(state.compost, 4);
  assert.ok(compost(state));
  assert.equal(state.selectedPlot.soil.fertility, 91);
});

test('annual consumption occurs only at winter end, including exact-food boundary', () => {
  const state = new GameState({ eventsEnabled: false });
  state.food = 10;
  for (let season = 0; season < 3; season++) { advanceSeason(state); assert.equal(state.food, 10); }
  advanceSeason(state);
  assert.equal(state.food, 0);
  assert.equal(state.status, 'playing');
  assert.equal(state.annualReports.length, 1);
  advanceSeason(state);
  assert.equal(state.annualReports.length, 1);
});

test('precise soil and final reserve boundaries are enforced', () => {
  for (const [fertility, food, year, outcome] of [[18.9, 30, 1, 'lost'], [19, 30, 1, 'playing'], [58.9, 11, 5, 'lost'], [59, 11, 5, 'won'], [80, 10, 5, 'lost']]) {
    const state = new GameState({ eventsEnabled: false });
    state.seasonIndex = 3;
    state.year = year;
    state.yearsSurvived = year - 1;
    state.food = food;
    for (const plot of state.plots) plot.soil.fertility = fertility;
    advanceSeason(state);
    assert.equal(state.status, outcome);
    assert.ok(state.food >= 0);
  }
});

test('all gameplay actions stop after either ending, and restart restores the entire state', () => {
  for (const state of [simulate(sensible), simulate(() => 'wheat')]) {
    const before = structuredClone(state);
    for (let attempt = 0; attempt < 3; attempt++) {
      assert.equal(plant(state, 'wheat'), null);
      assert.equal(water(state), null);
      assert.equal(compost(state), null);
      assert.equal(harvest(state), null);
      assert.equal(advanceSeason(state), null);
    }
    assert.deepEqual({ ...state }, before);
    const oldPlots = state.plots;
    state.reset();
    assert.deepEqual(state, new GameState({ eventsEnabled: false }));
    assert.notEqual(state.plots, oldPlots);
    assert.ok(plant(state, 'beans'));
  }
});
