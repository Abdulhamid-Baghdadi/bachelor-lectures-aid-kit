// The diode characteristic (Strasser 2015, section 5.3; Hobler 2009, part 1): I = Is (exp(Ud/(n UT)) − 1), with Is from
// the doping and the lifetime, an ideality factor n, and a series resistance Rs that bends the forward branch into a
// straight line. The reverse branch saturates at −Is until breakdown, whose voltage is marked.
import { saturation, diodeCurrent, breakdown, thermal, si } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const NA = 1e18, ND = 1e16, AREA = 1e-4, TAU = 1e-6;

export default {
  id: "diode",
  art: () => a.picture("A diode symbol above its exponential characteristic, bending into a straight line",
    a.line([[30, 30], [70, 30]], a.INK) + a.path("M50 18 L50 42 L70 30 Z", a.INK, 3) + a.line([[70, 18], [70, 42]], a.INK) +
      a.line([[15, 120], [100, 120]], a.DIM, 2) + a.path("M15 121 C90 121 110 115 125 75 L160 20", a.ACC, 3) + a.line([[35, 121], [35, 140]], a.HOT, 2, "4 3")),
  mount(root) {
    let n = 1, Rs = 0, T = 300, scale = "lin";
    const box = h("div", {}), rS = readout("Saturation current Is"), rI = readout("Current at 0.7 V"), rB = readout("Breakdown estimate");
    const update = () => {
      const Is = saturation({ NA, ND, tau: TAU, area: AREA, T }), prm = { Is, n, Rs, T };
      if (scale === "lin") {
        const Us = Array.from({ length: 301 }, (_, k) => -0.4 + k * 1.4 / 300);
        box.replaceChildren(lineChart({ label: "Diode current against voltage",
          lines: [{ x: Us, y: Us.map(U => diodeCurrent(U, prm) * 1e3), name: "I" }, { x: Us, y: Us.map(U => diodeCurrent(U, { Is, T }) * 1e3), name: "ideal, n = 1, Rs = 0", cls: "faint" }],
          xLabel: "Voltage U [V]", yLabel: "Current I [mA]", yMin: -5, yMax: 100, xFormat: v => v.toFixed(1) }));
      } else {
        const Us = Array.from({ length: 301 }, (_, k) => 0.05 + k * 1.05 / 300);
        box.replaceChildren(lineChart({ label: "Logarithm of the forward current against voltage",
          lines: [{ x: Us, y: Us.map(U => Math.log10(diodeCurrent(U, prm))), name: "log₁₀ I" }, { x: Us, y: Us.map(U => Math.log10(diodeCurrent(U, { Is, T }))), name: "ideal", cls: "faint" }],
          xLabel: "Voltage U [V]", yLabel: "Current, log₁₀ of I [A]", yMin: -14, yMax: 0, xFormat: v => v.toFixed(1) }));
      }
      rS.set(`${Is.toExponential(2)} A`, "", `${(n * thermal(T) * Math.log(10) * 1e3).toFixed(0)} mV per decade`);
      rI.set(si(diodeCurrent(0.7, prm), "A")); rB.set(si(-breakdown(ND), "V"), "", "the reverse current rises steeply there; not drawn");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Current axis", [["lin", "Linear"], ["log", "Logarithmic"]], scale, v => { scale = v; update(); }),
      slider({ label: "Ideality factor n", unit: "", min: 1, max: 2, value: n, step: 0.05, format: v => v.toFixed(2), onInput: v => { n = v; update(); } }),
      slider({ label: "Series resistance Rs", unit: "Ω", min: 0, max: 20, value: Rs, step: 0.5, format: v => `${v} Ω`, onInput: v => { Rs = v; update(); } }),
      slider({ label: "Temperature T", unit: "K", min: 250, max: 400, value: T, step: 5, format: v => `${v} K`, onInput: v => { T = v; update(); } }),
      rS.el, rI.el, rB.el,
      h("p", { class: "hint" }, `Silicon p⁺n diode, NA = ${NA.toExponential(0)}, ND = ${ND.toExponential(0)} cm⁻³, τ = 1 µs, area 0.01 mm². On the logarithmic axis the ideal diode is a straight line, 60 mV a decade; the resistance bends it over at high current. Warm it 10 K: at fixed voltage the current rises by about half, at fixed current the voltage falls about 2 mV/K.`))));
    update();
  },
};
