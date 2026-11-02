// The Babylonian square root, Taschner pp. 1–3: a rectangle of area a whose sides x and a/x are replaced by their
// mean, again and again, until it is a square; for a = 10 from x = 3 the script reaches 19/6, then 721/228.
import { babylonian } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { fixed } from "./plane.js";

export default {
  id: "babylon",
  art: () => a.picture("A long rectangle turning into a square in three steps",
    a.rect(20, 95, 160, 30, a.DIM, 2) + a.rect(45, 70, 110, 55, a.INK, 2) + a.rect(65, 50, 70, 75, a.ACC, 3)),
  mount(root) {
    let A = 10, x0 = 1, n = 0;
    const box = h("div", {}), rX = readout("Side x after the steps"), rY = readout("Other side a/x"), rE = readout("x² − a, the error");
    const update = () => {
      const xs = babylonian(A, x0, 6), x = xs[n], y = A / x;
      // One scale for every step, set by the longest side the steps ever reach, so the rectangle visibly squares up.
      const longest = Math.max(...xs, ...xs.map(v => A / v)), k = 250 / longest;
      const rects = xs.slice(0, n + 1).map((xi, i) => s("rect", { x: 30, y: 270 - (A / xi) * k, width: xi * k, height: (A / xi) * k,
        class: i === n ? "rect now" : "rect faint" }));
      box.replaceChildren(s("svg", { viewBox: "0 0 460 300", class: "schematic", role: "img", "aria-label": `Rectangles of area ${A}, step ${n}` },
        ...rects, s("text", { x: 30 + x * k / 2, y: 290, class: "label", "text-anchor": "middle" }, `x = ${fixed(x, 6)}`)));
      rX.set(fixed(x, 9)); rY.set(fixed(y, 9)); rE.set(fixed(x * x - A, 9), "", `√${A} = ${fixed(Math.sqrt(A), 9)}`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Area a", unit: "", min: 2, max: 20, value: A, step: 1, format: v => String(v), onInput: v => { A = v; update(); } }),
      slider({ label: "First side x0", unit: "", min: 1, max: 10, value: x0, step: 0.5, format: v => String(v), onInput: v => { x0 = v; update(); } }),
      slider({ label: "Steps", unit: "", min: 0, max: 6, value: n, step: 1, format: v => String(v), onInput: v => { n = v; update(); } }),
      rX.el, rY.el, rE.el,
      h("p", { class: "hint" }, "Each step keeps the area and replaces the sides by their mean, so the rectangle gets squarer. The number of correct digits roughly doubles with each step: for a = 10 from x0 = 3 the script gets 19/6, then 721/228. It is Newton's formula for x² − a, as the script remarks on p. 308."))));
    update();
  },
};
