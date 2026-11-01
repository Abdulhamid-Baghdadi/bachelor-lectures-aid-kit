// The op-amp in a feedback loop (Zimmermann 2010, section 4.1): an open loop gain with two poles, fed back by β. The
// closed loop gain is vg/(1 + β vg); where |β vg| = 1 the phase margin decides how the step response rings. The
// Bode and Nyquist theory behind it is the Automation lab's.
import { phaseMargin, stepResponse, openLoop, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "opamploop",
  art: () => a.picture("A step response overshooting and ringing before it settles",
    a.line([[15, 125], [40, 125], [40, 60], [185, 60]], a.DIM, 2, "4 4") + a.path("M40 125 C55 20 70 25 85 75 C95 95 105 50 120 62 C135 70 150 58 185 60", a.ACC, 3)),
  mount(root) {
    let vg0 = 1e5, f1 = 10, f2 = 1e6, gain = 10;
    const box = h("div", {}), rM = readout("Phase margin"), rC = readout("Crossover |β vg| = 1"), rO = readout("Overshoot"), rB = readout("Closed-loop gain at DC");
    const update = () => {
      const prm = { vg0, w1: 2 * Math.PI * f1, w2: 2 * Math.PI * f2 }, beta = 1 / gain, m = phaseMargin(prm, beta);
      const tEnd = 12 / Math.max(m.wc, 1), ts = Array.from({ length: 401 }, (_, k) => k * tEnd / 400), y = ts.map(t => stepResponse(t, prm, beta));
      const final = vg0 / (1 + beta * vg0), over = Math.max(0, Math.max(...y) / final - 1);
      const fs = Array.from({ length: 121 }, (_, k) => 10 ** (k / 12)), dB = v => 20 * Math.log10(Math.hypot(...v));
      box.replaceChildren(
        lineChart({ label: "Open loop gain and the inverse feedback factor against frequency", lines: [
          { x: fs.map(Math.log10), y: fs.map(f => dB(openLoop(2 * Math.PI * f, prm))), name: "|vg| [dB]" },
          { x: [0, 10], y: [20 * Math.log10(gain), 20 * Math.log10(gain)], name: "1/β [dB]", cls: "second" }],
          xLabel: "Frequency, log₁₀ of f [Hz]", yLabel: "Gain [dB]", yMin: -20, yMax: 120, xFormat: v => v.toFixed(0) }),
        lineChart({ label: "Closed-loop step response", lines: [{ x: ts.map(t => t * 1e6), y: y.map(v => v / final), name: "ua / final" }, { x: [0, tEnd * 1e6], y: [1, 1], cls: "faint" }],
          xLabel: "Time t [µs]", yLabel: "Output / final value [1]", yMin: 0, yMax: 2, xFormat: v => v.toPrecision(2) }));
      rM.set(`${m.margin.toFixed(1)}°`, m.margin < 45 ? "warn" : "", m.margin < 45 ? "below 45°: it rings (p. 76)" : "");
      rC.set(si(m.wc / (2 * Math.PI), "Hz")); rO.set(`${(over * 100).toFixed(0)} %`); rB.set(final.toPrecision(4), "", "vg0/(1 + β vg0)");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Closed-loop gain 1/β", unit: "", min: 1, max: 1000, value: gain, log: true, format: v => v.toPrecision(2), onInput: v => { gain = v; update(); } }),
      slider({ label: "First pole f1", unit: "Hz", min: 1, max: 1000, value: f1, log: true, format: v => `${v} Hz`, onInput: v => { f1 = v; update(); } }),
      slider({ label: "Second pole f2", unit: "Hz", min: 1e4, max: 1e7, value: f2, log: true, format: v => si(v, "Hz"), onInput: v => { f2 = v; update(); } }),
      slider({ label: "DC open loop gain vg0", unit: "", min: 1e3, max: 1e6, value: vg0, log: true, format: v => v.toExponential(0), onInput: v => { vg0 = v; update(); } }),
      rM.el, rC.el, rO.el, rB.el,
      h("p", { class: "hint" }, "Lower the closed-loop gain towards a follower (1/β = 1): the 1/β line meets |vg| where the second pole has already turned the phase, the margin shrinks and the step rings. The script's rule (p. 75): f1 must lie the loop gain below f2 for 45°, half that again for 60°. Bode and Nyquist diagrams in depth are in the Automation lab."))));
    update();
  },
};
