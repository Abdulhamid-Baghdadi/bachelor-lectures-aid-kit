// The Hertz dipole (Prechtl 2010, pp. 123–128): a short antenna of length l radiates P = R_S I² with the radiation
// resistance R_S = (2π/3)(l/λ)² Z0 (5.52, 5.53); its far field goes as sin θ, its power as sin²θ.
import { radiationResistance, dipolePattern, C0, si } from "../core/index.js";
import { h, slider, readout } from "../ui/kit.js";
import { polar } from "../ui/field.js";
import * as a from "../ui/art.js";

export default {
  id: "hertz",
  art: () => a.picture("A short antenna with the doughnut-shaped radiation pattern round it",
    a.line([[100, 55], [100, 95]], a.INK, 4) + a.path("M100 75 C60 20 20 40 20 75 C20 110 60 130 100 75", a.ACC, 3) +
      a.path("M100 75 C140 20 180 40 180 75 C180 110 140 130 100 75", a.ACC, 3)),
  mount(root) {
    let ratio = 0.05, I = 1, f = 100e6;
    const plotBox = h("div", { class: "polar" });
    const rR = readout("Radiation resistance R_S"), rP = readout("Radiated power P = R_S I²"), rl = readout("Antenna length l");
    const update = () => {
      const lam = C0 / f, Rs = radiationResistance(ratio * lam, lam);
      plotBox.replaceChildren(polar(300, dipolePattern, "Radiation pattern of a short dipole: power per solid angle as sin²θ, nothing along the axis, most across it"));
      rR.set(si(Rs, "Ω"), ratio > 0.1 ? "warn" : "", ratio > 0.1 ? "l/λ above 0.1: the short-dipole formula starts to fail" : "");
      rP.set(si(Rs * I * I, "W")); rl.set(si(ratio * lam, "m"));
    };
    root.append(h("div", { class: "stage" }, plotBox, h("div", { class: "controls" },
      slider({ label: "Length as a share of the wavelength l/λ", unit: "", min: 0.005, max: 0.2, value: ratio, step: 0.005, format: v => v.toFixed(3), onInput: v => { ratio = v; update(); } }),
      slider({ label: "Effective feed current I", unit: "A", min: 0.01, max: 10, value: I, log: true, onInput: v => { I = v; update(); } }),
      slider({ label: "Frequency f", unit: "Hz", min: 1e6, max: 3e9, value: f, log: true, onInput: v => { f = v; update(); } }),
      rR.el, rP.el, rl.el,
      h("p", { class: "hint" }, "The pattern is a doughnut round the antenna: no radiation along its axis, most across it. Halve the length and R_S falls to a quarter, which is why very short antennas radiate so poorly."))));
    update();
  },
};
