// Newton's formula, Taschner p. 308: the tangent at x meets the x-axis at x* = x − f(x)/f'(x), the next, better guess.
// For f(x) = x³ − 2 from x = 1 the script gets 4/3, then 91/72 on its way to the cube root of 2.
import { newton } from "../core/index.js";
import { h, s, slider, readout, choice } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { fixed } from "./plane.js";

const FUNCTIONS = {
  cube: { name: "f(x) = x³ − 2", f: x => x ** 3 - 2, df: x => 3 * x * x, root: Math.cbrt(2) },
  square: { name: "f(x) = x² − 10, Babylonian", f: x => x * x - 10, df: x => 2 * x, root: Math.sqrt(10) },
  cosine: { name: "f(x) = cos x − x", f: x => Math.cos(x) - x, df: x => -Math.sin(x) - 1, root: 0.7390851332151607 },
};
const W = 460, H = 300;

export default {
  id: "newton",
  art: () => a.picture("A curve and tangents stepping down to where it crosses the axis",
    a.path("M20 140 Q120 130 190 20", a.INK, 3) + a.line([[10, 130], [190, 130]], a.DIM, 2) +
      a.line([[170, 40], [120, 130]], a.ACC, 2) + a.line([[120, 130], [120, 112]], a.DIM, 2, "4 3") + a.line([[120, 112], [95, 130]], a.ACC, 2)),
  mount(root) {
    let key = "cube", x0 = 1, n = 2;
    const box = h("div", {}), rX = readout("Guess after the steps"), rE = readout("Distance from the root");
    const update = () => {
      const F = FUNCTIONS[key], xs = newton(F.f, F.df, x0, n), lo = Math.min(...xs, F.root) - 0.5, hi = Math.max(...xs, F.root) + 0.5;
      const ys = Array.from({ length: 201 }, (_, i) => F.f(lo + i * (hi - lo) / 200)), ymin = Math.min(0, ...ys), ymax = Math.max(0, ...ys);
      const X = x => 20 + (x - lo) / (hi - lo) * (W - 40), Y = y => H - 20 - (y - ymin) / (ymax - ymin || 1) * (H - 40);
      const steps = xs.slice(0, -1).flatMap((x, k) => [
        s("line", { x1: X(x), y1: Y(0), x2: X(x), y2: Y(F.f(x)), class: "drop" }),
        s("line", { x1: X(x), y1: Y(F.f(x)), x2: X(xs[k + 1]), y2: Y(0), class: "tangent" })]);
      box.replaceChildren(s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic", role: "img", "aria-label": `${F.name}: ${n} Newton steps from x = ${x0}` },
        s("line", { x1: 0, y1: Y(0), x2: W, y2: Y(0), class: "axis" }),
        s("polyline", { points: ys.map((y, i) => `${X(lo + i * (hi - lo) / 200).toFixed(1)},${Y(y).toFixed(1)}`).join(" "), class: "curve" }),
        ...steps, ...xs.map((x, k) => s("circle", { cx: X(x), cy: Y(0), r: k === xs.length - 1 ? 5 : 3, class: "end" }))));
      const x = xs.at(-1);
      rX.set(fixed(x, 10)); rE.set(Math.abs(x - F.root).toExponential(2), Number.isFinite(x) ? "" : "warn", Number.isFinite(x) ? "" : "the tangent was flat: no next guess");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Function", Object.entries(FUNCTIONS).map(([k, v]) => [k, v.name]), key, v => { key = v; update(); }),
      slider({ label: "Start x0", unit: "", min: 0.2, max: 5, value: x0, step: 0.1, format: v => v.toFixed(1), onInput: v => { x0 = v; update(); } }),
      slider({ label: "Steps", unit: "", min: 0, max: 6, value: n, step: 1, format: v => String(v), onInput: v => { n = v; update(); } }),
      rX.el, rE.el,
      h("p", { class: "hint" }, "Each step follows the tangent down to the x-axis. Near the root the distance roughly squares with each step: 2 steps from x0 = 1 give the script's 91/72 = 1.2639 for the cube root of 2, and 4 steps are right to ten digits. For x² − 10 the steps are exactly the Babylonian ones."))));
    update();
  },
};
