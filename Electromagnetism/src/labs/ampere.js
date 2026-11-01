// Ampère's law, V(∂A) = I(A) for steady currents (Tab. 2.1, row 3): round a long straight wire, H = I/(2πr), and the
// magnetic voltage round any circle is the current through it.
import { wireH, si } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import { arrows, draggable } from "../../../kit/ui/field.js";
import * as a from "../../../kit/ui/art.js";

const W = 460, H = 300, OX = 230, OY = 150;

export default {
  id: "ampere",
  art: () => a.picture("A wire seen end on, with circles of magnetic field round it",
    a.circle(100, 75, 10, a.INK, 3) + a.circle(100, 75, 3, a.INK, 3, a.INK) + a.circle(100, 75, 30, a.ACC, 2) + a.circle(100, 75, 52, a.ACC, 2) +
      a.arrow(130, 82, 130, 66, a.ACC, 2) + a.arrow(152, 84, 152, 66, a.ACC, 2) + a.text(176, 30, "H", 18, a.ACC)),
  mount(root) {
    let I = 10, r = 0.08;
    const drawing = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic field", role: "img", "aria-label": "A wire carrying current through the page, its magnetic field circling it, and a circular path" });
    const field = readout("H on the circle"), loop = readout("Magnetic voltage V(∂A) = H · 2πr");
    const update = () => {
      const k = Math.sign(I) || 1;
      drawing.replaceChildren(
        arrows(W, H, 23, 15, (x, y) => { const X = (x - OX) / 1000, Y = -(y - OY) / 1000, rr = Math.hypot(X, Y);
          return rr < 0.014 ? [0, 0] : [-k * Y / rr ** 2, k * X / rr ** 2]; }),
        s("circle", { cx: OX, cy: OY, r: r * 1000, class: "surface" }),
        s("g", { class: "charge" }, s("circle", { cx: OX, cy: OY, r: 12 }), s("text", { x: OX, y: OY + 5, "text-anchor": "middle" }, I >= 0 ? "•" : "×")));
      const Hv = wireH(Math.abs(I), r);
      field.set(si(Hv, "A/m"));
      loop.set(si(Hv * 2 * Math.PI * r, "A"), "", `equal to the current I = ${si(Math.abs(I), "A")}, at any radius`);
    };
    const sr = slider({ label: "Radius of the path r", unit: "m", min: 0.02, max: 0.14, value: r, step: 0.005, onInput: v => { r = v; update(); } });
    // The path passes through the point the reader drags.
    draggable(drawing, (x, y) => { r = Math.round(Math.min(0.14, Math.max(0.02, Math.hypot(x - OX, y - OY) / 1000)) * 200) / 200; sr.set(r); update(); });
    root.append(h("div", { class: "stage" }, drawing, h("div", { class: "controls" },
      slider({ label: "Current I", unit: "A", min: -50, max: 50, value: I, step: 1, onInput: v => { I = v; update(); } }),
      sr,
      field.el, loop.el,
      h("p", { class: "hint" }, "Drag on the drawing to resize the path. • is current out of the page, × into it; the field turns by the right-hand rule. H falls as 1/r while the path grows as r, so their product, the magnetic voltage, stays the current enclosed."))));
    update();
  },
};
