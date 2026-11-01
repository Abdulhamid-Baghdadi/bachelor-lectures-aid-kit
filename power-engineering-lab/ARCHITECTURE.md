# Architecture

Binds the design rules (UA-SMARTLab/design-rules) to this project's names. Built on the Telecommunications lab's
skeleton and the kit shared by every lab of the Bachelor lectures aid kit.

## Layers, bottom first

The kit (`../kit`) holds two layers: its pure core (complex numbers, units, the answer check) and the drawing kit. The
lab imports them by relative path, no build step; its own `style.css` is linked after `../kit/style.css` and adds its
families' frame colours, the phasor plane's arrows and legend keys, and the equal-area shading.

| Layer | Files | May use | Front door |
|---|---|---|---|
| kit-core | `../kit/core/**` (shared) | nothing | `../kit/core/index.js` |
| core | `src/core/**` | kit-core | `src/core/index.js` |
| vendor | `../kit/vendor/*.mjs` (shared) | nothing | Temml, `../kit/vendor/temml.mjs`; only `../kit/ui/math.js` imports it |
| kit | `../kit/ui/**` (shared) | kit-core, vendor | `../kit/ui/kit.js`, `../kit/ui/chart.js`, `../kit/ui/field.js`, `../kit/ui/art.js`, `../kit/ui/math.js` |
| labs | `src/labs/**` | kit-core, core, kit | each lab's default export `{ id, art(), mount(element) }`; the list in `src/labs/index.js` |
| app | `src/app.js` | kit-core, core, kit, labs | the page, `index.html` |

The core is pure: no DOM, network, clock or `Math.random` (`forbid` in `architecture.json`), and needs no randomness
at all. `threephase.js` holds the rotation operator, star and delta, three-phase power and per-unit values (Gawlik,
chapter 3 and section 6.3.4); `network.js` the transformer, the homogeneous line and power over a reactance (chapter 4,
section 6.2); `faults.js` the short-circuit current, κ, the notes' example network and the equal areas (sections 6.3,
6.4); `machines.js` the space vector, the DC machine and the PMSM (Schrödl). The core names no lab.

`src/labs/plane.js` is not a lab: it draws the complex plane with equal scales, which the kit's line chart does not
keep, for the labs that show phasors and space vectors.

## Data

`data/labs.json` (`"format": "power-engineering-lab labs"`, version 1): four parts, then each lab's words, its
`equations` (equation, what it is, its equation number and page, or empty for a step derived here) and practice
questions with a `compute` block that `src/core/practice.js` works out. `bibliography.json` holds the subject sources:
Gawlik's notes and slides (2015), Schrödl (2012) and the students' exam collection (2017), each with how it was checked.

## Held by tests

- Layering, cycles, forbidden names: `../kit/scripts/check-architecture.js`, run on this lab by
  `tests/unit/architecture.test.js`.
- The laws: `tests/unit/core.test.js`, each against a second route: delta against the equivalent star; S summed over
  the phases against √3 U I; instantaneous power averaged numerically; the load-flow quadratic against fixed-point
  iteration on the phasors; the hyperbolic line against 2000 π sections; (6-29) against the ODE integrated by
  Runge–Kutta; the equal areas in closed form against Simpson's rule; the space vector against the field summed around
  the gap; the DC machine against its power balance; the PMSM's torque (P.4) against (P.8). And the numbers printed in
  the notes: the 380 kV line (Z_w, γ, 567 kV, 322.5 kV, 602 MW), the 30 kV fault (1.038 kA), table 6-3's κ, x″d, Z_T,
  the paralleled transformers, and the two machines exams.
- Practice answers: `tests/unit/labs-data.test.js`. Modules and data agree: `tests/unit/labs-modules.test.js`.
- Citations: `tests/unit/design-citations.test.js` (`.citation-ignore` skips the words of the exam collection's name).
  README pictures: `tests/unit/readme.test.js`.

Trusted to the agent: one idea per lab; equation numbers and pages as read on 1 Nov 2026, the notes in their text
layer and Schrödl in page images.

## Where it departs from the rules

- One library, Temml, typesets the equations: the exception to the plain-web rule, stated with why in
  `../kit/ARCHITECTURE.md`. An equation's optional `tex` (and the law's `lawTex`) is its LaTeX; without one the page
  shows the plain `eq` text. How to write it: `../kit/MATH.md`.
- No file format round-trip test: the app reads `labs.json` and never writes it.
- The dependency matrix is not drawn yet.

## README pictures

`node scripts/record-readme.mjs` with the repository served on port 8774 (or `LAB_URL` pointing elsewhere) records
`docs/stability-light.gif` and `docs/stability-dark.gif`, and the stills `docs/light.png` (overview) and
`docs/dark.png` (`#line`).
