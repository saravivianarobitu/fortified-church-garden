import { EVENTS } from '../game/SeasonalEvents.js';

export class EventNotice {
  constructor() {
    document.querySelector('main').insertAdjacentHTML('beforebegin', '<details class="seasonal-event" id="seasonal-event" hidden><summary><canvas id="event-art" width="80" height="80" aria-hidden="true"></canvas><span><small>THIS SUMMER IN THE VILLAGE</small><strong id="event-name"></strong></span><span class="event-toggle">Details</span></summary><div class="event-copy" aria-live="polite"><p id="event-effect"></p><p id="event-advice"></p><small id="event-plots"></small></div></details>');
    this.element = document.querySelector('#seasonal-event');
    this.key = null;
  }
  render(state) {
    const event = state.currentEvent;
    if (!event) { this.element.hidden = true; this.key = null; return; }
    const key = `${event.year}-${event.id}`;
    if (key === this.key) return;
    this.key = key;
    this.element.hidden = false;
    this.element.open = true;
    const definition = EVENTS.find(item => item.id === event.id);
    document.querySelector('#event-name').textContent = `Year ${event.year} · ${definition.name}`;
    document.querySelector('#event-effect').textContent = event.effect;
    document.querySelector('#event-advice').textContent = definition.advice;
    document.querySelector('#event-plots').textContent = event.affected.length ? `${event.id === 'rain' ? 'Eroded' : 'Marked'} plots: ${event.affected.map(id => String(id + 1).padStart(2, '0')).join(', ')}. ${event.id === 'rain' ? 'Soil loss remains until you restore it.' : 'Harvest effects last only this year.'}` : 'One summer draw per year. Effects never stack with a second event.';
    this.draw(definition.icon);
  }
  draw(icon) {
    const context = document.querySelector('#event-art').getContext('2d');
    context.clearRect(0, 0, 80, 80);
    const oval = (x, y, radiusX, radiusY, color) => {
      context.fillStyle = color;
      context.beginPath(); context.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2); context.fill();
    };
    const line = (points, color, width = 3) => {
      context.strokeStyle = color; context.lineWidth = width;
      context.beginPath(); points.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y)); context.stroke();
    };
    oval(40, 40, 36, 36, '#e9dfc5');
    if (icon === 'sun' || icon === 'rainbow') {
      for (let ray = 0; ray < 8; ray++) {
        const angle = ray * Math.PI / 4;
        line([[40 + Math.cos(angle) * 21, 36 + Math.sin(angle) * 21], [40 + Math.cos(angle) * 28, 36 + Math.sin(angle) * 28]], '#c49438', 2);
      }
      oval(40, 36, 15, 15, '#e9b44c');
      if (icon === 'rainbow') { oval(48, 56, 22, 8, '#f9f5e5'); oval(44, 50, 10, 10, '#f9f5e5'); }
      else line([[19, 64], [30, 60], [41, 65], [58, 61]], '#aa7e59', 2);
    } else if (icon === 'rain') {
      oval(40, 30, 24, 10, '#91aeb0'); oval(34, 23, 12, 12, '#aac3c2');
      for (const x of [25, 40, 55]) line([[x, 48], [x - 4, 59]], '#6b9ba6');
    } else if (icon === 'basket') {
      context.fillStyle = '#ad8256'; context.fillRect(20, 34, 40, 27);
      line([[18, 34], [62, 34]], '#795548', 5);
      for (const y of [43, 52]) line([[22, y], [58, y]], '#d1ae77', 2);
      oval(40, 31, 18, 5, '#795548');
      line([[40, 30], [40, 16]], '#405d43'); oval(34, 18, 7, 4, '#8baa67'); oval(47, 13, 7, 4, '#a4b97b');
    } else if (icon === 'beetle') {
      for (const y of [32, 42, 52]) { line([[30, y], [20, y - 5]], '#795548', 2); line([[50, y], [60, y - 5]], '#795548', 2); }
      oval(40, 43, 14, 19, '#b85c38'); oval(40, 23, 8, 7, '#405d43');
      line([[40, 29], [40, 61]], '#795548', 2); oval(34, 38, 2, 2, '#f5ebd8'); oval(47, 48, 2, 2, '#f5ebd8');
    } else {
      oval(40, 61, 24, 6, '#795548'); line([[40, 60], [40, 24]], '#405d43');
      oval(29, 36, 12, 6, '#8baa67'); oval(51, 25, 12, 7, '#9ebd77');
      oval(60, 50, 3, 3, '#e9b44c');
    }
  }
}
