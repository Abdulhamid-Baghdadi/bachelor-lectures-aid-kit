// The dead-time element of section 3.8.10: y(t) = u(t − Tt) (3.158), G(s) = e^(−sTt) (3.159). On a sine input the
// output keeps its amplitude, |G(jω)| = 1, and lags by ωTt, a phase that grows without bound with the frequency.
import { deadTimePhase } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "deadtime",
  art: () => a.picture("A conveyor belt carrying a block, so what goes in comes out later unchanged",
    a.circle(40, 95, 14) + a.circle(160, 95, 14) + a.line([[40, 81], [160, 81]]) + a.line([[40, 109], [160, 109]]) +
      a.rect(85, 55, 30, 26, a.ACC, 3) + a.arrow(60, 40, 140, 40, a.ACC, 2) + a.text(100, 135, "Tt", 16, a.INK)),
  mount(root) {
    let Tt = 0.2, w = 5;
    const chartBox = h("div", {});
    const rPh = readout("Phase of G(jω) = e^(−jωTt)"), rMag = readout("Magnitude |G(jω)|");
    const update = () => {
      const tEnd = Math.max(4 * Math.PI / w, 2 * Tt), ts = Array.from({ length: 401 }, (_, k) => k * tEnd / 400);
      const u = t => (t >= 0 ? Math.sin(w * t) : 0);
      chartBox.replaceChildren(lineChart({ label: "A sine input switched on at t = 0 and the same sine delayed by the dead time",
        lines: [{ x: ts, y: ts.map(u), name: "input u(t)" }, { x: ts, y: ts.map(t => u(t - Tt)), name: "output u(t − Tt)", cls: "second" }],
        xMin: 0, xMax: tEnd, yMin: -1.2, yMax: 1.2, xLabel: "Time t [s]", yLabel: "Signal u, y [–]", xFormat: v => v.toFixed(1) }));
      const ph = deadTimePhase(Tt, w);
      rPh.set(`${ph.toFixed(1)}°`, ph < -180 ? "warn" : "", ph < -180 ? "more than half a period behind" : "");
      rMag.set("1 (0 dB)", "", "the dead time changes no amplitude");
    };
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      slider({ label: "Dead time Tt (Totzeit)", unit: "s", min: 0, max: 1, value: Tt, step: 0.01, onInput: v => { Tt = v; update(); } }),
      slider({ label: "Angular frequency ω", unit: "rad/s", min: 0.5, max: 30, value: w, step: 0.5, onInput: v => { w = v; update(); } }),
      rPh.el, rMag.el,
      h("p", { class: "hint" }, "The output is the input shifted right by Tt, nothing else. A fixed time shift is a phase lag ωTt that grows in proportion to ω, so at high frequency a dead time costs any amount of phase; this is what makes it hard to control. In the Bode diagram it is a flat 0 dB line."))));
    update();
  },
};
