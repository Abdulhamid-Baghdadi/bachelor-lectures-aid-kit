# Bachelor lectures aid kit

Interactive labs for TU Wien Bachelor lectures, each fusing two or three courses, where you move a slider and watch the
lecture notes' own equations work.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="Electromagnetism/docs/gauss-dark.gif">
  <img src="Electromagnetism/docs/gauss-light.gif" alt="The Gauss's law lab: a dashed sphere slides over four charges and grows; the charge inside and the numerically integrated flux out agree at every step" width="720">
</picture>

The main task in every lab, recorded from the Electrodynamics Lab: move a control, watch the field and the numbers agree.

| Light | Dark |
|---|---|
| <img src="docs/light.png" alt="The start page in the light theme: four lab panels, Electrodynamics, Automation, Signals and systems, and Semiconductors, devices and circuits, each with its courses and a screenshot" width="420"> | <img src="docs/dark.png" alt="The start page in the dark theme: the same four lab panels" width="420"> |

## The labs

| Lab | Fuses | After |
|---|---|---|
| [Electrodynamics](Electromagnetism/README.md) | Elektrodynamik, Wellenausbreitung | Prechtl (2010); Lasser (2012) |
| [Automation](Automation/README.md) | Automatisierung, Modellbildung | Kugi (2015); Kugi et al. (2015) |
| [Signals and systems](signals-systems-lab/README.md) | Signale und Systeme 1, 2 | Prechtl (2010); Doblinger (2015) |
| [Semiconductors, devices and circuits](semiconductors-lab/README.md) | Halbleiterphysik, Elektronische Bauelemente, Schaltungstechnik | Strasser (2015); Hobler (2009); Zimmermann (2010) |
| [Special relativity](relativity-lab/README.md) | Relativitätstheorie | Einstein (1905) |
| [Telecommunications](telecommunications-lab/README.md) | Telekommunikation | Goiser (2016) |
| [Power engineering](power-engineering-lab/README.md) | Energieversorgung, Maschinen und Antriebe | Gawlik (2015); Schrödl (2012) |
| [Measurement](measurement-lab/README.md) | Messtechnik, Messtechnik-Labor | Schrüfer et al. (2012); Schitter (2015) |

## How to open it

Serve the folder and open the start page, for example:

```bash
python -m http.server 8771 --bind 127.0.0.1
```

then <http://127.0.0.1:8771/>. The labs are ES modules, so opening `index.html` straight from the disk does not work.
Tests, per folder: `node --test` in `kit`, `Electromagnetism`, `Automation`, `signals-systems-lab`, `semiconductors-lab`, `telecommunications-lab`, `power-engineering-lab` and `measurement-lab`.

## Where your data stays

Everything runs in your browser. Nothing is sent anywhere; the only thing kept is your light or dark choice, in the
browser's local storage.

## Parts

```mermaid
flowchart BT
  kc["kit/core: complex numbers, units, answer check (pure)"]
  ku["kit/ui and kit/style.css: controls, charts, field maps, cards"]
  ec["Electromagnetism/src/core: the laws"]
  ac["Automation/src/core: LTI numerics and models"]
  sc["signals-systems-lab/src/core: signals, transforms, filters"]
  hc["semiconductors-lab/src/core: bands, carriers, devices, circuits"]
  tc["telecommunications-lab/src/core: coding, modulation, detection, noise"]
  pc["power-engineering-lab/src/core: three phases, lines, faults, machines"]
  mc["measurement-lab/src/core: uncertainty, meters, bridges, counters, converters"]
  el["Electrodynamics labs and page"]
  al["Automation labs and page"]
  sl["Signals and systems labs and page"]
  hl["Semiconductors, devices and circuits labs and page"]
  tl["Telecommunications labs and page"]
  pl["Power engineering labs and page"]
  ml["Measurement labs and page"]
  start["index.html: start page"]
  ku --> kc
  ec --> kc
  ac --> kc
  sc --> kc
  hc --> kc
  el --> ec
  el --> ku
  al --> ac
  al --> ku
  sl --> sc
  sl --> ku
  hl --> hc
  hl --> ku
  tl --> tc
  tl --> ku
  tc --> kc
  pl --> pc
  pl --> ku
  pc --> kc
  ml --> mc
  ml --> ku
  mc --> kc
  start -. links .-> el
  start -. links .-> al
  start -. links .-> sl
  start -. links .-> hl
  start -. links .-> tl
  start -. links .-> pl
  start -. links .-> ml
```

Arrows point from a part to what it uses. The kit is shared once; each lab imports it by relative path (`../kit/...`),
with no build step. `kit/scripts/check-architecture.js` holds each lab to these layers (its `architecture.json`).

## Limits

- A learning aid: ideal models, typical material values, numerical methods on coarse grids. Equation numbers refer to
  the lecture notes; no text of them is reproduced.
- Each lab still has its own tests and its own `package.json`; there is no single test command at the root yet.
- The README pictures are recorded per lab; the start page's screenshots by headless Edge
  (`--blink-settings=preferredColorScheme=1` or `0`, window 1280 × 900).
