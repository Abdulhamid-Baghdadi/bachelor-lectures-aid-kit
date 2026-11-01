// Sampling, the bridge between the two halves (Doblinger 2015, section 4.2): a sine sampled at fs is rebuilt by a sum
// of sincs. Below fs/2 the rebuilt signal is the original; above, the same samples fit a slower sine, its alias at
// |f − fs·round(f/fs)|. Doblinger's aliasing.m sweeps the same effect.
import { alias, reconstruct, range } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "sampling",
  art: () => a.picture("A fast sine with samples on it, and a slow sine through the same samples",
    a.path("M15 75 C22 30 30 30 37 75 C44 120 52 120 59 75 C66 30 74 30 81 75 C88 120 96 120 103 75 C110 30 118 30 125 75 C132 120 140 120 147 75 C154 30 162 30 169 75", a.DIM, 2) +
      a.path("M15 75 C60 20 120 20 185 80", a.ACC, 3) + [26, 70, 114, 158].map(x => a.circle(x, 75 - 40 * Math.sin((x - 15) / 185 * Math.PI * 0.9), 4, a.COOL, 2, a.COOL)).join("")),
  mount(root) {
    let f = 3, fs = 10;
    const box = h("div", {}), rA = readout("Frequency the samples show"), rN = readout("Nyquist frequency fs / 2");
    const update = () => {
      const T = 1 / fs, Ns = Math.round(2 * fs), samples = Array.from({ length: Ns }, (_, n) => Math.cos(2 * Math.PI * f * n * T));
      const ts = range(0.25, 1.75, 600), nIn = samples.map((_, n) => n * T).filter(t => t >= 0.25 && t <= 1.75);
      box.replaceChildren(
        lineChart({ label: "The sine, its samples, and the signal rebuilt from the samples by sincs", lines: [
          { x: ts, y: ts.map(t => Math.cos(2 * Math.PI * f * t)), name: "x(t)", cls: "faint" },
          { x: ts, y: ts.map(t => reconstruct(samples, T, t)), name: "rebuilt", cls: "second" },
          { x: nIn, y: nIn.map(t => Math.cos(2 * Math.PI * f * t)), name: "samples x[n]", stem: true }],
          xLabel: "Time t [s]", yLabel: "Value [1]", yMin: -1.4, yMax: 1.4, xFormat: v => v.toFixed(2) }),
        lineChart({ label: "Where the sine's frequency folds to, against its frequency", lines: [
          { x: range(0, 30, 301), y: range(0, 30, 301).map(v => alias(v, fs)), name: "shown frequency" },
          { x: [f, f], y: [0, fs / 2], name: "now", cls: "marker" }],
          xLabel: "Sine frequency f [Hz]", yLabel: "Frequency after sampling [Hz]", yMin: 0, yMax: fs / 2 }));
      const fa = alias(f, fs);
      rA.set(`${fa.toFixed(2)} Hz`, f > fs / 2 ? "warn" : "", f > fs / 2 ? "aliased: not the sine you sampled" : "the original");
      rN.set(`${(fs / 2).toFixed(1)} Hz`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Sine frequency f", unit: "Hz", min: 0.5, max: 30, value: f, step: 0.1, format: v => `${v.toFixed(1)} Hz`, onInput: v => { f = v; update(); } }),
      slider({ label: "Sampling rate fs", unit: "Hz", min: 2, max: 40, value: fs, step: 0.5, format: v => `${v.toFixed(1)} Hz`, onInput: v => { fs = v; update(); } }),
      rA.el, rN.el,
      h("p", { class: "hint" }, "The rebuilt line uses the samples of two seconds, so it is exact in the middle and drifts near the ends. Raise f past fs/2: the samples now lie on a slower sine, and nothing after the sampler can tell the two apart. That is why an analogue low-pass comes before every sampler."))));
    update();
  },
};
