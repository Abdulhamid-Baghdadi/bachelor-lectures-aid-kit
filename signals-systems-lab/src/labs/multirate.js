// Multirate processing (Doblinger 2015, sections 8.1–8.2): keeping every M-th sample stretches the spectrum M times
// and folds what lay above fs/(2M) back into the band; a low-pass before it prevents that. Inserting zeros does the
// opposite: the spectrum repeats, and a low-pass after it removes the images.
import { noise, downsample, upsample, fir, firLowpass, dft } from "../core/index.js";
import { h, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const L0 = 512;
const spectrum = x => { const X = dft(x).slice(0, x.length / 2 + 1); return X.map(c => 20 * Math.log10(Math.max(1e-6, Math.hypot(...c) / x.length))); };

export default {
  id: "multirate",
  art: () => a.picture("A dense row of samples, and below it every second one kept",
    Array.from({ length: 16 }, (_, k) => a.line([[18 + k * 11, 60], [18 + k * 11, 60 - 25 * Math.abs(Math.sin(k * 0.6))]], k % 2 ? a.DIM : a.INK, 2)).join("") +
      Array.from({ length: 8 }, (_, k) => a.line([[18 + k * 22, 130], [18 + k * 22, 130 - 25 * Math.abs(Math.sin(k * 1.2))]], a.ACC, 3)).join("") + a.arrow(100, 75, 100, 95, a.COOL, 2)),
  mount(root) {
    let op = "down", M = 2, guard = "off";
    const box = h("div", {}), rB = readout("New sampling rate"), rN = readout("Low-pass cut-off");
    const update = () => {
      // Two sines and a little seeded noise, at fs = 48 kHz; both fall on DFT lines at every factor, so nothing leaks.
      const hiss = noise(L0, 0.01, 4), x = hiss.map((v, n) => v + Math.cos(2 * Math.PI * 3000 / 48000 * n) + 0.6 * Math.cos(2 * Math.PI * 18000 / 48000 * n));
      const lp = firLowpass(63, 0.5 / M * 0.9, "blackman");
      let y, fsOut;
      if (op === "down") { y = downsample(guard === "on" ? fir(x, lp) : x, M); fsOut = 48 / M; }
      else { y = upsample(x.slice(0, L0 / M), M); if (guard === "on") y = fir(y, lp).map(v => v * M); fsOut = 48 * M; }
      const Sx = spectrum(x), Sy = spectrum(y.slice(0, 2 ** Math.floor(Math.log2(y.length))));
      box.replaceChildren(
        lineChart({ label: "Spectrum before, at 48 kHz", lines: [{ x: Sx.map((_, k) => k * 48 / L0), y: Sx, name: "x" }],
          xLabel: "Frequency f [kHz]", yLabel: "Level [dB]", yMin: -70, yMax: 0 }),
        lineChart({ label: `Spectrum after, at ${fsOut} kHz`, lines: [{ x: Sy.map((_, k) => k * fsOut / (2 * (Sy.length - 1))), y: Sy, name: "y" }],
          xLabel: "Frequency f [kHz]", yLabel: "Level [dB]", yMin: -70, yMax: 0 }));
      rB.set(`${fsOut} kHz`, "", op === "down" ? `band now 0 … ${(fsOut / 2).toFixed(1)} kHz` : "");
      rN.set(guard === "on" ? `${(op === "down" ? 21.6 / M : 21.6).toFixed(1)} kHz` : "no filter", guard === "off" && (op === "up" || 18 > 24 / M) ? "warn" : "",
        guard === "off" ? (op === "down" ? (18 > 24 / M ? "the 18 kHz sine folds into the band" : "") : "images of the spectrum remain") : "");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Operation", [["down", "Downsample: keep every M-th"], ["up", "Upsample: insert M − 1 zeros"]], op, v => { op = v; update(); }),
      choice("Factor M", [["2", "2"], ["3", "3"], ["4", "4"]], String(M), v => { M = Number(v); update(); }),
      choice("Low-pass", [["off", "Off"], ["on", "On"]], guard, v => { guard = v; update(); }),
      rB.el, rN.el,
      h("p", { class: "hint" }, "The input has sines at 3 kHz and 18 kHz at 48 kHz. Downsample by 2 without the filter: 18 kHz is above the new limit of 12 kHz and returns at 6 kHz, where no sine was. Upsampled, the input is taken as running at 48 kHz and the output at 48·M kHz. Discrete only: changing the rate has no continuous counterpart."))));
    update();
  },
};
