// From secant to tangent, Taschner pp. 204–205: the secant through X and X + ΔX cuts the curve twice; as ΔX shrinks it
// turns into the tangent, which only touches it, and its slope into the differential quotient dy/dx.
import { secantSlope } from "../core/index.js";
import { h, s, slider, readout, choice } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { fixed } from "./plane.js";

// Each function with its derivative, by the rules of differentiation.
const FUNCTIONS = {
  cube: { name: "f(x) = x³ − 2x", f: x => x ** 3 - 2 * x, df: x => 3 * x * x - 2 },
  sine: { name: "f(x) = sin x", f: Math.sin, df: Math.cos },
  exp: { name: "f(x) = eˣ", f: Math.exp, df: Math.exp },
};
const W = 460, H = 300, X = x => W / 2 + x * 80, Y = y => H / 2 - y * 40;

export default {
  id: "tangent",
  art: () => a.picture("A curve with a secant through two points turning into the tangent at one",
    a.path("M20 130 Q100 140 190 20", a.INK, 3) + a.line([[30, 150], [190, 50]], a.DIM, 2, "6 4") + a.line([[30, 140], [190, 70]], a.ACC, 3) +
      a.circle(100, 105, 5, a.ACC, 2, a.ACC)),
  mount(root) {
    let key = "cube", x = 0.6, dx = 1;
    const box = h("div", {}), rS = readout("Slope of the secant, Δy/Δx"), rT = readout("Slope of the tangent, dy/dx");
    const update = () => {
      const F = FUNCTIONS[key], k = secantSlope(F.f, x, dx), t = F.df(x), y0 = F.f(x);
      const curve = Array.from({ length: 241 }, (_, i) => -2.8 + i * 5.6 / 240).map(u => `${X(u).toFixed(1)},${Y(F.f(u)).toFixed(1)}`).join(" ");
      const line = (m, cls) => s("line", { x1: X(-2.8), y1: Y(y0 + m * (-2.8 - x)), x2: X(2.8), y2: Y(y0 + m * (2.8 - x)), class: cls });
      box.replaceChildren(s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic", role: "img", "aria-label": `${F.name}, its secant and its tangent at x = ${x}` },
        s("line", { x1: 0, y1: H / 2, x2: W, y2: H / 2, class: "axis faint" }), s("line", { x1: W / 2, y1: 0, x2: W / 2, y2: H, class: "axis faint" }),
        s("polyline", { points: curve, class: "curve" }), line(t, "tangent"), line(k, "secant"),
        s("circle", { cx: X(x), cy: Y(y0), r: 5, class: "end" }), s("circle", { cx: X(x + dx), cy: Y(F.f(x + dx)), r: 5, class: "end two" })));
      rS.set(fixed(k, 4), "", `ΔX = ${fixed(dx, 3)}`); rT.set(fixed(t, 4), "", `difference ${fixed(k - t, 4)}`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Function", Object.entries(FUNCTIONS).map(([k, v]) => [k, v.name]), key, v => { key = v; update(); }),
      slider({ label: "Point x", unit: "", min: -1.5, max: 1.5, value: x, step: 0.05, format: v => v.toFixed(2), onInput: v => { x = v; update(); } }),
      slider({ label: "Step ΔX", unit: "", min: -1.2, max: 1.2, value: dx, step: 0.01, format: v => v.toFixed(2), onInput: v => { dx = Math.abs(v) < 0.005 ? 0.005 : v; update(); } }),
      rS.el, rT.el,
      h("p", { class: "hint" }, "Dashed: the secant, through the two dots. Solid: the tangent. Shrink the step and the second dot slides onto the first; the secant turns into the tangent and the difference of their slopes goes to zero. Leibniz's characteristic triangle, p. 205, is the vanishing triangle between the dots."))));
    update();
  },
};
