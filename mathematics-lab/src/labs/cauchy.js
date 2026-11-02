// Cauchy's integral theorem, Taschner p. 493: for f holomorphic in a simply connected region G and a closed curve Γ in
// G, ∮Γ f(z) dz = 0. A circle round the pole of 1/z leaves that region and collects 2πj (worked by hand).
import { contourIntegral, COMPLEX_FUNCTIONS } from "../core/index.js";
import { h, s, slider, readout, choice } from "../../../kit/ui/kit.js";
import { draggable } from "../../../kit/ui/field.js";
import * as a from "../../../kit/ui/art.js";
import { board, px, toPlane, UNIT, fixed } from "./plane.js";

export default {
  id: "cauchy",
  art: () => a.picture("A closed curve in the complex plane beside a marked point it does not enclose",
    a.path("M40 80 C40 30 120 30 130 70 C140 110 60 130 40 80", a.ACC, 3) + a.circle(165, 60, 5, a.HOT, 3) + a.text(100, 85, "∮ = 0", 16, a.INK)),
  mount(root) {
    let key = "inverse", cx = 0.9, cy = 0.3, R = 0.6;
    const box = h("div", {}), rI = readout("∮ f(z) dz round the circle");
    const update = () => {
      const F = COMPLEX_FUNCTIONS[key], [re, im] = contourIntegral(F.f, [cx, cy], R), [X, Y] = px([cx, cy]);
      const pole = F.pole, inside = pole && Math.hypot(pole[0] - cx, pole[1] - cy) < R;
      const svg = board([s("circle", { cx: X, cy: Y, r: R * UNIT, class: "surface" }),
        pole ? s("circle", { cx: px(pole)[0], cy: px(pole)[1], r: 6, class: "pole" }) : null],
        `${F.name}: a circle you move${pole ? ", and the pole at 0" : ""}`);
      draggable(svg, (x, y) => { [cx, cy] = toPlane(x, y).map(v => Math.round(v * 20) / 20); sx.set(cx); sy.set(cy); update(); });
      box.replaceChildren(svg);
      rI.set(`${fixed(re)} ${im < 0 ? "−" : "+"} j ${fixed(Math.abs(im))}`, inside ? "warn" : "",
        inside ? "the pole is inside: f is not holomorphic there, and the integral need not vanish" : "holomorphic inside: zero, as Cauchy says");
    };
    const sx = slider({ label: "Centre, real part", unit: "", min: -1.8, max: 1.8, value: cx, step: 0.05, format: v => v.toFixed(2), onInput: v => { cx = v; update(); } });
    const sy = slider({ label: "Centre, imaginary part", unit: "", min: -1, max: 1, value: cy, step: 0.05, format: v => v.toFixed(2), onInput: v => { cy = v; update(); } });
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Function", Object.entries(COMPLEX_FUNCTIONS).map(([k, v]) => [k, v.name]), key, v => { key = v; update(); }),
      sx, sy, slider({ label: "Radius", unit: "", min: 0.1, max: 1.4, value: R, step: 0.05, format: v => v.toFixed(2), onInput: v => { R = v; update(); } }),
      rI.el,
      h("p", { class: "hint" }, "Drag the circle. For z² and eᶻ the integral is zero wherever it goes. For 1/z it is zero until the circle takes in the pole at 0; then it jumps to 2πj ≈ 6.283 j, whatever the circle's size. 1/z² stays zero even round its pole: a pole alone does not decide it. The Vector Calculus Lab's vortex is the same field seen as a vector field."))));
    update();
  },
};
