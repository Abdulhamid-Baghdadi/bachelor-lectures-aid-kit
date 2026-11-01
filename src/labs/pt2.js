// The second-order lag (P-T2 element) of section 3.8.2, G(s) = V/(1 + 2ξ(sT) + (sT)²) (3.137): its step response
// (3.138) between the envelopes of Aufgabe 3.34, and its poles (−ξ ± j√(1 − ξ²))/T.
import { pt2Step, pt2Poles, pt2Peak } from "../core/index.js";
import { h, slider, readout } from "../ui/kit.js";
import { lineChart } from "../ui/chart.js";
import * as a from "../ui/art.js";

export default {
  id: "pt2",
  art: () => a.picture("A step response overshooting and ringing down to its final value",
    a.line([[20, 130], [185, 130]], a.INK, 2) + a.line([[20, 130], [20, 15]], a.INK, 2) + a.line([[20, 60], [185, 60]], a.DIM, 2, "5 4") +
      a.path("M20 130 C40 0 60 20 75 70 C88 105 100 45 115 58 C128 68 140 55 185 60", a.ACC, 3)),
  mount(root) {
    let V = 5, T = 0.1, xi = 0.1;
    const chartBox = h("div", {}), poleBox = h("div", {});
    const rPeak = readout("Peak value V(1 + e^(−πξ/√(1 − ξ²)))"), rPole = readout("Poles s1,2");
    const update = () => {
      const tEnd = 40 * T, ts = Array.from({ length: 401 }, (_, k) => k * tEnd / 400), env = t => V / Math.sqrt(1 - xi * xi) * Math.exp(-xi * t / T);
      chartBox.replaceChildren(lineChart({ label: "Step response of the second-order lag between its envelopes",
        lines: [{ x: ts, y: ts.map(t => pt2Step(V, T, xi, t)), name: "h(t)" },
                { x: ts, y: ts.map(t => V + env(t)), name: "envelopes", cls: "faint" }, { x: ts, y: ts.map(t => V - env(t)), cls: "faint" }],
        xMin: 0, xMax: tEnd, yMin: 0, yMax: 2 * V, xLabel: "Time t [s]", yLabel: "Step response h(t) [–]", xFormat: v => v.toFixed(1) }));
      const p = pt2Poles(T, xi);
      poleBox.replaceChildren(lineChart({ label: "Poles of the second-order lag in the complex plane",
        lines: [], marks: p.map(([re, im]) => ({ x: re, y: im, shape: "x" })), xMin: -1.1 / T, xMax: 0.5 / T, yMin: -1.1 / T, yMax: 1.1 / T,
        xLabel: "Real part Re s [1/s]", yLabel: "Imaginary part Im s [1/s]", xFormat: v => v.toFixed(0), yFormat: v => v.toFixed(0) }));
      rPeak.set(pt2Peak(V, xi).toFixed(2), "", `overshoot ${(100 * (pt2Peak(V, xi) / V - 1)).toFixed(0)} % of V`);
      rPole.set(`${p[0][0].toFixed(2)} ± j${Math.abs(p[0][1]).toFixed(2)} 1/s`, "", "on a circle of radius 1/T; the angle grows as ξ falls");
    };
    root.append(h("div", { class: "stage" }, h("div", {}, chartBox, poleBox), h("div", { class: "controls" },
      slider({ label: "Gain V", unit: "", min: 1, max: 10, value: V, step: 0.5, format: v => v.toFixed(1), onInput: v => { V = v; update(); } }),
      slider({ label: "Time constant T", unit: "s", min: 0.02, max: 0.5, value: T, step: 0.01, onInput: v => { T = v; update(); } }),
      slider({ label: "Damping ξ (Dämpfungsgrad)", unit: "", min: 0.01, max: 0.95, value: xi, step: 0.01, format: v => v.toFixed(2), onInput: v => { xi = v; update(); } }),
      rPeak.el, rPole.el,
      h("p", { class: "hint" }, "Lower the damping and the poles swing towards the imaginary axis: the response rings longer and overshoots more, always inside the envelopes V(1 ± e^(−ξt/T)/√(1 − ξ²)). T only stretches time. The defaults are the notes' (3.140) with ξ = 0.1."))));
    update();
  },
};
