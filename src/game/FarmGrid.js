import { soilQuality } from './GameRules.js';
import { drawCrop } from './CropArt.js';
export class FarmGrid {
  constructor(canvas, state, onSelect) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.state = state;
    this.onSelect = onSelect;
    this.growthStarted = 0;
    this.floatingHarvest = null;
    this.animationFrame = null;
    this.hovered = -1;
    this.hoverStrength = Array(16).fill(0);
    this.effects = [];
    this.lastFrame = 0;
    this.visible = true;
    this.motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.landscape = document.createElement('canvas');
    this.landscape.width = 1000;
    this.landscape.height = 820;
    this.landscapeSeason = null;
    this.previousScene = null;
    this.transitionStarted = 0;
    this.bounds = { left: 185, top: 418, size: 146, gap: 12 };
    canvas.addEventListener('pointermove', event => {
      this.hovered = state.status === 'playing' ? this.plotAt(event.clientX, event.clientY) : -1;
      canvas.style.cursor = this.hovered >= 0 ? 'pointer' : 'default';
      if (this.motion.matches) this.render();
    });
    canvas.addEventListener('pointerleave', () => { this.hovered = -1; if (this.motion.matches) this.render(); });
    this.observer = new IntersectionObserver(entries => {
      this.visible = entries[0].isIntersecting;
      if (this.visible) this.scheduleFrame();
    });
    this.observer.observe(canvas);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.scheduleFrame(); });
    document.addEventListener('close', () => this.scheduleFrame(), true);
    this.motion.addEventListener('change', () => { this.render(); this.scheduleFrame(); });
    this.scheduleFrame();
    canvas.addEventListener('click', event => {
      if (state.status !== 'playing') return;
      const selected = this.plotAt(event.clientX, event.clientY);
      if (selected >= 0) {
        state.selected = selected;
        onSelect();
      }
    });
    canvas.addEventListener('keydown', event => {
      if (state.status !== 'playing') return;
      const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 };
      if (!(event.key in offsets)) return;
      event.preventDefault();
      state.selected = Math.max(0, Math.min(15, state.selected + offsets[event.key]));
      onSelect();
    });
  }
  plotAt(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const pointX = (clientX - rect.left) * 1000 / rect.width;
    const pointY = (clientY - rect.top) * 820 / rect.height;
    const { left, top, size, gap } = this.bounds;
    const column = Math.floor((pointX - left) / (size + gap));
    const row = Math.floor((pointY - top) / 86);
    if (column < 0 || column > 3 || row < 0 || row > 3) return -1;
    return pointX - left - column * (size + gap) <= size && pointY - top - row * 86 <= 74 ? row * 4 + column : -1;
  }
  showEffect(kind, plotId = this.state.selected) {
    this.effects.push({ kind, plotId, started: performance.now() });
    this.effects = this.effects.slice(-12);
    this.scheduleFrame();
  }
  resetEffects() {
    this.effects = [];
    this.hovered = -1;
    this.hoverStrength.fill(0);
    this.floatingHarvest = null;
    this.previousScene = null;
    this.landscapeSeason = null;
    this.scheduleFrame();
  }
  animateGrowth() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.growthStarted = performance.now();
    this.scheduleFrame();
  }
  showHarvest(plotId, food) {
    this.floatingHarvest = { plotId, food, started: performance.now() };
    this.showEffect('harvest', plotId);
    this.scheduleFrame();
  }
  scheduleFrame() {
    if (this.animationFrame !== null) return;
    if (document.hidden || !this.visible) return;
    this.animationFrame = requestAnimationFrame(time => {
      this.animationFrame = null;
      if (document.querySelector('dialog[open]')) return;
      if (time - this.lastFrame >= 1000 / 30) {
        this.render();
        this.lastFrame = time;
      }
      if ((!this.motion.matches && this.state.status === 'playing') || this.effects.length || this.floatingHarvest || this.previousScene) this.scheduleFrame();
    });
  }
  render() {
    const ctx = this.context;
    const now = performance.now();
    const motionTime = this.motion.matches ? 0 : now;
    const winter = this.state.season === 'Winter';
    const autumn = this.state.season === 'Autumn';
    const summer = this.state.season === 'Summer';
    const rect = (x, y, width, height, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, width, height); };
    const ellipse = (x, y, rx, ry, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); };
    const polygon = (points, color) => { ctx.fillStyle = color; ctx.beginPath(); points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); };
    const line = (points, color, width = 2) => { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); };
    const rounded = (x, y, width, height, radius, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); ctx.fill(); };
    if (this.landscapeSeason === this.state.season) {
      ctx.drawImage(this.landscape, 0, 0);
    } else {
      if (this.landscapeSeason && !this.motion.matches) {
        this.previousScene = document.createElement('canvas');
        this.previousScene.width = 1000;
        this.previousScene.height = 820;
        this.previousScene.getContext('2d').drawImage(this.canvas, 0, 0);
        this.transitionStarted = now;
      }
    const sky = ctx.createLinearGradient(0, 0, 0, 400);
    sky.addColorStop(0, winter ? '#c6d9df' : autumn ? '#e5d3ad' : summer ? '#acd3cd' : '#beded4'); sky.addColorStop(1, '#fcf0ce');
    rect(0, 0, 1000, 820, sky);
    ellipse(796, 85, 37, 37, '#f6edc4');
    const sunlight = ctx.createRadialGradient(796, 85, 25, 796, 85, 230);
    sunlight.addColorStop(0, '#ffe7a940'); sunlight.addColorStop(1, '#ffe7a900');
    rect(550, 0, 450, 330, sunlight);
    polygon([[0, 230], [125, 140], [240, 210], [360, 130], [510, 235], [720, 130], [1000, 245]], winter ? '#b9cbd1' : '#9eb9ac');
    for (const [x, y] of [[140, 88], [465, 60], [865, 157]]) {
      ellipse(x, y, 62, 12, '#f1f0d9'); ellipse(x - 13, y - 10, 29, 16, '#f1f0d9');
    }
    ellipse(180, 330, 420, 173, '#a3ba8e'); ellipse(850, 345, 460, 190, '#9fb68a');
    ellipse(380, 395, 630, 180, '#8ea577');
    rect(0, 350, 1000, 470, winter ? '#e9ece2' : autumn ? '#b6ad70' : summer ? '#8baa67' : '#a8bf83');
    polygon([[420, 320], [515, 320], [650, 820], [350, 820]], '#d3c6a1');
    polygon([[0, 337], [1000, 337], [1000, 365], [0, 365]], '#cabc98');
    for (let stone = 0; stone < 50; stone++) ellipse(stone * 21, 344 + stone % 3 * 6, 4, 2, '#b7aa89');
    const tree = (x, y, scale = 1) => {
      rect(x - 5 * scale, y - 45 * scale, 10 * scale, 62 * scale, '#786c4c');
      ellipse(x, y - 58 * scale, 31 * scale, 45 * scale, winter ? '#aab9ad' : autumn ? '#b38b4d' : '#6f8a60');
      ellipse(x - 12 * scale, y - 69 * scale, 23 * scale, 30 * scale, winter ? '#e4e9de' : autumn ? '#d5ad60' : '#94ad72');
    };
    for (const [x, y, scale] of [[60, 318, 1.3], [131, 270, .7], [896, 310, 1.4], [950, 335, 1], [740, 275, .8]]) tree(x, y, scale);
    const house = (x, y, scale, color) => {
      rect(x, y, 100 * scale, 65 * scale, color);
      polygon([[x - 10 * scale, y], [x + 27 * scale, y - 43 * scale], [x + 88 * scale, y - 43 * scale], [x + 110 * scale, y]], '#a86245');
      for (let tileRow = 1; tileRow < 5; tileRow++) {
        const tileY = y - tileRow * 8 * scale;
        const roofLeft = x - 10 * scale + tileRow * 7 * scale;
        const roofRight = x + 110 * scale - tileRow * 4 * scale;
        line([[roofLeft, tileY], [roofRight, tileY]], '#bd7655', scale);
        for (let tileX = roofLeft + 7 * scale; tileX < roofRight; tileX += 12 * scale) line([[tileX, tileY], [tileX - 2 * scale, tileY + 6 * scale]], '#875039', scale);
      }
      line([[x - 8 * scale, y], [x + 110 * scale, y]], '#784d38', 3);
      if (winter) line([[x + 27 * scale, y - 43 * scale], [x + 88 * scale, y - 43 * scale], [x + 110 * scale, y]], '#f6f4e9', 6 * scale);
      rect(x + 65 * scale, y - 48 * scale, 9 * scale, 24 * scale, '#c8b89a');
      rect(x + 40 * scale, y + 26 * scale, 21 * scale, 39 * scale, '#6c7158');
      for (const offset of [13, 76]) { rect(x + offset * scale, y + 21 * scale, 13 * scale, 19 * scale, '#55736a'); }
      for (const offset of [11, 74]) {
        rect(x + offset * scale, y + 19 * scale, 17 * scale, 2 * scale, '#f6e9c8');
        rect(x + offset * scale, y + 40 * scale, 17 * scale, 3 * scale, '#f6e9c8');
      }
      rect(x, y + 59 * scale, 100 * scale, 6 * scale, '#b9ab90');
      rect(x + 101 * scale, y + 20 * scale, 23 * scale, 45 * scale, '#9b805d');
      line([[x + 113 * scale, y + 20 * scale], [x + 113 * scale, y + 65 * scale]], '#776b4e', scale);
    };
    house(93, 303, 1.1, '#e5d8b4'); house(758, 305, 1, '#e6cea4'); house(660, 289, .7, '#e7dfbf');
    ellipse(483, 345, 204, 22, '#82976b');
    rect(316, 259, 333, 77, '#d9cfb0');
    for (let course = 0; course < 5; course++) {
      const stoneY = 267 + course * 13;
      line([[317, stoneY], [648, stoneY]], '#c4ba9d', 1);
      for (let stoneX = 323 + course % 2 * 13; stoneX < 648; stoneX += 28) line([[stoneX, stoneY], [stoneX, stoneY + 12]], '#c4ba9d', 1);
    }
    for (let index = 0; index < 16; index++) rect(316 + index * 21, 250, 13, 16, '#ded5b6');
    rect(390, 186, 179, 98, '#f0e6c8');
    polygon([[373, 191], [433, 128], [548, 128], [586, 191]], '#a65e43');
    for (let index = 0; index < 4; index++) { rect(409 + index * 37, 215, 10, 30, '#7e8b7b'); }
    rect(480, 105, 58, 162, '#eee3c4'); rect(523, 105, 15, 162, '#d4c6a9');
    polygon([[470, 108], [509, 45], [547, 108]], '#84513d');
    if (winter) {
      line([[470, 108], [509, 45], [547, 108]], '#f6f4e9', 5);
      line([[373, 191], [433, 128], [548, 128], [586, 191]], '#f6f4e9', 5);
    }
    rect(506, 31, 4, 17, '#665d43'); rect(501, 36, 14, 3, '#665d43');
    rect(492, 123, 13, 28, '#646f60'); rect(514, 123, 12, 28, '#646f60');
    ellipse(509, 177, 13, 13, '#d6c49c');
    line([[509, 168], [509, 177], [516, 180]], '#6f6a54', 2);
    rect(446, 281, 58, 55, '#b4a889'); ellipse(475, 291, 22, 22, '#777a61'); rect(453, 291, 44, 45, '#777a61');
    line([[316, 330], [649, 330]], '#b4ac8b', 5);
    for (const towerX of [302, 626]) {
      rect(towerX, 243, 34, 90, '#d8cbaa');
      polygon([[towerX - 5, 243], [towerX + 17, 216], [towerX + 39, 243]], '#a15f45');
      rect(towerX + 14, 263, 5, 20, '#7c7b64');
      line([[towerX, 304], [towerX + 34, 304]], '#b8ad91', 2);
    }
    for (const person of [{ x: 260, color: '#a7755a' }, { x: 283, color: '#6b8777' }]) {
      ellipse(person.x, 335, 4, 5, '#d1b08b');
      rect(person.x - 4, 340, 8, 12, person.color);
      line([[person.x - 2, 352], [person.x - 3, 358]], '#6f6851', 2);
      line([[person.x + 2, 352], [person.x + 3, 358]], '#6f6851', 2);
    }
    rect(268, 344, 8, 6, '#a78c5e');
    for (let index = 0; index < 9; index++) {
      const x = 275 + index * 58;
      rect(x, 366, 5, 28, '#93825b');
    }
    rect(276, 373, 468, 4, '#ab966b');
    ellipse(500, 753, 367, 37, '#8e9e6b');
    rounded(164, 403, 657, 361, 18, winter ? '#d9dccc' : '#a89d6f');
    rounded(174, 410, 637, 347, 14, winter ? '#f1eee0' : '#c8b48a');
    this.landscape.getContext('2d').drawImage(this.canvas, 0, 0);
    this.landscapeSeason = this.state.season;
    }
    const { left, top, size, gap } = this.bounds;
    for (const plot of this.state.plots) {
      const x = left + plot.id % 4 * (size + gap);
      const y = top + Math.floor(plot.id / 4) * 86;
      rounded(x - 2, y + 5, size + 4, 74, 12, '#594438');
      rounded(x, y, size, 72, 10, winter ? '#9b8d7c' : plot.soil.fertility >= 60 ? '#795548' : '#a08064');
      this.hoverStrength[plot.id] += ((this.hovered === plot.id ? 1 : 0) - this.hoverStrength[plot.id]) * (this.motion.matches ? 1 : 0.22);
      if (this.hoverStrength[plot.id] > 0.01) {
        ctx.save(); ctx.globalAlpha = this.hoverStrength[plot.id] * 0.17;
        rounded(x, y, size, 72, 10, '#fff0bf'); ctx.restore();
      }
      for (let row = 0; row < 4; row++) line([[x + 9, y + 18 + row * 14], [x + size - 9, y + 18 + row * 14]], '#7e5f40', 3);
      for (let dot = 0; dot < 11; dot++) ellipse(x + 12 + (dot * 43 % 125), y + 9 + (dot * 17 % 53), 1.5, 1, '#b39468');
      for (let stone = 0; stone < 3; stone++) ellipse(x + 18 + stone * 49, y + 62 - stone % 2 * 10, 3, 1.8, '#c0a690');
      if (winter) rounded(x + 2, y, size - 4, 10, 5, '#f1eee4');
      else for (const offset of [2, size - 4]) line([[x + offset, y + 70], [x + offset - 3, y + 62], [x + offset, y + 67], [x + offset + 4, y + 60]], '#6f9154', 1.4);
      if (plot.crop) {
        for (let row = 0; row < 3; row++) for (let column = 0; column < 5; column++) {
          const cropX = x + 23 + column * 25;
          const cropY = y + 19 + row * 20;
          const progress = Math.min(1, (performance.now() - this.growthStarted) / 700);
          drawCrop(ctx, plot.crop, plot.growthStage, cropX, cropY, motionTime, this.motion.matches ? 1 : 0.85 + progress * 0.15);
        }
      }
      ctx.font = '11px Georgia'; ctx.fillStyle = '#e4cf9e'; ctx.fillText(String(plot.id + 1).padStart(2, '0'), x + 6, y + 12);
      ellipse(x + size - 10, y + 10, 4, 4, soilQuality(plot.soil.fertility).color);
      if (plot.seasonalEffect) { ctx.fillStyle = '#ffe7a1'; ctx.font = 'bold 14px Georgia'; ctx.fillText(plot.seasonalEffect === 'pests' ? '!' : '+', x + size - 43, y + 15); }
      if (plot.composted) {
        for (let speck = 0; speck < 5; speck++) ellipse(x + 17 + speck * 25, y + 65, 3, 2, '#d4b889');
        ctx.fillStyle = '#f1dfb3'; ctx.font = '13px Georgia'; ctx.fillText('♻', x + size - 27, y + 14);
      }
      if (plot.id === this.state.selected) {
        ctx.strokeStyle = '#ffe7a1'; ctx.lineWidth = this.motion.matches ? 3 : 3 + Math.sin(now / 420) * 0.7;
        ctx.beginPath(); ctx.roundRect(x - 3, y - 3, size + 6, 78, 13); ctx.stroke();
        polygon([[x + size / 2 - 6, y - 13], [x + size / 2 + 6, y - 13], [x + size / 2, y - 7]], '#fff0b5');
      }
    }
    for (let index = 0; index < 60; index++) {
      const x = (index * 127 + 39) % 1000;
      const y = 390 + (index * 73 % 420);
      if (x > 147 && x < 840 && y < 776) continue;
      line([[x, y], [x + 2, y - 9]], '#7c925d', 2);
      ellipse(x + 2, y - 10, 3, 3, winter ? '#f8f7ef' : autumn ? '#ca904d' : ['#e9b44c', '#d9a793', '#fff0d0'][index % 3]);
    }
    for (const treeX of [65, 931]) {
      rect(treeX - 5, 556, 10, 75, '#786c4c');
      ellipse(treeX, 550, 33, 45, winter ? '#cbd6ca' : autumn ? '#c39a57' : '#759458');
      ellipse(treeX - 11, 536, 22, 28, winter ? '#f2f2e8' : autumn ? '#dfb768' : '#91aa6a');
    }
    rect(853, 684, 49, 39, '#9b7951'); rect(849, 679, 57, 9, '#b89461');
    ellipse(876, 677, 23, 5, '#65573d');
    ctx.fillStyle = '#f0dfac'; ctx.font = '21px Georgia'; ctx.fillText('♻', 863, 710);
    for (const [x, y] of [[221, 137], [245, 149], [694, 105]]) line([[x - 5, y], [x, y - 3], [x + 5, y]], '#748e7a', 1.5);
    if (autumn || winter) {
      for (let flake = 0; flake < 18; flake++) {
        const drift = motionTime / (winter ? 70 : 50);
        const leafX = (flake * 113 + Math.sin(drift / 18 + flake) * 18 + 1000) % 1000;
        const leafY = (flake * 47 + drift) % 800;
        ellipse(leafX, leafY, winter ? 2 : 4, 2, winter ? '#fffdf4b0' : '#ba713e99');
      }
    }
    this.effects = this.effects.filter(effect => now - effect.started < 900);
    for (const effect of this.effects) {
      const progress = (now - effect.started) / 900;
      const effectX = left + effect.plotId % 4 * (size + gap) + size / 2;
      const effectY = top + Math.floor(effect.plotId / 4) * 86 + 35;
      ctx.save(); ctx.globalAlpha = 1 - progress;
      for (let particle = 0; particle < 10; particle++) {
        const angle = particle * Math.PI * 2 / 10;
        const spread = this.motion.matches ? 18 : 12 + progress * 44;
        ellipse(effectX + Math.cos(angle) * spread, effectY + Math.sin(angle) * spread * 0.5 - (this.motion.matches ? 0 : Math.sin(progress * Math.PI) * 18), effect.kind === 'compost' ? 3 : 2, 2, effect.kind === 'compost' ? '#c8a17b' : '#e9b44c');
      }
      ctx.restore();
    }
    if (this.previousScene) {
      const fade = (now - this.transitionStarted) / 650;
      if (fade >= 1 || this.motion.matches) this.previousScene = null;
      else { ctx.save(); ctx.globalAlpha = 1 - fade; ctx.drawImage(this.previousScene, 0, 0); ctx.restore(); }
    }
    if (this.floatingHarvest) {
      const { plotId, food, started } = this.floatingHarvest;
      const progress = (performance.now() - started) / 1400;
      if (progress >= 1) { this.floatingHarvest = null; return; }
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      ctx.save();
      ctx.globalAlpha = 1 - progress;
      ctx.font = 'bold 23px Georgia';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#42513a';
      ctx.fillStyle = '#fff1bd';
      const label = `+${food} food`;
      const labelX = left + plotId % 4 * (size + gap) + size / 2;
      const labelY = top + Math.floor(plotId / 4) * 86 + 30 - (reducedMotion ? 0 : progress * 35);
      ctx.strokeText(label, labelX, labelY);
      ctx.fillText(label, labelX, labelY);
      ctx.restore();
    }
  }
}
