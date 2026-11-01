// Resolution and quantisation noise (Schrüfer et al. 2012, section 6.4.4; the lab script's task 1.2.4): an n-bit
// converter rounds to steps of U/2ⁿ, leaving an error of RMS Δu/√12; a full-scale sine then has 6.02n + 1.76 dB of
// SNR, and a measured SNR tells how many bits a converter really has.
import { quantise, quantisationNoise, snrSine, snrDC, enob, snrMeasured, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "quantisation",
  art: () => a.picture("A rising line, its staircase, and the sawtooth error between them",
    a.line([[15, 95], [185, 25]], a.DIM, 2) +
      a.line([[15, 95], [49, 95], [49, 81], [83, 81], [83, 67], [117, 67], [117, 53], [151, 53], [151, 39], [185, 39]], a.INK, 3) +
      a.line([[15, 125], [49, 111], [49, 139], [83, 125], [83, 139], [117, 111], [117, 139], [151, 111], [151, 139], [185, 111]], a.ACC, 2)),
  mount(root) {
    let n = 4, range = 10, measured = 62;
    const box = h("div", {}), snr = h("div", {}), rL = readout("Step Δu"), rN = readout("Quantisation noise, RMS"), rS = readout("Ideal SNR, full-scale sine"), rE = readout("Effective bits of a converter measuring");
    const update = () => {
      const lsb = range / 2 ** n, ts = Array.from({ length: 401 }, (_, k) => k / 400), x = ts.map(t => (range / 2 - lsb / 2) * Math.sin(2 * Math.PI * t));
      box.replaceChildren(lineChart({ label: `A full-scale sine on a ${n}-bit converter, its steps and the error`,
        lines: [{ x: ts, y: x, name: "input", cls: "faint" }, { x: ts, y: x.map(v => quantise(v, lsb)), name: "converted" },
                { x: ts, y: x.map(v => 10 * (quantise(v, lsb) - v)), name: "error × 10", cls: "second" }],
        xLabel: "Time t / period [1]", yLabel: "Voltage u [V]", yMin: -range / 2 - 0.5, yMax: range / 2 + 0.5, xFormat: v => v.toFixed(1) }));
      const bits = Array.from({ length: 16 }, (_, k) => k + 1);
      snr.replaceChildren(lineChart({ label: "Signal-to-noise ratio of an ideal converter against its bits",
        lines: [{ x: bits, y: bits.map(snrSine), name: "sine, 6.02n + 1.76" }, { x: bits, y: bits.map(snrDC), name: "DC, 6.02n + 10.79", cls: "second" }],
        marks: [{ x: n, y: snrMeasured(n), shape: "dot", name: "measured here" }, { x: enob(measured), y: measured, shape: "o" }],
        xLabel: "Bits n [1]", yLabel: "SNR [dB]", yMin: 0, yMax: 110, xMin: 1, xMax: 16 }));
      rL.set(si(lsb, "V"), "", `${si(range, "V")} / 2^${n}`);
      rN.set(si(quantisationNoise(lsb), "V"), "", "Δu/√12 (eq. 6.37)");
      rS.set(`${snrSine(n).toFixed(1)} dB`, "", `measured on the sine: ${snrMeasured(n).toFixed(1)} dB`);
      rE.set(`${enob(measured).toFixed(2)} bit`, "", `(SNR − 1.76)/6.02 (eq. 6.45), the ○ on the chart`);
    };
    root.append(h("div", { class: "stage" }, h("div", {}, box, snr), h("div", { class: "controls" },
      slider({ label: "Bits n", unit: "", min: 1, max: 16, value: n, step: 1, format: v => `${v} bit, ${2 ** v} steps`, onInput: v => { n = v; update(); } }).el,
      slider({ label: "Input range, peak to peak", unit: "V", min: 0.1, max: 20, log: true, value: range, onInput: v => { range = v; update(); } }).el,
      slider({ label: "SNR measured on a real converter", unit: "dB", min: 20, max: 100, value: measured, step: 0.5, format: v => `${v} dB`, onInput: v => { measured = v; update(); } }).el,
      rL.el, rN.el, rS.el, rE.el,
      h("p", { class: "hint" }, "Each bit halves the step and adds 6 dB. A signal that fills only a tenth of the range loses 20 dB: choose the range to fit. The lab script reads an oscilloscope's resolution off its screen (task 1.2.4): an 8-bit scope on 8 divisions of 1 V has steps of 31 mV. Real converters fall short of the ideal line through noise and non-linearity; the measured SNR names their effective bits. The same law as PCM, seen from the line coder, is in the Telecommunications lab."))));
    update();
  },
};
