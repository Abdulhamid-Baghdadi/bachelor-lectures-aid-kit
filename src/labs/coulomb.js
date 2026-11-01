// Two point charges: the potential ϕ = Q/(4πε r) (3.13) as a colour map, the field E = −∇ϕ (3.4) as arrows.
// 1 drawing unit is 1 mm; the charges sit on the middle line.
import { chargesField, EPS0, si } from "../core/index.js";
import { h, s, slider, readout } from "../ui/kit.js";
import { heatmap, arrows } from "../ui/field.js";
import * as a from "../ui/art.js";

const W = 460, H = 300;

export default {
  id: "coulomb",
  art: () => a.picture("A positive and a negative charge with field lines running from one to the other",
    a.circle(60, 75, 14, a.HOT, 3) + a.text(60, 81, "+", 20, a.HOT) + a.circle(140, 75, 14, a.COOL, 3) + a.text(140, 81, "−", 20, a.COOL) +
      a.path("M74 70 Q100 40 126 70", a.ACC, 2) + a.path("M74 80 Q100 110 126 80", a.ACC, 2) + a.arrow(80, 75, 120, 75, a.ACC, 3) +
      a.path("M46 66 Q20 50 22 30", a.DIM, 2) + a.path("M154 66 Q180 50 178 30", a.DIM, 2)),
  mount(root) {
    let q1 = 1e-9, q2 = -1e-9, d = 160;
    const drawing = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic field", role: "img",
      "aria-label": "Colour map of the potential of two point charges, with arrows for the electric field" });
    const probe = readout("Field strength |E| halfway between them");
    const update = () => {
      const c = [{ q: q1, x: (W - d) / 2 / 1000, y: H / 2 / 1000 }, { q: q2, x: (W + d) / 2 / 1000, y: H / 2 / 1000 }];
      const at = (x, y) => chargesField(c, x / 1000, y / 1000);
      // Full colour at the potential 1 nC makes 40 mm away.
      const scale = 1e-9 / (4 * Math.PI * EPS0 * 0.04);
      drawing.replaceChildren(
        heatmap(W, H, 46, 30, (x, y) => at(x, y).phi, scale),
        arrows(W, H, 23, 15, (x, y) => { const f = at(x, y); return [f.Ex, -f.Ey]; }),
        ...c.map(ch => s("g", { class: "charge" }, s("circle", { cx: ch.x * 1000, cy: ch.y * 1000, r: 13 }),
          s("text", { x: ch.x * 1000, y: ch.y * 1000 + 5, "text-anchor": "middle" }, ch.q > 0 ? "+" : ch.q < 0 ? "−" : "0"))));
      const m = at(W / 2, H / 2);
      probe.set(si(Math.hypot(m.Ex, m.Ey), "V/m"));
    };
    root.append(h("div", { class: "stage" }, drawing, h("div", { class: "controls" },
      slider({ label: "Charge Q1", unit: "C", min: -5e-9, max: 5e-9, value: q1, step: 0.25e-9, onInput: v => { q1 = v; update(); } }),
      slider({ label: "Charge Q2", unit: "C", min: -5e-9, max: 5e-9, value: q2, step: 0.25e-9, onInput: v => { q2 = v; update(); } }),
      slider({ label: "Distance between them", unit: "m", min: 0.04, max: 0.36, value: d / 1000, step: 0.01, onInput: v => { d = v * 1000; update(); } }),
      probe.el,
      h("p", { class: "hint" }, "Red is positive potential, blue negative. The arrows point down the slope of the potential: E = −∇ϕ. Give both charges the same sign and watch the field vanish between them."))));
    update();
  },
};
