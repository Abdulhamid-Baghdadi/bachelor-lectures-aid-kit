// The 10 : 1 probe (Schrüfer et al. 2012, section 2.2.2, Bild 2.41–2.43; the lab script's task 1.2.1): its RT ‖ CT and
// the scope's RE ‖ CE* form a divider that is flat in frequency only when RT·CT = RE·CE*; a square wave shows it.
import { probeStep, probeRatio, compensatingCT, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const P = { RT: 9e6, RE: 1e6, CE: 100e-12 }; // scope 1 MΩ ‖ 25 pF and about 75 pF of cable (p. 115)

export default {
  id: "probe",
  art: () => a.picture("Three square waves: one with an overshooting top, one flat, one with a rounded rising top",
    a.path("M10 45 L10 15 Q20 30 60 30 L60 45", a.HOT, 3) + a.path("M75 45 L75 30 L125 30 L125 45", a.ACC, 3) +
      a.path("M140 45 L140 38 Q150 30 190 30 L190 45", a.COOL, 3) +
      a.line([[20, 120], [40, 120], [40, 75], [160, 75], [160, 120], [180, 120]], a.INK, 3)),
  mount(root) {
    let CT = 8e-12;
    const box = h("div", {}), resp = h("div", {}), rN = readout("Compensating CT"), rS = readout("At the edge"),
      rE = readout("Settles to"), rV = readout("State");
    const update = () => {
      const q = { ...P, CT }, period = 2e-3, xs = Array.from({ length: 401 }, (_, k) => k / 400 * period);
      // A 500 Hz square wave of ±1 V: each edge is a step of 2 V from the level the last half period settled on.
      const end = P.RE / (P.RT + P.RE), u = t => 10 * (t < period / 2 ? 2 * probeStep(q, t) - end : end - 2 * probeStep(q, t - period / 2));
      box.replaceChildren(lineChart({ label: "A 500 Hz square wave as the scope shows it through the probe, times ten",
        lines: [{ x: xs.map(t => 1e3 * t), y: xs.map(t => (t < period / 2 ? 1 : -1)), name: "input", cls: "faint" },
                { x: xs.map(t => 1e3 * t), y: xs.map(u), name: "on screen × 10" }],
        xLabel: "Time t [ms]", yLabel: "Voltage u [V]", yMin: -1.6, yMax: 1.6, xFormat: v => v.toFixed(1) }));
      const fs = Array.from({ length: 121 }, (_, k) => 1 + k * 0.05);
      resp.replaceChildren(lineChart({ label: "Divider ratio against frequency",
        lines: [{ x: fs, y: fs.map(l => 10 / probeRatio(q, 2 * Math.PI * 10 ** l)), name: "gain × 10" }],
        xLabel: "Frequency f [Hz], log scale", yLabel: "Gain × 10 [1]", yMin: 0, yMax: 1.6, xFormat: v => si(10 ** v, "Hz") }));
      const need = compensatingCT(P), edge = 10 * probeStep(q, 0), dev = CT / need - 1;
      rN.set(si(need, "F"), "", "RT·CT = RE·CE* (eq. 2.100)");
      rS.set(edge.toFixed(3), "", "10 · CT/(CT + CE*) (eq. 2.101)");
      rE.set("1.000", "", "10 · RE/(RT + RE) (eq. 2.102)");
      rV.set(Math.abs(dev) < 0.03 ? "compensated" : dev < 0 ? "under-compensated" : "over-compensated", Math.abs(dev) < 0.03 ? "" : "warn",
        Math.abs(dev) < 0.03 ? "a flat top at every frequency" : dev < 0 ? "rounded corners, high frequencies read low" : "overshoot, high frequencies read high");
    };
    root.append(h("div", { class: "stage" }, h("div", {}, box, resp), h("div", { class: "controls" },
      slider({ label: "Probe capacitance CT (the trimmer)", unit: "pF", min: 4, max: 20, value: CT * 1e12, step: 0.1,
        format: v => `${v.toFixed(1)} pF`, onInput: v => { CT = v * 1e-12; update(); } }).el,
      rN.el, rS.el, rE.el, rV.el,
      h("p", { class: "hint" }, "Turn the trimmer until the square wave's top is flat, as the lab script asks with the scope's own calibration signal (task 1.2.1). Under-compensated the corners round off; over-compensated they spike. Then sine waves from 100 Hz to 100 kHz read the same peak-to-peak value; otherwise they drift with frequency. Here RT = 9 MΩ, RE = 1 MΩ and CE* = 100 pF, an example in the range the book names."))));
    update();
  },
};
