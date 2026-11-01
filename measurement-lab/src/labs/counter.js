// Counting frequency or period (Schrüfer et al. 2012, sections 5.5–5.6): edges counted in a gate are uncertain by one,
// so frequency mode resolves 1/T and period mode fx²/f0; below √(f0/T) the period wins.
import { countFrequency, countPeriod, crossoverFrequency, display, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const F0 = 1e7; // a 10 MHz quartz time base

export default {
  id: "counter",
  art: () => a.picture("A pulse train, a gate window over it, and a four-digit display",
    Array.from({ length: 9 }, (_, k) => a.line([[14 + 20 * k, 70], [14 + 20 * k, 45], [24 + 20 * k, 45], [24 + 20 * k, 70], [34 + 20 * k, 70]], a.INK, 2)).join("") +
      a.rect(40, 35, 112, 45, a.ACC, 3) + a.rect(50, 100, 100, 34, a.COOL, 3) + a.text(100, 124, "0314", 20, a.COOL)),
  mount(root) {
    let fx = 100314.3, T = 1, phase = 0;
    const box = h("div", {}), rF = readout("Frequency mode, gate T"), rP = readout("Period mode, 10 MHz clock"), rX = readout("Crossover √(f0/T)"), rD = readout("A 4-digit counter shows");
    const update = () => {
      const xs = Array.from({ length: 161 }, (_, k) => k * 0.05);
      box.replaceChildren(lineChart({ label: "Relative resolution of frequency and period measurement against the frequency",
        lines: [{ x: xs, y: xs.map(l => Math.log10(1 / T / 10 ** l)), name: "frequency, 1/(T·fx)" },
                { x: xs, y: xs.map(l => Math.log10(10 ** l / F0)), name: "period, fx/f0", cls: "second" }],
        marks: [{ x: Math.log10(fx), y: Math.log10(Math.min(1 / T / fx, fx / F0)), shape: "dot" }],
        xLabel: "Frequency fx [Hz], log scale", yLabel: "Relative resolution [1], log scale", yMin: -10, yMax: 0,
        xFormat: v => si(10 ** v, "Hz"), yFormat: v => `10^${v.toFixed(0)}` }));
      const cf = countFrequency(fx, T, phase / fx), cp = countPeriod(fx, F0, phase / F0), better = cf.resolution < cp.resolution;
      rF.set(si(cf.f, "Hz", 8), better ? "" : "warn", `N = ${cf.N}, ± ${si(cf.resolution, "Hz")} (eq. 5.9)`);
      if (cp.N) rP.set(si(cp.f, "Hz", 8), better ? "warn" : "", `N = ${cp.N} clock periods, ± ${si(cp.resolution, "Hz", 2)} (eq. 5.7)`);
      else rP.set("no count", "warn", "one period is shorter than a clock period");
      rX.set(si(crossoverFrequency(F0, T), "Hz"), "", better ? "fx is above it: count the signal" : "fx is below it: time one period");
      rD.set(display(cf.N, 4), "", "in overflow only the last digits show (Table 5.8)");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Signal frequency fx", unit: "Hz", min: 1, max: 1e8, log: true, value: fx, onInput: v => { fx = v; update(); } }).el,
      slider({ label: "Gate time T", unit: "s", min: 0.001, max: 10, log: true, value: T, onInput: v => { T = v; update(); } }).el,
      slider({ label: "Where the gate opens, in the signal's period", unit: "", min: 0, max: 0.99, value: phase, step: 0.01, format: v => v.toFixed(2), onInput: v => { phase = v; update(); } }).el,
      rF.el, rP.el, rX.el, rD.el,
      h("p", { class: "hint" }, "Move where the gate opens: the count jumps by one, and the result by 1/T. The book's example, 100.3143 kHz, shows 1003, 0031, 0314 and 3143 for gates of 10 ms to 10 s (Table 5.8): a longer gate buys digits. At 50 Hz a 1 s gate gives ± 1 Hz, but timing one period with a 10 MHz clock gives ± 0.25 mHz. The trigger threshold decides which edges count (Bild 5.17)."))));
    update();
  },
};
