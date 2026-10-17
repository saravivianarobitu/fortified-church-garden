import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../src/game/GameState.js';
import { plant, harvest, compost, advanceSeason } from '../src/game/GameRules.js';
import { CHAPTERS, SOURCES, LESSONS } from '../src/game/Heritage.js';
import { simulate, sensible } from './strategies.js';

test('rotation heritage is awarded on successful harvest, never on planting or repeated clicks', () => {
  const state = new GameState({ eventsEnabled: false });
  state.selectedPlot.previousCrop = 'beans';
  plant(state, 'wheat');
  assert.equal(state.heritage, 0);
  assert.equal(harvest(state), null);
  advanceSeason(state); advanceSeason(state);
  harvest(state);
  assert.equal(state.heritage, 1);
  assert.deepEqual(state.lesson, LESSONS.rotation);
  harvest(state);
  assert.equal(state.heritage, 1);
});

test('monoculture and compost teach the relevant lesson only after valid actions', () => {
  const state = new GameState({ eventsEnabled: false });
  state.selectedPlot.previousCrop = 'wheat';
  plant(state, 'wheat');
  assert.deepEqual(state.lesson, LESSONS.monoculture);
  compost(state);
  assert.deepEqual(state.lesson, LESSONS.compost);
  assert.equal(state.heritage, 0);
  const before = structuredClone(state);
  assert.equal(compost(state), null);
  assert.equal(plant(state, 'beans'), null);
  assert.deepEqual({ ...state }, before);
});

test('annual heritage recognizes food and soil independently and respects its cap', () => {
  for (const [fertility, food, expected] of [[70, 15, 8], [30, 15, 4], [70, 3, 4], [10, 3, 0]]) {
    const state = new GameState({ eventsEnabled: false });
    for (const plot of state.plots) plot.soil.fertility = fertility;
    state.food = food;
    advanceSeason(state); advanceSeason(state); advanceSeason(state);
    assert.equal(state.heritage, 0);
    advanceSeason(state);
    assert.equal(state.heritage, expected);
  }
  const state = new GameState({ eventsEnabled: false });
  state.heritage = 99;
  state.seasonIndex = 3;
  advanceSeason(state);
  assert.equal(state.heritage, 100);
});

test('heritage does not replace the strategy outcome, and restart clears learning progress', () => {
  const winner = simulate(sensible);
  assert.equal(winner.status, 'won');
  assert.equal(winner.food, 94);
  assert.equal(winner.averageFertility, 82.75);
  assert.equal(winner.heritage, 100);
  const before = structuredClone(winner);
  advanceSeason(winner);
  assert.deepEqual({ ...winner }, before);
  winner.reset();
  assert.deepEqual(winner, new GameState({ eventsEnabled: false }));
  const loser = new GameState({ eventsEnabled: false });
  loser.heritage = 100;
  loser.food = 0;
  loser.seasonIndex = 3;
  advanceSeason(loser);
  assert.equal(loser.status, 'lost');
});

test('all lesson chapters and educational source references exist', () => {
  assert.equal(CHAPTERS.length, 6);
  assert.equal(new Set(CHAPTERS.map(chapter => chapter.id)).size, 6);
  for (const lesson of Object.values(LESSONS)) assert.ok(CHAPTERS.some(chapter => chapter.id === lesson.chapter));
  for (const chapter of CHAPTERS) for (const source of chapter.sources) assert.ok(SOURCES[source].url.startsWith('https://'));
});
