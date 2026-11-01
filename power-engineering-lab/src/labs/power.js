// Active, reactive and apparent power in three phases (Gawlik 2015, sections 3.1.3 and 3.2.3; slides V05+06): each
// phase's power pulses at twice the frequency; three balanced phases add up to a constant, the active power.
import { instantaneous, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const U = 230, I = 10, N = 181;

export default {
  id: "power",
  art: () => a.picture("Three waves offset in time and a flat line above them",
    [0, 1, 2].map(k => a.path(`M20 ${95} ${Array.from({ length: 33 }, (_, i) => `L${20 + i * 5} ${95 - 25 * (1 + Math.cos(i / 32 * 4 * Math.PI - k * 2.09))}`).join(" ")}`, k ? a.DIM : a.INK, 2)).join("") +
      a.line([[20, 30], [180, 30]], a.ACC, 3)),
  mount(root) {
    let phi = 30, ic = 1;
    const box = h("div", {}), rP = readout("Active power P"), rQ = readout("Reactive power Q"), rS = readout("Apparent power S"), rR = readout("Ripple of the sum");
    const update = () => {
      const xs = Array.from({ length: N }, (_, k) => k * 2), ps = xs.map(x => instantaneous(U, [I, I, ic * I], phi, x * Math.PI / 180));
      const sum = ps.map(p => p[0] + p[1] + p[2]);
      box.replaceChildren(lineChart({ label: `Instantaneous power of three phases and their sum, φ = ${phi}°`,
        // Three names fit the legend: phase a, the other two phases (one dashed, one faint), and the sum.
        lines: [{ x: xs, y: ps.map(p => p[0] / 1e3), name: "phase a" }, { x: xs, y: ps.map(p => p[1] / 1e3), name: "phases b, c", cls: "second" },
                { x: xs, y: ps.map(p => p[2] / 1e3), cls: "faint" }, { x: xs, y: sum.map(p => p / 1e3), name: "sum of three", cls: "marker" }],
        xLabel: "Phase angle ωt [°]", yLabel: "Power p(t) [kW]", xMin: 0, xMax: 360, yMin: -2, yMax: 10, xFormat: v => v.toFixed(0) }));
      const c = Math.cos(phi * Math.PI / 180), s = Math.sin(phi * Math.PI / 180), sumI = (2 + ic) * I;
      rP.set(si(U * sumI * c, "W"), "", `mean of the sum; Σ U I cos φ (3-40)`);
      rQ.set(si(U * sumI * s, "var"), "", "Σ U I sin φ (3-42): stored and returned every half cycle");
      rS.set(si(U * sumI, "VA"), "", `S² = P² + Q² (3-25); cos φ = ${c.toFixed(2)}`);
      const ripple = Math.max(...sum) - Math.min(...sum);
      rR.set(ripple > 1 ? si(ripple, "W") : "0 W", ripple > 1 ? "warn" : "", ripple > 1 ? "the phases are unbalanced: the sum pulses" : "balanced: the sum is constant (3-44)");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Phase angle φ between voltage and current", unit: "°", min: -90, max: 90, value: phi, step: 1, format: v => `${v}°`, onInput: v => { phi = v; update(); } }),
      slider({ label: "Current in phase c, share of the others", unit: "", min: 0, max: 1.5, value: ic, step: 0.05, format: v => `${v.toFixed(2)}`, onInput: v => { ic = v; update(); } }),
      rP.el, rQ.el, rS.el, rR.el,
      h("p", { class: "hint" }, "230 V and 10 A a phase. One phase's power swings at twice the frequency around U I cos φ (3-26); at φ = ±90° it averages to zero. A three-phase machine on a balanced system therefore sees a steady torque. Harmonics and distortion power are in the Signals and systems lab."))));
    update();
  },
};
