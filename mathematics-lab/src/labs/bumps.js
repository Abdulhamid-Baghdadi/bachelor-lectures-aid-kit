// Pointwise convergence that is not uniform, Taschner pp. 285–288: the bumps φ_n are zero outside |t| < 1/n and have
// integral 1. For every t ≠ 0 the values go to 0, yet the integrals stay 1: the limit and the integral do not commute.
import { bump } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";
import { fixed } from "./plane.js";

const TS = Array.from({ length: 1201 }, (_, k) => -1.2 + k * 2.4 / 1200);

export default {
  id: "bumps",
  art: () => a.picture("Three bumps of equal area, each narrower and taller than the one before",
    a.path("M20 140 C60 140 70 100 100 100 C130 100 140 140 180 140", a.DIM, 2) + a.path("M60 140 C80 140 85 60 100 60 C115 60 120 140 140 140", a.INK, 2) +
      a.path("M85 140 C93 140 95 15 100 15 C105 15 107 140 115 140", a.ACC, 3)),
  mount(root) {
    let n = 2, t = 0.3;
    const box = h("div", {}), rV = readout("φₙ(t) at the chosen t"), rI = readout("Integral of φₙ"), rM = readout("Height at t = 0");
    const update = () => {
      const ys = TS.map(u => bump(n, u)), dt = 2.4 / 1200, area = ys.reduce((s, y) => s + y * dt, 0);
      box.replaceChildren(lineChart({ label: `The bump φ${n}, of integral 1`,
        lines: [{ x: TS, y: TS.map(u => bump(1, u)), name: "φ₁", cls: "faint" }, { x: TS, y: ys, name: `φ${n}` }, { x: [t, t], y: [0, 10], name: "t", cls: "marker" }],
        xLabel: "Argument t [1]", yLabel: "Value φₙ(t) [1]", xMin: -1.2, xMax: 1.2, yMin: 0, yMax: 10, xFormat: v => v.toFixed(1) }));
      rV.set(fixed(bump(n, t), 4), "", Math.abs(t) >= 1 / n ? `zero for every n ≥ ${Math.ceil(1 / Math.abs(t) + 1e-9)}` : "not yet zero: raise n");
      rI.set(fixed(area, 4), "", "always 1, though the values go to 0"); rM.set(fixed(bump(n, 0), 3));
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Index n", unit: "", min: 1, max: 12, value: n, step: 1, format: v => String(v), onInput: v => { n = v; update(); } }),
      slider({ label: "Argument t", unit: "", min: -1, max: 1, value: t, step: 0.01, format: v => v.toFixed(2), onInput: v => { t = v; update(); } }),
      rV.el, rI.el, rM.el,
      h("p", { class: "hint" }, "Fix any t ≠ 0 and raise n: from some n on the bump has left t behind, so φₙ(t) → 0, pointwise. But how large n must be depends on t, so the convergence is not uniform, and the integral keeps its value 1 instead of tending to the integral of the limit, 0. The script's heights, φ₁(0) = 0.828, φ₂(0) = 2.605 and φ₄(0) = 9.424, are on p. 286."))));
    update();
  },
};
