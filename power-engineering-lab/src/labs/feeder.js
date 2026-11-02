// The worked example: Gawlik's 30 kV feeder (2015, pp. 215–216), a 110 kV network of 5 GVA, a 31 MVA transformer
// and 40 km of overhead line. First it carries a load, through the load flow of section 6.2; then it is short-circuited
// anywhere along the line, by (6-31) and (6-43). The protection must tell the two apart (pp. 210–211).
import { FEEDER, feederLoad, feederFault } from "../core/index.js";
import { h, slider, choice, readout, tabs } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const kA = v => `${(v / 1000).toFixed(3)} kA`;

export default {
  id: "feeder",
  art: () => a.picture("A transformer feeding a long overhead line, a lightning flash at its far end",
    a.path("M20 75 L45 75", a.INK, 3) + a.path("M55 75 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 M70 75 m-5 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0", a.INK, 3) +
      a.path("M85 75 L170 75", a.INK, 3) + a.path("M175 45 L165 72 L178 72 L168 100", a.ACC, 3)),
  mount(root) {
    const st = { P: 5, cos: 0.9, x: 40, cmin: false };
    const Q = () => st.P * 1e6 * Math.tan(Math.acos(st.cos));

    // Step 1: the load and the voltage at the line's end.
    const c1 = h("div", { class: "plot" }), rU = readout("Voltage at the line's end"), rI = readout("Line current"), rL = readout("Losses, 3 I² Rk");
    const load = () => {
      const ps = Array.from({ length: 121 }, (_, k) => k * 0.125), tan = Math.tan(Math.acos(st.cos)), L = feederLoad(st.P * 1e6, Q());
      c1.replaceChildren(lineChart({ lines: [{ x: ps, y: ps.map(p => feederLoad(p * 1e6, p * 1e6 * tan).u) , name: `cos φ = ${st.cos}` }, { x: [0, 15], y: [0.9, 0.9], name: "0.9 p.u.", cls: "faint" }],
        marks: Number.isNaN(L.u) ? [] : [{ x: st.P, y: L.u, shape: "dot" }], xMin: 0, xMax: 15, yMin: 0, yMax: 1.05,
        xLabel: "Load P [MW]", yLabel: "Voltage at the line's end [p.u. of 30 kV]", label: "The voltage at the line's end against the load: the nose curve" }));
      if (Number.isNaN(L.u)) { rU.set("no operating point", "danger", "the load is beyond the nose of the curve: the voltage collapses"); rI.set("—"); rL.set("—"); return; }
      rU.set(`${(L.U / 1000).toFixed(2)} kV = ${L.u.toFixed(3)} p.u.`, L.u < 0.9 ? "warn" : "", L.u < 0.9 ? "below 0.9 p.u.: too low for the consumers (p. 202)" : "within 0.9 p.u.");
      rI.set(`${L.I.toFixed(0)} A`, "", "S/(√3 U) at the line's end");
      rL.set(`${(L.loss / 1e6).toFixed(2)} MW = ${(L.loss / (st.P * 1e6) * 100).toFixed(1)} %`, "", `Rk = ${L.R.toFixed(2)} Ω, almost all of it the line's 4.8 Ω`);
    };
    const s1 = h("div", { class: "stage" }, c1, h("div", { class: "controls" },
      slider({ label: "Load at the line's end P", unit: "MW", min: 0.5, max: 15, value: st.P, step: 0.5, format: v => `${v.toFixed(1)} MW`, onInput: v => { st.P = v; load(); fault(); } }),
      slider({ label: "Power factor cos φ, inductive", unit: "1", min: 0.7, max: 1, value: st.cos, step: 0.01, format: v => v.toFixed(2), onInput: v => { st.cos = v; load(); fault(); } }),
      rU.el, rI.el, rL.el,
      h("p", { class: "hint" }, `The impedances of p. 215, all at 30 kV: network 0.020 + j0.197 Ω, transformer 0.13 + j3.48 Ω, line 4.8 + j14 Ω. The 110 kV side is held at nominal voltage.`),
      h("p", { class: "hint" }, "The transformer could deliver 31 MVA, but 40 km of line let through little more than 12 MW before the voltage collapses: the line's 14 Ω, not the transformer, limit the feeder. This lab's reading of the notes' network; the notes compute only its fault.")));

    // Step 2: a fault along the line.
    const c2 = h("div", { class: "plot" }), rZ = readout("Impedance to the fault Zk"), rK = readout("Initial short-circuit current I″k3 = c Un/(√3 Zk) (6-31)"),
      rP = readout("Peak current ip = κ √2 I″k (6-43)"), rS = readout("Protection: line-end fault against load current");
    const fault = () => {
      const xs = Array.from({ length: 81 }, (_, k) => k * 0.5), c = st.cmin ? 1 : 1.1, F = feederFault(st.x, c), end = feederFault(FEEDER.len, 1), L = feederLoad(st.P * 1e6, Q());
      c2.replaceChildren(lineChart({ lines: [{ x: xs, y: xs.map(x => feederFault(x, 1.1).Ik / 1000), name: "cmax = 1.1" }, { x: xs, y: xs.map(x => feederFault(x, 1).Ik / 1000), name: "cmin = 1.0", cls: "second" }],
        marks: [{ x: st.x, y: F.Ik / 1000, shape: "dot" }], xMin: 0, xMax: 40, yMin: 0, yMax: 6,
        xLabel: "Fault location along the line [km]", yLabel: "I″k3 [kA]", label: "Initial short-circuit current against the fault's distance down the line" }));
      rZ.set(`${F.Z.toFixed(2)} Ω`, "", `${F.R.toFixed(2)} + j${F.X.toFixed(2)} Ω; R/X = ${(F.R / F.X).toFixed(2)}`);
      rK.set(kA(F.Ik), "", `c = ${c}; S″k = √3 Un I″k = ${(F.Sk / 1e6).toFixed(0)} MVA; the notes, at 40 km with c = 1.1: 1.038 kA`);
      rP.set(kA(F.ip), "", `κ = 1 + e^(−πR/X) = ${F.kappa.toFixed(2)}; the notes read 1.4 off Abb. 6-18`);
      const ratio = Number.isNaN(L.I) ? NaN : end.Ik / L.I;
      rS.set(Number.isNaN(ratio) ? "—" : `${ratio.toFixed(1)} ×`, ratio < 2 ? "danger" : "", `I″k,min at 40 km = ${kA(end.Ik)} with cmin = 1.0 (table 6-2), against ${Number.isNaN(L.I) ? "—" : L.I.toFixed(0)} A of load: an overcurrent relay must pick up between them`);
    };
    const s2 = h("div", { class: "stage" }, c2, h("div", { class: "controls" },
      slider({ label: "Fault location x", unit: "km", min: 0, max: 40, value: st.x, step: 0.5, format: v => `${v.toFixed(1)} km`, onInput: v => { st.x = v; fault(); } }),
      choice("Voltage factor (table 6-2)", [["max", "Largest current, cmax = 1.1"], ["min", "Smallest current, cmin = 1.0"]], "max", v => { st.cmin = v === "min"; fault(); }),
      rZ.el, rK.el, rP.el, rS.el,
      h("p", { class: "hint" }, "Close to the transformer the line's resistance is missing: R/X falls, κ climbs towards 2 and the peak is more than six times the line-end one. The largest current sizes the switchgear; the smallest, at the far end with cmin, must still trip the protection (p. 211).")));

    root.append(tabs("Steps of the worked example", [["1 · Load", s1], ["2 · Short circuit", s2]]));
    load(); fault();
  },
};
