// Carrier densities against temperature and doping (Strasser 2015, sections 3.1.2 and 3.1.3): ni² = NC NV e^(−Eg/kT),
// mass action n p = ni², neutrality, and the Fermi level EF − Ei = kT ln(n/ni). Silicon, all dopants ionised.
import { intrinsic, carriers, fermiLevel, intrinsicOffset, SI, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const lg = Math.log10;

export default {
  id: "carriers",
  art: () => a.picture("A conduction and a valence band with the Fermi level moving between them",
    a.line([[20, 35], [180, 35]], a.INK) + a.line([[20, 115], [180, 115]], a.INK) + a.line([[20, 75], [180, 75]], a.DIM, 2, "5 5") +
      a.line([[20, 50], [180, 50]], a.ACC, 3) + [40, 80, 120, 160].map(x => a.circle(x, 27, 4, a.COOL, 2, a.COOL)).join("")),
  mount(root) {
    let T = 300, ND = 1e16, NA = 0;
    const box = h("div", {}), rI = readout("Intrinsic density ni"), rN = readout("Electrons n"), rP = readout("Holes p"), rF = readout("Fermi level EF − Ei");
    const update = () => {
      const Ts = Array.from({ length: 141 }, (_, k) => 200 + k * 5), ni = intrinsic(T), c = carriers(ND, NA, ni);
      box.replaceChildren(lineChart({ label: "Electron and hole densities and ni against temperature",
        lines: [{ x: Ts, y: Ts.map(t => lg(carriers(ND, NA, intrinsic(t)).n)), name: "n" }, { x: Ts, y: Ts.map(t => lg(carriers(ND, NA, intrinsic(t)).p)), name: "p", cls: "second" },
                { x: Ts, y: Ts.map(t => lg(intrinsic(t))), name: "ni", cls: "faint" }, { x: [T, T], y: [0, 20], cls: "marker" }],
        xLabel: "Temperature T [K]", yLabel: "Density, log₁₀ of n [cm⁻³]", yMin: 0, yMax: 20 }));
      const half = SI.Eg / 2, ef = fermiLevel(c.n, ni, T) + intrinsicOffset(T);
      rI.set(`${ni.toExponential(2)} cm⁻³`); rN.set(`${c.n.toExponential(2)} cm⁻³`); rP.set(`${c.p.toExponential(2)} cm⁻³`, "", "n p = ni²");
      rF.set(`${fermiLevel(c.n, ni, T).toFixed(3)} eV`, Math.abs(ef) > half - 0.1 ? "warn" : "",
        Math.abs(ef) > half - 0.1 ? "within 0.1 eV of a band edge: Boltzmann starts to fail" : `${(ef + half).toFixed(3)} eV above EV`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Temperature T", unit: "K", min: 200, max: 900, value: T, step: 5, format: v => `${v} K`, onInput: v => { T = v; update(); } }),
      slider({ label: "Donors ND", unit: "cm⁻³", min: 1e10, max: 1e18, value: ND, log: true, format: v => `${v.toExponential(1)} cm⁻³`, onInput: v => { ND = v; update(); } }),
      slider({ label: "Acceptors NA", unit: "cm⁻³", min: 1e10, max: 1e18, value: 1e10, log: true, format: v => `${v.toExponential(1)} cm⁻³`, onInput: v => { NA = v; update(); } }),
      rI.el, rN.el, rP.el, rF.el,
      h("p", { class: "hint" }, `Silicon, Eg = ${SI.Eg} eV held constant, ni = ${si(SI.ni, "")} cm⁻³ at 300 K. With ND ≫ ni the electrons stay at ND while ni climbs; where ni passes ND the sample turns intrinsic and EF returns to the middle. Freeze-out of the dopants at low temperature is not modelled.`))));
    update();
  },
};
