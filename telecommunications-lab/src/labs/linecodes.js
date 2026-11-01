// Line codes and their spectra (Goiser 2016, set 3, slides 45–62): seeded bits in the chosen code, the waveform, and
// its power spectral density, estimated and by the formula of slide 47.
import { LINE_CODES, lineCode, psdEstimate, psdContinuous, meanPower, bits } from "../core/index.js";
import { h, choice, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

// 4 samples per half-bit, 8 per bit: bin k of a 256-sample block is at k/32 of the bit rate.
const BITS = bits(2016, 4096), SHOW = BITS.slice(0, 16), HOLD = 4, BLOCK = 256;

export default {
  id: "linecodes",
  art: () => a.picture("A square wave of bits above a spectrum with a dip at zero frequency",
    a.line([[15, 50], [40, 50], [40, 20], [65, 20], [65, 50], [90, 50], [90, 20], [140, 20], [140, 50], [185, 50]], a.INK, 3) +
      a.path("M15 130 C30 130 40 85 60 85 C80 85 90 130 105 130 C120 130 130 105 145 105 C160 105 170 130 185 130", a.ACC, 3)),
  mount(root) {
    let code = "manchester";
    const wave = h("div", {}), spec = h("div", {}), rP = readout("Mean power at peak level 1"), rD = readout("At DC");
    const update = () => {
      const w = lineCode(SHOW, code), t = w.flatMap((_, k) => [k / 2, (k + 1) / 2]), y = w.flatMap(v => [v, v]);
      wave.replaceChildren(lineChart({ label: `The bits ${SHOW.join("")} in ${LINE_CODES[code].name}`, lines: [{ x: t, y }],
        xLabel: "Time t / bit duration [1]", yLabel: "Level / A [1]", yMin: -1.2, yMax: 1.2 }));
      const est = psdEstimate(lineCode(BITS, code), HOLD, BLOCK), k = est.map((_, i) => i).filter(i => i / BLOCK * 8 <= 4);
      const f = k.map(i => i / BLOCK * 8), lines = [{ x: f, y: k.map(i => est[i] / 8), name: "estimated" }];
      if (psdContinuous(code, 1) !== null) lines.push({ x: f, y: f.map(v => psdContinuous(code, v)), name: "slide 47", cls: "second" });
      spec.replaceChildren(lineChart({ label: `Power spectral density of ${LINE_CODES[code].name}`, lines,
        xLabel: "Frequency f / bit rate [1]", yLabel: "Power density · bit rate / A² [1]", yMin: 0, yMax: 1.1 }));
      const dcFree = est[0] / 8 < 0.05;
      rP.set(meanPower(code).toFixed(2), "", "the mean of the level squared");
      rD.set(dcFree ? "a null" : "power at DC", dcFree ? "" : "warn", dcFree ? "the line may be AC-coupled" : "a transformer or capacitor would block it");
    };
    root.append(h("div", { class: "stage" }, h("div", {}, wave, spec), h("div", { class: "controls" },
      choice("Line code", Object.entries(LINE_CODES).map(([k, c]) => [k, c.name]), code, v => { code = v; update(); }),
      rP.el, rD.el,
      h("p", { class: "hint" }, "4096 seeded bits, the periodogram averaged over 128 blocks. A spike in the estimate is a spectral line, which the formula's continuous part leaves out: DC for the unipolar codes, the bit rate for unipolar RZ, which a clock recovery can use (slide 52). AMI's symbols depend on the bits before, so the formula for independent symbols does not hold, and only the estimate is drawn."))));
    update();
  },
};
