// The meter loads the circuit (Schrüfer et al. 2012, section 2.1.2; the lab script's tasks 1.1.1 and 1.1.2): a
// voltmeter forms a divider with the source's internal resistance, an ammeter adds its own resistance to the loop.
import { voltmeterReading, ammeterReading, loadingError, si } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "loading",
  art: () => a.picture("A source with its inner resistor and a voltmeter across its terminals drawing current",
    a.circle(40, 75, 18) + a.resistor(85, 40) + a.line([[40, 57], [40, 40], [69, 40]]) + a.line([[101, 40], [150, 40], [150, 57]]) +
      a.circle(150, 75, 18, a.ACC) + a.text(150, 81, "V", 18, a.ACC) + a.line([[150, 93], [150, 110], [40, 110], [40, 93]]) +
      a.arrow(120, 52, 140, 60, a.HOT, 2)),
  mount(root) {
    let kind = "voltmeter", Rs = 1e5, Rm = 1e7;
    const box = h("div", {}), rT = readout("Without the meter"), rR = readout("The meter shows"), rE = readout("Loading error");
    const ctl = h("div", { class: "sub" });
    const update = () => {
      const volt = kind === "voltmeter", Uq = 10;
      // The error against the meter's resistance, on a log axis: 10 Ω to 100 MΩ for a voltmeter, 10 mΩ to 100 kΩ for an ammeter.
      const xs = Array.from({ length: 141 }, (_, k) => (volt ? 1 : -2) + k * 0.05);
      const err = R => (volt ? loadingError(voltmeterReading(Uq, Rs, R), Uq) : loadingError(ammeterReading(Uq, Rs, R), Uq / Rs));
      box.replaceChildren(lineChart({ label: `Loading error of a ${kind} against its resistance`,
        lines: [{ x: xs, y: xs.map(l => 100 * err(10 ** l)), name: kind }],
        marks: [{ x: Math.log10(Rm), y: 100 * err(Rm), shape: "dot", name: "this meter" }],
        xLabel: `${volt ? "Voltmeter resistance RV" : "Ammeter resistance RA"} [Ω], log scale`, yLabel: "Loading error [%]",
        yMin: -100, yMax: 0, xFormat: v => si(10 ** v, "Ω") }));
      const truth = volt ? Uq : Uq / Rs, reading = volt ? voltmeterReading(Uq, Rs, Rm) : ammeterReading(Uq, Rs, Rm), e = loadingError(reading, truth);
      const unit = volt ? "V" : "A";
      rT.set(si(truth, unit, 4), "", volt ? "the open-circuit voltage Uq" : "Uq / R");
      rR.set(si(reading, unit, 4), "", volt ? "Uq · RV/(Ri + RV)" : "Uq/(R + RA)");
      rE.set(`${(100 * e).toFixed(e > -0.01 ? 3 : 1)} %`, e < -0.01 ? "warn" : "", e < -0.01 ? "more than 1 %: correct it or choose another meter" : "small");
    };
    const build = () => {
      const volt = kind === "voltmeter";
      if (volt) { Rs = 1e5; Rm = 1e7; } else { Rs = 4700; Rm = 100; }
      ctl.replaceChildren(
        slider({ label: volt ? "Source's internal resistance Ri" : "Load resistance R", unit: "Ω", min: 1, max: 1e7, log: true, value: Rs, onInput: v => { Rs = v; update(); } }).el,
        slider({ label: volt ? "Voltmeter resistance RV" : "Ammeter resistance RA", unit: "Ω", min: volt ? 10 : 0.01, max: volt ? 1e8 : 1e5, log: true, value: Rm, onInput: v => { Rm = v; update(); } }).el);
      update();
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Meter", [["voltmeter", "Voltmeter across a source"], ["ammeter", "Ammeter in a loop"]], kind, v => { kind = v; build(); }),
      ctl, rT.el, rR.el, rE.el,
      h("p", { class: "hint" }, "A voltmeter should be much larger than the source's resistance, an ammeter much smaller than the loop's. When the reading halves, the meter equals the source's resistance (Schrüfer et al. 2012, p. 91). The lab script finds a voltmeter's own resistance from the divider it forms with a known 100 kΩ (task 1.1.1). A shunt Rp = RM·IM/(I − IM) extends an ammeter's range, a series resistor a voltmeter's (eqs. 2.31, 2.34)."))));
    build();
  },
};
