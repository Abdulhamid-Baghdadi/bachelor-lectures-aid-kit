// The series resonant circuit of section 1.2: the state model (1.8) with x = [uC, iL], driven by a step of the input
// voltage; while (1.12) holds the states ring at ω = √(1/(CL) − δ²) (1.11) as they settle.
import { rlcStep, rlcRates, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "rlc",
  art: () => a.picture("A series circuit of a capacitor, a coil and a resistor fed by a voltage source",
    a.line([[30, 110], [30, 40], [70, 40]]) + a.line([[80, 28], [80, 52]]) + a.line([[88, 28], [88, 52]]) + a.line([[88, 40], [105, 40]]) +
      a.path("M105 40 q6 -14 12 0 q6 -14 12 0 q6 -14 12 0", a.INK, 3) + a.line([[141, 40], [170, 40], [170, 59]]) + a.resistor(170, 75, true) +
      a.line([[170, 91], [170, 110], [30, 110]]) + a.circle(30, 75, 12, a.ACC, 3, "#0F172A") + a.text(30, 81, "u", 16, a.ACC)),
  mount(root) {
    let R = 1, L = 1, C = 1, U = 1;
    const chartBox = h("div", {});
    const rRates = readout("Decay rate δ = R/(2L) and ringing ω (1.11)"), rEnd = readout("Final state (uC, iL)");
    const update = () => {
      const T = Math.min(12 * Math.sqrt(L * C) + 6 * L / R, 60), run = rlcStep(R, L, C, U, T);
      chartBox.replaceChildren(lineChart({ label: "Capacitor voltage and coil current after a step of the input voltage",
        lines: [{ x: run.t, y: run.x.map(x => x[0]), name: "uC(t) [V]" }, { x: run.t, y: run.x.map(x => x[1]), name: "iL(t) [A]", cls: "second" }],
        xLabel: "Time t [s]", yLabel: "State uC [V], iL [A]" }));
      const { delta, omega } = rlcRates(R, L, C);
      rRates.set(`δ = ${si(delta, "1/s")}`, "", Number.isFinite(omega) ? `ω = ${si(omega, "rad/s")}: it rings` : "1/(CL) ≤ δ²: no ringing, (1.12) fails");
      const end = run.x.at(-1);
      rEnd.set(`${si(end[0], "V")}, ${si(end[1], "A")}`, "", "the capacitor takes the whole input voltage; no current flows");
    };
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      slider({ label: "Resistance R", unit: "Ω", min: 0.1, max: 4, value: R, step: 0.1, onInput: v => { R = v; update(); } }),
      slider({ label: "Inductance L", unit: "H", min: 0.2, max: 3, value: L, step: 0.1, onInput: v => { L = v; update(); } }),
      slider({ label: "Capacitance C", unit: "F", min: 0.2, max: 3, value: C, step: 0.1, onInput: v => { C = v; update(); } }),
      slider({ label: "Input step U", unit: "V", min: -2, max: 2, value: U, step: 0.1, onInput: v => { U = v; update(); } }),
      rRates.el, rEnd.el,
      h("p", { class: "hint" }, "The two states are the energy stores: the capacitor's voltage and the coil's current. Lower R and they swing back and forth for longer; raise it past 2√(L/C) and the ringing stops."))));
    update();
  },
};
