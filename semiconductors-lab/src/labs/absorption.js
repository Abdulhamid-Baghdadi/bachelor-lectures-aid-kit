// Optical absorption at the band gap (Strasser 2015, section 4.2.1): in a direct semiconductor α grows as √(ħω − Eg),
// the joint density of states, times fv(E1) − fc(E2). Pump enough carriers that EFc − EFv > Eg and the factor turns
// negative below ħω = EFc − EFv: the crystal amplifies light, the condition of the laser.
import { absorption, wavelength, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const GAAS = { Eg: 1.42, mn: 0.067, mp: 0.5 };

export default {
  id: "absorption",
  art: () => a.picture("A photon lifting an electron straight up from the valence band to the conduction band",
    a.path("M40 30 Q100 85 160 30", a.INK, 3) + a.path("M40 135 Q100 80 160 135", a.INK, 3) + a.arrow(100, 100, 100, 62, a.ACC, 3) +
      a.path("M20 80 q8 -8 16 0 t16 0 t16 0", a.COOL, 2)),
  mount(root) {
    let T = 300, split = -0.3;
    const box = h("div", {}), rG = readout("Band gap and its wavelength"), rT = readout("Transparent at ħω = EFc − EFv"), rS = readout("Light");
    const update = () => {
      const prm = { ...GAAS, T, split }, Es = Array.from({ length: 401 }, (_, k) => 1.3 + k * 0.4 / 400);
      box.replaceChildren(lineChart({ label: "Relative absorption against photon energy; below zero the crystal amplifies",
        lines: [{ x: Es, y: Es.map(E => absorption(E, prm)), name: "α / σ" }, { x: Es, y: Es.map(E => absorption(E, { ...prm, split: -0.5, T: 4 })), name: "no carriers, 4 K", cls: "faint" },
                { x: [GAAS.Eg, GAAS.Eg], y: [-0.6, 0.6], cls: "marker" }],
        xLabel: "Photon energy ħω [eV]", yLabel: "Absorption α/σ [eV^½]", yMin: -0.6, yMax: 0.6, xFormat: v => v.toFixed(2) }));
      const sep = GAAS.Eg + 2 * split;
      rG.set(`${GAAS.Eg} eV, ${si(wavelength(GAAS.Eg), "m")}`, "", "longer wavelengths pass through");
      rT.set(`${sep.toFixed(3)} eV`); rS.set(sep > GAAS.Eg ? "amplified between Eg and EFc − EFv" : "absorbed above Eg", sep > GAAS.Eg ? "warn" : "", sep > GAAS.Eg ? "EFc − EFv > Eg: gain" : "");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Quasi-Fermi levels past the band edges", unit: "eV", min: -0.3, max: 0.1, value: split, step: 0.005, format: v => `${v.toFixed(3)} eV`, help: "EFc − EC = EV − EFv; negative means inside the gap",
        onInput: v => { split = v; update(); } }),
      slider({ label: "Temperature T", unit: "K", min: 4, max: 400, value: T, step: 1, format: v => `${v} K`, onInput: v => { T = v; update(); } }),
      rG.el, rT.el, rS.el,
      h("p", { class: "hint" }, "Gallium arsenide, a direct semiconductor, with the masses of exercise 39. The dashed curve is the bare square root. Pump carriers in: first the absorption near the edge bleaches, then it turns into gain. The scale is relative, since the cross-section σ is not given; indirect silicon is left out."))));
    update();
  },
};
