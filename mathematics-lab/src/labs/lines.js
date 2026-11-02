// Two linear equations, two lines, Taschner § 59 (p. 336) and Cramer's rule (p. 400): the lines meet in one point
// exactly when the determinant is not zero, and each unknown is a quotient of two determinants.
import { det2, cramer2 } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { board, px, fixed } from "./plane.js";

export default {
  id: "lines",
  art: () => a.picture("Two straight lines crossing in one point",
    a.line([[20, 130], [180, 30]], a.ACC, 3) + a.line([[20, 40], [180, 120]], a.COOL, 3) + a.circle(100, 80, 6, a.INK, 2, a.INK)),
  mount(root) {
    const A = { a11: 1, a12: 1, b1: 1, a21: 1, a22: -1, b2: 0 };
    const box = h("div", {}), rD = readout("Determinant a11 a22 − a12 a21"), rS = readout("Solution (x, y) by Cramer's rule");
    // A line a x + b y = c, clipped to the drawing.
    const line = (p, q, c, cls) => {
      const pts = Math.abs(q) > Math.abs(p)
        ? [-2.3, 2.3].map(x => [x, (c - p * x) / q]) : [-1.5, 1.5].map(y => [(c - q * y) / p, y]);
      if (!pts.every(pt => pt.every(Number.isFinite))) return null;
      const [[x1, y1], [x2, y2]] = pts.map(px);
      return s("line", { x1, y1, x2, y2, class: `eqline ${cls}` });
    };
    const update = () => {
      const d = det2(A.a11, A.a12, A.a21, A.a22), sol = cramer2(A.a11, A.a12, A.a21, A.a22, A.b1, A.b2);
      const [X, Y] = sol ? px(sol) : [0, 0];
      box.replaceChildren(board([line(A.a11, A.a12, A.b1, "one"), line(A.a21, A.a22, A.b2, "two"),
        sol ? s("circle", { cx: X, cy: Y, r: 6, class: "end" }) : null], "Two lines, one per equation, and where they meet"));
      rD.set(fixed(d, 2), sol ? "" : "warn", sol ? "" : "zero: the lines are parallel, or the same line");
      rS.set(sol ? `(${fixed(sol[0])}, ${fixed(sol[1])})` : "none, or infinitely many");
    };
    const k = (key, label) => slider({ label, unit: "", min: -2, max: 2, value: A[key], step: 0.1, format: v => v.toFixed(1), onInput: v => { A[key] = v; update(); } });
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      h("p", { class: "hint" }, "a11 x + a12 y = b1 (solid), a21 x + a22 y = b2 (dashed)"),
      k("a11", "a11"), k("a12", "a12"), k("b1", "b1"), k("a21", "a21"), k("a22", "a22"), k("b2", "b2"),
      rD.el, rS.el,
      h("p", { class: "hint" }, "Turn one line until it lies parallel to the other: the determinant reaches zero just then, and Cramer's quotients x = det(b, a₂)/det(a₁, a₂) lose their denominator. The script calls Cramer's rule elegant but useless for practical sums (p. 400): elimination is cheaper."))));
    update();
  },
};
