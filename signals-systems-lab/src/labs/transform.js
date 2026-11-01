// The Fourier transform (Prechtl 2010, sections 3.1–3.3; Doblinger 2015, section 4.1): a pulse of duration T has the
// spectrum A T sinc(fT), first zero at f = 1/T; shorter in time is wider in frequency. The spectrum of a sequence (the
// DTFT) has the same shape near zero, but repeats with period 1 in the normalised frequency F.
import { pulseSpectrum, pulseDtft, range } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "transform",
  art: () => a.picture("A short pulse on the left and its wide sinc spectrum on the right",
    a.line([[15, 110], [40, 110], [40, 50], [65, 50], [65, 110], [90, 110]], a.INK, 3) +
      a.path("M105 110 C120 112 125 100 130 108 C138 118 140 30 150 30 C160 30 162 118 170 108 C175 100 180 112 190 110", a.ACC, 3)),
  mount(root) {
    let mode = "ct", T = 1, M = 3;
    const box = h("div", {}), rZ = readout("First zero of the spectrum"), rA = readout("Spectrum at zero frequency");
    const update = () => {
      if (mode === "ct") {
        const ts = range(-3, 3, 601), fs = range(-5, 5, 801);
        box.replaceChildren(
          lineChart({ label: "A pulse of duration T", lines: [{ x: ts, y: ts.map(t => Math.abs(t) < T / 2 ? 1 : 0), name: "x(t)" }],
            xLabel: "Time t [s]", yLabel: "Value [1]", yMin: 0, yMax: 1.2, xFormat: v => v.toFixed(0) }),
          lineChart({ label: "Its spectrum T sinc(fT)", lines: [{ x: fs, y: fs.map(f => pulseSpectrum(1, T, f)), name: "X(f)" }],
            xLabel: "Frequency f [Hz]", yLabel: "Spectrum X(f) [s]", yMin: -0.6, yMax: 3, xFormat: v => v.toFixed(0) }));
        rZ.set(`f = 1/T = ${(1 / T).toFixed(2)} Hz`); rA.set(`X(0) = ${T.toFixed(2)} s`, "", "the area under the pulse");
      } else {
        const ns = Array.from({ length: 31 }, (_, k) => k - 15), Fs = range(-1.5, 1.5, 1201);
        box.replaceChildren(
          lineChart({ label: "A pulse of 2M + 1 samples", lines: [{ x: ns, y: ns.map(n => Math.abs(n) <= M ? 1 : 0), name: "x[n]", stem: true }],
            xLabel: "Index n [1]", yLabel: "Value [1]", yMin: 0, yMax: 1.2 }),
          lineChart({ label: "Its spectrum, the DTFT, repeating every F = 1", lines: [{ x: Fs, y: Fs.map(F => pulseDtft(M, F)), name: "X(e^j2πF)" },
            { x: [0.5, 0.5], y: [-3, 15], name: "F = ±1/2", cls: "marker" }, { x: [-0.5, -0.5], y: [-3, 15], name: "", cls: "marker" }],
            xLabel: "Normalised frequency F = f / fs [1]", yLabel: "Spectrum X [1]", yMin: -3, yMax: 15, xFormat: v => v.toFixed(1) }));
        rZ.set(`F = 1/(2M + 1) = ${(1 / (2 * M + 1)).toFixed(3)}`); rA.set(`X = ${2 * M + 1}`, "", "the sum of the samples");
      }
    };
    const controls = h("div", {});
    const build = () => controls.replaceChildren((mode === "ct"
      ? slider({ label: "Duration T", unit: "s", min: 0.25, max: 3, value: T, step: 0.05, format: v => `${v.toFixed(2)} s`, onInput: v => { T = v; update(); } })
      : slider({ label: "Half-width M", min: 0, max: 7, value: M, step: 1, format: v => `${2 * v + 1} samples`, onInput: v => { M = v; update(); } })).el);
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Time", [["ct", "Continuous: Fourier transform"], ["dt", "Discrete: DTFT"]], mode, v => { mode = v; build(); update(); }),
      controls, rZ.el, rA.el,
      h("p", { class: "hint" }, "Halve the duration and the spectrum doubles in width and halves in height: duration times bandwidth stays fixed. A sampled signal's spectrum is the continuous one repeated every fs; only the band from −fs/2 to fs/2 is new information."))));
    build(); update();
  },
};
