// Three A/D converters step by step (Schrüfer et al. 2012, sections 6.2–6.3): the flash converter compares with every
// level at once, successive approximation weighs bit by bit, the dual slope times how long a reference takes to undo
// what the input built up.
import { flash, sar, binaryWeights, dualSlope, dualSlopeTrace, si } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const U0 = 10, BITS = 8, NA = 1000, CLOCK = 1e5, RC = 0.02;

export default {
  id: "adc",
  art: () => a.picture("A staircase homing in on a level from above and below",
    a.line([[10, 110], [190, 110]], a.DIM, 2) + a.line([[10, 62], [190, 62]], a.ACC, 2, "6 4") +
      a.line([[15, 130], [15, 75], [50, 75], [50, 45], [85, 45], [85, 60], [120, 60], [120, 68], [155, 68], [155, 64], [185, 64]], a.INK, 3)),
  mount(root) {
    let kind = "sar", ux = 6.3;
    const box = h("div", {}), rV = readout("Result"), rC = readout("Code"), rS = readout("Steps");
    const update = () => {
      if (kind === "sar") {
        const r = sar(ux, binaryWeights(U0, BITS)), k = r.steps.map((_, i) => i + 1);
        box.replaceChildren(lineChart({ label: "Successive approximation: the reference tried at each step against the input",
          lines: [{ x: k, y: r.steps.map(s => s.trial), name: "reference tried", stem: true }, { x: [0.5, BITS + 0.5], y: [ux, ux], name: "input ux", cls: "second" }],
          xLabel: "Step, most significant bit first [1]", yLabel: "Voltage [V]", yMin: 0, yMax: U0, xMin: 0.5, xMax: BITS + 0.5 }));
        rV.set(si(r.value, "V", 4), "", `lsb = ${si(U0 / 2 ** BITS, "V")}`);
        rC.set(r.bits.join(""), "", "1 where the trial was kept, ux ≥ reference");
        rS.set(`${BITS} comparisons`, "", "one per bit, one comparator");
      } else if (kind === "flash") {
        const n = 3, r = flash(ux, U0, n);
        box.replaceChildren(lineChart({ label: "Flash converter: each comparator's threshold and whether the input passed it",
          lines: [{ x: r.thresholds.map((_, i) => i + 1), y: r.thresholds, name: "threshold", stem: true, cls: "second" },
                  { x: r.thermometer.map((_, i) => i + 1), y: r.thermometer.map((b, i) => (b ? r.thresholds[i] : 0)), name: "passed", stem: true },
                  { x: [0.5, 2 ** n - 0.5], y: [ux, ux], name: "input ux", cls: "faint" }],
          xLabel: "Comparator number [1]", yLabel: "Voltage [V]", yMin: 0, yMax: U0, xMin: 0.5, xMax: 2 ** n - 0.5 }));
        rV.set(si(r.value, "V", 4), "", `the middle of its interval, in steps of U0/8 = ${si(U0 / 8, "V")}`);
        rC.set(r.thermometer.slice().reverse().join(""), "", `thermometer code, ${r.k} comparators high (Table 6.1)`);
        rS.set("1 step", "", `${2 ** n - 1} comparators at once; 8 bits would need 255`);
      } else {
        const d = dualSlope(ux, U0, NA, CLOCK, RC), end = 2 * d.t1, ts = Array.from({ length: 401 }, (_, k) => k / 400 * end);
        box.replaceChildren(lineChart({ label: "Dual slope: the integrator runs down with the input for a fixed time, then back up with the reference",
          lines: [{ x: ts.map(t => 1e3 * t), y: ts.map(t => dualSlopeTrace(ux, U0, NA, CLOCK, RC, t)), name: "integrator output" }],
          xLabel: "Time t [ms]", yLabel: "Integrator output ua [V]", yMin: -U0 * d.t1 / RC, yMax: 0.5, xFormat: v => v.toFixed(0) }));
        rV.set(si(d.Nx * U0 / NA, "V", 4), "", `Nx = Na · ux/U0 (eq. 6.16), Na = ${NA}`);
        rC.set(String(d.Nx), "", "clock pulses counted while the reference runs up");
        rS.set(`${si(d.t1 + d.tx, "s")}`, "", "R, C and the clock cancel: only U0 matters");
      }
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Converter", [["sar", "Successive approximation, 8 bit"], ["flash", "Flash, 3 bit"], ["dual", "Dual slope"]], kind, v => { kind = v; update(); }),
      slider({ label: "Input voltage ux", unit: "V", min: 0, max: 9.99, value: ux, step: 0.01, format: v => `${v.toFixed(2)} V`, onInput: v => { ux = v; update(); } }).el,
      rV.el, rC.el, rS.el,
      h("p", { class: "hint" }, `Range U0 = ${U0} V. Flash is fastest but needs 2ⁿ − 1 comparators; successive approximation takes n steps with one comparator and needs a sample-and-hold; the dual slope is slow but averages the input, so hum whose period fits the run-down time cancels (p. 314). The book weighs 6.5 V on BCD steps 8, 4, 2, 1, 0.8, … V and gets 0110 0101 (Bild 6.6 c).`))));
    update();
  },
};
