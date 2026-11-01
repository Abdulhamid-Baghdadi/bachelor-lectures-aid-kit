// Quantisation and PCM (Goiser 2016, set 2, slides 32–52): a sine rounded to 2ⁿ levels, its error, and the SNR left
// after the channel's bit errors.
import { quantise, snqr, snqrMeasured, pcmOutput, dB, sci } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "pcm",
  art: () => a.picture("A smooth wave and the staircase that rounds it to a few levels",
    a.path("M15 75 C45 10 75 10 100 75 S155 140 185 75", a.DIM, 2) +
      a.line([[15, 75], [30, 75], [30, 45], [45, 45], [45, 25], [80, 25], [80, 45], [95, 45], [95, 75], [110, 75], [110, 105],
        [125, 105], [125, 125], [160, 125], [160, 105], [175, 105], [175, 75], [185, 75]], a.ACC, 3)),
  mount(root) {
    let n = 3, logPe = -8;
    const box = h("div", {}), rQ = readout("SNQR, full-scale sine"), rM = readout("SNQR measured"), rO = readout("SNR after decoding");
    const update = () => {
      const M = 2 ** n, ts = Array.from({ length: 401 }, (_, k) => k / 400), x = ts.map(t => Math.sin(2 * Math.PI * t));
      box.replaceChildren(lineChart({ label: `A sine and its ${M}-level quantised version, with the error`,
        lines: [{ x: ts, y: x, name: "signal", cls: "faint" }, { x: ts, y: x.map(v => quantise(v, M, 1)), name: "quantised" },
                { x: ts, y: x.map(v => v - quantise(v, M, 1)), name: "error", cls: "second" }],
        xLabel: "Time t / period [1]", yLabel: "Amplitude / full scale [1]", yMin: -1.1, yMax: 1.1, xFormat: v => v.toFixed(1) }));
      const Pe = 10 ** logPe, errorsRule = 4 * 4 ** n * Pe > 1;
      rQ.set(`${dB(snqr(n, 2)).toFixed(1)} dB`, "", "4.8 + 6n − 3 dB");
      rM.set(`${dB(snqrMeasured(n)).toFixed(1)} dB`, "", "signal power over error power, many periods");
      rO.set(`${dB(pcmOutput(n, Pe, snqr(n, 2))).toFixed(1)} dB`, errorsRule ? "warn" : "", errorsRule ? "bit errors dominate" : "quantisation dominates");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Bits per sample n", unit: "", min: 1, max: 12, value: n, step: 1, format: v => `${v} bit, ${2 ** v} levels`, onInput: v => { n = v; update(); } }),
      slider({ label: "Bit error probability, log₁₀ Pe", unit: "", min: -10, max: -1, value: logPe, step: 0.5, format: v => sci(10 ** v, 1), onInput: v => { logPe = v; update(); } }),
      rQ.el, rM.el, rO.el,
      h("p", { class: "hint" }, "Each bit halves the step and buys 6 dB. Telephony: 8 kHz × 8 bit = 64 kbit/s (set 2, slide 60). Raise Pe: once 4 · SNQR · Pe passes 1, more bits no longer help. With few bits the measured value strays from the rule, which assumes the error spread evenly over a step. Sampling and aliasing are in the Signals and Systems lab."))));
    update();
  },
};
