// Stationary heat flow through a layered plane wall with convection on both sides (Kugi et al. 2015, section 3.4.1):
// the resistances 1/α0, Li/λi, 1/αL add up (3.84), and the same flux q drops the temperature over each (3.82).
// The layers are the notes' own window, Beispiel 3.2: single or double glazing.
import { heatWallProfile, si } from "../core/index.js";
import { h, slider, readout, choice } from "../ui/kit.js";
import { lineChart } from "../ui/chart.js";
import * as a from "../ui/art.js";

const GLASS = { L: 0.004, lambda: 1 }; // typical float glass, 4 mm, λ ≈ 1 W/(m K)

export default {
  id: "wall",
  art: () => a.picture("A double-glazed window with the temperature falling in steps from warm room to cold outside",
    a.rect(70, 20, 10, 110, a.INK, 2) + a.rect(120, 20, 10, 110, a.INK, 2) +
      a.line([[20, 35], [65, 45], [75, 48], [125, 102], [135, 105], [185, 115]], a.ACC, 3) +
      a.text(30, 140, "in", 14, a.HOT) + a.text(170, 140, "out", 14, a.COOL)),
  mount(root) {
    let TI = 20, TA = -5, aI = 8, aA = 20, D = 0.012, pane = "double";
    const chartBox = h("div", {});
    const rK = readout("Heat transfer coefficient k"), rQ = readout("Heat flux q");
    const update = () => {
      const layers = pane === "double" ? [GLASS, { L: D, lambda: 0.025 }, GLASS] : [GLASS];
      const { q, k, x, T } = heatWallProfile(TI, TA, aI, layers, aA);
      const W = x.at(-1), pad = 0.01, mm = v => v * 1000;
      // The film on each side is drawn as a short drop just outside the wall, where the fluid meets it.
      const xs = [-pad, 0, ...x.slice(1), W + pad].map(mm), ys = [TI, ...T, TA];
      const faces = x.map((xi, i) => ({ x: mm(xi), y: T[i], shape: "dot" }));
      chartBox.replaceChildren(lineChart({ label: "Temperature across the window from room to outside air",
        lines: [{ x: xs, y: ys, name: "temperature" }], marks: faces,
        xLabel: "Position x [mm]", yLabel: "Temperature T [°C]", yMin: Math.min(TA, 0) - 5, yMax: TI + 5 }));
      rK.set(si(k, "W/(m²K)")); rQ.set(si(q, "W/m²"), "", `the same through every layer; ${si(q * 1.5, "W")} through a 1.5 m² window`);
    };
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      choice("Window", [["single", "Single glazing"], ["double", "Double glazing"]], pane, v => { pane = v; update(); }),
      slider({ label: "Room temperature TI", unit: "°C", min: 10, max: 30, value: TI, step: 1, format: v => `${v} °C`, onInput: v => { TI = v; update(); } }),
      slider({ label: "Outside temperature TA", unit: "°C", min: -20, max: 10, value: TA, step: 1, format: v => `${v} °C`, onInput: v => { TA = v; update(); } }),
      slider({ label: "Inner heat transfer coefficient αI", unit: "W/(m²K)", min: 2, max: 30, value: aI, step: 1, onInput: v => { aI = v; update(); } }),
      slider({ label: "Outer heat transfer coefficient αA", unit: "W/(m²K)", min: 5, max: 100, value: aA, step: 1, onInput: v => { aA = v; update(); } }),
      slider({ label: "Gap between the panes D", unit: "m", min: 0.004, max: 0.02, value: D, step: 0.001, onInput: v => { D = v; update(); } }),
      rK.el, rQ.el,
      h("p", { class: "hint" }, "Each step in the line is one thermal resistance: the steeper or longer the drop, the larger that resistance. In single glazing almost all the drop sits in the two air films, not in the glass. The still air in the gap of double glazing takes most of it, and k falls to about a quarter. Gap air is taken as still conduction only, λ = 0.025 W/(m K); glass λ = 1 W/(m K); typical values."))));
    update();
  },
};
