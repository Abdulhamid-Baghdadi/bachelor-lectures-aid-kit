// Point kinematics, Example 2.1 of Kugi et al. (2015): accelerate, coast, brake. Velocity is the integral of the
// acceleration and position the integral of velocity (2.5)–(2.7); amin and t3 are chosen so the mass stops at xsoll.
import { mechProfile, mechProfileAt, si } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const SHOW = { a: "Acceleration a [m/s²]", v: "Velocity v [m/s]", x: "Position x [m]" };

export default {
  id: "kinematics",
  art: () => a.picture("An acceleration profile: speed up, coast, then brake to a stop",
    a.line([[20, 120], [180, 120]], a.DIM, 2) + a.line([[20, 120], [20, 50], [60, 50], [60, 75], [110, 75], [110, 120]], a.INK, 3) +
      a.line([[20, 120], [60, 70], [110, 70], [170, 120]], a.ACC, 3) + a.text(176, 40, "v", 18, a.ACC)),
  mount(root) {
    let amax = 2, t1 = 1, t2 = 3, xsoll = 8, show = "v";
    const box = h("div", {});
    const amin = readout("Braking acceleration amin (2.11)"), t3 = readout("Stopping time t3 (2.10)"), top = readout("Top speed amax t1");
    const update = () => {
      const p = mechProfile(amax, t1, t2, xsoll);
      const ok = p.amin < 0 && p.t3 > t2;
      amin.set(ok ? si(p.amin, "m/s²") : "none", ok ? "" : "warn", ok ? "" : "the mass passes xsoll before it can brake: lower amax or t2");
      t3.set(ok ? si(p.t3, "s") : "—"); top.set(si(amax * t1, "m/s"));
      if (!ok) return box.replaceChildren();
      const ts = Array.from({ length: 301 }, (_, k) => k * p.t3 * 1.1 / 300);
      box.replaceChildren(lineChart({ label: `${SHOW[show]} against time for the motion profile`,
        lines: [{ x: ts, y: ts.map(t => mechProfileAt(amax, t1, t2, p.amin, t)[show]), name: SHOW[show].split(" [")[0] }],
        marks: [{ x: p.t3, y: mechProfileAt(amax, t1, t2, p.amin, p.t3)[show], shape: "dot", name: "t3" }],
        xLabel: "Time t [s]", yLabel: SHOW[show], xFormat: v => v.toFixed(1) }));
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Show", [["a", "Acceleration"], ["v", "Velocity"], ["x", "Position"]], show, v => { show = v; update(); }),
      slider({ label: "Acceleration amax", unit: "m/s²", min: 0.5, max: 5, value: amax, step: 0.1, onInput: v => { amax = v; update(); } }),
      slider({ label: "End of speeding up t1", unit: "s", min: 0.2, max: 2, value: t1, step: 0.1, onInput: v => { t1 = v; update(); } }),
      slider({ label: "Start of braking t2", unit: "s", min: 2, max: 5, value: t2, step: 0.1, onInput: v => { t2 = v; update(); } }),
      slider({ label: "Target position xsoll", unit: "m", min: 2, max: 20, value: xsoll, step: 0.5, onInput: v => { xsoll = v; update(); } }),
      amin.el, t3.el, top.el,
      h("p", { class: "hint" }, "Each curve is the area under the one before: velocity ramps while a is constant and stays flat while coasting; position bends into parabolas. Starts at rest at x = 0 at t0 = 0."))));
    update();
  },
};
