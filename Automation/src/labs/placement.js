// The state controller (Kugi 2015, 8.1): u_k = kᵀx_k + g·r_k (8.4) on the sampled double integrator (6.25); Ackermann's
// formula (8.18b) puts the poles of Φ + Γkᵀ where wanted, g (8.39) makes y_k → r. With every pole at 0 it is the
// dead-beat controller (Satz 8.3), which settles in at most n = 2 steps.
import { loopDoubleIntegrator, loopStateGain, loopPrefilter, loopPairZ, loopRun } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const TE = 10;

export default {
  id: "placement",
  art: () => a.picture("A staircase output settling onto its set point after a few steps, with feedback round the plant",
    a.line([[10, 120], [40, 120], [40, 60], [70, 60], [70, 50], [100, 50], [190, 50]], a.ACC, 3) + a.line([[10, 50], [190, 50]], a.DIM, 1) +
      a.rect(120, 85, 40, 26) + a.text(140, 103, "kᵀ", 15) + a.arrow(175, 98, 162, 98, a.INK, 2)),
  mount(root) {
    let mode = "poles", Ta = 0.5, w0 = 1, xi = 0.7;
    const chart = h("div", { class: "plot" });
    const gain = readout("Feedback kᵀ (8.18b) and prefilter g (8.39)"), zp = readout("Poles of Φ + Γkᵀ"), umax = readout("Largest input |u_k|");
    const update = () => {
      const P = loopDoubleIntegrator(Ta), poles = mode === "dead" ? [0, 0] : loopPairZ(w0, xi, Ta);
      const k = loopStateGain(P.Phi, P.Gamma, poles), g = loopPrefilter(P.Phi, P.Gamma, P.c, P.d, k), N = Math.round(TE / Ta);
      const run = loopRun({ ...P, k, g, x0: [0, 0], r: 1, N }), sx = [], sy = [];
      run.y.forEach((v, i) => { sx.push(i * Ta, (i + 1) * Ta); sy.push(v, v); });
      chart.replaceChildren(lineChart({ lines: [{ x: sx, y: sy, name: "output y_k" }, { x: [0, TE], y: [1, 1], name: "reference r", cls: "faint" }],
        marks: run.y.map((v, i) => ({ x: i * Ta, y: v, shape: "dot" })), xMin: 0, xMax: TE, yMin: 0, yMax: 1.6,
        xLabel: "Time t [s]", yLabel: "Output y [1]", label: "Output of the sampled double integrator under state feedback for a step reference" }));
      gain.set(`k = (${k.map(v => v.toFixed(3)).join(", ")}), g = ${g.toFixed(3)}`);
      zp.set(poles.map(p => Array.isArray(p) ? `${p[0].toFixed(3)}${p[1] ? ` ${p[1] < 0 ? "−" : "+"} ${Math.abs(p[1]).toFixed(3)}I` : ""}` : p.toFixed(1)).join(", "),
        "", mode === "dead" ? "both at z = 0: settled after 2 steps" : "z = e^{sTa} of the chosen s-plane pair");
      const um = Math.max(...run.u.map(Math.abs));
      umax.set(um.toFixed(2), um > 10 ? "warn" : "", mode === "dead" ? "the price of dead-beat grows as 1/Ta²" : "");
    };
    root.append(h("div", { class: "stage" }, chart, h("div", { class: "controls" },
      choice("Desired poles", [["poles", "a pair from the s-plane, z = e^{sTa}"], ["dead", "dead-beat, z = 0 (8.1.1)"]], mode, v => { mode = v; update(); }),
      slider({ label: "Sample time Ta", unit: "s", min: 0.1, max: 2, value: Ta, step: 0.05, onInput: v => { Ta = v; update(); }, format: v => `${v.toFixed(2)} s` }),
      slider({ label: "Natural frequency ω0 of the pair", unit: "rad/s", min: 0.3, max: 3, value: w0, step: 0.05, onInput: v => { w0 = v; update(); }, format: v => `${v.toFixed(2)} rad/s` }),
      slider({ label: "Damping ξ of the pair", unit: "", min: 0.3, max: 1, value: xi, step: 0.05, onInput: v => { xi = v; update(); }, format: v => v.toFixed(2) }),
      gain.el, zp.el, umax.el,
      h("p", { class: "hint" }, "The plant is the double integrator (6.21), sampled with a zero-order hold (6.25). Any poles can be placed because the system is completely reachable (Satz 8.2). Choose dead-beat and the output reaches r in two samples, whatever Ta, but a short Ta asks for a huge input."))));
    update();
  },
};
