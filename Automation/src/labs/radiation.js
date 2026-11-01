// Heat radiation between grey diffuse surfaces (Kugi et al. 2015, section 3.2.4), in the notes' Beispiel 3.1: a hot
// inner tube inside a vacuum jacket. The outer tube loses q′ = πD(α(T2 − T∞) + ε2σ(T2⁴ − T∞⁴)) (3.65) by convection
// and radiation; the inner tube must be hot enough to push q′ across the vacuum by radiation alone (3.67).
import { heatOuterLoss, heatInnerTemp, heatRadAlpha, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const K = 273.15;

export default {
  id: "radiation",
  art: () => a.picture("A hot tube inside a vacuum jacket, radiating outwards in wavy rays",
    a.circle(100, 75, 18, a.HOT, 3) + a.circle(100, 75, 42, a.INK, 3) +
      [0, 1, 2, 3].map(k => { const t = k * Math.PI / 2 + 0.6, c = Math.cos(t), s = Math.sin(t);
        return a.path(`M${100 + 22 * c} ${75 + 22 * s} L${100 + 37 * c} ${75 + 37 * s}`, a.ACC, 2, "3 3"); }).join("") +
      a.arrow(145, 75, 185, 75, a.COOL, 2, 6)),
  mount(root) {
    let T2 = 45, Tinf = 20, alpha = 10, eps1 = 0.8, eps2 = 0.8;
    const D = 0.1, d = 0.05; // typical tubes, 100 mm and 50 mm
    const chartBox = h("div", {});
    const rQ = readout("Largest heat flow per metre q′ (3.66)"), rS = readout("Share by radiation"),
          rA = readout("Linearised radiation coefficient"), rT = readout("Inner tube temperature T1 (3.67)");
    const update = () => {
      const Ts = Array.from({ length: 101 }, (_, k) => Tinf + k * 80 / 100);
      const at = t => heatOuterLoss(t + K, Tinf + K, alpha, eps2, D);
      chartBox.replaceChildren(lineChart({ label: "Heat loss of the outer tube by convection and by radiation against its temperature",
        lines: [{ x: Ts, y: Ts.map(t => at(t).total), name: "total" },
                { x: Ts, y: Ts.map(t => at(t).conv), name: "convection", cls: "second" },
                { x: Ts, y: Ts.map(t => at(t).rad), name: "radiation", cls: "faint" }],
        marks: [{ x: T2, y: at(T2).total, shape: "dot" }],
        xLabel: "Outer tube temperature T2 [°C]", yLabel: "Heat loss per metre q′ [W/m]", yMin: 0 }));
      const q = at(T2);
      rQ.set(si(q.total, "W/m")); rS.set(`${(q.rad / q.total * 100 || 0).toFixed(0)} %`);
      rA.set(si(heatRadAlpha(T2 + K, Tinf + K, eps2), "W/(m²K)"), "", `against α = ${alpha} W/(m²K) for convection`);
      rT.set(`${(heatInnerTemp(q.total, T2 + K, eps1, eps2, d, D) - K).toFixed(0)} °C`);
    };
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      slider({ label: "Highest safe outer temperature T2,max", unit: "°C", min: 25, max: 100, value: T2, step: 1, format: v => `${v} °C`, onInput: v => { T2 = v; update(); } }),
      slider({ label: "Emissivity of the outer tube ε2", unit: "", min: 0.05, max: 1, value: eps2, step: 0.05, format: v => v.toFixed(2), onInput: v => { eps2 = v; update(); } }),
      slider({ label: "Emissivity of the inner tube ε1", unit: "", min: 0.05, max: 1, value: eps1, step: 0.05, format: v => v.toFixed(2), onInput: v => { eps1 = v; update(); } }),
      slider({ label: "Heat transfer coefficient α", unit: "W/(m²K)", min: 2, max: 50, value: alpha, step: 1, onInput: v => { alpha = v; update(); } }),
      rQ.el, rS.el, rA.el, rT.el,
      h("p", { class: "hint" }, "Near room temperature radiation carries about as much as gentle convection: its linearised coefficient εσ(T2² + T∞²)(T2 + T∞) is some 5 W/(m²K). It grows with the cube of temperature, so the radiation curve bends up. A shiny jacket (low ε2) radiates little, so the reactor must run cooler; shiny tubes also make the inner tube hotter for the same heat flow. Tubes of 50 and 100 mm, air at 20 °C; typical values."))));
    update();
  },
};
