// The geometric series, Taschner p. 126: 1 + q + q² + … = 1/(1 − q), but only for |q| < 1; the same trick applied
// to q = 2 would claim 1 + 2 + 4 + … = −1, which is why the script insists on limits.
import { geometricPartial, geometricSum } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";
import { fixed } from "./plane.js";

const N = 30;

export default {
  id: "series",
  art: () => a.picture("Partial sums as dots climbing towards a dashed line",
    a.line([[20, 130], [180, 130]], a.DIM, 2) + a.line([[20, 40], [180, 40]], a.HOT, 2, "6 4") +
      [0, 1, 2, 3, 4, 5, 6, 7].map(k => a.circle(30 + k * 20, 130 - 90 * (1 - 0.6 ** (k + 1)), 4, a.ACC, 2, a.ACC)).join("")),
  mount(root) {
    let q = 0.6;
    const box = h("div", {}), rS = readout("Partial sum after 30 terms"), rL = readout("1/(1 − q)");
    const update = () => {
      const s = geometricPartial(q, N), sum = geometricSum(q), ns = s.map((_, k) => k + 1), conv = Number.isFinite(sum);
      box.replaceChildren(lineChart({ label: `Partial sums of the geometric series for q = ${q}`,
        lines: [{ x: ns, y: s, name: "partial sum sₙ", stem: true }, ...(conv ? [{ x: [1, N], y: [sum, sum], name: "1/(1 − q)", cls: "second" }] : [])],
        xLabel: "Number of terms n [1]", yLabel: "Partial sum sₙ [1]", yMin: -6, yMax: 12, xFormat: v => v.toFixed(0) }));
      rS.set(fixed(s.at(-1)));
      rL.set(conv ? fixed(sum) : "no sum", conv ? "" : "warn",
        conv ? "the partial sums settle on it" : `|q| ≥ 1: the formula would say ${q === 1 ? "nothing" : fixed(1 / (1 - q))}, which is wrong`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Ratio q", unit: "", min: -1.2, max: 2, value: q, step: 0.05, format: v => v.toFixed(2), onInput: v => { q = Math.round(v * 100) / 100; update(); } }),
      rS.el, rL.el,
      h("p", { class: "hint" }, "Below |q| = 1 the partial sums close in on 1/(1 − q), from one side for q > 0 and alternating for q < 0. Set q = 2: multiplying the series by q promises −1, but the partial sums run off the chart. That is the script's warning on p. 126."))));
    update();
  },
};
