// Circulation and curl, Fritzsche (2003) ch. 10 §§ 1 and 3: the circulation of F round a circle, ∮ F • dx, against
// the curl summed over the disc inside, ∫ (g_x − f_y) dx dy: Green's theorem (p. 61), the plane case of Stokes'
// theorem (p. 77). Divided by the area, the circulation of a small circle is the curl there (p. 79).
import { FIELDS, lineIntegral, circle, curlOverDisc, curlZ } from "../core/index.js";
import { h, s, slider, readout, choice } from "../../../kit/ui/kit.js";
import { draggable } from "../../../kit/ui/field.js";
import * as a from "../../../kit/ui/art.js";
import { view, px, toPlane, UNIT, fixed3 } from "./plane.js";

export default {
  id: "stokes",
  art: () => a.picture("A circle in a swirling field, arrows running round its edge",
    a.circle(100, 75, 50, a.ACC, 3) + [0, 1, 2, 3, 4, 5].map(k => { const t = k * Math.PI / 3;
      return a.arrow(100 + 50 * Math.cos(t), 75 + 50 * Math.sin(t), 100 + 50 * Math.cos(t) - 18 * Math.sin(t), 75 + 50 * Math.sin(t) + 18 * Math.cos(t), a.INK, 2, 6); }).join("") +
      a.text(100, 82, "rot F", 16, a.HOT)),
  mount(root) {
    let key = "rotation", cx = 0.6, cy = 0.3, R = 0.6;
    const box = h("div", {}), rC = readout("Circulation round the edge, ∮ F • dx"), rA = readout("Curl over the disc, ∫ (g_x − f_y) dx dy"),
      rD = readout("Circulation per area, near the centre");
    const update = () => {
      const F = FIELDS[key].f, ring = circle(cx, cy, R), circ = lineIntegral(F, ring), area = curlOverDisc(F, cx, cy, R);
      const [X, Y] = px([cx, cy]), sing = FIELDS[key].singular, inside = sing && Math.hypot(sing[0] - cx, sing[1] - cy) < R;
      const svg = view(F, [s("circle", { cx: X, cy: Y, r: R * UNIT, class: "surface" })], `${FIELDS[key].name} with a circle you move`);
      draggable(svg, (x, y) => { [cx, cy] = toPlane(x, y).map(v => Math.round(v * 20) / 20); sx.set(cx); sy.set(cy); update(); });
      box.replaceChildren(svg);
      rC.set(fixed3(circ));
      // Inside the vortex's circle F is not differentiable at the origin, so Green's theorem does not apply there.
      rA.set(fixed3(area), inside ? "warn" : "", inside ? "the origin is inside, where F is not defined: Green does not apply" : "");
      // The density of p. 79 for a small circle about the centre, and rot F there for comparison.
      const e = 0.01, density = lineIntegral(F, circle(cx, cy, e), 400) / (Math.PI * e * e);
      const atPole = sing && Math.hypot(sing[0] - cx, sing[1] - cy) < 0.05;
      if (atPole) rD.set("—", "", "not defined at the origin, where F is not"); else rD.set(Number.isFinite(density) ? fixed3(density) : "—", "", `rot F • e_z at the centre = ${fixed3(curlZ(F, cx, cy))}`);
    };
    const sx = slider({ label: "Centre x", unit: "", min: -1.8, max: 1.8, value: cx, step: 0.05, format: v => v.toFixed(2), onInput: v => { cx = v; update(); } });
    const sy = slider({ label: "Centre y", unit: "", min: -1, max: 1, value: cy, step: 0.05, format: v => v.toFixed(2), onInput: v => { cy = v; update(); } });
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Field", Object.entries(FIELDS).map(([k, v]) => [k, v.name]), key, v => { key = v; update(); }),
      sx, sy, slider({ label: "Radius", unit: "", min: 0.1, max: 1.4, value: R, step: 0.05, format: v => v.toFixed(2), onInput: v => { R = v; update(); } }),
      rC.el, rA.el, rD.el,
      h("p", { class: "hint" }, "Drag on the drawing to move the circle. The two first readouts agree for every circle that keeps clear of the vortex's origin: what runs round the edge is what turns inside. The rotation field turns everywhere alike, so the circulation grows with the area; the source and the gradient field do not turn at all. The vortex turns nowhere except at the origin: a circle round it still collects 2π. The Electrodynamics Lab puts this to work in the law of induction."))));
    update();
  },
};
