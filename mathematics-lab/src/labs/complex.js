// Complex numbers, Taschner pp. 92–94: in the plane, multiplying by z = r(cos φ + j sin φ) stretches by r and turns by
// φ, so |zζ| = |z||ζ| and arg zζ = arg z + arg ζ (p. 93); raising to the n-th power gives de Moivre's formula (p. 94).
import { cMul, cAbs, cArg, polar, cPow } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { board, vector, fixed } from "./plane.js";

const deg = r => (r * 180 / Math.PI + 360) % 360;

export default {
  id: "complex",
  art: () => a.picture("Two arrows from the origin and their product, turned by the sum of their angles",
    a.arrow(40, 130, 110, 110, a.INK, 3) + a.arrow(40, 130, 80, 80, a.COOL, 3) + a.arrow(40, 130, 100, 40, a.ACC, 3)),
  mount(root) {
    let r1 = 1.2, p1 = 30, r2 = 1.1, p2 = 50, n = 1;
    const box = h("div", {}), rP = readout("Product zζ"), rA = readout("Its modulus and argument"), rN = readout("Power zⁿ, modulus and argument");
    const update = () => {
      const z = polar(r1, p1 * Math.PI / 180), w = polar(r2, p2 * Math.PI / 180), zw = cMul(z, w), zn = cPow(z, n);
      box.replaceChildren(board([vector(z, "one", "z"), vector(w, "two", "ζ"), vector(zw, "three", "zζ"), n > 1 ? vector(zn, "four", `z^${n}`) : null],
        "The complex plane: z, ζ, their product and a power of z"));
      rP.set(`${fixed(zw[0])} ${zw[1] < 0 ? "−" : "+"} j ${fixed(Math.abs(zw[1]))}`);
      rA.set(`${fixed(cAbs(zw))}, ${fixed(deg(cArg(zw)), 1)}°`, "", `${fixed(r1, 2)} · ${fixed(r2, 2)} = ${fixed(r1 * r2)};  ${p1}° + ${p2}° = ${(p1 + p2) % 360}°`);
      rN.set(`${fixed(cAbs(zn))}, ${fixed(deg(cArg(zn)), 1)}°`, "", `rⁿ = ${fixed(r1 ** n)}, n φ = ${(n * p1) % 360}°`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Modulus |z|", unit: "", min: 0.2, max: 1.5, value: r1, step: 0.05, format: v => v.toFixed(2), onInput: v => { r1 = v; update(); } }),
      slider({ label: "Argument of z", unit: "°", min: 0, max: 360, value: p1, step: 5, format: v => `${v}°`, onInput: v => { p1 = v; update(); } }),
      slider({ label: "Modulus |ζ|", unit: "", min: 0.2, max: 1.5, value: r2, step: 0.05, format: v => v.toFixed(2), onInput: v => { r2 = v; update(); } }),
      slider({ label: "Argument of ζ", unit: "°", min: 0, max: 360, value: p2, step: 5, format: v => `${v}°`, onInput: v => { p2 = v; update(); } }),
      slider({ label: "Power n", unit: "", min: 1, max: 8, value: n, step: 1, format: v => String(v), onInput: v => { n = v; update(); } }),
      rP.el, rA.el, rN.el,
      h("p", { class: "hint" }, "Multiplying is a turn and a stretch: the moduli multiply and the angles add. With |z| = 1 every power stays on the unit circle and only turns: (cos φ + j sin φ)ⁿ = cos nφ + j sin nφ, de Moivre's formula."))));
    update();
  },
};
