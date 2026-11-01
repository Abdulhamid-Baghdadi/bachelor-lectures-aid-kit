# Architecture

Binds the design rules (UA-SMARTLab/design-rules) to this project's names. Built on the Signals and Systems Lab's
skeleton and the kit shared by every lab of the Bachelor lectures aid kit.

## Layers, bottom first

The kit (`../kit`) holds two layers: its pure core (complex numbers, units, the answer check) and the drawing kit. The
lab imports them by relative path, no build step; its own `style.css` is linked after `../kit/style.css` and adds only
its families' frame colours.

| Layer | Files | May use | Front door |
|---|---|---|---|
| kit-core | `../kit/core/**` (shared) | nothing | `../kit/core/index.js` |
| core | `src/core/**` | kit-core | `src/core/index.js` |
| kit | `../kit/ui/**` (shared) | kit-core | `../kit/ui/kit.js`, `../kit/ui/chart.js`, `../kit/ui/field.js`, `../kit/ui/art.js` |
| labs | `src/labs/**` | kit-core, core, kit | each lab's default export `{ id, art(), mount(element) }`; the list in `src/labs/index.js` |
| app | `src/app.js` | kit-core, core, kit, labs | the page, `index.html` |

The core is pure: no DOM, network, clock or randomness (`forbid` in `architecture.json`); the noise lab's samples
come from a seeded generator (`gaussian`), so the same seed gives the same trace. `semiconductors.js` holds the physics and the devices, in the script's units (cm⁻³, cm, F/cm, eV, A), with
the silicon data of the script's table (p. 73) as one object, `SI`; `circuits.js` holds the circuits, in SI units, and
the one seeded noise generator. The core names no lab.

## Data

`data/labs.json` (`"format": "semiconductors-lab labs"`, version 1): four parts grouped by idea, then each lab's words,
its `equations` (equation, what it is, its section, page and equation number in the script or the exercise collection,
or empty for a step derived here) and practice questions with a `compute` block that `src/core/practice.js` works out.
`bibliography.json` holds the subject sources, Strasser (2015), Hobler (2009), Zimmermann (2010) and
Schneider & Zimmermann (2005).

## Held by tests

- Layering, cycles, forbidden names: `../kit/scripts/check-architecture.js`, run on this lab by
  `tests/unit/architecture.test.js`.
- The laws: `tests/unit/core.test.js`, each against a second route (a transfer matrix against the Kronig–Penney
  equation, bisection on neutrality against the closed form, finite differences against the analytic profiles and the
  Shockley–Haynes pulse, a numerical derivative against the capacitance and the transconductances) or a value the
  script prints (UT = 25.85 mV, λ = 1107 nm at 1.12 eV, the body factor 0.84 V, 0.15 /K, 60 mV a decade).
- The circuits: `tests/unit/circuits.test.js`, against a numerical derivative, a nodal solution, a period
  integral, an RK4 simulation, seeded noise, or the values the script and the worked examples print.
- Practice answers: `tests/unit/labs-data.test.js`. Modules and data agree: `tests/unit/labs-modules.test.js`.
- Citations: `tests/unit/design-citations.test.js`. README pictures: `tests/unit/readme.test.js`.

Trusted to the agent: one idea per lab; sections, pages and equation numbers as read in the script on 1 Nov 2026.

## Where it departs from the rules

- No file format round-trip test: the app reads `labs.json` and never writes it.
- The dependency matrix is not drawn yet.

## README pictures

`node scripts/record-readme.mjs` with the repository served on port 8769 records `docs/drift-light.gif` and
`docs/drift-dark.gif`, and the stills `docs/light.png` (overview) and `docs/dark.png` (`#mosfet`).
