// The DFT and the FFT (Doblinger 2015, chapter 7): N samples give N spectral lines spaced fs/N apart, which sample the
// DTFT of the windowed signal. A sine between two lines leaks into all of them; a window trades a wider peak for lower
// leakage. The FFT reaches the same lines in log2 N stages of butterflies.
import { windowOf, dft, dtft, fftStages, range } from "../core/index.js";
import { h, s, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const db = v => 20 * Math.log10(Math.max(1e-6, v));

/** The 8-point FFT's signal flow: three stages of butterflies, the chosen stage drawn bold. */
function butterflies(stage, values) {
  const N = 8, x = k => 60 + k * 110, y = n => 26 + n * 26;
  const g = s("svg", { viewBox: "0 0 520 240", class: "chart", role: "img", "aria-label": `The 8-point FFT, stage ${stage} of 3 drawn bold` });
  for (let st = 1; st <= 3; st++) {
    const size = 2 ** st;
    for (let start = 0; start < N; start += size) for (let j = 0; j < size / 2; j++) {
      const top = start + j, bot = top + size / 2, cls = st === stage ? "fly on" : "fly";
      for (const [a1, b1] of [[top, top], [top, bot], [bot, top], [bot, bot]]) g.append(s("line", { x1: x(st - 1), y1: y(a1), x2: x(st), y2: y(b1), class: cls }));
    }
  }
  for (let st = 0; st <= 3; st++) for (let n = 0; n < N; n++) g.append(s("circle", { cx: x(st), cy: y(n), r: 3, class: "dot" }));
  values.forEach((v, n) => g.append(s("text", { x: x(stage) + 8, y: y(n) + 4, class: "tick" }, `${v[0].toFixed(1)}${v[1] >= 0 ? "+" : "−"}j${Math.abs(v[1]).toFixed(1)}`)));
  return g;
}

export default {
  id: "dft",
  art: () => a.picture("Spectral lines with one tall peak and leakage on either side",
    a.line([[15, 130], [185, 130]], a.DIM, 2) + [25, 40, 55, 70, 85, 100, 115, 130, 145, 160, 175].map((xx, k) => a.line([[xx, 130], [xx, 130 - [6, 8, 12, 20, 60, 100, 55, 20, 12, 8, 6][k]]], k === 5 ? a.ACC : a.INK, 3)).join("")),
  mount(root) {
    let view = "leak", N = 32, bin = 5.5, win = "rectangular", pad = 1, stage = 3;
    const box = h("div", {}), rB = readout("Line spacing"), rP = readout("Leakage, highest line away from the peak");
    const update = () => {
      if (view === "leak") {
        const w = windowOf(win, N), x = w.map((v, n) => v * Math.cos(2 * Math.PI * bin * n / N));
        const L = N * pad, X = dft([...x, ...Array(L - N).fill(0)]).slice(0, L / 2 + 1).map(c => Math.hypot(...c));
        const top = Math.max(...X), Fs = range(0, 0.5, 600), D = Fs.map(F => Math.hypot(...dtft(x, F)));
        const peakAt = X.indexOf(top), far = X.filter((_, k) => Math.abs(k - peakAt) > 3 * pad).reduce((m, v) => Math.max(m, v), 0);
        box.replaceChildren(lineChart({ label: "The DFT lines and the DTFT they sample, in decibels", lines: [
          { x: Fs.map(F => F * N), y: D.map(v => db(v / top)), name: "DTFT", cls: "faint" },
          { x: X.map((_, k) => k / pad), y: X.map(v => db(v / top)), name: "DFT lines", stem: true }],
          xLabel: "Frequency in lines of the unpadded DFT, k [1]", yLabel: "Level [dB]", yMin: -80, yMax: 0 }));
        rB.set(`fs/${L}`, "", pad > 1 ? "zero-padding draws the DTFT more finely; it does not sharpen the peak" : "");
        rP.set(`${db(far / top).toFixed(1)} dB`, "", Number.isInteger(bin) && win === "rectangular" ? "on a line: no leakage at all" : "");
      } else {
        const x = [1, 2, 0, -1, 3, 0.5, -2, 1], st = fftStages(x);
        box.replaceChildren(butterflies(stage, st[stage]));
        rB.set("8 points, 3 stages", "", `${8 * 3 / 2} butterflies instead of 64 products`);
        rP.set(stage === 3 ? "stage 3 gives X[k], the DFT" : `after stage ${stage}`);
      }
    };
    const controls = h("div", {});
    const build = () => controls.replaceChildren(...(view === "leak" ? [
      choice("Length N", [["16", "16"], ["32", "32"], ["64", "64"]], String(N), v => { N = Number(v); update(); }),
      slider({ label: "Sine frequency in lines", min: 1, max: 7.5, value: bin, step: 0.05, format: v => v.toFixed(2), onInput: v => { bin = v; update(); } }),
      choice("Window", [["rectangular", "Rectangular"], ["hann", "Hann"], ["hamming", "Hamming"], ["blackman", "Blackman"]], win, v => { win = v; update(); }),
      choice("Zero-padding", [["1", "None"], ["4", "4 ×"], ["8", "8 ×"]], String(pad), v => { pad = Number(v); update(); })]
      : [slider({ label: "Stage", min: 0, max: 3, value: stage, step: 1, format: v => v ? `${v} of 3` : "bit-reversed input", onInput: v => { stage = v; update(); } })]).map(c => c.el ?? c));
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Look at", [["leak", "Leakage and windows"], ["fft", "FFT butterflies"]], view, v => { view = v; build(); update(); }),
      controls, rB.el, rP.el,
      h("p", { class: "hint" }, "Set the sine to a whole number of lines with the rectangular window: one line, nothing else. Move it half a line and it leaks into every line; the readout gives how far down. Try each window: the lower its leakage, the wider its peak."))));
    build(); update();
  },
};
