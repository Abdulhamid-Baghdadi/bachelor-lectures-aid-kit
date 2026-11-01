// Entropy and Huffman coding (Goiser 2016, set 5, slides 26–64): the slides' eight-symbol source to start with; move a
// weight and the code is built again.
import { entropy, huffman, meanLength, information } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const NAMES = "ABCDEFGH";

export default {
  id: "huffman",
  art: () => a.picture("A code tree: pairs of branches merge, then merge again, into one root",
    a.line([[20, 30], [70, 30], [70, 50], [20, 50]], a.INK, 2) + a.line([[20, 85], [70, 85], [70, 105], [20, 105]], a.INK, 2) +
      a.line([[70, 40], [120, 40], [120, 95], [70, 95]], a.ACC, 3) + a.line([[120, 67], [180, 67]], a.ACC, 3) +
      a.line([[20, 130], [180, 130], [180, 67]], a.COOL, 2)),
  mount(root) {
    const w = [0.10, 0.18, 0.40, 0.05, 0.06, 0.10, 0.07, 0.04];
    const box = h("div", {}), table = h("table", { class: "eqs" });
    const rH = readout("Entropy H"), rL = readout("Mean length L"), rE = readout("Efficiency H / L");
    const update = () => {
      const sum = w.reduce((s, v) => s + v, 0), ps = w.map(v => v / sum), codes = huffman(ps), H = entropy(ps), L = meanLength(ps, codes);
      box.replaceChildren(lineChart({ label: "Each symbol's codeword length beside its information content",
        lines: [{ x: ps.map((_, i) => i), y: codes.map(c => c.length), name: "codeword length", stem: true },
                { x: ps.map((_, i) => i + 0.2), y: ps.map(information), name: "−ld p", stem: true, cls: "second" }],
        xLabel: "Symbol A … H [1]", yLabel: "Length [bit]", yMin: 0, xMin: -0.3, xMax: 7.5, xFormat: v => NAMES[Math.max(0, Math.round(v))] ?? "" }));
      table.replaceChildren(h("thead", {}, h("tr", {}, h("th", {}, "Symbol"), h("th", {}, "Probability"), h("th", {}, "Codeword"))),
        h("tbody", {}, ps.map((p, i) => h("tr", {}, h("td", {}, NAMES[i]), h("td", {}, p.toFixed(3)), h("td", { class: "eq" }, codes[i])))));
      rH.set(`${H.toFixed(3)} bit/symbol`, "", "at most ld 8 = 3"); rL.set(`${L.toFixed(3)} bit/symbol`, "", "Σ p l");
      rE.set(`${(H / L * 100).toFixed(1)} %`, "", `a fixed 3-bit code: ${(H / 3 * 100).toFixed(1)} %`);
    };
    const sliders = w.map((v, i) => slider({ label: `Weight of ${NAMES[i]}`, unit: "", min: 0.01, max: 0.5, value: v, step: 0.01,
      format: x => x.toFixed(2), onInput: x => { w[i] = x; update(); } }).el);
    root.append(h("div", { class: "stage" }, h("div", {}, box, table), h("div", { class: "controls" },
      rH.el, rL.el, rE.el, ...sliders,
      h("p", { class: "hint" }, "The weights are scaled to sum to one. The slides' source (slides 41 and 56) gives H = 2.55, L = 2.61, η = 97.7 %. Make every weight a power of ½ and L meets H exactly. Ties are broken the same way every time, so the code does not flicker."))));
    update();
  },
};
