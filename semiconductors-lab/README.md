# Semiconductors Lab

Eleven ideas of semiconductor physics and devices to play with in the browser, from energy bands to the MOSFET, after
Strasser (2015), *Skriptum Halbleiterphysik*, and the exercise collection of Hobler (2009), *Elektronische
Bauelemente*, the texts of two TU Wien courses.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/drift-dark.gif">
  <img src="docs/drift-light.gif" alt="The drift and diffusion lab: a pulse of injected holes drifts along the bar, spreads and shrinks, while the readouts give its position, width and the share of holes left" width="720">
</picture>

## What is in it

| Part | Labs |
|---|---|
| 1 Bands and carriers | energy bands from coupled wells (Kronig–Penney), Fermi–Dirac occupation, carrier density and the Fermi level against temperature and doping |
| 2 Transport and light | drift and diffusion (the Shockley–Haynes pulse), generation, recombination and lifetime, optical absorption and gain at the band gap |
| 3 Junctions and transistors | the pn junction's space-charge zone, junction capacitance, the diode characteristic, the bipolar transistor's output characteristics, the MOSFET's threshold and output characteristics |

Each lab has charts to move, readouts worked by the core, a table of the equations behind it with their section, page
and equation number in the script, and practice questions from the two courses' exercise sheets. Silicon at 300 K
unless a lab says otherwise, with the data of the script's table (p. 73).

<img src="docs/light.png" alt="The overview in the light theme: three parts in rows, each lab a card with a line drawing of its idea" width="640">
<img src="docs/dark.png" alt="The MOSFET lab in the dark theme: a family of output characteristics, the pinch-off parabola, and the threshold worked out from doping and oxide" width="640">

## Open it

Published at <https://abdulhamid-baghdadi.github.io/bachelor-lectures-aid-kit/semiconductors-lab/> once released.
Locally, serve the repository's root (the lab uses `../kit`) and open <http://127.0.0.1:8769/semiconductors-lab/>:

```bash
python -m http.server 8769 --bind 127.0.0.1 --directory ..
```

Nothing is sent anywhere; the page keeps only your light or dark choice in the browser.

## How it is built

```mermaid
flowchart LR
  app["app: src/app.js, reads data/labs.json"] --> labs["labs: one idea each"]
  labs --> kit["kit: sliders, charts"]
  labs --> core["core: the laws, pure"]
  kit --> core
```

Plain JavaScript modules, no build step. Layers and their tests: [ARCHITECTURE.md](ARCHITECTURE.md). Tests:
`node --test "tests/unit/*.test.js"`.

## Limits

- A learning aid. All dopants are ionised (no freeze-out), the band gap is held at its 300 K value, junctions use the
  depletion approximation, and the diode's breakdown is only marked, not drawn.
- The Early effect and channel-length modulation are left out, so the transistors' output curves are flat.
- Absorption is relative (the script gives no cross-section) and drawn for direct GaAs only.
- Most practice answers are worked by hand from the script; two agree with the Bauelemente course's scanned worked
  solutions. The Halbleiterphysik solutions are scans not read here.
