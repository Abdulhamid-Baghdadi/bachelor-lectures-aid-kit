// Line integrals and potentials, Fritzsche (2003) ch. 9 § 2: two paths from p to q, the straight one and an arc; in a
// gradient field both give f(q) − f(p) (Hauptsatz über Kurvenintegrale, p. 22), elsewhere they differ. Closing the
// loop gives zero exactly when the field has a potential; the vortex gives 2π round the origin (p. 21).
import { FIELDS, lineIntegral, segment, arc } from "../core/index.js";
import { h, s, slider, readout, choice } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { view, scaled, px, fixed3 } from "./plane.js";

export default {
  id: "paths",
  art: () => a.picture("Two paths from one point to another through a field of arrows, one straight and one curved",
    a.circle(40, 110, 6, a.INK, 3, a.INK) + a.circle(160, 40, 6, a.INK, 3, a.INK) + a.path("M40 110 L160 40", a.ACC, 3) +
      a.path("M40 110 C40 40 100 30 160 40", a.HOT, 3, "6 4")),
  mount(root) {
    let key = "gradient", bend = 1;
    const box = h("div", {}), rS = readout("Along the straight path"), rA = readout("Along the arc"), rL = readout("Round the closed loop");
    const P = [-1.2, -0.6], Q = [1.2, 0.9];
    const paths = () => {
      // The arc bulges by "bend" to the left of p → q (to the right when negative); its centre lies on the bisector of pq.
      const mx = (P[0] + Q[0]) / 2, my = (P[1] + Q[1]) / 2, dx = Q[0] - P[0], dy = Q[1] - P[1], L = Math.hypot(dx, dy);
      const d = (L * L / 4 - bend * bend) / (2 * bend), cx = mx + dy / L * d, cy = my - dx / L * d, R = Math.hypot(P[0] - cx, P[1] - cy);
      let a0 = Math.atan2(P[1] - cy, P[0] - cx), a1 = Math.atan2(Q[1] - cy, Q[0] - cx);
      // A bulge to the left of p → q runs clockwise round the centre, one to the right counter-clockwise.
      if (bend > 0 && a1 > a0) a1 -= 2 * Math.PI;
      if (bend < 0 && a1 < a0) a1 += 2 * Math.PI;
      return { straight: segment(P, Q), curved: arc(cx, cy, R, a0, a1) };
    };
    const update = () => {
      const F = FIELDS[key].f, { straight, curved } = paths(), toPts = p => Array.from({ length: 81 }, (_, k) => p(k / 80));
      const iS = lineIntegral(F, straight), iA = lineIntegral(F, curved);
      // The loop: out along the straight path, back along the arc.
      const iL = iS - iA;
      box.replaceChildren(view(F, [
        s("polyline", { points: toPts(straight).map(scaled).join(" "), class: "path one" }),
        s("polyline", { points: toPts(curved).map(scaled).join(" "), class: "path two" }),
        ...[P, Q].map(p => s("circle", { cx: px(p)[0], cy: px(p)[1], r: 6, class: "end" }))],
        `${FIELDS[key].name} with two paths from p to q`));
      rS.set(fixed3(iS)); rA.set(fixed3(iA));
      const zero = Math.abs(iL) < 1e-3;
      rL.set(fixed3(iL), zero ? "" : "warn", zero ? "zero: the integral does not depend on the path" : "not zero: the path matters");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Field", Object.entries(FIELDS).map(([k, v]) => [k, v.name]), key, v => { key = v; update(); }),
      slider({ label: "Bulge of the arc", unit: "", min: -1.5, max: 1.5, value: bend, step: 0.05, format: v => v.toFixed(2),
               onInput: v => { bend = Math.abs(v) < 0.05 ? 0.05 : v; update(); } }),
      rS.el, rA.el, rL.el,
      h("p", { class: "hint" }, "Solid: the straight path, dashed: the arc, both from p (lower left) to q. In the gradient field both give f(q) − f(p) = −0.45, whatever the bulge. In the rotation field they differ by the area between them, twice over. The vortex has no curl, so the loop gives zero until the arc swings round the origin; then it gives ±2π, Fritzsche's example of a field with a potential only on a region without the origin (pp. 21–24)."))));
    update();
  },
};
