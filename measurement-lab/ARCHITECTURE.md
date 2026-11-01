# Architecture

Binds the design rules (UA-SMARTLab/design-rules) to this project's names. Built on the Telecommunications lab's
skeleton and the kit shared by every lab of the Bachelor lectures aid kit.

## Layers, bottom first

The kit (`../kit`) holds two layers: its pure core (complex numbers, units, the answer check) and the drawing kit. The
lab imports them by relative path, no build step; its own `style.css` is linked after `../kit/style.css` and adds its
families' frame colours, a third chart series and the button that draws new readings.

| Layer | Files | May use | Front door |
|---|---|---|---|
| kit-core | `../kit/core/**` (shared) | nothing | `../kit/core/index.js` |
| core | `src/core/**` | kit-core | `src/core/index.js` |
| vendor | `../kit/vendor/*.mjs` (shared) | nothing | Temml, `../kit/vendor/temml.mjs`; only `../kit/ui/math.js` imports it |
| kit | `../kit/ui/**` (shared) | kit-core, vendor | `../kit/ui/kit.js`, `../kit/ui/chart.js`, `../kit/ui/art.js`, `../kit/ui/math.js` |
| labs | `src/labs/**` | kit-core, core, kit | each lab's default export `{ id, art(), mount(element) }`; the list in `src/labs/index.js` |
| app | `src/app.js` | kit-core, core, kit, labs | the page, `index.html` |

The core is pure: no DOM, network, clock or `Math.random` (`forbid` in `architecture.json`). Its randomness comes from
one seeded generator, `uniform(seed)` in `maths.js`, with `gaussian` built on it, so the same seed gives the same
readings. `uncertainty.js` holds repeated readings, Student's table and the propagation laws (book chapter 1);
`meters.js` loading, range extension, the two U/I circuits, the waveform averages and the probe (chapters 2–3);
`bridge.js` the Wheatstone bridge (3.3, 3.11); `power.js` active power and the wattmeter (2.1.4); `seismic.js` the
seismic sensor (7.4); `digital.js` counters, the three converters and quantisation (chapters 5–6). The core names no
lab.

## Data

`data/labs.json` (`"format": "measurement-lab labs"`, version 1): three parts, then each lab's words, its `equations`
(equation, what it is, its equation number and printed page in the book or its task in the lab script, or empty for a
step derived here) and practice questions with a `compute` block that `src/core/practice.js` works out.
`bibliography.json` holds the subject sources, Schrüfer et al. (2012) and Schitter (2015).

## Held by tests

- Layering, cycles, forbidden names: `../kit/scripts/check-architecture.js`, run on this lab by
  `tests/unit/architecture.test.js`.
- The laws: `tests/unit/core.test.js`, each against a second route or a number printed in the book: Beispiel 1.3 and
  s/√N against 400 seeded series; Student's t by the coverage of seeded intervals; Beispiele 1.2 and 1.4, and Gauss's
  law against a seeded Monte Carlo of every model; Beispiele 2.1 and 2.2 and eq. 2.35; eqs. 3.1–3.2 correcting exactly;
  the sine's 0.637, 0.707, 1.41 and 1.11 by sampled averages; the probe's step answer against the node equation
  integrated by Runge–Kutta; the bridge's arrangements of Bild 3.9 and the loaded bridge against nodal analysis;
  Beispiel 3.2; U·I·cos φ against the mean of u·i; Table 5.8's counts digit for digit and the ±1 count over seeded gate
  phases; Table 6.1's thresholds; Bild 6.6 c's BCD result 0110 0101; the dual slope independent of R·C and the clock;
  Δu/√12 and 6.02n + 1.76 dB against quantised signals; eq. 7.114 against eq. 7.108 integrated.
- Practice answers: `tests/unit/labs-data.test.js`. Modules and data agree: `tests/unit/labs-modules.test.js`.
- Citations: `tests/unit/design-citations.test.js`. README pictures: `tests/unit/readme.test.js`.

Trusted to the agent: one idea per lab; equation numbers and pages as read in the book's text layer on 1 Nov 2026;
the steps marked "derived here" (the U/I crossover √(RA·RV), the counter crossover √(f0/T), the probe's time constant,
the wattmeter's error terms), each held by a test.

## Where it departs from the rules

- One library, Temml, typesets the equations: the exception to the plain-web rule, stated with why in
  `../kit/ARCHITECTURE.md`. An equation's optional `tex` (and the law's `lawTex`) is its LaTeX; without one the page
  shows the plain `eq` text. How to write it: `../kit/MATH.md`.
- No file format round-trip test: the app reads `labs.json` and never writes it.
- The dependency matrix is not drawn yet.

## README pictures

`node scripts/record-readme.mjs` with the repository served on port 8773 (or `LAB_URL` pointing elsewhere) records
`docs/bridge-light.gif` and `docs/bridge-dark.gif`, and the stills `docs/light.png` (overview) and `docs/dark.png`
(`#rms`).
