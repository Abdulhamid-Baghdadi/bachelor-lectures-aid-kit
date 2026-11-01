// No magnetic charges, Φ(∂V) = 0 (Tab. 2.1, row 2): the field of a small current loop (a magnetic dipole), and a
// sphere you move round it; the flux out is always zero, integrated numerically.
import { dipoleBFlux } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import { arrows, draggable } from "../../../kit/ui/field.js";
import * as a from "../../../kit/ui/art.js";

const W = 460, H = 300, OX = 230, OY = 150;

export default {
  id: "monopole",
  art: () => a.picture("Closed field loops of a bar magnet, and a surface with as many lines in as out",
    a.rect(84, 62, 32, 26, a.INK, 3) + a.path("M100 62 C60 10 20 75 84 75", a.ACC, 2) + a.path("M100 62 C140 10 180 75 116 75", a.ACC, 2) +
      a.path("M100 88 C60 140 20 75 84 75", a.ACC, 2) + a.path("M100 88 C140 140 180 75 116 75", a.ACC, 2) + a.circle(150, 75, 26, a.DIM, 2)),
  mount(root) {
    let cx = 0.07, cy = 0, R = 0.05;
    const drawing = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic field", role: "img", "aria-label": "Field arrows of a small current loop, and a sphere you move round it" });
    const flux = readout("Magnetic flux out of the sphere Φ(∂V)");
    // A dipole pointing up the page at the centre.
    const field = arrows(W, H, 27, 17, (x, y) => {
      const X = (x - OX) / 1000, Y = -(y - OY) / 1000, r = Math.hypot(X, Y);
      return r < 0.008 ? [0, 0] : [3 * Y * X / r ** 5, (3 * Y * Y / r ** 2 - 1) / r ** 3];
    });
    const update = () => {
      drawing.replaceChildren(field,
        s("rect", { x: OX - 9, y: OY - 14, width: 18, height: 28, rx: 3, class: "magnet" }),
        s("circle", { cx: OX + cx * 1000, cy: OY - cy * 1000, r: R * 1000, class: "surface" }));
      const phi = dipoleBFlux(1, cx, cy, R, 50);
      flux.set(`${Math.abs(phi) < 1e-9 ? "0" : phi.toExponential(1)} Wb`, "", "Every line that enters the sphere leaves it again.");
    };
    const sx = slider({ label: "Sphere centre x", unit: "m", min: -0.2, max: 0.2, value: cx, step: 0.005, onInput: v => { cx = v; update(); } });
    const sy = slider({ label: "Sphere centre y", unit: "m", min: -0.12, max: 0.12, value: cy, step: 0.005, onInput: v => { cy = v; update(); } });
    const clamp = (v, lo, hi) => Math.round(Math.min(hi, Math.max(lo, v)) * 200) / 200;
    // The drawing's y runs down from the top; the sphere's y runs up from the magnet.
    draggable(drawing, (x, y) => { cx = clamp((x - OX) / 1000, -0.2, 0.2); cy = clamp((OY - y) / 1000, -0.12, 0.12); sx.set(cx); sy.set(cy); update(); });
    root.append(h("div", { class: "stage" }, drawing, h("div", { class: "controls" }, sx, sy,
      slider({ label: "Sphere radius", unit: "m", min: 0.02, max: 0.12, value: R, step: 0.005, onInput: v => { R = v; update(); } }),
      flux.el,
      h("p", { class: "hint" }, "Drag on the drawing to move the sphere. Compare Gauss's law for D: there the flux counts the charge inside. For B it is always zero, magnet inside or not, because there is no magnetic charge to count (Prechtl 2010, p. 31)."))));
    update();
  },
};
