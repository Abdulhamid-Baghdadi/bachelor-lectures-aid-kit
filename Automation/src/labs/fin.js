// A cooling fin (Rippe), Kugi et al. (2015), section 3.4.3: a rod fixed to a wall at T0 loses heat along its sides
// and tip. The temperature falls along it, and the fin efficiency ηf = Q(0)/Qmax (3.94) compares its heat flow with
// that of a fin at T0 all over. The profile is the fin equation worked by hand; defaults are the notes' Aufgabe 3.14.
import { finTemperature, finHeat, finEfficiency, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "fin",
  art: () => a.picture("A wall with cooling fins sticking out, heat leaving their sides",
    a.rect(20, 15, 25, 120, a.INK, 3) +
      [40, 75, 110].map(y => a.rect(45, y, 120, 10, a.ACC, 2) + a.arrow(105, y - 2, 105, y - 14, a.HOT, 2, 5)).join("")),
  mount(root) {
    // Aufgabe 3.14: L = 0.5 m, T0 = 353 K, T∞ = 293 K, α = αL = 25 W/(m²K), P = 0.5 m, A = 0.01 m², λ = 60 W/(m K).
    const f = { L: 0.5, T0: 353, Tinf: 293, alpha: 25, alphaL: 25, P: 0.5, A: 0.01, lambda: 60 };
    const C = v => v - 273.15;
    const chartBox = h("div", {});
    const rQ = readout("Heat flow at the base Q(0)"), rE = readout("Fin efficiency ηf = Q(0)/Qmax"), rT = readout("Tip temperature T(L)");
    const update = () => {
      const xs = Array.from({ length: 101 }, (_, k) => k * f.L / 100);
      chartBox.replaceChildren(lineChart({ label: "Temperature along the fin from base to tip",
        lines: [{ x: xs.map(x => x * 100), y: xs.map(x => C(finTemperature(x, f))), name: "fin" },
                { x: [0, f.L * 100], y: [C(f.Tinf), C(f.Tinf)], name: "air T∞", cls: "faint" }],
        xLabel: "Distance from the base x [cm]", yLabel: "Temperature T [°C]", yMin: C(f.Tinf) - 5, yMax: C(f.T0) + 5, yFormat: v => v.toFixed(0) }));
      const eta = finEfficiency(f);
      rQ.set(si(finHeat(f), "W")); rE.set(`${(eta * 100).toFixed(0)} %`, eta < 0.5 ? "warn" : "", eta < 0.5 ? "the far end does little" : "");
      rT.set(`${C(finTemperature(f.L, f)).toFixed(1)} °C`);
    };
    const set = k => v => { f[k] = v; if (k === "alpha") f.alphaL = v; update(); };
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      slider({ label: "Fin length L", unit: "m", min: 0.02, max: 1, value: f.L, step: 0.01, onInput: set("L") }),
      slider({ label: "Conductivity λ", unit: "W/(m K)", min: 10, max: 400, value: f.lambda, log: true, onInput: set("lambda") }),
      slider({ label: "Heat transfer coefficient α", unit: "W/(m²K)", min: 5, max: 200, value: f.alpha, log: true, onInput: set("alpha") }),
      rQ.el, rE.el, rT.el,
      h("p", { class: "hint" }, "Heat must be conducted out along the fin before it can leave its surface, so the fin cools towards the tip. A longer fin moves more heat, but each extra centimetre adds less: the efficiency falls. A better conductor (copper, λ ≈ 400 W/(m K), typical) keeps the fin warm further out; stronger cooling α makes it cold sooner. Cross-section 0.01 m², perimeter 0.5 m, as in the notes' Aufgabe 3.14."))));
    update();
  },
};
