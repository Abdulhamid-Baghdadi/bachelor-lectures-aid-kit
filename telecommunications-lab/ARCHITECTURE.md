# Architecture

Binds the design rules (UA-SMARTLab/design-rules) to this project's names. Built on the Semiconductors lab's skeleton
and the kit shared by every lab of the Bachelor lectures aid kit.

## Layers, bottom first

The kit (`../kit`) holds two layers: its pure core (complex numbers, units, the answer check) and the drawing kit. The
lab imports them by relative path, no build step; its own `style.css` is linked after `../kit/style.css` and adds its
families' frame colours, the eye's traces, the constellation's cloud and the Hamming lab's bit buttons.

| Layer | Files | May use | Front door |
|---|---|---|---|
| kit-core | `../kit/core/**` (shared) | nothing | `../kit/core/index.js` |
| core | `src/core/**` | kit-core | `src/core/index.js` |
| vendor | `../kit/vendor/*.mjs` (shared) | nothing | Temml, `../kit/vendor/temml.mjs`; only `../kit/ui/math.js` imports it |
| kit | `../kit/ui/**` (shared) | kit-core, vendor | `../kit/ui/kit.js`, `../kit/ui/chart.js`, `../kit/ui/field.js`, `../kit/ui/art.js`, `../kit/ui/math.js` |
| labs | `src/labs/**` | kit-core, core, kit | each lab's default export `{ id, art(), mount(element) }`; the list in `src/labs/index.js` |
| app | `src/app.js` | kit-core, core, kit, labs | the page, `index.html` |

The core is pure: no DOM, network, clock or `Math.random` (`forbid` in `architecture.json`). Its randomness comes from
one seeded generator, `uniform(seed)` in `maths.js`, with `gaussian` and `bits` built on it, so the same seed gives the
same noise. `maths.js` holds erfc, Q, the DFT and that generator; `baseband.js` PCM, line codes, the raised cosine and
binary detection (sets 2–4); `coding.js` entropy, Huffman, the repetition and Hamming codes (sets 5–6); `carrier.js`
constellations, synchronisation errors and receiver noise (sets 7–8 and the two sets numbered 99). The core names no lab.

## Data

`data/labs.json` (`"format": "telecommunications-lab labs"`, version 1): five parts, then each lab's words, its
`equations` (equation, what it is, its lecture set and printed slide number, or empty for a step derived here) and
practice questions with a `compute` block that `src/core/practice.js` works out. `bibliography.json` holds the subject
sources, Goiser (2016) and the course formulary of March 2017.

## Held by tests

- Layering, cycles, forbidden names: `../kit/scripts/check-architecture.js`, run on this lab by
  `tests/unit/architecture.test.js`.
- The laws: `tests/unit/core.test.js`, each against a second route: erfc against the Gaussian tail integrated; the
  SNQR measured on a quantised sine; PCM's output SNR summed bit by bit; line-code spectra against an averaged
  periodogram; bit, symbol and synchronisation error rates against seeded counts; the matched filter's 2E/N0 against a
  seeded correlator; the raised cosine's zeros and its sinc limit; Huffman, the repetition code and Hamming against the
  slides' worked examples; Friis against the cascade of noise temperatures and the slides' receiver (F = 3.5 dB,
  −49 dBm).
- Practice answers: `tests/unit/labs-data.test.js`. Modules and data agree: `tests/unit/labs-modules.test.js`.
- Citations: `tests/unit/design-citations.test.js`. README pictures: `tests/unit/readme.test.js`.

Trusted to the agent: one idea per lab; slide numbers as read in the slides' text layer on 1 Nov 2026; the readings of
garbled formulas, each backed by a seeded simulation.

## Where it departs from the rules

- One library, Temml, typesets the equations: the exception to the plain-web rule, stated with why in
  `../kit/ARCHITECTURE.md`. An equation's optional `tex` (and the law's `lawTex`) is its LaTeX; without one the page
  shows the plain `eq` text. How to write it: `../kit/MATH.md`.
- No file format round-trip test: the app reads `labs.json` and never writes it.
- The dependency matrix is not drawn yet.

## README pictures

`node scripts/record-readme.mjs` with the repository served on port 8772 (or `LAB_URL` pointing elsewhere) records
`docs/eye-light.gif` and `docs/eye-dark.gif`, and the stills `docs/light.png` (overview) and `docs/dark.png`
(`#constellation`).
