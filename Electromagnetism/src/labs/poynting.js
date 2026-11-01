// The Poynting vector S = E × H (2.107) and the energy balance (2.108, 2.109): the energy a resistive wire turns to heat
// does not run inside the copper; it flows in from the field around it, through the surface, as S.
import { wirePoynting, si } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import { arrow } from "../../../kit/ui/field.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "poynting",
  art: () => a.picture("A wire with the field along it, magnetic rings round it and energy arrows pointing into it",
    a.rect(20, 64, 160, 22, a.INK, 3) + a.arrow(40, 52, 160, 52, a.COOL, 2) + a.text(100, 46, "E", 14, a.COOL) +
      [55, 100, 145].map(x => a.path(`M${x - 6} 60 C${x - 16} 75 ${x - 16} 90 ${x - 6} 92`, a.DIM, 2) + a.arrow(x + 4, 125, x + 4, 92, a.ACC, 3)).join("") + a.text(178, 120, "S", 18, a.ACC)),
  mount(root) {
    let U = 2, I = 3;
    const a0 = 1e-3, l = 1;
    const pic = s("svg", { viewBox: "0 0 460 220", class: "schematic", role: "img", "aria-label": "A wire seen from the side; E along it, H round it, S pointing into it from all sides" });
    const rS = readout("Poynting vector at the surface S = E H"), rP = readout("Flux into the wire S · 2πa l");
    const update = () => {
      const w = wirePoynting(U, I, a0, l);
      const len = 14 + Math.min(40, 8 * Math.log10(1 + w.S));
      pic.replaceChildren(s("rect", { x: 40, y: 95, width: 380, height: 30, rx: 6, class: "conductor" }),
        arrow(60, 80, 0, 340, "vec e"),
        s("text", { x: 230, y: 72, class: "letter", "text-anchor": "middle" }, "E along the wire"),
        ...[110, 230, 350].flatMap(x => [arrow(x, 95 - 12 - len, Math.PI / 2, len, "vec s"), arrow(x, 125 + 12 + len, -Math.PI / 2, len, "vec s"),
          s("ellipse", { cx: x + 30, cy: 110, rx: 9, ry: 30, class: "ring" })]),
        s("text", { x: 230, y: 210, class: "letter", "text-anchor": "middle" }, "S points into the wire from the field around it"));
      rS.set(si(w.S, "W/m²"));
      rP.set(si(w.P, "W"), "", `the same as U · I = ${si(U * I, "W")}, the heat in the wire`);
    };
    root.append(h("div", { class: "stage" }, pic, h("div", { class: "controls" },
      slider({ label: "Voltage along the wire U", unit: "V", min: 0.1, max: 20, value: U, step: 0.1, onInput: v => { U = v; update(); } }),
      slider({ label: "Current I", unit: "A", min: 0.1, max: 20, value: I, step: 0.1, onInput: v => { I = v; update(); } }),
      rS.el, rP.el,
      h("p", { class: "hint" }, "A wire 1 m long and 1 mm in radius. E = U/l runs along it, H = I/(2πa) circles it, so E × H points inward. Integrated over the surface, the inflow is exactly U · I (Prechtl 2010, eq. 2.109)."))));
    update();
  },
};
