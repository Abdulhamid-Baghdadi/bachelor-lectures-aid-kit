# Architecture

Binds the design rules (UA-SMARTLab/design-rules) to this project's names. Built from the Electrodynamics Lab's skeleton
(Abdulhamid-Baghdadi/electrodynamics-lab): same kit, page and checks.

## Layers, bottom first

The kit (`../kit`, shared by every lab of the Bachelor lectures aid kit) holds two layers: its pure core (complex
numbers, units, the answer check) and the drawing kit. Each lab imports them by relative path, no build step; the
lab's own `style.css` is linked after `../kit/style.css` and adds only its families and drawings.

| Layer | Files | May use | Front door |
|---|---|---|---|
| kit-core | `../kit/core/**` (shared) | nothing | `../kit/core/index.js` |
| core | `src/core/**` | kit-core | `src/core/index.js` |
| vendor | `../kit/vendor/*.mjs` (shared) | nothing | Temml, `../kit/vendor/temml.mjs`; only `../kit/ui/math.js` imports it |
| kit | `../kit/ui/**` (shared) | kit-core, vendor | `../kit/ui/kit.js`, `../kit/ui/chart.js`, `../kit/ui/field.js`, `../kit/ui/art.js`, `../kit/ui/math.js` |
| labs | `src/labs/**` | kit-core, core, kit | each lab's default export `{ id, art(), mount(element) }`; the list in `src/labs/index.js` |
| app | `src/app.js` | kit-core, core, kit, labs | the page, `index.html` |

The core is pure: no DOM, network, clock or randomness (`forbid` in `architecture.json`). Inside it, `lti.js` holds the
shared numerics (polynomials and their roots, transfer functions, Bode data, matrices, the matrix exponential, a fixed
step Runge–Kutta integrator, Routh array, zero-order hold, Ackermann's formula); `systems.js` and `loops.js` the models
of the Automation course; `mechanics.js` and `heat.js` those of the Modelling course. Each keeps its own `LAWS` table
for practice answers, merged by `practice.js`; their keys are prefixed (`sys`, `loop`, `mech`, `heat`) so they never
clash. The kit draws and knows no law. A lab holds one idea. The core names no lab.

## Data

`data/labs.json` (`"format": "automation-lab labs"`, version 1): the two courses, the chapters of their notes (course,
number, page range, title from the table of contents), then each lab's words, its `equations` (equation, what it is,
its number in the notes or empty for a derived step) and practice questions with a `compute` block that
`src/core/practice.js` works out. `bibliography.json` holds the subject sources, Kugi (2015) and Kugi et al. (2015).

## Held by tests

- Layering, cycles, forbidden names: `../kit/scripts/check-architecture.js` (its own tests in `../kit/tests/`), run on
  this lab by `tests/unit/architecture.test.js`.
- The shared numerics: `tests/unit/lti.test.js`; each course part: `systems`, `loops`, `mechanics`, `heat` tests, each
  against a second route or a hand calculation it names.
- Practice answers: `tests/unit/labs-data.test.js`. Modules and data agree: `tests/unit/labs-modules.test.js`.
- Citations: `tests/unit/design-citations.test.js`. README pictures: `tests/unit/readme.test.js`.

Trusted to the agent: one idea per lab; equation numbers matching the notes (checked against the PDFs' text on
1 Nov 2026).

## Where it departs from the rules

- One library, Temml, typesets the equations: the exception to the plain-web rule, stated with why in
  `../kit/ARCHITECTURE.md`. An equation's optional `tex` (and the law's `lawTex`) is its LaTeX; without one the page
  shows the plain `eq` text. How to write it: `../kit/MATH.md`.
- No file format round-trip test: the app reads `labs.json` and never writes it.
- The dependency matrix is not drawn yet.
- `.citation-ignore` lists Kugi: the Modellbildung notes name only "A. Kugi et al.", so the citation check cannot
  match the co-authors; both sources are in `bibliography.json`.
