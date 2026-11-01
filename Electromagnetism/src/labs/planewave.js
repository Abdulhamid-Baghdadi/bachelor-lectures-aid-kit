// A free plane wave (Prechtl 2010, pp. 132–134): E and H across the direction of travel and in step, H = κ × E / Z
// (5.71), Z = √(μ/ε) (5.70), carrying the power density S = E²/Z (5.72).
import { planeWave, si } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import { clock } from "../../../kit/ui/field.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "planewave",
  art: () => a.picture("A wave with E up and down and H sideways, travelling to the right",
    a.line([[20, 80], [180, 80]], a.DIM, 2) + a.path("M20 80 C40 20 60 20 80 80 C100 140 120 140 140 80 C160 20 170 30 180 50", a.ACC, 3) +
      a.path("M20 80 C40 100 60 100 80 80 C100 60 120 60 140 80 C160 100 170 98 180 92", a.COOL, 3) + a.arrow(150, 130, 190, 130, a.INK, 2)),
  mount(root) {
    let E0 = 10, epsr = 1;
    const W = 460, H = 260, Y = 130;
    const pic = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic", role: "img", "aria-label": "A plane wave seen at an angle: E up and down, H in and out of the page drawn slanted, both travelling right" });
    const rZ = readout("Wave impedance Z = √(μ/ε)"), rH = readout("Magnetic field amplitude Ĥ = Ê / Z"), rS = readout("Peak power density S = Ê² / Z");
    const draw = t => {
      const w = planeWave(E0, epsr), lam = 180 / Math.sqrt(epsr), ph = t * 2;
      const eStems = [], hStems = [];
      for (let x = 30; x <= W - 30; x += 10) {
        const v = Math.cos(2 * Math.PI * x / lam - ph);
        eStems.push(s("line", { x1: x, y1: Y, x2: x, y2: Y - 80 * v, class: "stem e" }));
        // H drawn slanted, as if out of the page.
        hStems.push(s("line", { x1: x, y1: Y, x2: x - 40 * v, y2: Y + 40 * v, class: "stem h" }));
      }
      pic.replaceChildren(s("line", { x1: 20, y1: Y, x2: W - 10, y2: Y, class: "axis" }), ...hStems, ...eStems,
        s("text", { x: 30, y: 30, class: "letter e" }, "E"), s("text", { x: 16, y: H - 40, class: "letter h" }, "H"),
        s("text", { x: W - 14, y: Y - 8, class: "tick", "text-anchor": "end" }, "travels → κ"));
      rZ.set(si(w.Z, "Ω")); rH.set(si(w.H, "A/m")); rS.set(si(w.S, "W/m²"));
    };
    const c = clock(draw);
    root.append(h("div", { class: "stage" }, pic, h("div", { class: "controls" },
      slider({ label: "Electric field amplitude Ê", unit: "V/m", min: 0.1, max: 1000, value: E0, log: true, onInput: v => { E0 = v; c.draw(); } }),
      slider({ label: "Permittivity number εr", unit: "", min: 1, max: 10, value: epsr, step: 0.1, format: v => v.toFixed(1), onInput: v => { epsr = v; c.draw(); } }),
      c.el, rZ.el, rH.el, rS.el,
      h("p", { class: "hint" }, "E, H and the direction of travel form a right-handed set, and E and H peak together. In vacuum Z = 376.7 Ω: a mobile phone's 10 V/m near the head brings about 27 mA/m and 0.27 W/m². Raise εr and the wavelength and Z both shrink by √εr."))));
  },
};
