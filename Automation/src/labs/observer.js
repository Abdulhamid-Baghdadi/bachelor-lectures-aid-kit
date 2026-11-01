// The full Luenberger observer (Kugi 2015, 8.3.2) and the separation principle (8.4): x̂ follows x through the error
// dynamics Φ + k̂cᵀ (8.65), k̂ from Ackermann's formula (8.66b); the controller fed by x̂ (8.73) keeps its own poles,
// and the loop's poles are the controller's and the observer's together (8.74).
import { loopDoubleIntegrator, loopStateGain, loopObserverGain, loopPairZ, loopRun, roots, charpoly, cAbs } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const Ta = 0.2, TE = 10, X0 = [1, 0], XH0 = [0, 0];

export default {
  id: "observer",
  art: () => a.picture("A true state curve and an estimate that starts wrong and quickly joins it",
    a.path("M 10 40 C 60 40, 90 120, 190 110", a.INK, 3) + a.path("M 10 130 C 30 90, 50 50, 70 62 S 120 112, 190 110", a.ACC, 3, "6 5")),
  mount(root) {
    let mode = "speed", f = 3;
    const chart = h("div", { class: "plot" });
    const gain = readout("Observer gain k̂ (8.66b)"), sep = readout("Poles of the whole loop (8.74)"), err = readout("Estimation error after 1 s");
    const update = () => {
      const P = loopDoubleIntegrator(Ta), kp = loopPairZ(1, 0.7, Ta), k = loopStateGain(P.Phi, P.Gamma, kp);
      const op = mode === "dead" ? [0, 0] : loopPairZ(f, 0.7, Ta), kh = loopObserverGain(P.Phi, P.c, op), N = Math.round(TE / Ta);
      const run = loopRun({ ...P, k, kh, x0: X0, xh0: XH0, N }), t = run.x.map((_, i) => i * Ta);
      chart.replaceChildren(lineChart({ lines: [{ x: t, y: run.x.map(x => x[0]), name: "true x₁" }, { x: t, y: run.xh.map(x => x[0]), name: "estimate x̂₁", cls: "second" },
        { x: t, y: run.x.map(x => x[1]), cls: "faint" }, { x: t, y: run.xh.map(x => x[1]), cls: "faint second" }],
        xMin: 0, xMax: TE, yMin: -1.5, yMax: 1.5, xLabel: "Time t [s]", yLabel: "State x [1]",
        label: "True and estimated position, faint lines the true and estimated speed, from a wrong first guess" }));
      gain.set(`(${kh.map(v => v.toFixed(3)).join(", ")})`);
      // The loop in (x, x̂): its characteristic polynomial, compared with the controller's and the observer's poles.
      const Kc = P.Gamma.map(gi => k.map(kj => gi * kj)), Hc = kh.map(hi => P.c.map(cj => hi * cj));
      const top = [0, 1].map(i => [P.Phi[i][0], P.Phi[i][1], Kc[i][0], Kc[i][1]]);
      const bottom = [0, 1].map(i => [-Hc[i][0], -Hc[i][1], P.Phi[i][0] + Kc[i][0] + Hc[i][0], P.Phi[i][1] + Kc[i][1] + Hc[i][1]]);
      const all = roots(charpoly([...top, ...bottom])).map(cAbs).sort((p, q) => p - q);
      const own = [...kp, ...(mode === "dead" ? [[0, 0], [0, 0]] : op)].map(p => cAbs(Array.isArray(p) ? p : [p, 0])).sort((p, q) => p - q);
      sep.set(`|z| = ${all.map(v => v.toFixed(3)).join(", ")}`, "", `controller and observer alone: ${own.map(v => v.toFixed(3)).join(", ")}`);
      const i1 = Math.round(1 / Ta), e = Math.hypot(run.xh[i1][0] - run.x[i1][0], run.xh[i1][1] - run.x[i1][1]);
      err.set(e.toFixed(3), "", mode === "dead" ? "zero after n = 2 steps (Aufgabe 8.8)" : "it started at 1");
    };
    root.append(h("div", { class: "stage" }, chart, h("div", { class: "controls" },
      choice("Observer poles", [["speed", "a pair f times faster than the controller's"], ["dead", "dead-beat, z = 0"]], mode, v => { mode = v; update(); }),
      slider({ label: "Observer speed f (ω0 of its pair)", unit: "rad/s", min: 0.5, max: 8, value: f, step: 0.1, onInput: v => { f = v; update(); }, format: v => `${v.toFixed(1)} rad/s` }),
      gain.el, sep.el, err.el,
      h("p", { class: "hint" }, "The plant is the double integrator (6.25) with Ta = 0.2 s, measured only in its position; the controller's poles are fixed at ω0 = 1 rad/s, ξ = 0.7. The observer starts at x̂ = 0 while x starts at (1, 0). A faster observer closes the gap sooner, and the loop's poles stay the controller's plus the observer's, whatever their speed (Satz 8.6)."))));
    update();
  },
};
