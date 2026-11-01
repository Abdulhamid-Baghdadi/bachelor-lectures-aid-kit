// Routh–Hurwitz (Kugi 2015, 4.4.1): the Routh array (4.31) with entries (4.32) tells from the coefficients alone
// whether a polynomial is Hurwitz; for the loop of Beispiel 4.4 it gives the range 0 < K < 3 (4.36).
import { routh, roots, loopRouthKmax } from "../core/index.js";
import { h, slider, readout, choice } from "../ui/kit.js";
import { lineChart } from "../ui/chart.js";
import * as a from "../ui/art.js";

const CASES = {
  loop: { text: "Loop of Beispiel 4.4: s³ + 3s² + 9s + 9K (4.34)" },
  n430: { text: "s³ + s² + 11s + 51 (4.30)", p: [1, 1, 11, 51] },
  n2: { text: "n2 = s⁴ + 9s³ + 13s² + 54s + 40 (Aufgabe 4.6)", p: [1, 9, 13, 54, 40] },
  n3: { text: "n3 = s⁴ + 6s³ + 13s² + 30s + 40 (Aufgabe 4.6)", p: [1, 6, 13, 30, 40] },
};
const fmt = v => Number.isFinite(v) ? String(Number(v.toFixed(3))) : "—";

export default {
  id: "routh",
  art: () => a.picture("A Routh array: rows of coefficients with the pivot column marked",
    [0, 1, 2, 3].map(i => a.text(30, 38 + i * 26, `s${3 - i}`, 14, a.DIM) + a.text(80, 38 + i * 26, ["1", "3", "9−3K", "9K"][i], 14) +
      (i < 2 ? a.text(140, 38 + i * 26, ["9", "9K"][i], 14) : "")).join("") + a.rect(55, 18, 50, 108, a.ACC, 2)),
  mount(root) {
    let which = "loop", K = 1;
    const chart = h("div", { class: "plot" }), table = h("table", { class: "routh" });
    const verdict = readout("Sign changes in the pivot column"), range = readout("Stable for gains");
    const update = () => {
      const p = which === "loop" ? [1, 3, 9, 9 * K] : CASES[which].p, r = routh(p), n = p.length - 1;
      table.replaceChildren(h("caption", {}, "Routh array (4.31); the first column is the pivot column"),
        ...r.rows.map((row, i) => h("tr", {}, h("th", { scope: "row" }, `s^${n - i}`), ...row.map((v, j) => h("td", j ? {} : { class: "pivot" }, fmt(v))))));
      verdict.set(String(r.changes), r.changes ? "danger" : "",
        !r.regular ? "a zero in the pivot column: the test needs a special step" : r.changes ? `${r.changes} roots in the right half plane: not Hurwitz` : "all pivots share one sign: Hurwitz");
      range.set(which === "loop" ? `0 < K < ${fmt(loopRouthKmax({ num: [9], den: [1, 3, 9, 0] }))}` : "—", "", which === "loop" ? "from 9 − 3K > 0 and 9K > 0 (4.36)" : "no gain in this polynomial");
      const z = roots(p);
      chart.replaceChildren(lineChart({ lines: [{ x: [0, 0], y: [-6, 6], cls: "faint" }], marks: z.map(([re, im]) => ({ x: re, y: im, shape: "x" })),
        xMin: -10, xMax: 4, yMin: -6, yMax: 6, xLabel: "Real part Re(s) [1/s]", yLabel: "Imaginary part Im(s) [1/s]", label: "Roots of the polynomial in the s-plane" }));
    };
    const gain = slider({ label: "Loop gain K", unit: "", min: 0.1, max: 6, value: K, step: 0.05, onInput: v => { K = v; update(); }, format: v => v.toFixed(2) });
    root.append(h("div", { class: "stage" }, chart, h("div", { class: "controls" },
      choice("Polynomial", Object.entries(CASES).map(([k, c]) => [k, c.text]), which, v => { which = v; gain.el.hidden = v !== "loop"; update(); }),
      gain, table, verdict.el, range.el,
      h("p", { class: "hint" }, "Count the sign changes down the pivot column: each is a root in the right half plane. Polynomial (4.30) has all coefficients positive and still is not Hurwitz, so that sign test is only necessary (Satz 4.2). Push K past 3 and the s¹ pivot 9 − 3K turns negative as two roots cross the imaginary axis."))));
    update();
  },
};
