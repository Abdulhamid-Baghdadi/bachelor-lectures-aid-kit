// Resistance from voltage and current (Schrüfer et al. 2012, section 3.1.1; the lab script's task 1.1.3): with the
// ammeter inside the voltmeter's reach the voltage is too high, with the voltmeter inside the ammeter's the current is;
// each error can be corrected, and each circuit suits one end of the scale.
import { currentCorrect, voltageCorrect, crossover, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "resistance",
  art: () => a.picture("Two error curves over resistance that cross, one rising, one falling",
    a.line([[15, 130], [185, 130]], a.DIM, 2) + a.path("M15 20 C60 95 90 120 185 128", a.ACC, 3) + a.path("M15 128 C110 120 140 95 185 20", a.COOL, 3) +
      a.circle(100, 112, 6, a.INK, 3)),
  mount(root) {
    let Rx = 100, RA = 1, RV = 1e7;
    const box = h("div", {}), rC = readout("Current-correct, U/I"), rV = readout("Voltage-correct, U/I"), rX = readout("Both equally wrong at"), rB = readout("Better here");
    const update = () => {
      const xs = Array.from({ length: 161 }, (_, k) => -1 + k * 0.05), errC = R => 100 * (currentCorrect(R, RA, RV).raw / R - 1),
        errV = R => 100 * (1 - voltageCorrect(R, RA, RV).raw / R);
      box.replaceChildren(lineChart({ label: "Size of the raw error of the two circuits against the resistance measured",
        lines: [{ x: xs, y: xs.map(l => errC(10 ** l)), name: "current-correct" }, { x: xs, y: xs.map(l => errV(10 ** l)), name: "voltage-correct", cls: "second" }],
        marks: [{ x: Math.log10(Rx), y: Math.min(errC(Rx), errV(Rx)), shape: "dot", name: "Rx" }],
        xLabel: "Resistance measured Rx [Ω], log scale", yLabel: "Size of the raw error [%]", yMin: 0, yMax: 10, xFormat: v => si(10 ** v, "Ω") }));
      const c = currentCorrect(Rx, RA, RV), v = voltageCorrect(Rx, RA, RV), Rc = crossover(RA, RV);
      rC.set(si(c.raw, "Ω", 4), "", `${errC(Rx).toFixed(3)} % high; minus RA gives ${si(c.corrected, "Ω", 4)} (eq. 3.1)`);
      rV.set(si(v.raw, "Ω", 4), "", `${errV(Rx).toFixed(3)} % low; corrected ${si(v.corrected, "Ω", 4)} (eq. 3.2)`);
      rX.set(si(Rc, "Ω"), "", "√(RA · RV)");
      rB.set(Rx > Rc ? "current-correct" : "voltage-correct", "", Rx > Rc ? "a large Rx: the ammeter's drop is small beside it" : "a small Rx: the voltmeter's current is small beside it");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Resistance measured Rx", unit: "Ω", min: 0.1, max: 1e7, log: true, value: Rx, onInput: v => { Rx = v; update(); } }).el,
      slider({ label: "Ammeter resistance RA", unit: "Ω", min: 0.01, max: 100, log: true, value: RA, onInput: v => { RA = v; update(); } }).el,
      slider({ label: "Voltmeter resistance RV", unit: "Ω", min: 1e4, max: 1e9, log: true, value: RV, onInput: v => { RV = v; update(); } }).el,
      rC.el, rV.el, rX.el, rB.el,
      h("p", { class: "hint" }, "The lab script measures 100 Ω and 100 kΩ both ways (task 1.1.3): try them. The crossover √(RA·RV) is derived here from eqs. 3.1 and 3.2 to first order; the book's rule is the same in words: circuit a for Rx ≫ RA, b for Rx ≪ RV. For the smallest resistances the four-wire connection and the Thomson bridge remove the leads (p. 201)."))));
    update();
  },
};
