// Flux and divergence, Fritzsche (2003) ch. 10 § 4: the flux of F out of a sphere, ∫ F • dO, against the divergence
// summed over the ball, ∫ div F dV: Gauss's theorem (p. 85). Divided by the volume, the flux out of a small sphere is
// the divergence there, the source density (p. 87). The sphere's centre lies in the plane z = 0 that the drawing shows.
import { FIELDS, fluxThroughSphere, divergenceOverBall, divergence } from "../core/index.js";
import { h, s, slider, readout, choice } from "../../../kit/ui/kit.js";
import { draggable } from "../../../kit/ui/field.js";
import * as a from "../../../kit/ui/art.js";
import { view, px, toPlane, UNIT, fixed3 } from "./plane.js";

export default {
  id: "gauss",
  art: () => a.picture("A sphere with arrows streaming out through its surface",
    a.circle(100, 75, 42, a.ACC, 3) + [0, 1, 2, 3, 4, 5, 6, 7].map(k => { const t = k * Math.PI / 4;
      return a.arrow(100 + 46 * Math.cos(t), 75 + 46 * Math.sin(t), 100 + 66 * Math.cos(t), 75 + 66 * Math.sin(t), a.INK, 2, 6); }).join("") +
      a.text(100, 82, "div F", 16, a.HOT)),
  mount(root) {
    let key = "source", cx = 0.4, cy = 0.2, R = 0.6;
    const box = h("div", {}), rF = readout("Flux out of the sphere, ∫ F • dO"), rV = readout("Divergence over the ball, ∫ div F dV"),
      rD = readout("Flux per volume, near the centre");
    const update = () => {
      const F = FIELDS[key].f, flux = fluxThroughSphere(F, cx, cy, R), vol = divergenceOverBall(F, cx, cy, R);
      const [X, Y] = px([cx, cy]), sing = FIELDS[key].singular, inside = sing && Math.hypot(sing[0] - cx, sing[1] - cy) < R;
      const svg = view(F, [s("circle", { cx: X, cy: Y, r: R * UNIT, class: "surface" })], `${FIELDS[key].name} with a sphere you move`);
      draggable(svg, (x, y) => { [cx, cy] = toPlane(x, y).map(v => Math.round(v * 20) / 20); sx.set(cx); sy.set(cy); update(); });
      box.replaceChildren(svg);
      rF.set(fixed3(flux));
      rV.set(fixed3(vol), inside ? "warn" : "", inside ? "the z-axis runs through the ball, where F is not defined: Gauss does not apply" : "");
      const e = 0.02, density = fluxThroughSphere(F, cx, cy, e, 40) / (4 / 3 * Math.PI * e ** 3);
      const atPole = sing && Math.hypot(sing[0] - cx, sing[1] - cy) < 0.05;
      if (atPole) rD.set("—", "", "not defined at the origin, where F is not"); else rD.set(Number.isFinite(density) ? fixed3(density) : "—", "", `div F at the centre = ${fixed3(divergence(F, cx, cy))}`);
    };
    const sx = slider({ label: "Centre x", unit: "", min: -1.8, max: 1.8, value: cx, step: 0.05, format: v => v.toFixed(2), onInput: v => { cx = v; update(); } });
    const sy = slider({ label: "Centre y", unit: "", min: -1, max: 1, value: cy, step: 0.05, format: v => v.toFixed(2), onInput: v => { cy = v; update(); } });
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Field", Object.entries(FIELDS).map(([k, v]) => [k, v.name]), key, v => { key = v; update(); }),
      sx, sy, slider({ label: "Radius", unit: "", min: 0.1, max: 1.4, value: R, step: 0.05, format: v => v.toFixed(2), onInput: v => { R = v; update(); } }),
      rF.el, rV.el, rD.el,
      h("p", { class: "hint" }, "Drag on the drawing to move the sphere; the circle is where it cuts the plane z = 0. The two first readouts agree: what flows out through the surface is what springs up inside. The source field springs up everywhere alike, div F = 2, so the flux grows with the volume. The rotation, gradient and shear fields only stream through: as much goes in as comes out. The Electrodynamics Lab puts this to work in Gauss's law for the electric field."))));
    update();
  },
};
