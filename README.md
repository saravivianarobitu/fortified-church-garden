# Fortified Church Garden: The Soil Remembers

A cozy, procedural HTML5 farming puzzle prototype made for a 48-hour soil conservation and heritage game jam. Dealul Lin is a fictional Saxon village inspired by Viscri and the UNESCO World Heritage property “Villages with Fortified Churches in Transylvania”. This is not an official UNESCO product or a historical reconstruction.

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
cd fortified-church-garden
npm install
npm run dev
```

Open the local URL printed by Vite. For a production build, run `npm run build`; `npm run preview` serves the resulting `dist/` folder. Run `npm test` for the rules checks.

On Windows PowerShell, if script execution policy blocks `npm`, use `npm.cmd` for these commands instead. All checks and the production build pass on Node.js 24.16.0. Browser visual QA has not been performed.

## Play

- Select one of the 16 plots by clicking the canvas or focusing it and using arrow keys.
- In spring, plant wheat, potatoes, beans, or clover in empty plots. Seeds cost nothing. Plants start as seeds, become sprouts when summer arrives, and mature when autumn arrives.
- In summer, water and compost your plots. In autumn, select each mature plot and press **Harvest**. Food and fertility changes happen only on harvest; all mature plots must be harvested before advancing to winter.
- Repeating wheat or potatoes costs 8 additional fertility. Switching families saves 1 fertility, or 6 after beans (a nitrogen benefit), or 8 after clover. Benefits depend on the previous harvested crop and do not stack. Clover itself restores 15 fertility before rotation adjustments.
- Fertility tiers determine food multipliers: excellent (80–100) 100%, healthy (60–79) 85%, degraded (40–59) 65%, poor (20–39) 45%, severely depleted (0–19) 25%. Final yield is rounded down with a minimum of 1 for food crops; clover always produces 0 food.
- At each growth step, moisture below the crop requirement reduces the yield multiplier by 25 percentage points (50% maximum reduction). This multiplies the fertility-adjusted yield. Drought never delays maturity. Free watering adds 25 moisture in spring or summer; it prevents future stress but cannot undo earlier stress.
- Seasonal moisture changes on arrival are summer −20, autumn +10, winter +5, spring +25. Growth checks moisture before that seasonal change. Initial soils are deterministic; special summer events use a seeded random generator.
- Winter restores 1 fertility to every plot when the year ends, before checking soil objectives. Natural recovery is deliberately slow: rotation and cover crops do the restorative work. Soil fertility and moisture always stay within 0–100.
- Compost adds 20 fertility, once per plot per year. You start with 3 units and receive 2 more on entering each winter, including Year 5. Unused compost carries over. Treated plots show compost flecks and a marker; their eligibility resets only at the start of the next year.
- The village consumes 10 food when you press **End Year** in winter. Winter gives you time to use compost before the soil check. Each completed annual report records harvests, actual consumption, food remaining, and fertility.
- Win at the end of Year 5 with at least 60% average fertility and more than 0 food after consumption. Insufficient food for the annual meal or fertility below 20% at year end causes immediate defeat. Exactly 10 food can cover an earlier year's meal, but an empty reserve after Year 5 cannot win. Missing either final target also ends the challenge in defeat.
- Both endings freeze gameplay and show final fertility, total food produced, years survived, and remaining food. **Restart Game** resets the entire garden, resources, history, journal, and statistics.
- This small prototype keeps its state in memory. Refreshing starts a new garden. There is no backend or persistence.

| Crop | Base food | Fertility change | Moisture required | Growth |
| --- | ---: | ---: | ---: | --- |
| Wheat | 4 | −18 | 35 | 2 seasons |
| Potatoes | 3 | −15 | 40 | 2 seasons |
| Beans | 2 | −5 | 35 | 2 seasons |
| Clover | 0 | +15 | 30 | 2 seasons |

These are simplified game values, not scientific measurements. Crop tooltips explain requirements and plot-specific rotation effects. Soil markers, growth illustrations, and floating harvest totals provide visual feedback; reduced-motion preferences are respected.

## Verification

### Seasonal events

One draw happens on entering summer, after the normal seasonal moisture change and before the player’s summer care actions. There is at most one event per year, with a 30% chance of a quiet year. No events trigger on redraw, selection, failed season advances, or after the game ends. Restart creates a fresh campaign seed.

| Event | Chance per year | Effect and response |
| --- | ---: | --- |
| Summer drought | 15% | −20 additional moisture everywhere. Water before the next growth step to prevent yield loss. |
| Heavy rainfall | 15% | +20 moisture everywhere; plots below 20 fertility lose up to 3 fertility. Restore damaged soil with compost and rotations. |
| Favorable weather | 10% | +1 food on up to four planted food-crop plots, chosen by plot ID. |
| Compost bonus | 10% | +2 compost, preserving the once-per-plot yearly limit. |
| Pest outbreak | 10% | Up to four food-crop plots repeating their previous crop family lose 1 food unless fertility reaches 80 before harvest. Minimum yield remains 1. |
| Healthy soil bonus | 10% | The four planted food-crop plots with highest summer fertility are marked; each gets +1 food only if fertility is at least 80 at harvest. Compost can help. |

Only planted food crops receive harvest modifiers; clover never produces food. Direct yield adjustments occur after the normal rounded yield and remain bounded to four food per event. An event with no eligible plots still uses that year’s event draw. Yield modifiers disappear after harvest or at the next spring; moisture, erosion, and compost changes persist as normal resources. All values are simplified game balance, not scientific predictions.

The illustrated event card stays available through winter and can be collapsed using its summary. Its effect text, affected plot list, and response advice agree with the rules. Canvas + / ! markers and harvest explanations identify modified plots.

For reproducible tests use `new GameState({ seed: 123 })`; `reset()` repeats that seed and `reset({ seed: 456 })` chooses another. Browser starts and restarts obtain a fresh seed with `crypto.getRandomValues`. `eventsEnabled: false` is used only for baseline tests. The RNG stores its numeric state so snapshots are reproducible.

Event tests cover all six effects, quiet years, one draw per year, clamping, response actions, reset, and post-game locking. A 20,000-draw frequency check verifies probabilities. Across 500 seeds, the watered wheat/beans/clover rotation wins all five-year campaigns; wheat monoculture loses even with compost. These are strategy checks rather than a guarantee for every possible player decision.

### Presentation and demo controls

The storybook presentation uses the cream, forest, grass, soil, terracotta, and warm-gold palette with system fonts and no external visual dependencies. Rounded beds include hover highlights, pulsing selection, stones, and grass. A shared procedural crop illustrator draws seeds, sprouts, mature plants, and sidebar icons. Spring flowers, summer sunlight, autumn leaves, and winter snow distinguish the seasons.

The first visit opens a short guide; **How to play** below the garden reopens it. Only the dismissed-guide preference is saved in local storage (when available); the game itself still resets on reload. The season strip explains the next action. Soil history and harvest arithmetic are expandable to reduce clutter. Buttons explain unavailable actions, and crop tips appear on pointer hover or keyboard focus.

Planting, compost, harvest rewards, crop sway, and season fades are presentation-only. Landscape rendering is cached per season; active canvas drawing is capped at 30 frames per second and pauses when the canvas is out of view, the tab is hidden, or a dialog is open. Reduced-motion settings remove ongoing sway, pulsing, drifting, and transitions. Tablet widths stack the garden above the controls; buttons have at least 44px targets.

Before a public demo, manually review desktop and tablet layouts in a connected browser, including the tutorial, all four seasons, crop tooltips, Heritage Book, and both ending screens. Browser visual QA is still unverified in this environment. Canvas smoke tests verify drawing calls and geometry, not the final appearance or browser layout.

### Heritage and education

Open **Heritage Book** above the garden for six short chapters on churches, communities, landscapes, soil, rotation, and compost. Each chapter links to its sources and separates general educational ideas from the fictional gameplay. **Credits / About** is the seventh page. Book navigation supports keyboard buttons, Close, and Escape; opening a modal prevents accidental farm actions.

Village Heritage begins at 0 and is capped at 100. A harvested rotation between different crop families awards 1 point. Each year-end awards 4 for average fertility of at least 60 and 4 for enough food to cover the annual meal. These are cumulative care points, not a real-world conservation assessment or UNESCO rating. They do not alter resources, crop rules, or endings. Repeated planting, invalid harvesting, opening the book, and compost clicks cannot farm extra points. Restart resets the score and contextual lesson.

The village notebook responds to successful rotations, repeated crop planting, compost applications, and annual landscape care. Its **Read the Heritage Book** button opens the relevant chapter. The occasional pest outbreak is a simplified yield event, not a biological pest simulation.

Original procedural details include tiled roofs, pale house façades, courtyard gates, stone courses, church enclosure towers, a village lane, and neighbors sharing a basket. These drawings evoke a fictional Saxon village; they are not an architectural reconstruction or copied artwork.

Heritage sources: [UNESCO property overview](https://whc.unesco.org/en/list/596/) and [ICOMOS evaluation](https://whc.unesco.org/document/285). Soil education draws on [FAO soil cover guidance](https://www.fao.org/conservation-agriculture/in-practice/soil-organic-cover/en/) and FAO’s *The importance of soil organic matter*, [organic matter](https://www.fao.org/4/a0100e/a0100e04.htm) and [management practices](https://www.fao.org/4/a0100e/a0100e07.htm). Sources checked on 17 October 2026. No historical claim is made that these precise farming mechanics were practiced in Viscri.

### Team acknowledgements

Edit the `CREDITS` array in `src/game/Heritage.js` to add team names, roles, playtesters, and external-resource acknowledgements; it is displayed in Credits / About. Include creator names, licenses, and links if new assets are added. Current credits disclose OpenAI Codex assistance with code, copy, procedural drawing code, and tests. There are no AI-generated image assets.

### Checks

The automated tests cover the farming lifecycle, rotation, moisture, soil tiers, annual compost limits, precise victory/defeat boundaries, single annual consumption, nonnegative storage, frozen end states, complete restart, heritage rewards and caps, educational triggers, and unchanged strategy outcomes. Run `npm test` and `npm run build`. Browser visual QA could not run because no browser connection was available.

Baseline five-year simulations in `tests/strategies.js` use the same rules as the game with special events disabled to isolate crop balance. All strategies water their plots; random planting uses reproducible seeds. Compost strategies spend available compost on the lowest-fertility plots each winter. Event-enabled campaigns are tested separately as described above.

| Strategy | Outcome | Years survived | Final fertility | Total food produced |
| --- | --- | ---: | ---: | ---: |
| Staggered wheat → beans → clover rotation | Victory | 5 | 82.75% | 129 |
| Same rotation, leaving four plots unplanted | Victory | 5 | 80.25% | 96 |
| Wheat monoculture | Soil defeat | 2 | 6.375% | 106 |
| Wheat monoculture with compost | Soil defeat | 2 | 16.125% | 116 |
| Potato monoculture | Soil defeat | 2 | 13.875% | 74 |
| Potato monoculture with compost | Soil defeat | 3 | 6.9375% | 95 |

Uniform random planting without compost loses in 88 of 100 seeded campaigns. Sensible rotation needs neither perfect planting nor compost to win, while compost can buy time for a struggling garden. Food reserves alone cannot compensate for soil collapse.

## Files

```text
index.html                  Accessible interface and canvas
package.json                Vite scripts and dependency
package-lock.json           Locked dependencies
.gitignore                  Generated-file exclusions
README.md                   Setup and gameplay guide
public/assets/.gitkeep      Reserved asset directory (no external artwork)
src/main.js                 Entry point
src/game/Game.js            Game coordinator
src/game/GameState.js       Central state
src/game/FarmGrid.js        Procedural village and clickable canvas grid
src/game/CropArt.js         Shared procedural illustrations for every crop stage
src/game/Crop.js            Crop definitions
src/game/Soil.js            Soil creation and limits
src/game/GameRules.js       Planting, compost, harvest, season rules
src/game/SeasonalEvents.js  Seeded yearly draws and bounded event effects
src/game/Heritage.js        Educational chapters, source links, and editable credits
src/ui/HeritageBook.js      Heritage meter, learning messages, and book dialog
src/ui/Tutorial.js          First-visit guide and replay control
src/ui/EventNotice.js       Illustrated summer event card
src/ui/UIManager.js         Sidebar and resource display
src/ui/Notifications.js     Bounded garden journal
src/styles/main.css        Responsive cream, wood, and earth-tone interface
src/styles/polish.css       Storybook palette, responsive controls, and motion styles
tests/rules.test.js         Core gameplay regression checks
tests/balance.test.js       Five-year balance, ending, and restart checks
tests/strategies.js         Reproducible strategy simulation helpers
tests/heritage.test.js      Heritage progression and educational-event checks
tests/rendering.test.js     Canvas smoke tests, seasonal caching, and plot hit targets
tests/events.test.js        Event effects, seeded probabilities, and campaign checks
```

All visuals are drawn in Canvas or CSS with simple geometry and system fonts. No AI-generated artwork, external images, game engine, or paid dependencies.
