// The static electric dipole, ϕ = e_r·p / (4π ε0 r²) and E = (3 e_r e_r·p − p) / (4π ε0 r³) (5.42): the potential as
// a colour map, the field as arrows, and a probe you move round it.
import { dipolePotential, dipoleField, si } from "../core/index.js";
import { h, s, slider, readout } from "../ui/kit.js";
import { heatmap, arrows } from "../ui/field.js";
import * as a from "../ui/art.js";

const W = 460, H = 300, OX = 230, OY = 150;

export default {
  id: "dipole",
  art: () => a.picture("A dipole arrow with field loops above and below",
    a.arrow(100, 100, 100, 50, a.ACC, 4) + a.path("M100 50 C40 0 20 140 100 100", a.INK, 2) + a.path("M100 50 C160 0 180 140 100 100", a.INK, 2) +
      a.text(100, 135, "p", 18, a.ACC)),
  mount(root) {
    let p = 1e-12, r = 0.08, th = 45;
    const pic = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic field", role: "img", "aria-label": "Colour map and field arrows of an electric dipole pointing up, with a probe point" });
    const rPhi = readout("Potential at the probe ϕ"), rE = readout("Field at the probe |E|");
    const polarAt = (x, y) => { const X = (x - OX) / 1000, Y = -(y - OY) / 1000; return [Math.hypot(X, Y), Math.atan2(X, Y)]; };
    const scale = dipolePotential(1e-12, 0.05, 0);
    const background = [heatmap(W, H, 46, 30, (x, y) => { const [rr, t] = polarAt(x, y); return rr < 0.01 ? 0 : dipolePotential(1e-12, rr, t); }, scale),
      arrows(W, H, 23, 15, (x, y) => {
        const [rr, t] = polarAt(x, y);
        if (rr < 0.012) return [0, 0];
        const { Er, Etheta } = dipoleField(1e-12, rr, t);
        // e_r = (sin θ, cos θ), e_θ = (cos θ, −sin θ) with θ from the vertical.
        return [Er * Math.sin(t) + Etheta * Math.cos(t), Er * Math.cos(t) - Etheta * Math.sin(t)];
      }), s("line", { x1: OX, y1: OY + 10, x2: OX, y2: OY - 10, class: "dipole" })];
    const update = () => {
      const t = th * Math.PI / 180, px = OX + r * 1000 * Math.sin(t), py = OY - r * 1000 * Math.cos(t);
      pic.replaceChildren(...background, s("circle", { cx: px, cy: py, r: 7, class: "probe" }),
        s("line", { x1: OX, y1: OY, x2: px, y2: py, class: "radius" }));
      const { Er, Etheta } = dipoleField(p, r, t);
      rPhi.set(si(dipolePotential(p, r, t), "V")); rE.set(si(Math.hypot(Er, Etheta), "V/m"));
    };
    root.append(h("div", { class: "stage" }, pic, h("div", { class: "controls" },
      slider({ label: "Dipole moment p", unit: "C·m", min: 1e-13, max: 1e-11, value: p, log: true, onInput: v => { p = v; update(); } }),
      slider({ label: "Probe distance r", unit: "m", min: 0.02, max: 0.14, value: r, step: 0.005, onInput: v => { r = v; update(); } }),
      slider({ label: "Probe angle θ from the axis", unit: "°", min: 0, max: 180, value: th, step: 5, format: v => `${v} °`, onInput: v => { th = v; update(); } }),
      rPhi.el, rE.el,
      h("p", { class: "hint" }, "Double r: the potential falls to a quarter and the field to an eighth, faster than a single charge. On the plane θ = 90° the potential is zero, yet the field is not."))));
    update();
  },
};
