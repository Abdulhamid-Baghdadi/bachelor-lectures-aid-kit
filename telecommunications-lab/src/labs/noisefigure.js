// Noise figure of a receiver chain (Goiser 2016, Rauschen und Link-Budget, slides 10–65): the slides' superheterodyne
// receiver, an LNA, a mixer and two amplifiers, whose order and figures can be changed; Friis gives the chain's noise
// figure, the bars show what each stage adds.
import { friis, cascadeTemperature, outputNoise, fromDB, dB, T0 } from "../core/index.js";
import { h, slider, choice, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "noisefigure",
  art: () => a.picture("A chain of amplifier triangles, the first one highlighted",
    [20, 75, 130].map((x, k) => a.path(`M${x} 50 L${x + 40} 75 L${x} 100 Z`, k === 0 ? a.ACC : a.INK, 3)).join("") +
      a.line([[10, 75], [20, 75]], a.INK, 2) + a.line([[60, 75], [75, 75]], a.INK, 2) + a.line([[115, 75], [130, 75]], a.INK, 2) + a.line([[170, 75], [190, 75]], a.INK, 2)),
  mount(root) {
    let lnaG = 12, lnaF = 0.7, order = "lna";
    const box = h("div", {}), rF = readout("Noise figure of the chain"), rT = readout("System temperature at the input"), rN = readout("Noise at the output");
    const update = () => {
      const lna = { name: "LNA", G: fromDB(lnaG), f: fromDB(lnaF) }, mixer = { name: "mixer", G: 0.25, f: 4 };
      const rest = [{ name: "amplifier 1", G: 100, f: fromDB(6.5) }, { name: "amplifier 2", G: 1000, f: fromDB(6.5) }];
      const chain = order === "lna" ? [lna, mixer, ...rest] : [mixer, lna, ...rest];
      let g = 1;
      const adds = chain.map(st => { const t = (st.f - 1) * T0 / g; g *= st.G; return t; });
      box.replaceChildren(lineChart({ label: "Noise temperature each stage adds, referred to the input",
        lines: [{ x: chain.map((_, k) => k + 1), y: adds, name: "Te,k / (G1 … Gk−1)", stem: true }],
        xLabel: `Stage: ${chain.map(s => s.name).join(", ")} [1]`, yLabel: "Added noise temperature [K]", yMin: 0, xMin: 0.5, xMax: 4.5 }));
      const f = friis(chain);
      rF.set(`${dB(f).toFixed(2)} dB`, "", `f = ${f.toFixed(2)} by Friis; Te = ${cascadeTemperature(chain).toFixed(0)} K`);
      rT.set(`${(100 + cascadeTemperature(chain)).toFixed(0)} K`, "", "antenna 100 K + Te");
      rN.set(`${dB(outputNoise(chain, 100, 5e6) / 1e-3).toFixed(1)} dBm`, "", "G k B (Ts + Te), B = 5 MHz");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Order", [["lna", "LNA, then mixer"], ["mixer", "Mixer, then LNA"]], order, v => { order = v; update(); }),
      slider({ label: "LNA gain", unit: "dB", min: 0, max: 30, value: lnaG, step: 0.5, format: v => `${v} dB`, onInput: v => { lnaG = v; update(); } }),
      slider({ label: "LNA noise figure", unit: "dB", min: 0.2, max: 6, value: lnaF, step: 0.1, format: v => `${v.toFixed(1)} dB`, onInput: v => { lnaF = v; update(); } }),
      rF.el, rT.el, rN.el,
      h("p", { class: "hint" }, "The slides' receiver (slides 43–65): LNA 12 dB, F = 0.7 dB; mixer −6 dB, F = 6 dB; amplifiers 20 and 30 dB, F = 6.5 dB; antenna 100 K; B = 5 MHz. It gives F = 3.5 dB and −49 dBm. Put the mixer first and its loss counts in full: the system temperature roughly triples (slides 49–50). kT0 = −174 dBm/Hz. Free-space path loss and the link budget are in the Electrodynamics lab."))));
    update();
  },
};
