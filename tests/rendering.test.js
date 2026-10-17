import test from 'node:test';
import assert from 'node:assert/strict';
import { FarmGrid } from '../src/game/FarmGrid.js';
import { GameState } from '../src/game/GameState.js';
import { drawCrop } from '../src/game/CropArt.js';

function drawingContext() {
  const calls = [];
  const context = { calls };
  for (const method of ['fillRect', 'beginPath', 'fill', 'moveTo', 'lineTo', 'closePath', 'stroke', 'fillText', 'strokeText', 'save', 'restore', 'translate', 'scale', 'rotate', 'drawImage']) {
    context[method] = (...args) => calls.push([method, ...args]);
  }
  context.ellipse = (...args) => {
    assert.ok(args.slice(0, 5).every(Number.isFinite));
    assert.ok(args[2] >= 0 && args[3] >= 0);
    calls.push(['ellipse', ...args]);
  };
  context.roundRect = (...args) => {
    assert.ok(args.every(Number.isFinite));
    calls.push(['roundRect', ...args]);
  };
  context.createLinearGradient = () => { calls.push(['gradient']); return { addColorStop() {} }; };
  context.createRadialGradient = () => ({ addColorStop() {} });
  return context;
}

test('every crop and growth stage draws finite, balanced canvas geometry', () => {
  for (const crop of ['wheat', 'potatoes', 'beans', 'clover']) {
    for (const stage of ['Seed', 'Sprout', 'Mature']) {
      const context = drawingContext();
      drawCrop(context, crop, stage, 40, 60, 1000, 2.5);
      assert.ok(context.calls.some(call => call[0] === 'ellipse'));
      assert.equal(context.calls.filter(call => call[0] === 'save').length, context.calls.filter(call => call[0] === 'restore').length);
    }
  }
});

test('season rendering, cached scenery, effects, hit targets, and restart run without runtime errors', context => {
  const createCanvas = () => {
    const drawing = drawingContext();
    return { style: {}, width: 1000, height: 820, getContext: () => drawing, addEventListener() {}, getBoundingClientRect: () => ({ left: 10, top: 20, width: 500, height: 410 }) };
  };
  const globals = {
    window: { matchMedia: () => ({ matches: false, addEventListener() {} }) },
    document: { hidden: false, createElement: createCanvas, addEventListener() {}, querySelector: () => null },
    IntersectionObserver: class { observe() {} },
    requestAnimationFrame: () => 1,
  };
  for (const [name, value] of Object.entries(globals)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    context.after(() => original ? Object.defineProperty(globalThis, name, original) : delete globalThis[name]);
  }
  const state = new GameState({ eventsEnabled: false });
  const canvas = createCanvas();
  const grid = new FarmGrid(canvas, state, () => {});
  const before = structuredClone(state);
  grid.render();
  const gradientCount = canvas.getContext().calls.filter(call => call[0] === 'gradient').length;
  grid.render();
  assert.equal(canvas.getContext().calls.filter(call => call[0] === 'gradient').length, gradientCount);
  assert.deepEqual({ ...state }, before);
  for (let index = 0; index < 16; index++) {
    const pointX = 10 + (185 + index % 4 * 158 + 50) / 2;
    const pointY = 20 + (418 + Math.floor(index / 4) * 86 + 30) / 2;
    assert.equal(grid.plotAt(pointX, pointY), index);
  }
  assert.equal(grid.plotAt(10, 20), -1);
  assert.equal(grid.plotAt(10 + 338 / 2, 20 + 500 / 2), -1);
  for (const seasonIndex of [1, 2, 3, 0]) {
    state.seasonIndex = seasonIndex;
    for (const [index, plot] of state.plots.entries()) {
      plot.crop = ['wheat', 'potatoes', 'beans', 'clover'][index % 4];
      plot.growthStage = ['Seed', 'Sprout', 'Mature'][index % 3];
      plot.composted = true;
    }
    grid.showEffect('plant');
    grid.showEffect('compost');
    grid.showHarvest(0, 4);
    grid.render();
    assert.equal(grid.landscapeSeason, state.season);
  }
  grid.motion.matches = true;
  grid.render();
  assert.equal(grid.previousScene, null);
  grid.resetEffects();
  assert.equal(grid.effects.length, 0);
  assert.equal(grid.floatingHarvest, null);
  assert.equal(grid.hovered, -1);
});
