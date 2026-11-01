// Material equations: D = ε E with ε = ε0 (1 + χ) (2.37, 2.38), the polarisation P = ε0 χ E (2.36), and the local
// Ohm's law J = γ E (2.34). A slab between two plates at a fixed voltage: E is set by the voltage, D and P by the
// material.
import { material, EPS0, si } from "../core/index.js";
import { h, s, slider, readout, choice } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";

const STUFF = { air: [0.0006, 0], paper: [2.5, 1e-12], glass: [6, 1e-11], water: [79, 5e-6] };

export default {
  id: "materials",
  art: () => a.picture("Two plates with a slab of material between them; small dipoles in the slab line up with the field",
    a.line([[30, 30], [30, 120]], a.INK, 5) + a.line([[170, 30], [170, 120]], a.INK, 5) + a.rect(60, 34, 80, 82, a.DIM, 2) +
      [48, 75, 102].map(y => [80, 120].map(x => a.text(x - 8, y + 5, "−", 14, a.COOL) + a.text(x + 8, y + 5, "+", 14, a.HOT)).join("")).join("") +
      a.arrow(40, 130, 160, 130, a.ACC, 2)),
  mount(root) {
    let U = 100, d = 0.002, chi = 2, gamma = 0;
    const pic = s("svg", { viewBox: "0 0 360 200", class: "schematic", role: "img", "aria-label": "A slab between capacitor plates; the dipoles in it line up more when the susceptibility is larger" });
    const rE = readout("Electric field strength E = U / d"), rD = readout("Flux density D = ε E"), rP = readout("Polarisation P = ε0 χ E"), rJ = readout("Current density J = γ E");
    const update = () => {
      const E = U / d, m = material({ E, chi, gamma });
      const tilt = Math.min(1, chi / 10), dipoles = [];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) {
        const x = 110 + j * 35, y = 45 + i * 36, ang = (1 - tilt) * ((i * 5 + j) * 2.39 % 6.28) ;
        dipoles.push(s("g", { transform: `translate(${x} ${y}) rotate(${(ang * 57.3).toFixed(0)})` },
          s("text", { x: -9, y: 5, class: "letter neg", "text-anchor": "middle" }, "−"), s("text", { x: 9, y: 5, class: "letter pos", "text-anchor": "middle" }, "+")));
      }
      pic.replaceChildren(s("line", { x1: 80, y1: 20, x2: 80, y2: 180, class: "plate" }), s("line", { x1: 280, y1: 20, x2: 280, y2: 180, class: "plate" }),
        s("rect", { x: 90, y: 24, width: 180, height: 152, class: "slab" }), ...dipoles,
        s("text", { x: 70, y: 18, class: "tick", "text-anchor": "end" }, "+U"), s("text", { x: 290, y: 18, class: "tick" }, "0"));
      rE.set(si(E, "V/m")); rD.set(si(m.D, "C/m²"), "", `ε0 E alone would be ${si(EPS0 * E, "C/m²")}: εr = ${m.epsr.toFixed(2)} times less`);
      rP.set(si(m.P, "C/m²")); rJ.set(si(m.J, "A/m²"));
    };
    const chiSlider = slider({ label: "Electric susceptibility χ", unit: "", min: 0, max: 80, value: chi, step: 0.5, format: v => v.toFixed(1), onInput: v => { chi = v; update(); } });
    root.append(h("div", { class: "stage" }, pic, h("div", { class: "controls" },
      slider({ label: "Voltage U", unit: "V", min: 1, max: 1000, value: U, log: true, onInput: v => { U = v; update(); } }),
      choice("Material", [["air", "Air"], ["paper", "Paper"], ["glass", "Glass"], ["water", "Water"]], "",
        k => { [chi, gamma] = STUFF[k]; chiSlider.set(chi); update(); }),
      chiSlider, rE.el, rD.el, rP.el, rJ.el,
      h("p", { class: "hint" }, "Plates 2 mm apart. The voltage fixes E; the material decides how much flux density D (and so how much charge on the plates) that takes. Material values are typical room-temperature figures for illustration, not from the lecture."))));
    update();
  },
};
