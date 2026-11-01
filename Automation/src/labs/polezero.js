// The pole-zero diagram of section 3.10 with BIBO stability (Satz 3.8): G(s) = (1 − s/z)·(σ² + ω²)/((s − σ)² + ω²), a
// pole pair α ± Iβ and one real zero z, scaled to a static gain of 1. Damping and time constant of the pair by
// (3.166), (3.167); the step response shows what the positions mean.
import { step, roots, pairDamping, biboStable } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "polezero",
  art: () => a.picture("Two poles marked by crosses and a zero marked by a circle in the complex plane",
    a.line([[15, 75], [185, 75]], a.DIM, 2) + a.line([[130, 10], [130, 140]], a.DIM, 2) +
      a.line([[64, 29], [80, 45]], a.ACC, 3) + a.line([[64, 45], [80, 29]], a.ACC, 3) + a.line([[64, 105], [80, 121]], a.ACC, 3) + a.line([[64, 121], [80, 105]], a.ACC, 3) +
      a.circle(40, 75, 8, a.INK, 3)),
  mount(root) {
    let sigma = -2, omega = 1.5, z = -4;
    const pzBox = h("div", {}), stepBox = h("div", {});
    const rXi = readout("Damping ξ (3.166) and time constant T (3.167)"), rBibo = readout("BIBO stable (Satz 3.8)");
    const update = () => {
      const k = sigma ** 2 + omega ** 2, G = { num: [-k / z, k], den: [1, -2 * sigma, k] }, p = roots(G.den);
      pzBox.replaceChildren(lineChart({ label: "Pole-zero diagram: poles as crosses, the zero as a circle",
        lines: [], marks: [...p.map(([re, im]) => ({ x: re, y: im, shape: "x" })), { x: z, y: 0, shape: "o" }],
        xMin: -6, xMax: 2, yMin: -4, yMax: 4, xLabel: "Real part Re s [1/s]", yLabel: "Imaginary part Im s [1/s]", yFormat: v => v.toFixed(0) }));
      const stable = biboStable(p), r = step(G, 6, 400);
      stepBox.replaceChildren(lineChart({ label: "Step response of the transfer function with these poles and zero",
        lines: [{ x: r.t, y: r.y, name: "h(t)" }], xMin: 0, xMax: 6, yMin: -1, yMax: 2.5, xLabel: "Time t [s]", yLabel: "Step response h(t) [–]", xFormat: v => v.toFixed(0) }));
      const d = pairDamping(sigma, omega);
      rXi.set(`ξ = ${d.xi.toFixed(2)}, T = ${d.T.toFixed(2)} s`, "", "a ray through the origin has one ξ, a circle about it one T");
      rBibo.set(stable ? "Yes" : "No", stable ? "" : "danger", stable ? "every pole in the left half plane" : "a pole on or right of the imaginary axis: the output grows");
    };
    root.append(h("div", { class: "stage" }, h("div", {}, pzBox, stepBox), h("div", { class: "controls" },
      slider({ label: "Pole real part α", unit: "1/s", min: -5, max: 1, value: sigma, step: 0.1, format: v => v.toFixed(1), onInput: v => { sigma = v; update(); } }),
      slider({ label: "Pole imaginary part β", unit: "1/s", min: 0, max: 3.5, value: omega, step: 0.1, format: v => v.toFixed(1), onInput: v => { omega = v; update(); } }),
      slider({ label: "Zero z", unit: "1/s", min: -6, max: 2, value: z, step: 0.1, format: v => v.toFixed(1), onInput: v => { z = v || 0.1; update(); } }),
      rXi.el, rBibo.el,
      h("p", { class: "hint" }, "Poles further left settle faster; further from the real axis they ring faster. Push α past zero and the response runs away. Move the zero right of the origin and the step first dips the wrong way. The default pair −2 ± I1.5 is the one of the notes' (3.163): ξ = 0.8, T = 0.4 s."))));
    update();
  },
};
