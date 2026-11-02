// The worked example: one system through the course, the moving average of Doblinger (2015), Beispiel 3.7 (p. 48),
// whose settling Beispiel 3.9 (p. 55) and zeros Beispiel 5.7 (p. 104) take up again. Here it cleans a sensor signal
// sampled at fs = 300 Hz of mains hum: sampling folds a 250 Hz part onto 50 Hz (4.2), the convolution sum (3.46) averages
// over N samples, and |H| (3.48) has its notches at k·fs/N, all of them on the hum when N = fs/50.
import { movingAverage, maMagnitude, maNotches, humSamples, sensor, HUM, fir, dft, alias, cAbs } from "../core/index.js";
import { h, slider, readout, tabs } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const FS = 300, NX = 300;
const hz = v => `${Number(v.toFixed(2))} Hz`;

export default {
  id: "humfilter",
  art: () => a.picture("A slow wave with fast ripple on it, and the same wave smooth after a box-shaped averaging window",
    a.path("M15 60 C40 30 60 30 85 60 S130 90 155 60", a.DIM, 2) +
      Array.from({ length: 14 }, (_, k) => a.line([[15 + k * 10, 60 - 25 * Math.sin(k / 2.2)], [20 + k * 10, 50 - 25 * Math.sin(k / 2.2)]], a.HOT, 2)).join("") +
      a.path("M15 120 C40 90 60 90 85 120 S130 150 155 120", a.ACC, 3) + a.rect(165, 100, 25, 20, a.INK, 2)),
  mount(root) {
    const st = { N: 6 };
    const { x, s } = humSamples(FS, NX);

    // Step 1: the sampled signal and where the hum lands.
    const c1 = h("div", { class: "plot" }), rA = readout("Where the hum lands after sampling");
    const t1 = Array.from({ length: 61 }, (_, k) => k / FS);
    c1.replaceChildren(lineChart({ lines: [{ x: t1.map(t => t * 1000), y: t1.map((_, k) => x[k]), name: "samples x[n]", stem: true },
      { x: t1.map(t => t * 1000), y: t1.map(t => sensor(t)), name: "sensor s(t)", cls: "second" }],
      xMin: 0, xMax: 200, yMin: 0, yMax: 2, xLabel: "Time t [ms]", yLabel: "Signal [V]", label: "The first 200 ms of the samples, with the sensor signal they should show" }));
    rA.set(HUM.map(([f]) => `${f} → ${hz(alias(f, FS))}`).join(", "), "", `fs = ${FS} Hz, fs/2 = ${FS / 2} Hz: the 250 Hz part folds onto 50 Hz (4.52)`);
    const s1 = h("div", { class: "stage" }, c1, h("div", { class: "controls" }, rA.el,
      h("p", { class: "hint" }, "A slow sensor signal, 1 V + 0.5 V·sin(2π·1 Hz·t), picks up mains hum at 50 Hz and two harmonics. Sampled at 300 Hz, every part above fs/2 = 150 Hz shows up as an alias: the 250 Hz harmonic is now indistinguishable from 50 Hz. Example data, not a measurement.")));

    // Step 2: the moving average in time.
    const c2 = h("div", { class: "plot" }), rT = readout("Settling (Beispiel 3.9)"), rE = readout("Largest error once settled");
    const time = () => {
      const y = fir(x, movingAverage(st.N)), n = Array.from({ length: 61 }, (_, k) => k);
      c2.replaceChildren(lineChart({ lines: [{ x: n, y: n.map(k => x[k]), name: "x[n]", cls: "faint" }, { x: n, y: n.map(k => y[k]), name: "y[n]" },
        { x: n, y: n.map(k => sensor((k - (st.N - 1) / 2) / FS)), name: "sensor, delayed", cls: "second" }],
        xMin: 0, xMax: 60, yMin: 0, yMax: 2, xLabel: "Sample n [1]", yLabel: "Signal [V]", label: `The input and the output of the moving average over N = ${st.N} samples` }));
      rT.set(`n ≥ N − 1 = ${st.N - 1}`, "", `before that the window still holds the zeros before the start; the delay is (N − 1)/2 = ${((st.N - 1) / 2).toFixed(1)} samples (3.47)`);
      const err = Math.max(...y.slice(st.N).map((v, k) => Math.abs(v - sensor((k + st.N - (st.N - 1) / 2) / FS))));
      rE.set(`${(err * 1000).toFixed(1)} mV`, err > 0.01 ? "warn" : "", err > 0.01 ? "hum is left: the notches miss it" : "against the sensor signal delayed by (N − 1)/2");
    };
    const s2 = h("div", { class: "stage" }, c2, h("div", { class: "controls" },
      slider({ label: "Window length N", unit: "", min: 2, max: 12, value: st.N, step: 1, format: v => v.toFixed(0), onInput: v => { st.N = v; all(); } }),
      rT.el, rE.el,
      h("p", { class: "hint" }, "y[n] = (1/N)·(x[n − N + 1] + … + x[n]) (3.46): a running mean, with no multiplication but the 1/N. Six samples at 300 Hz span exactly one period of 50 Hz, so every hum part averages to zero; try N = 5 or 7.")));

    // Step 3: the frequency response and the spectrum.
    const c3 = h("div", { class: "plot" }), c4 = h("div", { class: "plot" }), rN = readout("Notches k·fs/N (5.37)");
    const freq = () => {
      const f = Array.from({ length: 301 }, (_, k) => k / 2), y = fir(x, movingAverage(st.N));
      c3.replaceChildren(lineChart({ lines: [{ x: f, y: f.map(v => maMagnitude(st.N, 2 * Math.PI * v / FS)), name: "|H|" }],
        marks: HUM.map(([v]) => ({ x: alias(v, FS), y: maMagnitude(st.N, 2 * Math.PI * alias(v, FS) / FS), shape: "x" })),
        xMin: 0, xMax: 150, yMin: 0, yMax: 1.1, xLabel: "Frequency f [Hz]", yLabel: "Magnitude |H| [1]", label: "Magnitude of the moving average, with the hum frequencies after sampling marked" }));
      // One-sided amplitudes: 2|X[k]|/N for a sine, |X[0]|/N for the mean.
      const X = dft(x), Y = dft(y), k = Array.from({ length: NX / 2 + 1 }, (_, i) => i), df = FS / NX, amp = (Z, i) => (i === 0 ? 1 : 2) * cAbs(Z[i]) / NX;
      c4.replaceChildren(lineChart({ lines: [{ x: k.map(i => i * df), y: k.map(i => amp(X, i)), name: "|X[k]|", cls: "faint", stem: true },
        { x: k.map(i => i * df), y: k.map(i => amp(Y, i)), name: "|Y[k]|", stem: true }],
        xMin: 0, xMax: 150, yMin: 0, yMax: 1.1, xLabel: "Frequency f [Hz]", yLabel: "Amplitude [V]", label: "Spectrum of one second of samples before and after the filter, from the DFT" }));
      const notch = maNotches(st.N, FS), hit = HUM.every(([v]) => notch.some(q => Math.abs(q - alias(v, FS)) < 1e-6));
      rN.set(notch.map(hz).join(", "), hit ? "" : "warn", hit ? "every hum part sits in a notch" : "the hum at 50 Hz and 100 Hz falls between the notches");
    };
    const s3 = h("div", { class: "stage" }, h("div", {}, c3, c4), h("div", { class: "controls" }, rN.el,
      h("p", { class: "hint" }, "|H(e^jθ)| = |sin(Nθ/2)/(N sin(θ/2))| (3.48), with θ = 2πf/fs. Its zeros sit on the unit circle at e^(j2πk/N) (Beispiel 5.7), the frequencies k·fs/N. The DFT of one second (Δf = 1 Hz, 7.27) shows the hum lines gone and the 1 Hz line kept: for N = 6, |H| there is 0.9994."),
      h("p", { class: "hint" }, "The notes' Beispiele use N = 6 on test signals; the hum is this lab's application of the same filter.")));

    const all = () => { time(); freq(); };
    root.append(tabs("Steps of the worked example", [["1 · Sampling", s1], ["2 · Averaging", s2], ["3 · Spectrum", s3]]));
    all();
  },
};
