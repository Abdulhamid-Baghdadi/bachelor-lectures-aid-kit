// The long line and the Ferranti effect (Gawlik 2015, section 4.1.5; slides V09+10): the 380 kV line of the notes'
// example, fed with 380 kV, open or loaded with a resistance at its end. Left the voltage along the line, right the
// voltage at the end against the length, as in figure 4-19.
import { lineSolve, lineConstants, naturalLoad, cMul, conj, C, cAbs, arg, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const LINE = { R: 0.03, L: 0.8e-3, G: 0.02e-6, Cap: 14e-9 }, U1 = 380e3;

export default {
  id: "line",
  art: () => a.picture("A pylon line whose voltage rises towards its open end",
    a.line([[20, 120], [180, 120]], a.DIM, 2) + [30, 90, 150].map(x => a.line([[x, 120], [x, 70]], a.INK, 3)).join("") +
      a.path("M20 70 Q110 70 180 30", a.ACC, 3) + a.circle(180, 30, 5, a.ACC, 3, a.ACC)),
  mount(root) {
    let l = 800, P = 0;
    const box = h("div", { class: "pair" }), rU = readout("Voltage at the end"), rS = readout("Power at the start"), rN = readout("Natural load"), rW = readout("Characteristic impedance");
    const { Zw } = lineConstants(LINE), Pnat = naturalLoad(U1, Zw);
    const update = () => {
      const Z2 = P > 0 ? U1 * U1 / P : Infinity, r = lineSolve(LINE, l, U1, Z2, 100);
      const lens = Array.from({ length: 76 }, (_, k) => k * 20), end = z => lens.map(x => cAbs(lineSolve(LINE, x, 1, z).U2));
      box.replaceChildren(
        lineChart({ label: `Voltage along a ${l} km line, ${P ? `${P / 1e6} MW at its end` : "open at its end"}`,
          lines: [{ x: r.profile.map(p => p.x), y: r.profile.map(p => p.U / U1), name: "|U(x)|/U₁" }, { x: [0, l], y: [1.1, 1.1], name: "+10 %", cls: "faint" }],
          xLabel: "Distance from the start x [km]", yLabel: "Voltage |U|/U₁ [1]", xMin: 0, xMax: Math.max(l, 1), yMin: 0.6, yMax: 1.6, yFormat: v => v.toFixed(1) }),
        lineChart({ label: "Voltage at the end against the line's length",
          lines: [{ x: lens, y: end(Infinity), name: "open end" }, ...(P ? [{ x: lens, y: end(Z2), name: `${P / 1e6} MW`, cls: "second" }] : [])],
          marks: [{ x: l, y: cAbs(r.U2) / U1, shape: "dot" }],
          xLabel: "Length l [km]", yLabel: "End voltage |U₂|/U₁ [1]", xMin: 0, xMax: 1500, yMin: 0, yMax: 3, yFormat: v => v.toFixed(1) }));
      const S1 = cMul(C(U1), conj(r.I1));
      rU.set(`${si(cAbs(r.U2), "V")}, ${(100 * cAbs(r.U2) / U1).toFixed(1)} %`, cAbs(r.U2) > 1.1 * U1 || cAbs(r.U2) < 0.9 * U1 ? "warn" : "", `${arg(r.U2).toFixed(1)}° from the start: U₂ = U₁ / (cosh γl + Z_w/Z₂ sinh γl)`);
      rS.set(`${si(S1[0], "W")}, ${si(S1[1], "var")}`, "", S1[1] < 0 ? "negative Q: the line's capacitance feeds reactive power back" : "the line's inductance takes reactive power");
      rN.set(si(Pnat, "W"), "", P > Pnat ? "above it, the line takes reactive power" : "below it, the line gives reactive power");
      rW.set(`${Zw[0].toFixed(1)} ${Zw[1] < 0 ? "−" : "+"} j${Math.abs(Zw[1]).toFixed(1)} Ω`, "", "√(L'/C') for a lossless line (4-48)");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Length l", unit: "km", min: 0, max: 1500, value: l, step: 10, format: v => `${v} km`, onInput: v => { l = v; update(); } }),
      slider({ label: "Load at the end (0: open)", unit: "MW", min: 0, max: 1200, value: P / 1e6, step: 10, format: v => `${v} MW`, onInput: v => { P = v * 1e6; update(); } }),
      rU.el, rS.el, rN.el, rW.el,
      h("p", { class: "hint" }, "R' = 0.03 Ω/km, L' = 0.8 mH/km, G' = 0.02 µS/km, C' = 14 nF/km (p. 90). An open line's capacitance draws a charging current through its inductance, and the voltage rises towards the end: 2.3 % at 200 km, 16 % at 500 km, a resonance near a quarter wavelength, 1500 km (p. 87). This is why long lines are switched on loaded, or with shunt reactors. Waves and the telegrapher's equations themselves are in the Electrodynamics lab."))));
    update();
  },
};
