// The loop with one degree of freedom (Kugi 2015, 4.3.1): y = Tr,y·r + Td,y·d with Gd = 1 (4.20); the sensitivity
// S = Td,y (4.23) sets how much of a disturbance is left, and the steady-state error follows table (5.10).
import { series, closeLoop, sensitivity, response, loopSteadyError, freq, cAbs } from "../core/index.js";
import { h, slider, readout, choice } from "../ui/kit.js";
import { lineChart } from "../ui/chart.js";
import * as a from "../ui/art.js";

const G = { num: [1], den: [1, 2, 1] }, TE = 20, TD = 10;

export default {
  id: "loop1dof",
  art: () => a.picture("A control loop: controller, plant and a disturbance added at the output",
    a.circle(30, 75, 8) + a.arrow(4, 75, 22, 75) + a.arrow(38, 75, 56, 75) + a.rect(56, 60, 36, 30) + a.text(74, 80, "R") +
      a.arrow(92, 75, 112, 75) + a.rect(112, 60, 36, 30) + a.text(130, 80, "G") + a.arrow(148, 75, 196, 75) +
      a.arrow(170, 30, 170, 70, a.HOT) + a.text(182, 30, "d", 16, a.HOT) + a.line([[184, 75], [184, 120], [30, 120], [30, 83]], a.ACC, 2)),
  mount(root) {
    let kind = "P", V = 4, d = 0.5;
    const chart = h("div", { class: "plot" });
    const before = readout("Error before the disturbance, e = r − y"), after = readout("Error after the disturbance step");
    const sens = readout("Sensitivity at zero frequency |S(0)|");
    const update = () => {
      const R = kind === "P" ? { num: [V], den: [1] } : { num: [V, V], den: [1, 0] };
      const L = series(R, G), T = closeLoop(L), S = sensitivity(L);
      const yr = response(T, () => 1, TE, 400), yd = response(S, t => (t >= TD ? d : 0), TE, 400);
      const y = yr.y.map((v, k) => v + yd.y[k]);
      chart.replaceChildren(lineChart({ lines: [{ x: yr.t, y, name: "output y" }, { x: [0, TE], y: [1, 1], name: "reference r", cls: "faint" }],
        xLabel: "Time t [s]", yLabel: "Output y [1]", yMin: 0, yMax: 1.6, label: "Output of the loop for a reference step at 0 s and a disturbance step at 10 s" }));
      const k = yr.t.findIndex(t => t >= TD) - 1, S0 = cAbs(freq(S, 1e-9));
      before.set((1 - y[k]).toFixed(3), "", `table (5.10) gives ${loopSteadyError(L).toFixed(3)}`);
      after.set((1 - y.at(-1)).toFixed(3), "", `S(0)·(r − d) = ${(S0 * (1 - d)).toFixed(3)}`);
      sens.set(S0.toFixed(3), "", kind === "P" ? "1/(1 + V): never zero with a P controller" : "zero: the integrator removes any constant disturbance");
    };
    root.append(h("div", { class: "stage" }, chart, h("div", { class: "controls" },
      choice("Controller R(s)", [["P", "P: R = V"], ["PI", "PI: R = V(1 + s)/s"]], kind, v => { kind = v; update(); }),
      slider({ label: "Controller gain V", unit: "", min: 0.2, max: 20, value: V, log: true, onInput: v => { V = v; update(); }, format: v => v.toFixed(2) }),
      slider({ label: "Disturbance step d at the output", unit: "", min: -1, max: 1, value: d, step: 0.05, onInput: v => { d = v; update(); }, format: v => v.toFixed(2) }),
      before.el, after.el, sens.el,
      h("p", { class: "hint" }, "The plant is G(s) = 1/(1 + s)². With a P controller a higher gain shrinks the error but never removes it, and the loop rings more. The PI controller adds a pole at s = 0, so both the reference error and a constant disturbance die out."))));
    update();
  },
};
