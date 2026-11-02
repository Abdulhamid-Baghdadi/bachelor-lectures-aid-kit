// The integral as an area, Taschner § 28, pp. 166–167: on each part of [a, b] a bar as high as the least value (the
// lower sum) and one as high as the greatest (the upper sum); finer parts squeeze the two together onto the area.
import { riemannSums } from "../core/index.js";
import { h, s, slider, readout, choice } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { fixed } from "./plane.js";

// Each function with its integral over [0, 2], worked by hand from its antiderivative.
const FUNCTIONS = {
  square: { name: "f(x) = x²", f: x => x * x, area: 8 / 3 },
  sine: { name: "f(x) = 1 + sin 3x", f: x => 1 + Math.sin(3 * x), area: 2 + (1 - Math.cos(6)) / 3 },
  root: { name: "f(x) = √x", f: x => Math.sqrt(x), area: 2 / 3 * 2 ** 1.5 },
};
const W = 460, H = 300, L = 40, B = 30, SX = (W - L - 20) / 2, SY = (H - B - 20) / 4;
const X = x => L + x * SX, Y = y => H - B - y * SY;

export default {
  id: "riemann",
  art: () => a.picture("Bars under a curve, a lower and an upper set, closing in on the area",
    [0, 1, 2, 3, 4, 5, 6].map(k => a.rect(20 + k * 24, 140 - 14 * (k + 1), 24, 14 * (k + 1), k % 2 ? a.ACC : a.DIM, 2)).join("") +
      a.path("M20 140 Q100 120 188 30", a.HOT, 3)),
  mount(root) {
    let key = "square", n = 6;
    const box = h("div", {}), rL = readout("Lower sum"), rU = readout("Upper sum"), rA = readout("The integral, the area");
    const update = () => {
      const F = FUNCTIONS[key], { lower, upper, bars } = riemannSums(F.f, 0, 2, n);
      const curve = Array.from({ length: 201 }, (_, k) => [X(k / 100), Y(F.f(k / 100))].map(v => v.toFixed(1)).join(",")).join(" ");
      box.replaceChildren(s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic", role: "img", "aria-label": `${F.name} with ${n} upper and lower bars` },
        ...bars.map(b => s("rect", { x: X(b.x0), y: Y(b.q), width: X(b.x1) - X(b.x0), height: Y(b.p) - Y(b.q), class: "sum upper" })),
        ...bars.map(b => s("rect", { x: X(b.x0), y: Y(b.p), width: X(b.x1) - X(b.x0), height: Y(0) - Y(b.p), class: "sum lower" })),
        s("polyline", { points: curve, class: "curve" }),
        s("line", { x1: L, y1: Y(0), x2: W - 10, y2: Y(0), class: "axis" }), s("line", { x1: L, y1: Y(0), x2: L, y2: 10, class: "axis" }),
        s("text", { x: X(2), y: H - 10, class: "label", "text-anchor": "middle" }, "x = 2"), s("text", { x: L, y: H - 10, class: "label", "text-anchor": "middle" }, "0")));
      rL.set(fixed(lower, 4)); rU.set(fixed(upper, 4), "", `upper − lower = ${fixed(upper - lower, 4)}`);
      rA.set(fixed(F.area, 4), "", "worked by hand from the antiderivative");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Function on [0, 2]", Object.entries(FUNCTIONS).map(([k, v]) => [k, v.name]), key, v => { key = v; update(); }),
      slider({ label: "Number of parts n", unit: "", min: 1, max: 60, value: n, step: 1, format: v => String(v), onInput: v => { n = v; update(); } }),
      rL.el, rU.el, rA.el,
      h("p", { class: "hint" }, "Dark bars: the lower sum, under the curve. Light tops: what the upper sum adds. The area always lies between the two sums, and with finer parts the light tops shrink away: a function is integrable when they can be made as thin as you like (§ 28)."))));
    update();
  },
};
