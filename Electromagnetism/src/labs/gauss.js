// Gauss's law, Ψ(∂V) = Q(V) (Tab. 2.1, row 4): move a sphere over a set of charges; the electric flux out of it is the
// charge inside, counted, and integrated numerically over the sphere as a check.
import { enclosedCharge, fluxThroughSphere, chargesField, si } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import { arrows, draggable } from "../../../kit/ui/field.js";
import * as a from "../../../kit/ui/art.js";

const W = 460, H = 300;
const CHARGES = [{ q: 2e-9, x: 0.15, y: 0.12 }, { q: -1e-9, x: 0.23, y: 0.19 }, { q: 1e-9, x: 0.33, y: 0.1 }, { q: -2e-9, x: 0.37, y: 0.22 }];

export default {
  id: "gauss",
  art: () => a.picture("A sphere round two charges, flux arrows crossing its surface",
    a.circle(100, 75, 48, a.ACC, 3) + a.circle(88, 70, 8, a.HOT, 3) + a.circle(116, 86, 8, a.HOT, 3) + a.circle(172, 30, 8, a.COOL, 2) +
      [0, 1, 2, 3, 4, 5].map(k => { const t = k * Math.PI / 3 + 0.5; return a.arrow(100 + 52 * Math.cos(t), 75 + 52 * Math.sin(t), 100 + 68 * Math.cos(t), 75 + 68 * Math.sin(t), a.INK, 2, 6); }).join("")),
  mount(root) {
    let cx = 0.2, cy = 0.15, R = 0.08;
    const drawing = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic field", role: "img", "aria-label": "Four charges and a sphere you move over them" });
    const inside = readout("Charge inside Q(V)"), flux = readout("Flux out Ψ(∂V), integrated over the sphere");
    const field = arrows(W, H, 23, 15, (x, y) => { const f = chargesField(CHARGES, x / 1000, y / 1000); return [f.Ex, -f.Ey]; }, "vec faint");
    const update = () => {
      drawing.replaceChildren(field,
        s("circle", { cx: cx * 1000, cy: cy * 1000, r: R * 1000, class: "surface" }),
        ...CHARGES.map(c => s("g", { class: "charge" }, s("circle", { cx: c.x * 1000, cy: c.y * 1000, r: 12 }),
          s("text", { x: c.x * 1000, y: c.y * 1000 + 5, "text-anchor": "middle" }, `${c.q > 0 ? "+" : "−"}${Math.abs(c.q * 1e9)}`))));
      inside.set(si(enclosedCharge(CHARGES, cx, cy, R), "C"));
      flux.set(si(fluxThroughSphere(CHARGES, cx, cy, R, 50), "C"));
    };
    const sx = slider({ label: "Sphere centre x", unit: "m", min: 0.05, max: 0.41, value: cx, step: 0.005, onInput: v => { cx = v; update(); } });
    const sy = slider({ label: "Sphere centre y", unit: "m", min: 0.05, max: 0.25, value: cy, step: 0.005, onInput: v => { cy = v; update(); } });
    const clamp = (v, lo, hi) => Math.round(Math.min(hi, Math.max(lo, v)) * 200) / 200;
    draggable(drawing, (x, y) => { cx = clamp(x / 1000, 0.05, 0.41); cy = clamp(y / 1000, 0.05, 0.25); sx.set(cx); sy.set(cy); update(); });
    root.append(h("div", { class: "stage" }, drawing, h("div", { class: "controls" }, sx, sy,
      slider({ label: "Sphere radius", unit: "m", min: 0.02, max: 0.2, value: R, step: 0.005, onInput: v => { R = v; update(); } }),
      inside.el, flux.el,
      h("p", { class: "hint" }, "Drag on the drawing to move the sphere. The charges are in nC. The two readouts agree wherever you put the sphere: only the charge inside counts, not where it sits or what is outside. A charge outside sends field lines in and out again. The integral is numerical, so it is off by a little when a charge sits right on the surface."))));
    update();
  },
};
