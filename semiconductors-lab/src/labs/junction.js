// The pn junction's space-charge zone (Strasser 2015, section 5.2.1): ionised dopants on both sides, a triangular field
// by Poisson's equation, a parabolic potential step of UD − U. The zone grows into the weaker side, as √(UD − U).
import { junction, Q, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "junction",
  art: () => a.picture("A p region and an n region with a triangle of field between them",
    a.rect(15, 30, 85, 90, a.DIM, 2) + a.rect(100, 30, 85, 90, a.DIM, 2) + a.text(40, 55, "p", 20) + a.text(160, 55, "n", 20) +
      a.line([[70, 110], [100, 70], [160, 110]], a.ACC, 3) + a.line([[70, 110], [160, 110]], a.INK, 2)),
  mount(root) {
    let NA = 1e17, ND = 1e15, U = 0;
    const box = h("div", {}), rD = readout("Diffusion voltage UD"), rW = readout("Width d = dp + dn"), rE = readout("Peak field Emax");
    const update = () => {
      const j = junction(NA, ND, U), m = 0.3 * j.d, x0 = -j.dp - m, x1 = j.dn + m, xs = Array.from({ length: 401 }, (_, k) => x0 + k * (x1 - x0) / 400);
      const um = xs.map(x => x * 1e4);
      box.replaceChildren(
        lineChart({ label: "Space charge across the junction", lines: [{ x: um, y: xs.map(x => j.rho(x) / Q), name: "ρ / e" }],
          xLabel: "Position x [µm]", yLabel: "Charge density ρ/e [cm⁻³]", yFormat: v => v.toExponential(0), xFormat: v => v.toFixed(2) }),
        lineChart({ label: "Field and potential across the junction",
          lines: [{ x: um, y: xs.map(x => -j.field(x) / 1e3), name: "−E [kV/cm]" }, { x: um, y: xs.map(x => j.potential(x) * 10), name: "φ × 10 [V]", cls: "second" }],
          xLabel: "Position x [µm]", yLabel: "Field [kV/cm], potential × 10 [V]", yMin: 0, xFormat: v => v.toFixed(2) }));
      rD.set(si(j.UD, "V"), "", "UT ln(NA ND / ni²)"); rW.set(si(j.d / 100, "m"), "", `dp ${si(j.dp / 100, "m")}, dn ${si(j.dn / 100, "m")}`);
      rE.set(`${(j.Emax / 1e3).toFixed(1)} kV/cm`, j.Emax > 3e5 ? "danger" : "", j.Emax > 3e5 ? "past 300 kV/cm: silicon breaks down" : "");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Acceptors NA (p side)", unit: "cm⁻³", min: 1e14, max: 1e19, value: NA, log: true, format: v => `${v.toExponential(1)} cm⁻³`, onInput: v => { NA = v; update(); } }),
      slider({ label: "Donors ND (n side)", unit: "cm⁻³", min: 1e14, max: 1e19, value: ND, log: true, format: v => `${v.toExponential(1)} cm⁻³`, onInput: v => { ND = v; update(); } }),
      slider({ label: "Bias U", unit: "V", min: -20, max: 0.5, value: U, step: 0.1, format: v => `${v.toFixed(1)} V`, help: "negative is reverse", onInput: v => { U = v; update(); } }),
      rD.el, rW.el, rE.el,
      h("p", { class: "hint" }, "Silicon at 300 K, abrupt junction, depletion approximation, which holds for reverse bias and fails well into forward bias. The two charges are equal: the lighter-doped side must be wider. Reverse bias widens the zone and raises the field."))));
    update();
  },
};
