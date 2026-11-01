# Architecture

Binds the design rules (UA-SMARTLab/design-rules) to this project's names. Built from the Signals and Systems Lab's
skeleton: same kit, page and checks.

## Layers, bottom first

The kit (`../kit`, shared by every lab of the Bachelor lectures aid kit) holds two layers: its pure core (complex
numbers, units, the answer check) and the drawing kit. Each lab imports them by relative path, no build step; the
lab's own `style.css` is linked after `../kit/style.css` and adds only its families and drawings.

| Layer | Files | May use | Front door |
|---|---|---|---|
| kit-core | `../kit/core/**` (shared) | nothing | `../kit/core/index.js` |
| core | `src/core/**` | kit-core | `src/core/index.js` |
| kit | `../kit/ui/**` (shared) | kit-core | `../kit/ui/kit.js`, `../kit/ui/chart.js`, `../kit/ui/field.js`, `../kit/ui/art.js` |
| labs | `src/labs/**` | kit-core, core, kit | each lab's default export `{ id, art(), mount(element) }`; the list in `src/labs/index.js` |
| app | `src/app.js` | kit-core, core, kit, labs | the page, `index.html` |

The core is pure: no DOM, network, clock or randomness (`forbid` in `architecture.json`). `relativity.js` holds the
Lorentz transformation, its consequences and the transformation of E and B, in SI. The kit draws and knows no law. A
lab holds one idea. The core names no lab.

## Data

`data/labs.json` (`"format": "relativity-lab labs"`, version 1): the sections of Einstein (1905) that the labs follow
(number, printed pages, a title in English after the section heading), then each lab's words, its `equations`
(equation, what it is, its page, or empty for a derived step) and practice questions with a `compute` block that
`src/core/practice.js` works out. `bibliography.json` holds Einstein (1905) and, for the cross-checks, Prechtl (2010).

## Held by tests

- Layering, cycles, forbidden names: `../kit/scripts/check-architecture.js`, run on this lab by
  `tests/unit/architecture.test.js`.
- The laws: `tests/unit/core.test.js`, each against a second route: the invariant interval, the inverse boost, two
  boosts against velocity addition, the Galilean limit, Prechtl (2010) (2.43) at low speed, Gauss's law by a numerical
  integral.
- Practice answers: `tests/unit/labs-data.test.js`. Modules and data agree: `tests/unit/labs-modules.test.js`.
- Citations: `tests/unit/design-citations.test.js`. README pictures: `tests/unit/readme.test.js`.

Trusted to the agent: one idea per lab; pages matching the scan (read on 1 Nov 2026).

## Where it departs from the rules

- No file format round-trip test: the app reads `labs.json` and never writes it.
- The dependency matrix is not drawn yet.
- Einstein's field equations are in Gaussian units; the SI form beside them is derived and marked so.

## README pictures

`node scripts/record-readme.mjs` with the site served on port 8772 records `docs/minkowski-light.gif` and
`docs/minkowski-dark.gif`. `docs/light.png` (overview) and `docs/dark.png` (`#movingcharge`): headless Edge
`--screenshot`, `--blink-settings=preferredColorScheme=1` or `0`, `--virtual-time-budget=8000`, window 1280 × 1000.
