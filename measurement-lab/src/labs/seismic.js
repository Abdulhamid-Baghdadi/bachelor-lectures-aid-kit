// The seismic vibration sensor (Schrüfer et al. 2012, section 7.4, eqs. 7.108–7.117): a mass on a spring in a
// housing; tuned low it measures displacement, tuned high acceleration, and damping near 0.7 flattens the response.
import { gain, phase, motion } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "seismic",
  art: () => a.picture("A box on a shaking floor with a mass hung inside it on a spring",
    a.rect(55, 20, 90, 100, a.INK, 3) + a.path("M100 20 L100 32 L88 38 L112 46 L88 54 L112 62 L100 68 L100 74", a.COOL, 2) +
      a.rect(82, 74, 36, 26, a.ACC, 3, "#0F172A") + a.path("M20 132 C40 120 60 144 80 132 S120 120 140 132 S170 144 185 132", a.HOT, 3)),
  mount(root) {
    let D = 0.7, logW = 0.5;
    const box = h("div", {}), time = h("div", {}), rG = readout("|xa / xe|"), rP = readout("Phase of xa"), rM = readout("Works as");
    const update = () => {
      const W = 10 ** logW, xs = Array.from({ length: 161 }, (_, k) => -2 + k * 0.025);
      box.replaceChildren(lineChart({ label: "Amplitude response of the seismic sensor against frequency, for the damping chosen and for D = 0.1",
        lines: [{ x: xs, y: xs.map(l => Math.log10(gain(10 ** l, D))), name: `D = ${D.toFixed(2)}` },
                { x: xs, y: xs.map(l => Math.log10(gain(10 ** l, 0.1))), name: "D = 0.1", cls: "faint" }],
        marks: [{ x: logW, y: Math.log10(gain(W, D)), shape: "dot" }],
        xLabel: "Frequency ratio Ω = ω/ω0 [1], log scale", yLabel: "Response |xa/xe| [1], log scale", yMin: -4, yMax: 1,
        xFormat: v => String(Number((10 ** v).toPrecision(2))), yFormat: v => `10^${v.toFixed(1)}` }));
      const ts = Array.from({ length: 301 }, (_, k) => k / 300 * 3 * 2 * Math.PI / W), m = ts.map(t => motion(W, D, t));
      time.replaceChildren(lineChart({ label: "Housing and mass over three periods at steady state",
        lines: [{ x: ts.map(t => t * W / (2 * Math.PI)), y: m.map(v => v.xe), name: "housing xe" }, { x: ts.map(t => t * W / (2 * Math.PI)), y: m.map(v => v.xa), name: "mass relative xa", cls: "second" }],
        xLabel: "Time t / period [1]", yLabel: "Displacement / xe peak [1]", xFormat: v => v.toFixed(0) }));
      const g = gain(W, D);
      rG.set(g < 0.01 ? g.toExponential(2) : g.toFixed(3), "", `at Ω = ${W.toPrecision(3)} (eq. 7.114)`);
      rP.set(`${(phase(W, D) * 180 / Math.PI).toFixed(0)}°`, "", "−90° at Ω = 1, −180° far above");
      rM.set(W > 3 ? "displacement sensor" : W < 0.3 ? "accelerometer" : "neither: near resonance", W >= 0.3 && W <= 3 ? "warn" : "",
        W > 3 ? "xa follows xe (eq. 7.116): low ω0, large mass" : W < 0.3 ? "xa = Ω²·xe, proportional to acceleration (eq. 7.117)" : "the reading depends strongly on D");
    };
    root.append(h("div", { class: "stage" }, h("div", {}, box, time), h("div", { class: "controls" },
      slider({ label: "Frequency ratio Ω = ω/ω0", unit: "", min: -2, max: 2, value: logW, step: 0.01, format: v => (10 ** v).toPrecision(3), onInput: v => { logW = v; update(); } }).el,
      slider({ label: "Damping ratio D", unit: "", min: 0.05, max: 2, value: D, step: 0.01, format: v => v.toFixed(2), onInput: v => { D = v; update(); } }).el,
      rG.el, rP.el, rM.el,
      h("p", { class: "hint" }, "ω0 = √(c/m) and D = w/(2√(c·m)), with spring constant c, damping w and mass m. A seismograph has a big mass on a soft spring, so it works above ω0; an accelerometer a small mass on a stiff spring, below. With D = 1 the response is Ω²/(1 + Ω²) (eq. 7.115); with little damping it peaks at resonance. The same second-order form governs every moving-coil movement (section 1.5); its Bode plot is in the Automation lab."))));
    update();
  },
};
