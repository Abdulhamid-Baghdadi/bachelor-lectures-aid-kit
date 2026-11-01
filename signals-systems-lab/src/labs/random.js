// Random signals and correlation (Prechtl 2010, sections 1.3, 3.4 and 4.6; Doblinger 2015, section 3.1): white noise
// has no memory, so its autocorrelation is a single spike; a low-pass gives it memory, r[k] ∝ a^|k|. Cross-correlation
// finds a delayed echo under noise. The noise is seeded, so the page shows the same samples every time.
import { noise, smooth, smoothVariance, correlate, mean } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const N = 600, LAG = 30;

export default {
  id: "random",
  art: () => a.picture("A noisy trace above and its autocorrelation, a single peak, below",
    a.line([[15, 50], [30, 30], [42, 62], [55, 25], [68, 58], [80, 35], [95, 60], [110, 28], [125, 55], [140, 38], [155, 62], [170, 30], [185, 50]], a.INK, 2) +
      a.line([[15, 130], [90, 130], [100, 80], [110, 130], [185, 130]], a.ACC, 3)),
  mount(root) {
    let view = "auto", A = 0.9, delay = 40, snr = 1, seed = 1;
    const box = h("div", {}), r1 = readout("Variance of the filtered noise"), r2 = readout("Correlation peak");
    const update = () => {
      const x = noise(N, 1, seed), ks = Array.from({ length: 2 * LAG + 1 }, (_, k) => k - LAG);
      if (view === "auto") {
        const y = smooth(x, A), rx = correlate(x, x, LAG), ry = correlate(y, y, LAG), ns = Array.from({ length: 150 }, (_, n) => n);
        box.replaceChildren(
          lineChart({ label: "White noise and the same noise after the low-pass", lines: [{ x: ns, y: ns.map(n => x[n]), name: "white x[n]", cls: "faint" }, { x: ns, y: ns.map(n => y[n] * 3), name: "filtered y[n] × 3" }],
            xLabel: "Index n [1]", yLabel: "Value [1]", yMin: -3, yMax: 3 }),
          lineChart({ label: "Autocorrelation of both, normalised to 1 at lag 0, and the theory a^|k|", lines: [
            { x: ks, y: rx.map(v => v / rx[LAG]), name: "white", cls: "faint", stem: true }, { x: ks, y: ry.map(v => v / ry[LAG]), name: "filtered", stem: true },
            { x: ks, y: ks.map(k => A ** Math.abs(k)), name: "a^|k|", cls: "second" }],
            xLabel: "Lag k [1]", yLabel: "Autocorrelation r[k] / r[0] [1]", yMin: -0.3, yMax: 1 }));
        // The estimate's own scatter grows as a nears 1, so the readout averages far more samples than the chart shows.
        const v = mean(smooth(noise(20000, 1, seed), A).map(q => q * q));
        r1.set(v.toFixed(4), "", `theory σ²(1 − a)/(1 + a) = ${smoothVariance(1, A).toFixed(4)}; 20 000 samples`);
        r2.set("at lag 0");
      } else {
        const s = noise(60, 1, seed + 7), rx = x.map((v, n) => v / snr + (n >= delay && n < delay + 60 ? s[n - delay] : 0));
        const sent = x.map((_, n) => n < 60 ? s[n] : 0), lags = Array.from({ length: 121 }, (_, k) => k), c = correlate(sent, rx, 120).slice(120);
        const peak = c.indexOf(Math.max(...c));
        box.replaceChildren(
          lineChart({ label: "The sent burst and the received signal: the echo plus noise", lines: [{ x: lags, y: lags.map(n => sent[n]), name: "sent", cls: "faint" }, { x: lags, y: lags.map(n => rx[n]), name: "received" }],
            xLabel: "Index n [1]", yLabel: "Value [1]", yMin: -4, yMax: 4 }),
          lineChart({ label: "Cross-correlation of sent and received against lag", lines: [{ x: lags, y: c, name: "r_sx[k]" }, { x: [delay, delay], y: [Math.min(...c), Math.max(...c)], name: "true delay", cls: "marker" }],
            xLabel: "Lag k [1]", yLabel: "Cross-correlation [1]" }));
        r1.set(`noise ${(1 / snr).toFixed(2)} × the echo's size`);
        r2.set(`lag ${peak}`, peak === delay ? "" : "warn", peak === delay ? "the echo's delay, found" : `true delay ${delay}: the noise wins`);
      }
    };
    const controls = h("div", {});
    const build = () => controls.replaceChildren(...(view === "auto"
      ? [slider({ label: "Low-pass pole a", min: 0, max: 0.98, value: A, step: 0.01, format: v => v.toFixed(2), onInput: v => { A = v; update(); } })]
      : [slider({ label: "Echo delay", min: 0, max: 100, value: delay, step: 1, format: v => `${v} samples`, onInput: v => { delay = v; update(); } }),
         slider({ label: "Echo to noise", min: 0.1, max: 3, value: snr, step: 0.05, format: v => v.toFixed(2), onInput: v => { snr = v; update(); } })]).map(c => c.el));
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Look at", [["auto", "Autocorrelation"], ["echo", "Find an echo"]], view, v => { view = v; build(); update(); }),
      controls,
      slider({ label: "Noise seed", min: 1, max: 20, value: seed, step: 1, format: v => v.toFixed(0), onInput: v => { seed = v; update(); } }),
      r1.el, r2.el,
      h("p", { class: "hint" }, "The samples stand for a continuous noise signal sampled; the laws are the same with sums for integrals. The low-pass y[n] = a y[n−1] + (1 − a) x[n] smooths: the closer a is to 1, the longer the noise remembers itself. An echo too weak to see in the received trace still stands out in the cross-correlation."))));
    build(); update();
  },
};
