# Architecture

Binds the design rules (UA-SMARTLab/design-rules) to this project's names. Built from the Vector Calculus Lab's
skeleton: same kit, page and checks.

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

The core is pure: no DOM, network, clock or randomness (`forbid` in `architecture.json`). `maths.js` holds the
script's procedures (Babylonian and Newton steps, complex products, sums, the bumps, Cramer, eigenvectors, contour
integrals). `src/labs/plane.js` is the drawing several labs share, not a lab. The kit draws and knows no law. A
lab holds one idea. The core names no lab.

## Data

`data/labs.json` (`"format": "mathematics-lab labs"`, version 1): the four parts of Taschner (2013) that the labs follow
(number, printed pages, a title in English with the German heading), then each lab's words, its `equations`
(equation, what it is, its page, or empty for a derived step) and practice questions with a `compute` block that
`src/core/practice.js` works out. `bibliography.json` holds Taschner (2013).

## Held by tests

- Layering, cycles, forbidden names: `../kit/scripts/check-architecture.js`, run on this lab by
  `tests/unit/architecture.test.js`.
- The laws: `tests/unit/core.test.js`, against the script's own worked values: 721/228 (p. 2), 91/72 (p. 308), the
  bump heights 0.828, 2.605, 9.424 (p. 286); elsewhere values worked by hand.
- Practice answers: `tests/unit/labs-data.test.js`. Modules and data agree: `tests/unit/labs-modules.test.js`.
- Citations: `tests/unit/design-citations.test.js`. README pictures: `tests/unit/readme.test.js`.

Trusted to the agent: one idea per lab; pages matching the script (read from the rendered pages on 2 Nov 2026).

## Where it departs from the rules

- One library, Temml, typesets the equations: the exception to the plain-web rule, stated with why in
  `../kit/ARCHITECTURE.md`. An equation's optional `tex` (and the law's `lawTex`) is its LaTeX; without one the page
  shows the plain `eq` text. How to write it: `../kit/MATH.md`.
- No file format round-trip test: the app reads `labs.json` and never writes it.
- The dependency matrix is not drawn yet.
- The script is undated: its year is the PDF's creation date.

## README pictures

`node scripts/record-readme.mjs` with the site served on port 8776 records `docs/newton-light.gif` and
`docs/newton-dark.gif`. `docs/light.png` (overview) and `docs/dark.png` (`#eigen`): headless Edge
`--screenshot`, `--blink-settings=preferredColorScheme=1` or `0`, `--virtual-time-budget=8000`, window 1280 × 1000.
