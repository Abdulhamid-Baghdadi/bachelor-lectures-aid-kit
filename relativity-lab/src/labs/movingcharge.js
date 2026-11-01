// E and B mix under a boost, Einstein (1905) p. 909. A charge rests in k: there it has Coulomb's field and no B. Seen
// from K, where it passes at v, the transformation gives a field squeezed towards the plane across the motion and a
// magnetic field B = v × E / c² circling the path. Arrows show E, the colour B_z (out of the page red, into it blue).
import { movingCharge, lorentzFactor, EPS0, C0, si } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import { heatmap, arrows } from "../../../kit/ui/field.js";
import * as a from "../../../kit/ui/art.js";

// 1 drawing unit is 1 mm; the charge of 1 nC sits in the middle.
const W = 460, H = 300, Q = 1e-9;

export default {
  id: "movingcharge",
  art: () => a.picture("A charge moving right, its field lines bunched into a band across the motion",
    a.circle(100, 75, 12, a.HOT, 3) + a.text(100, 81, "+", 18, a.HOT) +
      [-80, -60, 60, 80, 90, -90, 75, -75].map(d => a.arrow(100, 75, 100 + 55 * Math.cos(d * Math.PI / 180), 75 - 55 * Math.sin(d * Math.PI / 180), a.ACC, 2)).join("") +
      a.arrow(100, 75, 128, 75, a.DIM, 2) + a.arrow(30, 140, 80, 140, a.INK, 3)),
  mount(root) {
    let beta = 0.8;
    const drawing = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic field", role: "img",
      "aria-label": "The field of a charge moving to the right: arrows for E, colour for the magnetic flux density out of or into the page" });
    const rE = readout("|E| 40 mm across the path"), rA = readout("|E| 40 mm ahead"), rB = readout("B_z 40 mm across the path"), rR = readout("Across over at rest");
    const update = () => {
      const v = beta * C0, at = (x, y) => movingCharge(Q, v, (x - W / 2) / 1000, (H / 2 - y) / 1000);
      const rest = Q / (4 * Math.PI * EPS0 * 0.04 ** 2);
      drawing.replaceChildren(
        heatmap(W, H, 46, 30, (x, y) => at(x, y).B[2], rest * Math.max(beta, 0.05) / C0),
        arrows(W, H, 23, 15, (x, y) => { const f = at(x, y); return [f.E[0], f.E[1]]; }),
        s("g", { class: "charge" }, s("circle", { cx: W / 2, cy: H / 2, r: 13 }), s("text", { x: W / 2, y: H / 2 + 5, "text-anchor": "middle" }, "+")),
        s("text", { x: 10, y: H - 8, class: "tick" }, `moving right at ${beta.toFixed(2)} c0; red: B out of the page, blue: into it`));
      const side = at(W / 2, H / 2 - 40), ahead = at(W / 2 + 40, H / 2);
      rE.set(si(Math.hypot(...side.E), "V/m")); rA.set(si(Math.hypot(...ahead.E), "V/m"));
      rB.set(si(side.B[2], "T"), "", "out of the page above the path");
      rR.set(`${(Math.hypot(...side.E) / rest).toFixed(3)} = γ = ${lorentzFactor(v).toFixed(3)}`);
    };
    root.append(h("div", { class: "stage" }, drawing, h("div", { class: "controls" },
      slider({ label: "Speed of the charge v/c0", unit: "", min: 0, max: 0.99, value: beta, step: 0.01, format: v => v.toFixed(2), onInput: v => { beta = v; update(); } }),
      rE.el, rA.el, rB.el, rR.el,
      h("p", { class: "hint" }, "At v = 0 there is only Coulomb's field. Speed up: across the path E grows by γ, ahead and behind it falls by γ², and a magnetic field appears, though nothing changed but the frame. Gauss's law still holds: the total flux stays Q/ε0. Einstein: electric and magnetic forces have no existence apart from the state of motion of the frame (p. 910)."))));
    update();
  },
};
