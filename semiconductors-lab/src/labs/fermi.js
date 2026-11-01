// Fermi–Dirac occupation (Strasser 2015, section 3.1.2): f(E) = 1/(1 + exp((E − EF)/kT)). Half at EF, a step at 0 K
// that softens over a few kT, and the Boltzmann tail exp(−(E − EF)/kT) far above EF.
import { fermi, boltzmann, thermal } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "fermi",
  art: () => a.picture("A sharp step of occupation softened into an S-curve around the Fermi level",
    a.line([[20, 40], [100, 40], [100, 115], [180, 115]], a.DIM, 2) + a.path("M20 40 C80 40 85 42 100 78 C115 113 120 115 180 115", a.ACC, 3) +
      a.line([[100, 20], [100, 132]], a.COOL, 2, "4 4")),
  mount(root) {
    let T = 300, dE = 0.1;
    const box = h("div", {}), rF = readout("Occupation at E − EF"), rB = readout("Boltzmann approximation"), rK = readout("kT");
    const update = () => {
      const Es = Array.from({ length: 401 }, (_, k) => -0.3 + k * 0.6 / 400);
      box.replaceChildren(lineChart({ label: "Occupation against energy above the Fermi level",
        lines: [{ x: Es, y: Es.map(E => fermi(E, 0, T)), name: "Fermi–Dirac" }, { x: Es, y: Es.map(E => boltzmann(E, 0, T)), name: "Boltzmann", cls: "second" },
                { x: [dE, dE], y: [0, 1], cls: "marker" }],
        xLabel: "Energy E − EF [eV]", yLabel: "Occupation f [1]", yMin: 0, yMax: 1, xFormat: v => v.toFixed(1) }));
      rF.set(fermi(dE, 0, T).toPrecision(3)); rB.set(boltzmann(dE, 0, T).toPrecision(3), "", `${(dE / thermal(T)).toFixed(1)} kT above EF`);
      rK.set(`${(thermal(T) * 1e3).toFixed(2)} meV`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Temperature T", unit: "K", min: 10, max: 1000, value: T, step: 10, format: v => `${v} K`, onInput: v => { T = v; update(); } }),
      slider({ label: "Energy above the Fermi level", unit: "eV", min: -0.3, max: 0.3, value: dE, step: 0.005, format: v => `${v.toFixed(3)} eV`, onInput: v => { dE = v; update(); } }),
      rF.el, rB.el, rK.el,
      h("p", { class: "hint" }, "Cool towards 0 K: the curve becomes a step, every state below EF full, every one above empty. Warm it: the edge spreads over a few kT. Above about 3 kT the Boltzmann curve lies on the Fermi–Dirac one; below EF it climbs past 1, which no occupation can."))));
    update();
  },
};
