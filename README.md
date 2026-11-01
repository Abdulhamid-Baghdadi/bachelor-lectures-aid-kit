# Electrodynamics Lab

Twenty-six key equations of electrodynamics and wave propagation to play with in the browser, from Maxwell's equations to transmission lines,
each with its full equation set and its number in the lecture notes of Prechtl (2010), *Vorlesungen über
Elektrodynamik*, TU Wien.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/gauss-dark.gif">
  <img src="docs/gauss-light.gif" alt="The Gauss's law lab: a dashed sphere slides over four charges and grows; the charge inside and the numerically integrated flux out agree at every step" width="720">
</picture>

## What is in it

| Chapter of the notes | Labs |
|---|---|
| 2 Properties of electromagnetic fields | Gauss's law, no magnetic charge, induction law, Ampère–Maxwell law, conservation of charge, material equations, Poynting vector, Lorentz force |
| 3 Static and stationary fields | point charge and potential, Laplace equation (solved on a grid), electric dipole, charge relaxation, Biot–Savart formula |
| 4 Induction | skin effect |
| 5 Electromagnetic waves | wave speed, plane wave, Hertz dipole, transmission line |
| Wave propagation, after Lasser (2012) | polarisation, plane wave in a lossy medium, reflection and refraction (Fresnel, Brewster), rectangular waveguide, microstrip line, Fresnel zones, link budget, radar equation |

The first four rows follow Prechtl (2010); the last follows the TU Wien wave propagation notes, *Wellenausbreitung*,
which treat the engineering side more exactly: complex permittivity, reflection by polarisation, waveguide modes, link
budgets in decibels.

Each lab has a field or chart to move, readouts worked by the physics core, a table of the equations behind it (integral
and local forms, jump conditions, derived steps marked as derived) and a practice question.

<img src="docs/light.png" alt="The overview in the light theme: chapter rows of cards, each card a line drawing of one equation's idea" width="640">
<img src="docs/dark.png" alt="The Gauss's law lab in the dark theme: field arrows of four charges, a dashed sphere, sliders and the equations table" width="640">

## Open it

Published at <https://abdulhamid-baghdadi.github.io/electrodynamics-lab/>. Locally, serve the folder and open
<http://127.0.0.1:8766/>:

```bash
python -m http.server 8766 --bind 127.0.0.1
```

Nothing is sent anywhere; the page keeps only your light or dark choice in the browser.

## How it is built

```mermaid
flowchart LR
  app["app: src/app.js, reads data/labs.json"] --> labs["labs: one equation each"]
  labs --> kit["kit: sliders, charts, field maps"]
  labs --> core["core: the laws, pure"]
  kit --> core
```

Plain JavaScript modules, no build step. Layers and their tests: [ARCHITECTURE.md](ARCHITECTURE.md). Tests:
`node --test "tests/unit/*.test.js"`.

## Limits

- A learning aid. Fields are drawn in a plane through 3D sources; grids are coarse (the Laplace lab solves 46 × 30 cells).
- Material values (permittivities, conductivities) are typical room-temperature figures, not from the notes.
- Equation numbers and page ranges refer to the 2010 edition of the notes; no text of the notes is reproduced.
- Practice answers for chapters 2 and 3 are worked by hand; the course's exercises for those chapters are symbolic
  derivations. Chapters 4 and 5 add nine numerical exercises from the course's exercise collection, the Aufgabensammlung of
  TU Wien from 2010, with their answers from its worked solutions.
