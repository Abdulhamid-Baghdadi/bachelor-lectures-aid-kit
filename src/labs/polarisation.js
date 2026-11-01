// Polarisation, Lasser (2012) pp. 33–35: at a fixed place e_x = E1 cos ωt, e_y = E2 cos(ωt + ψ); the tip of E traces
// a line, a circle or an ellipse. Drawn in the notes' axes, x right and y down, looking along the wave.
import { polarisation } from "../core/index.js";
import { h, s, slider, readout } from "../ui/kit.js";
import { clock, arrow } from "../ui/field.js";
import * as a from "../ui/art.js";

const deg = Math.PI / 180, R = 110, C = 130;

export default {
  id: "polarisation",
  art: () => a.picture("An ellipse traced by the tip of the electric field, with the field arrow on it",
    a.line([[30, 75], [170, 75]], a.DIM, 2) + a.line([[100, 15], [100, 135]], a.DIM, 2) +
      a.path("M40 75 C40 30 160 30 160 75 C160 120 40 120 40 75", a.ACC, 3) + a.arrow(100, 75, 145, 50, a.INK, 3)),
  mount(root) {
    let E1 = 1, E2 = 1, psi = -90;
    const pic = s("svg", { viewBox: `0 0 ${2 * C} ${2 * C}`, class: "schematic polarisation", role: "img", "aria-label": "The path of the tip of the electric field in the plane across the wave, and the field now" });
    const rE = readout("Ellipticity a/b"), rS = readout("Sense of rotation");
    const draw = t => {
      const p = polarisation(E1, E2, psi * deg), m = Math.max(E1, E2) || 1;
      const pts = [];
      for (let k = 0; k <= 180; k++) { const w = k * 2 * Math.PI / 180; pts.push(`${(C + R * E1 / m * Math.cos(w)).toFixed(1)},${(C + R * E2 / m * Math.cos(w + psi * deg)).toFixed(1)}`); }
      const w = t * 1.5, ex = R * E1 / m * Math.cos(w), ey = R * E2 / m * Math.cos(w + psi * deg);
      pic.replaceChildren(s("line", { x1: 10, y1: C, x2: 2 * C - 10, y2: C, class: "axis" }), s("line", { x1: C, y1: 10, x2: C, y2: 2 * C - 10, class: "axis" }),
        s("text", { x: 2 * C - 14, y: C - 6, class: "tick", "text-anchor": "end" }, "x"), s("text", { x: C + 6, y: 2 * C - 12, class: "tick" }, "y"),
        s("polyline", { points: pts.join(" "), class: "path", fill: "none" }),
        Math.hypot(ex, ey) > 2 ? arrow(C, C, Math.atan2(ey, ex), Math.hypot(ex, ey), "vec e") : s("g"));
      rE.set(p.ratio === Infinity ? "∞ (linear)" : `${p.ratio.toFixed(2)} = ${p.dB.toFixed(1)} dB`);
      rS.set(p.sense === "linear" ? "none: linear" : `${p.sense}, ${p.sense === "right-hand" ? "clockwise" : "anticlockwise"} seen along the wave`);
    };
    const c = clock(draw);
    root.append(h("div", { class: "stage" }, pic, h("div", { class: "controls" },
      slider({ label: "Amplitude E1 along x", unit: "V/m", min: 0, max: 1, value: E1, step: 0.05, format: v => v.toFixed(2), onInput: v => { E1 = v; c.draw(); } }),
      slider({ label: "Amplitude E2 along y", unit: "V/m", min: 0, max: 1, value: E2, step: 0.05, format: v => v.toFixed(2), onInput: v => { E2 = v; c.draw(); } }),
      slider({ label: "Phase difference ψ", unit: "°", min: -180, max: 180, value: psi, step: 5, format: v => `${v} °`, onInput: v => { psi = v; c.draw(); } }),
      c.el, rE.el, rS.el,
      h("p", { class: "hint" }, "Seen along the wave, with y pointing down as in the notes. ψ = 0 or ±180°: linear. E1 = E2 and ψ = −90°: right-hand circular, clockwise at a fixed place, a left-hand screw in space (Fig. 3.6). Anything else is elliptical; link budgets count the ellipticity in dB."))));
  },
};
