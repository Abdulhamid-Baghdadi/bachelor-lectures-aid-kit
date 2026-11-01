// Conservation of angular momentum (Kugi et al. 2015, section 2.2.8, Example 2.13): a puck on a frictionless table,
// tied to a pin by a spring, moves under a central force. Its angular momentum (2.131) is constant, so the line from
// the pin sweeps equal areas in equal times (2.136), Kepler's second law.
import { mechCentral, si } from "../core/index.js";
import { h, s, slider, readout } from "../ui/kit.js";
import { clock } from "../ui/field.js";
import * as a from "../ui/art.js";

const m = 0.5, c = 20, N = 1200, TEND = 6, S = 600, O = 200;

export default {
  id: "angular",
  art: () => a.picture("An elliptical orbit round a pin with two equal swept areas",
    `<ellipse cx="100" cy="75" rx="80" ry="45" fill="none" stroke="${a.DIM}" stroke-width="2"/>` + a.circle(100, 75, 4, a.INK, 3, a.INK) +
      a.path("M100 75 L180 75 A80 45 0 0 0 157 43 Z", a.ACC, 2) + a.path("M100 75 L20 75 A80 45 0 0 0 43 107 Z", a.COOL, 2)),
  mount(root) {
    let s0 = 0.05, vt = 0.6, run;
    const pic = s("svg", { viewBox: `0 0 ${2 * O} ${2 * O}`, class: "schematic", role: "img", "aria-label": "A puck circling a pin on a spring, the area swept in each second shaded" });
    const lr = readout("Angular momentum l = m (x ẏ − y ẋ) (2.131)"), ar = readout("Area per second dA/dt = l / (2m) (2.136)"), rr = readout("Distance from the pin");
    const P = (x, y) => `${(O + x * S).toFixed(1)},${(O - y * S).toFixed(1)}`;
    const draw = t => {
      const k = Math.round(((t / TEND) % 1) * N), [x, y] = run.s[k], k0 = Math.max(0, k - N / TEND);
      pic.replaceChildren(s("polyline", { points: run.s.map(([x, y]) => P(x, y)).join(" "), class: "grid", fill: "none" }),
        s("polygon", { points: [P(0, 0), ...run.s.slice(k0, k + 1).map(([x, y]) => P(x, y))].join(" "), class: "lobe" }),
        s("line", { x1: O, y1: O, x2: O + x * S, y2: O - y * S, class: "wire" }),
        s("g", { class: "part" }, s("circle", { cx: O, cy: O, r: 4, class: "body" }), s("circle", { cx: O + x * S, cy: O - y * S, r: 10, class: "body" })));
      lr.set(si(run.l[k], "kg m²/s"), "", `drift since the start ${(Math.abs(run.l[k] / run.l[0] - 1) * 100).toExponential(1)} %`);
      ar.set(si(run.l[k] / (2 * m), "m²/s"), "", "the shaded area of the last second"); rr.set(si(Math.hypot(x, y), "m"));
    };
    const update = () => { run = mechCentral({ m, c, s0, x0: 0.25, y0: 0, vx0: 0, vy0: vt, T: TEND, n: N }); ck.draw(); };
    run = mechCentral({ m, c, s0, x0: 0.25, y0: 0, vx0: 0, vy0: vt, T: TEND, n: N });
    const ck = clock(draw);
    root.append(h("div", { class: "stage" }, pic, h("div", { class: "controls" },
      slider({ label: "Sideways launch speed", unit: "m/s", min: 0.2, max: 1.4, value: vt, step: 0.05, onInput: v => { vt = v; update(); } }),
      slider({ label: "Free length of the spring s0", unit: "m", min: 0, max: 0.2, value: s0, step: 0.01, onInput: v => { s0 = v; update(); } }),
      ck.el, lr.el, ar.el, rr.el,
      h("p", { class: "hint" }, "The puck speeds up near the pin and slows far out, yet the shaded area swept in the last second keeps the same size: the spring pulls along the line to the pin, so its moment about the pin is zero (Drallsatz, eq. 2.134). Puck 0.5 kg, spring 20 N/m, launched 0.25 m from the pin."))));
  },
};
