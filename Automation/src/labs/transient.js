// Transient heat transfer in the notes' Beispiel 3.3 (Kugi et al. 2015, section 3.5): an immersion heater warms water
// of uniform temperature in a ceramic tank, m0 cp dT/dt = P − kA(T − T∞) (3.97), so T rises as a first-order step
// response with time constant m0 cp/(kA) (3.99) until it boils at Ts; then the water boils away (3.104).
import { heatWallK, heatTankTemp, heatTankBoilTime, heatTankDryTime, heatTankPower, si } from "../core/index.js";
import { h, slider, readout } from "../ui/kit.js";
import { lineChart } from "../ui/chart.js";
import * as a from "../ui/art.js";

// Typical values: 1 kg of water, 0.05 m² of ceramic wall 5 mm thick (λ ≈ 1.5 W/(m K)), αi = 500, αa = 10 W/(m²K).
const W = { m0: 1, cp: 4190, hv: 2.257e6, Tinf: 20, Ts: 100, A: 0.05 };

export default {
  id: "transient",
  art: () => a.picture("A tank of water with a heating coil and a thermometer curve rising to the boil",
    a.rect(30, 30, 70, 100, a.INK, 3) + a.path("M50 120 l8 -10 l8 10 l8 -10 l8 10", a.HOT, 2) +
      a.path("M115 125 C130 60 150 40 185 38", a.ACC, 3) + a.line([[115, 38], [185, 38]], a.DIM, 2, "4 4")),
  mount(root) {
    let P = 600, aa = 10;
    const chartBox = h("div", {});
    const rTau = readout("Time constant m0cp/(kA)"), rB = readout("Time to the boil ts"), rD = readout("All boiled away after"), rP = readout("Power for the boil in 10 min (3.100)");
    const update = () => {
      const kA = W.A * heatWallK(500, [{ L: 0.005, lambda: 1.5 }], aa), p = { ...W, P, kA };
      const ts = heatTankBoilTime(p), tau = W.m0 * W.cp / kA, end = Math.min(3600, Number.isFinite(ts) ? 1.6 * ts : 3600);
      const t = Array.from({ length: 161 }, (_, k) => k * end / 160);
      chartBox.replaceChildren(lineChart({ label: "Water temperature against time after the heater is switched on",
        lines: [{ x: t.map(v => v / 60), y: t.map(v => heatTankTemp(v, p)), name: "water" },
                { x: [0, end / 60], y: [W.Ts, W.Ts], name: "boiling point", cls: "faint" }],
        marks: Number.isFinite(ts) ? [{ x: ts / 60, y: W.Ts, shape: "dot" }] : [],
        xLabel: "Time t [min]", yLabel: "Temperature T [°C]", yMin: 0, yMax: 110, xFormat: v => v.toFixed(0) }));
      rTau.set(si(tau, "s"), "", `${(tau / 3600).toFixed(1)} h: heat loss is slow beside the heater`);
      rB.set(Number.isFinite(ts) ? si(ts, "s") : "never", Number.isFinite(ts) ? "" : "warn", Number.isFinite(ts) ? "" : `P below kA(Ts − T∞) = ${si(kA * 80, "W")}`);
      rD.set(Number.isFinite(ts) ? si(heatTankDryTime(ts, p), "s") : "never");
      rP.set(si(heatTankPower(600, p), "W"));
    };
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      slider({ label: "Heater power P", unit: "W", min: 10, max: 3000, value: P, log: true, onInput: v => { P = v; update(); } }),
      slider({ label: "Outer heat transfer coefficient αa", unit: "W/(m²K)", min: 2, max: 100, value: aa, log: true, onInput: v => { aa = v; update(); } }),
      rTau.el, rB.el, rD.el, rP.el,
      h("p", { class: "hint" }, "The water would settle at T∞ + P/(kA), far above 100 °C, so it boils on the nearly straight start of the curve: ts ≈ m0cp(Ts − T∞)/P. Only when P comes close to the loss kA(Ts − T∞) does the curve bend over, and below it the water never boils. Material values are typical, for illustration."))));
    update();
  },
};
