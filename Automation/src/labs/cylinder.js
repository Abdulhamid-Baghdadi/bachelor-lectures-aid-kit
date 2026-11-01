// Stationary heat flow out of a layered pipe (Kugi et al. 2015, section 3.4.2): the heat flow per unit length
// q′ = 2π(TF − T∞)/(1/(r0α0) + Σ ln(ri/ri−1)/λi + 1/(rNαN)) (3.93). A thin pipe or cable gains outer surface as it
// is insulated, so up to the critical radius rc = λ/α more insulation loses more heat (derived from (3.93)).
import { heatPipeLoss, heatCriticalRadius, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "cylinder",
  art: () => a.picture("A pipe in a ring of insulation with heat arrows leaving its outer surface",
    a.circle(100, 75, 18, a.INK, 3) + a.circle(100, 75, 45, a.DIM, 2) +
      [0, 1, 2, 3, 4, 5].map(k => { const t = k * Math.PI / 3, c = Math.cos(t), s = Math.sin(t);
        return a.arrow(100 + 50 * c, 75 + 50 * s, 100 + 68 * c, 75 + 68 * s, a.HOT, 2, 6); }).join("")),
  mount(root) {
    let r0 = 0.002, lambda = 0.2, alpha = 10, rN = 0.006, TF = 60, Tinf = 20;
    const chartBox = h("div", {});
    const rQ = readout("Heat loss per metre q′"), rC = readout("Critical insulation radius rc = λ/α");
    const update = () => {
      // The inner side is held at TF (α0 very large): a hot wire or a thin pipe full of hot fluid.
      const loss = r => heatPipeLoss(TF, Tinf, [r0, r], [lambda], 1e9, alpha);
      const rc = heatCriticalRadius(lambda, alpha), top = Math.max(0.05, 2.5 * rc);
      const rs = Array.from({ length: 121 }, (_, k) => r0 + k * (top - r0) / 120);
      chartBox.replaceChildren(lineChart({ label: "Heat loss per metre against the outer radius of the insulation",
        lines: [{ x: rs.map(r => r * 1000), y: rs.map(loss), name: "with insulation" },
                { x: [r0 * 1000, top * 1000], y: [loss(r0), loss(r0)], name: "bare", cls: "faint" }],
        marks: [{ x: rN * 1000, y: loss(rN), shape: "dot", name: "now" }, ...(rc > r0 ? [{ x: rc * 1000, y: loss(rc), shape: "o", name: "critical radius", cls: "second" }] : [])],
        xLabel: "Outer radius rN [mm]", yLabel: "Heat loss per metre q′ [W/m]", yMin: 0, xFormat: v => v.toFixed(0), yFormat: v => v.toFixed(1) }));
      rQ.set(si(loss(rN), "W/m"), loss(rN) > loss(r0) ? "warn" : "", loss(rN) > loss(r0) ? "more than the bare pipe" : "less than the bare pipe");
      rC.set(si(rc, "m"), "", rc > r0 ? "insulation thinner than this adds loss" : "smaller than the pipe: every layer helps");
    };
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      slider({ label: "Outer insulation radius rN", unit: "m", min: r0, max: 0.05, value: rN, step: 0.0005, onInput: v => { rN = v; update(); } }),
      slider({ label: "Pipe radius r0", unit: "m", min: 0.001, max: 0.03, value: r0, step: 0.0005, onInput: v => { r0 = v; rN = Math.max(rN, v); update(); } }),
      slider({ label: "Insulation conductivity λ", unit: "W/(m K)", min: 0.02, max: 1, value: lambda, log: true, onInput: v => { lambda = v; update(); } }),
      slider({ label: "Outer heat transfer coefficient α", unit: "W/(m²K)", min: 2, max: 50, value: alpha, step: 1, onInput: v => { alpha = v; update(); } }),
      rQ.el, rC.el,
      h("p", { class: "hint" }, "Insulation adds the resistance ln(rN/r0)/λ but shrinks the film resistance 1/(rNα), because the outer surface grows. For a thin cable sheath (PVC, λ ≈ 0.2 W/(m K), typical) the second wins at first: the loss rises to a peak at rc = λ/α before it falls. Pick foam (λ ≈ 0.04 W/(m K)) or a thick pipe and rc lies inside the pipe, so every layer helps. Fluid inside held at 60 °C, air at 20 °C."))));
    update();
  },
};
