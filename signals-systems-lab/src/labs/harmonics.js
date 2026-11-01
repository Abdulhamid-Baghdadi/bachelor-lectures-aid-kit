// Harmonics and power (Prechtl 2010, chapter 6): a sine voltage drives a current with harmonics. Only the
// fundamental, in phase with the voltage, carries active power; the harmonics add to the RMS current and the
// apparent power as distortion power D, with S² = P² + Q² + D².
import { harmonics, range, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const U = 230;

export default {
  id: "harmonics",
  art: () => a.picture("A clean sine voltage and a peaked, distorted current",
    a.path("M15 75 C40 20 65 20 90 75 C115 130 140 130 165 75", a.DIM, 2) +
      a.path("M15 75 C30 70 38 25 52 25 C66 25 74 70 90 75 C105 80 112 125 127 125 C141 125 150 80 165 75", a.ACC, 3)),
  mount(root) {
    let I1 = 10, I3 = 3, I5 = 2, phi = 0;
    const box = h("div", {});
    const rI = readout("RMS current I"), rT = readout("Total harmonic distortion"), rP = readout("Active power P"),
          rQ = readout("Reactive power Q"), rD = readout("Distortion power D"), rL = readout("Power factor λ = P/S");
    const update = () => {
      const parts = [{ k: 1, I: I1, phi }, { k: 3, I: I3, phi: 0 }, { k: 5, I: I5, phi: 0 }], q = harmonics(U, parts);
      const ts = range(0, 20e-3, 401), w = 2 * Math.PI * 50;
      const i = t => parts.reduce((s, p) => s + Math.SQRT2 * p.I * Math.sin(p.k * w * t - p.phi), 0);
      box.replaceChildren(lineChart({ label: "Voltage and current over one period of 50 Hz", lines: [
        { x: ts.map(t => t * 1e3), y: ts.map(t => Math.SQRT2 * U * Math.sin(w * t) / 20), name: "u(t) / 20 [V]", cls: "faint" },
        { x: ts.map(t => t * 1e3), y: ts.map(i), name: "i(t) [A]" }],
        xLabel: "Time t [ms]", yLabel: "Current [A], voltage / 20 [V]", yMin: -25, yMax: 25 }));
      rI.set(si(q.Irms, "A")); rT.set(`${(q.THD * 100).toFixed(1)} %`); rP.set(si(q.P, "W"));
      rQ.set(si(q.Q, "var")); rD.set(si(q.D, "VA"), "", "S² = P² + Q² + D²"); rL.set(q.lambda.toFixed(3));
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Fundamental I1", unit: "A", min: 0, max: 15, value: I1, step: 0.5, onInput: v => { I1 = v; update(); } }),
      slider({ label: "Phase of I1 behind u, φ1", unit: "°", min: -90, max: 90, value: 0, step: 5, format: v => `${v} °`, onInput: v => { phi = v * Math.PI / 180; update(); } }),
      slider({ label: "Third harmonic I3", unit: "A", min: 0, max: 8, value: I3, step: 0.5, onInput: v => { I3 = v; update(); } }),
      slider({ label: "Fifth harmonic I5", unit: "A", min: 0, max: 8, value: I5, step: 0.5, onInput: v => { I5 = v; update(); } }),
      rI.el, rT.el, rP.el, rQ.el, rD.el, rL.el,
      h("p", { class: "hint" }, "The voltage is a clean sine of 230 V RMS. Raise the harmonics: P stays put, but the RMS current and the apparent power S grow, so the power factor falls even with φ1 = 0. A rectifier's current looks like this. Continuous only: this part of the course has no discrete counterpart."))));
    update();
  },
};
