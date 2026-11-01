# Architecture

Binds the design rules (UA-SMARTLab/design-rules) to this project's names. Built from the Circuit Lab's skeleton
(Abdulhamid-Baghdadi/circuit-lab): same kit, page and checks.

## Layers, bottom first

| Layer | Files | May use | Front door |
|---|---|---|---|
| core | `src/core/**` | nothing | `src/core/index.js` |
| kit | `src/ui/**` | core | `src/ui/kit.js`, `src/ui/chart.js`, `src/ui/field.js`, `src/ui/art.js` |
| labs | `src/labs/**` | core, kit | each lab's default export `{ id, art(), mount(element) }`; the list in `src/labs/index.js` |
| app | `src/app.js` | core, kit, labs | the page, `index.html` |

The core is pure: no DOM, network, clock or randomness (`forbid` in `architecture.json`). The kit draws and knows no law;
its animation clock lives in `src/ui/field.js`. A lab holds one equation. The core names no lab.

## Data

`data/labs.json` (`"format": "electrodynamics-lab labs"`, version 1): the chapters of the notes (number, page range,
title from its table of contents), then each lab's words, its `equations` (equation, what it is, its number in the
notes or empty for a derived step) and practice questions with a `compute` block that `src/core/practice.js` works
out. `bibliography.json` holds the subject source, Prechtl (2010).

## Held by tests

- Layering, cycles, forbidden names: `scripts/check-architecture.js`, run by `tests/unit/architecture.test.js`.
- The laws: `tests/unit/core.test.js`, each against a second route (numerical integral against closed form, numerical
  derivative) or a hand calculation it names.
- Practice answers: `tests/unit/labs-data.test.js`. Modules and data agree: `tests/unit/labs-modules.test.js`.
- Citations: `tests/unit/design-citations.test.js`. README pictures: `tests/unit/readme.test.js`.

Trusted to the agent: one idea per lab; equation numbers matching the notes (checked against the PDF on 1 Nov 2026).

## Where it departs from the rules

- No file format round-trip test: the app reads `labs.json` and never writes it.
- The dependency matrix is not drawn yet.

## README pictures

`node scripts/record-readme.mjs` with the site served on port 8766 records `docs/gauss-light.gif` and
`docs/gauss-dark.gif`. `docs/light.png` (overview) and `docs/dark.png` (`#gauss`): headless Edge `--screenshot`,
`--blink-settings=preferredColorScheme=1` or `0`, `--virtual-time-budget=8000`, window 1280 × 1000.
