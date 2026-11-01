// Raised-cosine pulses and the eye (Goiser 2016, set 4, slides 7–26; set 3, slides 63–68): the pulse from its
// spectrum, and the eye of seeded polar symbols, with noise.
import { raisedCosinePulse, eyeTraces, eyeOpening, rcBandwidth, rcEfficiency, bits, gaussian } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const SYMBOLS = bits(2004, 70), NOISE = gaussian(4, 4000), PER = 16;

export default {
  id: "nyquist",
  art: () => a.picture("An eye diagram: traces cross, leaving an open eye in the middle",
    [-1, 1].map(s => a.path(`M15 ${75 - 45 * s} C60 ${75 - 45 * s} 70 ${75 + 45 * s} 100 ${75 + 45 * s} C130 ${75 + 45 * s} 140 ${75 - 45 * s} 185 ${75 - 45 * s}`, a.INK, 2)).join("") +
      a.line([[15, 30], [185, 30]], a.DIM, 2) + a.line([[15, 120], [185, 120]], a.DIM, 2) + a.line([[100, 45], [100, 105]], a.ACC, 3)),
  mount(root) {
    let alpha = 0.35, sigma = 0;
    const pulseBox = h("div", {}), eyeBox = h("div", {});
    const rB = readout("Bandwidth"), rE = readout("Bandwidth efficiency"), rO = readout("Eye opening at the decision instant");
    const update = () => {
      const ts = Array.from({ length: 241 }, (_, k) => -6 + k / 20);
      pulseBox.replaceChildren(lineChart({ label: `Raised-cosine pulse of roll-off ${alpha} beside the sinc`,
        lines: [{ x: ts, y: ts.map(t => raisedCosinePulse(t, alpha, 200)), name: `α = ${alpha.toFixed(2)}` },
                { x: ts, y: ts.map(t => (t ? Math.sin(Math.PI * t) / (Math.PI * t) : 1)), name: "sinc, α = 0", cls: "faint" }],
        xLabel: "Time t / T0 [1]", yLabel: "Pulse h(t) / h(0) [1]", yMin: -0.3, yMax: 1.05 }));
      const tr = eyeTraces(alpha, SYMBOLS, NOISE, sigma, PER, 6), x = tr[0].map((_, k) => -1 + k / PER);
      eyeBox.replaceChildren(lineChart({ label: "Eye diagram: two symbols of every trace laid over each other",
        lines: tr.map(y => ({ x, y, cls: "trace" })), xLabel: "Time from the decision instant t / T0 [1]",
        yLabel: "Received level [1]", yMin: -2, yMax: 2 }));
      const open = eyeOpening(tr, PER);
      rB.set(`${rcBandwidth(1, alpha).toFixed(3)} / T0`, "", "(1 + α)/(2T0)");
      rE.set(`${rcEfficiency(alpha).toFixed(2)} baud/Hz`, "", "2/(1 + α)");
      rO.set(open > 0 ? open.toFixed(2) : "closed", open > 0.5 ? "" : "danger", open > 0 ? "of 2 without noise" : "some symbols are decided wrongly");
    };
    root.append(h("div", { class: "stage" }, h("div", {}, pulseBox, eyeBox), h("div", { class: "controls" },
      slider({ label: "Roll-off α", unit: "", min: 0.05, max: 1, value: alpha, step: 0.05, format: v => v.toFixed(2), onInput: v => { alpha = v; update(); } }),
      slider({ label: "Noise, standard deviation σ", unit: "", min: 0, max: 0.4, value: sigma, step: 0.02, format: v => v.toFixed(2), onInput: v => { sigma = v; update(); } }),
      rB.el, rE.el, rO.el,
      h("p", { class: "hint" }, "Every pulse is zero at the others' instants, so with no noise the eye is fully open at t = 0. A small α saves bandwidth, but its pulse decays slowly: the eye narrows from the sides, and a timing error costs more. The pulse is computed from the spectrum the slides define (set 4, slides 23–24), by a numerical inverse Fourier integral."))));
    update();
  },
};
