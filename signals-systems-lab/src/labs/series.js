// Fourier series (Prechtl 2010, chapter 5; Doblinger 2015, section 2.3): a periodic signal is a sum of infinitely many
// harmonics, and a partial sum overshoots at every jump by about 9 % of the jump (Gibbs). A periodic sequence of
// period N needs only N harmonics, and with all of them it is rebuilt exactly.
import { WAVES, partialSum, dft, range } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const N = 16;

export default {
  id: "series",
  art: () => a.picture("A square wave and a wavy sum of sines that nearly follows it",
    a.line([[15, 110], [15, 40], [100, 40], [100, 110], [185, 110]], a.DIM, 2) +
      a.path("M15 75 C18 30 26 45 35 42 C45 38 55 46 65 42 C75 38 85 46 92 40 C97 32 99 60 100 75 C102 115 110 105 125 108 C140 112 160 104 185 108", a.ACC, 3)),
  mount(root) {
    let mode = "ct", wave = "square", K = 5;
    const box = h("div", {}), rO = readout("Highest point of the sum"), rK = readout("Harmonics used");
    const update = () => {
      if (mode === "ct") {
        const ts = range(-1, 1, 801), ks = Array.from({ length: 25 }, (_, k) => k + 1);
        const y = ts.map(t => partialSum(wave, K, t));
        box.replaceChildren(
          lineChart({ label: "The wave and the sum of its first harmonics", lines: [{ x: ts, y: ts.map(WAVES[wave].exact), name: "x(t)", cls: "faint" }, { x: ts, y, name: `sum up to k = ${K}` }],
            xLabel: "Time in periods t / T [1]", yLabel: "Value [1]", yMin: -1.3, yMax: 1.3, xFormat: v => v.toFixed(0) }),
          lineChart({ label: "Size of each harmonic's coefficient", lines: [{ x: ks, y: ks.map(k => Math.abs(WAVES[wave].coeff(k))), name: "|c_k|", stem: true }],
            xLabel: "Harmonic number k [1]", yLabel: "Coefficient |c_k| [1]", yMin: 0 }));
        const peak = Math.max(...y);
        rO.set(peak.toFixed(3), "", wave === "triangle" ? "no jumps, so no overshoot" : "more harmonics squeeze the overshoot closer to the jump, but never shrink it");
        rK.set(`${K} of infinitely many`);
      } else {
        const x = Array.from({ length: N }, (_, n) => WAVES[wave].exact(n / N + 0.5 / N));
        const X = dft(x), ns = Array.from({ length: 2 * N }, (_, n) => n - N / 2), kmax = Math.min(K, N / 2);
        const rebuild = n => X.reduce((s, c, k) => {
          const kk = k <= N / 2 ? k : k - N;
          if (Math.abs(kk) > kmax || (Math.abs(kk) === N / 2 && kmax < N / 2)) return s;
          const w = 2 * Math.PI * k * n / N;
          return s + (c[0] * Math.cos(w) - c[1] * Math.sin(w)) / N;
        }, 0);
        box.replaceChildren(
          lineChart({ label: "The periodic sequence and the sum of its first harmonics", lines: [
            { x: ns, y: ns.map(n => x[((n % N) + N) % N]), name: "x[n]", cls: "faint", stem: true }, { x: ns, y: ns.map(rebuild), name: `sum up to k = ${kmax}`, stem: true }],
            xLabel: "Index n [1]", yLabel: "Value [1]", yMin: -1.3, yMax: 1.3 }),
          lineChart({ label: "Size of each coefficient of the discrete Fourier series, one period", lines: [{ x: X.map((_, k) => k), y: X.map(c => Math.hypot(...c) / N), name: "|X[k]| / N", stem: true }],
            xLabel: "Harmonic number k [1]", yLabel: "Coefficient |X[k]| / N [1]", yMin: 0 }));
        const err = Math.max(...ns.map(n => Math.abs(rebuild(n) - x[((n % N) + N) % N])));
        rO.set(err < 1e-9 ? "exact" : `largest error ${err.toFixed(3)}`, "", `period N = ${N}`);
        rK.set(`${kmax} of ${N / 2}`, "", kmax >= N / 2 ? "all of them: the sequence is rebuilt exactly" : "");
      }
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Time", [["ct", "Continuous signal"], ["dt", "Discrete sequence"]], mode, v => { mode = v; update(); }),
      choice("Wave", [["square", "Square"], ["sawtooth", "Sawtooth"], ["triangle", "Triangle"]], wave, v => { wave = v; update(); }),
      slider({ label: "Highest harmonic K", min: 1, max: 60, value: K, step: 1, format: v => v.toFixed(0), onInput: v => { K = v; update(); } }),
      rO.el, rK.el,
      h("p", { class: "hint" }, "The square wave's coefficients fall as 1/k, the triangle's as 1/k²: the smoother the wave, the faster its harmonics die. The square wave jumps by 2, so its partial sums peak near 1.18 however many harmonics you add."))));
    update();
  },
};
