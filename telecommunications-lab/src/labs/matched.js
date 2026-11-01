// Matched filter and bit errors (Goiser 2016, set 4, slides 43–90; formulary, Table 2): the bit error probability of
// polar, unipolar and orthogonal signalling against E/N0, and a seeded count for polar.
import { BER, berCounted, gaussian, fromDB, sci } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const NOISE = gaussian(1948, 200000);

export default {
  id: "matched",
  art: () => a.picture("A rectangular pulse, an arrow, and the triangle the matched filter makes of it",
    a.line([[15, 110], [35, 110], [35, 50], [85, 50], [85, 110]], a.INK, 3) + a.path("M110 120 L145 30 L180 120", a.ACC, 3) +
      a.arrow(88, 80, 108, 80, a.COOL, 2)),
  mount(root) {
    let e = 8;
    const box = h("div", {}), rP = readout("Polar"), rU = readout("Unipolar or orthogonal"), rC = readout("Polar, counted");
    const update = () => {
      const xs = Array.from({ length: 57 }, (_, k) => k * 0.25), lg = f => xs.map(x => Math.log10(f(fromDB(x))));
      box.replaceChildren(lineChart({ label: "Bit error probability against E/N0 with the matched filter",
        lines: [{ x: xs, y: lg(BER.polar), name: "polar" }, { x: xs, y: lg(BER.unipolar), name: "unipolar, orthogonal", cls: "second" }],
        marks: [{ x: e, y: Math.log10(BER.polar(fromDB(e))), shape: "dot" }],
        xLabel: "E/N0 [dB]", yLabel: "Bit error probability, log₁₀ Pb [1]", yMin: -8, yMax: 0, yFormat: v => sci(10 ** v, 1) }));
      const c = berCounted(fromDB(e), NOISE);
      rP.set(sci(BER.polar(fromDB(e))), "", "½ erfc(√(E/N0))");
      rU.set(sci(BER.unipolar(fromDB(e))), "", "½ erfc(√(E/2N0)): 3 dB more for the same");
      rC.set(c ? sci(c) : "none", "", `in ${NOISE.length.toLocaleString("en")} seeded bits`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Energy per bit over noise density E/N0", unit: "dB", min: 0, max: 14, value: e, step: 0.25, format: v => `${v} dB`, onInput: v => { e = v; update(); } }),
      rP.el, rU.el, rC.el,
      h("p", { class: "hint" }, "The matched filter h(t) = s(T0 − t) gives SNR = 2E/N0 at the decision instant whatever the pulse's shape (set 4, slide 80): only the energy counts. Polar symbols ±s stand twice as far apart as 0 and s at the same mean energy, so unipolar needs 3 dB more. The count reads none below about 10⁻⁵: too few bits to see an error."))));
    update();
  },
};
