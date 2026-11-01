// Momentum is kept when two masses meet (Kugi et al. 2015, (2.69)–(2.71)): the forces between them cancel, so their
// centre of mass moves on unchanged. How much kinetic energy (2.81) survives depends on the coefficient of restitution.
import { mechCollide, mechKinetic, si } from "../core/index.js";
import { h, s, slider, readout } from "../ui/kit.js";
import { clock } from "../ui/field.js";
import * as a from "../ui/art.js";

const W = 460, H = 120, X = x => 230 + x * 40;

export default {
  id: "collision",
  art: () => a.picture("Two blocks sliding towards each other on a track",
    a.line([[10, 110], [190, 110]], a.DIM, 2) + a.rect(30, 70, 40, 40) + a.rect(130, 80, 30, 30) +
      a.arrow(72, 60, 110, 60, a.ACC, 3) + a.arrow(128, 66, 100, 66, a.COOL, 3)),
  mount(root) {
    let m1 = 2, v1 = 3, m2 = 1, v2 = 0, e = 0;
    const pic = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic", role: "img", "aria-label": "Two blocks on a track meet, then move apart or on together" });
    const after = readout("Velocities after u1, u2"), p = readout("Momentum before → after"), T = readout("Kinetic energy before → after");
    const draw = t => {
      // Centres start 3 m apart, meet at tc, then carry on with u1, u2; the scene repeats every 6 s.
      const c = mechCollide(m1, v1, m2, v2, e), tc = 3 / (v1 - v2), tt = t % 6;
      const x1 = tt < tc ? -1.5 + v1 * tt : -1.5 + v1 * tc + c.u1 * (tt - tc), x2 = tt < tc ? 1.5 + v2 * tt : 1.5 + v2 * tc + c.u2 * (tt - tc);
      const b = (x, m, side) => { const w = 18 + 10 * m; return s("g", { class: "part" }, s("rect", { x: X(x) - (side < 0 ? w : 0), y: 100 - w, width: w, height: w, class: "body" })); };
      pic.replaceChildren(s("line", { x1: 0, y1: 100, x2: W, y2: 100, class: "wire" }), b(x1, m1, -1), b(x2, m2, 1),
        s("text", { x: 10, y: 20, class: "tick" }, tt < tc ? "before" : "after"));
    };
    const ck = clock(draw);
    const update = () => {
      const c = mechCollide(m1, v1, m2, v2, e);
      after.set(`${si(c.u1, "m/s")}, ${si(c.u2, "m/s")}`);
      p.set(`${si(m1 * v1 + m2 * v2, "N s")} → ${si(m1 * c.u1 + m2 * c.u2, "N s")}`, "", "the same: no outside force");
      const T0 = mechKinetic(m1, v1) + mechKinetic(m2, v2), T1 = mechKinetic(m1, c.u1) + mechKinetic(m2, c.u2);
      T.set(`${si(T0, "J")} → ${si(T1, "J")}`, "", `${si(T0 - T1, "J")} lost to heat and deformation`);
      ck.draw();
    };
    const sl = (label, unit, min, max, value, set) => slider({ label, unit, min, max, value, step: 0.1, onInput: v => { set(v); update(); } });
    root.append(h("div", { class: "stage" }, pic, h("div", { class: "controls" },
      sl("Mass m1", "kg", 0.5, 5, m1, v => m1 = v), sl("Velocity v1", "m/s", 0.5, 5, v1, v => v1 = v),
      sl("Mass m2", "kg", 0.5, 5, m2, v => m2 = v), sl("Velocity v2", "m/s", -3, 0, v2, v => v2 = v),
      slider({ label: "Coefficient of restitution e", min: 0, max: 1, value: e, step: 0.05, format: v => v.toFixed(2), onInput: v => { e = v; update(); } }),
      ck.el, after.el, p.el, T.el,
      h("p", { class: "hint" }, "Momentum is the same before and after for every e. Kinetic energy is kept only at e = 1 (elastic); at e = 0 (plastic) the blocks stick and move on together at the speed of their centre of mass."))));
    update();
  },
};
