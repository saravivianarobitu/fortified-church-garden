import { CROPS } from '../game/Crop.js';
import { HeritageBook } from './HeritageBook.js';
import { Tutorial } from './Tutorial.js';
import { EventNotice } from './EventNotice.js';
import { drawCrop } from '../game/CropArt.js';
import { CHALLENGE, canPlant, canHarvest, canCompost, canWater, harvestPending, harvestPreview, soilQuality, cropTooltip } from '../game/GameRules.js';
export class UIManager {
  constructor(state, actions) {
    this.state = state;
    this.eventNotice = new EventNotice();
    this.heritageBook = new HeritageBook();
    document.querySelector('footer').after(document.querySelector('.heritage-strip'));
    document.querySelector('.small-note').textContent = `+${CHALLENGE.compostGain} fertility · once per plot per year · +${CHALLENGE.winterCompost} compost each winter`;
    document.querySelector('main').insertAdjacentHTML('beforebegin', '<section class="year-objectives" aria-label="Yearly objectives"><div><span>ANNUAL MEAL</span><strong id="annual-food"></strong></div><div><span>THIS YEAR’S HARVEST</span><strong id="year-production"></strong></div><div><span>YEARS REMAINING</span><strong id="years-remaining"></strong></div><p id="year-report"></p></section>');
    document.body.insertAdjacentHTML('beforeend', '<dialog id="game-over" aria-labelledby="end-title" aria-describedby="end-reason"><div class="end-emblem" aria-hidden="true">❧</div><p class="eyebrow" id="end-kicker"></p><h2 id="end-title"></h2><p id="end-reason"></p><dl class="end-stats"><div><dt>Final soil fertility</dt><dd id="end-soil"></dd></div><div><dt>Total food produced</dt><dd id="end-food"></dd></div><div><dt>Years survived</dt><dd id="end-years"></dd></div><div><dt>Food remaining</dt><dd id="end-storage"></dd></div></dl><button id="restart" class="advance">Restart Game ↻</button></dialog>');
    this.endDialog = document.querySelector('#game-over');
    this.endDialog.addEventListener('cancel', event => event.preventDefault());
    document.querySelector('#restart').addEventListener('click', actions.restart);
    document.querySelector('#fertility-meter').setAttribute('aria-label', 'Selected plot fertility');
    document.querySelector('#moisture-meter').setAttribute('aria-label', 'Selected plot moisture');
    document.querySelector('.garden-caption').insertAdjacentHTML('afterend', '<p class="soil-legend">Soil markers: green = healthy · yellow = degraded · red = poor or depleted. Select a plot for exact values.</p>');
    document.querySelector('#history').insertAdjacentHTML('beforebegin', '<p id="previous-crop"></p>');
    document.querySelector('#history').insertAdjacentHTML('afterend', '<p id="rotation-feedback"></p>');
    const history = document.querySelector('.history');
    const historyDetails = document.createElement('details');
    historyDetails.className = 'history-details';
    historyDetails.innerHTML = '<summary>Soil memory & rotation</summary>';
    history.before(historyDetails);
    historyDetails.append(history);
    document.querySelector('#plant-hint').insertAdjacentHTML('afterend', '<details class="yield-details"><summary>What affects this harvest?</summary><p id="yield-explanation"></p></details>');
    document.querySelector('.panel-heading').insertAdjacentHTML('afterend', '<div class="season-path" aria-label="Seasonal lifecycle"><span data-season="Spring">1 · Plant</span><span data-season="Summer">2 · Care</span><span data-season="Autumn">3 · Harvest</span><span data-season="Winter">4 · Share</span></div><p id="season-guidance" class="season-guidance"></p>');
    document.querySelector('#compost').insertAdjacentHTML('beforebegin', '<button id="harvest" class="compost harvest-button">Harvest crop</button><button id="water" class="compost water-button" title="Free watering: +25 moisture in spring or summer. Water before advancing. Past drought damage cannot be reversed.">Water plot · +25 moisture</button>');
    const crops = document.querySelector('#crops');
    for (const [id, crop] of Object.entries(CROPS)) {
      const button = document.createElement('button');
      button.className = 'crop-card';
      button.dataset.crop = id;
      button.title = cropTooltip(state.selectedPlot, id);
      button.innerHTML = `<span class="crop-icon" style="--crop-color:${crop.color}">${crop.symbol}</span><span><strong>${crop.name}</strong><small>${crop.description}</small><em>${crop.yield ? `~${crop.yield} food` : 'Cover crop'} <b>·</b> ${crop.fertility > 0 ? '+' : ''}${crop.fertility} fertility</em></span><span class="plant-plus">+</span>`;
      button.addEventListener('click', () => actions.plant(id));
      const icon = document.createElement('canvas');
      icon.width = 80;
      icon.height = 90;
      icon.setAttribute('aria-hidden', 'true');
      icon.className = 'crop-illustration';
      drawCrop(icon.getContext('2d'), id, 'Mature', 40, 60, 0, 2.5);
      button.querySelector('.crop-icon').replaceChildren(icon);
      button.querySelector('small').textContent = `${crop.duration} seasons · needs ${crop.moisture}% moisture`;
      const wrapper = document.createElement('div');
      wrapper.className = 'crop-choice';
      const tooltip = document.createElement('span');
      tooltip.id = `crop-tip-${id}`;
      tooltip.className = 'crop-tooltip';
      tooltip.setAttribute('role', 'tooltip');
      button.setAttribute('aria-describedby', tooltip.id);
      wrapper.append(button, tooltip);
      crops.append(wrapper);
    }
    document.querySelector('#compost').addEventListener('click', actions.compost);
    document.querySelector('#harvest').addEventListener('click', actions.harvest);
    document.querySelector('#water').addEventListener('click', actions.water);
    document.querySelector('#advance').addEventListener('click', actions.advance);
    this.tutorial = new Tutorial();
  }
  render() {
    const state = this.state;
    this.eventNotice.render(state);
    document.body.dataset.season = state.season.toLowerCase();
    this.heritageBook.render(state);
    const plot = state.selectedPlot;
    const set = (id, text) => { document.getElementById(id).textContent = text; };
    set('year', `YEAR ${String(state.year).padStart(2, '0')}`);
    set('season', state.season);
    set('food', `${state.food} food`);
    set('fertility', `${state.averageFertility.toFixed(1)}%`);
    set('annual-food', `${CHALLENGE.annualFood} needed · ${state.food} available`);
    set('year-production', `+${state.yearFoodProduced} food`);
    set('years-remaining', `${Math.max(0, CHALLENGE.years - state.yearsSurvived)} of ${CHALLENGE.years}`);
    const lastReport = state.annualReports.at(-1);
    set('year-report', lastReport ? `Year ${lastReport.year}: +${lastReport.produced} harvested, −${lastReport.consumed} consumed, ${lastReport.remaining} stored.` : 'Consumption happens when you end winter. Rotate crops to leave at least 60% fertility after Year 5.');
    set('season-note', { Spring: 'The earth wakes. A new beginning.', Summer: 'Long days, golden possibilities.', Autumn: 'Gather enough to share.', Winter: 'The garden rests beneath the sky.' }[state.season]);
    set('plot-name', `Plot ${String(plot.id + 1).padStart(2, '0')}`);
    const quality = soilQuality(plot.soil.fertility);
    const preview = harvestPreview(plot);
    document.querySelectorAll('[data-season]').forEach(step => {
      if (step.dataset.season === state.season) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    set('season-guidance', {
      Spring: 'Choose a plot, then a crop. Think about what grew here last year.',
      Summer: 'A little care now, a better harvest later. Check moisture and compost.',
      Autumn: 'Your harvest is ready. Select each planted plot and gather the food.',
      Winter: 'Time to share. Restore the soil before the year’s final meal.',
    }[state.season]);
    set('yield-explanation', preview ? `${CROPS[plot.crop].name}: ${CROPS[plot.crop].yield} base food. ${quality.label} keeps ${Math.round(quality.multiplier * 100)}% of that yield. Dry growth steps: ${plot.drySeasons}; each reduces the moisture multiplier by 25 percentage points. Food is rounded down (minimum 1 for food crops). Clover restores soil instead of producing food.` : 'Plant in spring. Crops mature in autumn; fertility and dry growth steps determine the final food yield.');
    set('plot-status', plot.crop ? `${CROPS[plot.crop].name} · ${plot.growthStage}` : 'Resting earth');
    if (preview) document.querySelector('#yield-explanation').textContent += ` ${preview.event.text} Event adjustments are applied after rounding, with a final minimum of 1 for food crops.`;
    set('plot-fertility', `${plot.soil.fertility}% · ${quality.label}`);
    document.querySelector('#fertility-meter').style.setProperty('--soil-color', quality.color);
    set('plot-moisture', `${plot.soil.moisture}%`);
    document.querySelector('#fertility-meter').value = plot.soil.fertility;
    document.querySelector('#moisture-meter').value = plot.soil.moisture;
    set('history', plot.history.length ? plot.history.slice(-3).map(item => `${CROPS[item.crop].name} · ${item.season} ${item.year}`).join(' → ') : 'A fresh start. No previous crops.');
    set('previous-crop', `Previous crop: ${plot.previousCrop ? CROPS[plot.previousCrop].name : 'None'}`);
    set('rotation-feedback', preview ? preview.rotation.message : 'Choose a different crop family next spring. Crop tooltips show the rotation effects for this plot.');
    set('plant-hint', preview ? `Expected harvest: ${preview.food} food · ${plot.growthSeasons}/${CROPS[plot.crop].duration} seasons. ${plot.drySeasons ? `${plot.drySeasons} dry growth step(s) have reduced yield. ` : ''}${plot.growthStage !== 'Mature' && plot.soil.moisture < CROPS[plot.crop].moisture ? 'Low moisture: water before the next growth step. ' : ''}${canHarvest(state) ? 'Ready to harvest!' : 'Harvest in autumn.'}` : state.season === 'Spring' ? 'Plant now. Sprouts in summer, mature crops in autumn.' : 'Planting opens next spring. Care for the soil or plan your rotation.');
    if (plot.seasonalEffect && preview) document.querySelector('#plant-hint').textContent += ` ${preview.event.text}`;
    document.querySelectorAll('[data-crop]').forEach(button => {
      button.disabled = !canPlant(state);
      button.title = cropTooltip(plot, button.dataset.crop);
      document.getElementById(`crop-tip-${button.dataset.crop}`).textContent = button.title;
      button.classList.toggle('is-planted', plot.crop === button.dataset.crop);
    });
    document.querySelector('#harvest').disabled = !canHarvest(state);
    set('harvest', canHarvest(state) ? `Harvest ${CROPS[plot.crop].name} · +${preview.food} food` : plot.crop ? `Growing · ${plot.growthSeasons}/${CROPS[plot.crop].duration} seasons` : 'No crop to harvest');
    document.querySelector('#water').disabled = !canWater(state);
    set('water', !['Spring', 'Summer'].includes(state.season) ? 'Watering returns in spring' : plot.soil.moisture === 100 ? 'Soil fully watered' : 'Water plot · +25 moisture');
    set('advance', harvestPending(state) ? 'Harvest all plots before winter' : state.season === 'Winter' ? `End Year ${state.year} · −${CHALLENGE.annualFood} food` : 'Advance season →');
    document.querySelector('#advance').disabled = state.status !== 'playing';
    set('compost-count', `${state.compost} left`);
    document.querySelector('#compost').disabled = !canCompost(state);
    set('compost-count', plot.composted ? 'Used here this year' : state.compost ? `${state.compost} left` : 'None left');
    set('objective', 'Five years. A nourished village. Living soil.');
    set('objective-detail', `Year ${state.year}/${CHALLENGE.years} · ${state.yearsSurvived} survived · Finish with ≥${CHALLENGE.victoryFertility}% fertility and food to spare. Below ${CHALLENGE.minimumFertility}% at year end means defeat.`);
    if (state.status !== 'playing') {
      set('end-kicker', state.status === 'won' ? 'A FUTURE ROOTED IN CARE' : 'THE SOIL REMEMBERS');
      set('end-title', state.status === 'won' ? 'Your village flourishes.' : 'Every garden teaches us.');
      set('end-reason', state.endReason);
      set('end-soil', `${state.averageFertility.toFixed(1)}%`);
      set('end-food', `${state.totalFoodProduced}`);
      set('end-years', `${state.yearsSurvived} / ${CHALLENGE.years}`);
      set('end-storage', `${state.food}`);
      this.endDialog.dataset.outcome = state.status;
      if (!this.endDialog.open) this.endDialog.showModal();
    } else if (this.endDialog.open) this.endDialog.close();
  }
}
