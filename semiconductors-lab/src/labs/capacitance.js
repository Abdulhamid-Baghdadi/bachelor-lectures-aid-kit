// Junction capacitance (Strasser 2015, section 5.2.2): the space-charge zone is a plate capacitor of width d, so
// Cs = εA/d = A √(ε e N0 / (2(UD − U))). Plotted as 1/Cs² against U it is a straight line: its slope gives the doping
// of the weaker side, its intercept the diffusion voltage.
import { junctionCap, builtIn, breakdown, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const NA = 1e19;

export default {
  id: "capacitance",
  art: () => a.picture("Two plates moving apart as the reverse voltage grows, the capacitance falling",
    a.line([[60, 30], [60, 120]], a.INK, 4) + a.line([[140, 30], [140, 120]], a.INK, 4) + a.arrow(100, 75, 135, 75, a.ACC, 2) + a.arrow(100, 75, 65, 75, a.ACC, 2) +
      a.path("M15 140 C40 60 100 50 185 45", a.COOL, 2)),
  mount(root) {
    let ND = 1e16, area = 1e-4;
    const box = h("div", {}), rC = readout("Capacitance at 0 V"), rU = readout("Diffusion voltage UD"), rB = readout("Breakdown estimate UB*");
    const update = () => {
      const UD = builtIn(NA, ND), Us = Array.from({ length: 201 }, (_, k) => -20 + k * (UD - 0.05 + 20) / 200);
      const C = Us.map(U => junctionCap(NA, ND, U) * area);
      box.replaceChildren(
        lineChart({ label: "Capacitance against bias", lines: [{ x: Us, y: C.map(c => c * 1e12), name: "Cs" }, { x: [UD, UD], y: [0, 1e3], cls: "marker" }],
          xLabel: "Bias U [V]", yLabel: "Capacitance Cs [pF]", yMin: 0, yMax: Math.max(...C) * 1.1e12, xFormat: v => v.toFixed(0) }),
        lineChart({ label: "The inverse square of the capacitance against bias, a straight line reaching zero at UD",
          lines: [{ x: Us, y: C.map(c => 1 / (c * 1e12) ** 2), name: "1/Cs²", cls: "second" }],
          xLabel: "Bias U [V]", yLabel: "Inverse square 1/Cs² [1/pF²]", yMin: 0, xFormat: v => v.toFixed(0) }));
      rC.set(si(junctionCap(NA, ND, 0) * area, "F")); rU.set(si(UD, "V"), "", "where 1/Cs² reaches zero");
      rB.set(si(breakdown(ND), "V"), "", "εEmax²/(2eN0), Emax = 300 kV/cm");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Donors ND (n side)", unit: "cm⁻³", min: 1e14, max: 1e18, value: ND, log: true, format: v => `${v.toExponential(1)} cm⁻³`, onInput: v => { ND = v; update(); } }),
      slider({ label: "Area A", unit: "mm²", min: 0.001, max: 1, value: 0.01, log: true, format: v => `${v} mm²`, onInput: v => { area = v * 1e-2; update(); } }),
      rC.el, rU.el, rB.el,
      h("p", { class: "hint" }, `A one-sided p⁺n diode, NA = ${NA.toExponential(0)} cm⁻³, silicon at 300 K. Lighter doping: smaller capacitance and a higher breakdown voltage, the trade of a varactor. The curve stops short of UD, where the depletion approximation no longer holds.`))));
    update();
  },
};
