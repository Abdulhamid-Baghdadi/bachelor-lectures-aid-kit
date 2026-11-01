// The bipolar transistor's output characteristics (Strasser 2015, section 6.1.6; Hobler 2009, part 2):
// IC = Is (exp(UBE/UT) − exp(UBC/UT)) with UBC = UBE − UCE. Above a few UT of UCE the second term vanishes and the
// transistor is a current source set by UBE; below it, in the over-driven region, both diodes conduct.
import { collector, thermal, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const IS = 1e-14, STEPS = [0.66, 0.68, 0.70, 0.72, 0.74];

export default {
  id: "bjt",
  art: () => a.picture("A family of transistor output curves rising steeply then running flat",
    a.line([[20, 130], [20, 20]], a.DIM, 2) + a.line([[20, 130], [185, 130]], a.DIM, 2) +
      [100, 75, 45].map((y, k) => a.path(`M20 130 C30 ${y} 35 ${y} 50 ${y} L180 ${y}`, k === 1 ? a.ACC : a.INK, k === 1 ? 3 : 2)).join("")),
  mount(root) {
    let UBE = 0.72, UCE = 2, B = 100;
    const box = h("div", {}), rC = readout("Collector current IC"), rB = readout("Base current IB = IC/B"), rG = readout("Transconductance gm = IC/UT"), rR = readout("Region");
    const update = () => {
      const Us = Array.from({ length: 201 }, (_, k) => k * 5 / 200), prm = { Is: IS };
      box.replaceChildren(lineChart({ label: "Collector current against collector–emitter voltage, one curve per base–emitter voltage",
        lines: [...STEPS.map(u => ({ x: Us, y: Us.map(v => collector(u, v, prm) * 1e3), cls: "faint" })),
                { x: Us, y: Us.map(v => collector(UBE, v, prm) * 1e3), name: `UBE = ${UBE.toFixed(3)} V` }],
        marks: [{ x: UCE, y: collector(UBE, UCE, prm) * 1e3, shape: "dot" }],
        xLabel: "Collector–emitter voltage UCE [V]", yLabel: "Collector current IC [mA]", yMin: 0, yMax: 25, xFormat: v => v.toFixed(0) }));
      const IC = collector(UBE, UCE, prm), active = UBE - UCE < 0;
      rC.set(si(IC, "A")); rB.set(si(IC / B, "A")); rG.set(si(IC / thermal(), "S"));
      rR.set(active ? "active: BE forward, BC reverse" : "over-driven: both junctions forward", active ? "" : "warn", active ? "" : "the current-source behaviour is lost");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Base–emitter voltage UBE", unit: "V", min: 0.6, max: 0.76, value: UBE, step: 0.002, format: v => `${v.toFixed(3)} V`, onInput: v => { UBE = v; update(); } }),
      slider({ label: "Collector–emitter voltage UCE", unit: "V", min: 0, max: 5, value: UCE, step: 0.02, format: v => `${v.toFixed(2)} V`, onInput: v => { UCE = v; update(); } }),
      slider({ label: "Current gain B", unit: "", min: 20, max: 500, value: B, step: 10, format: v => String(v), onInput: v => { B = v; update(); } }),
      rC.el, rB.el, rG.el, rR.el,
      h("p", { class: "hint" }, "npn, Is = 10 fA, 300 K. 18 mV more on UBE doubles the current: UT ln 2. The curves are flat because the Early effect is left out (the collection's UY → ∞); the knee sits where UCE passes UBE and the collector junction turns forward."))));
    update();
  },
};
