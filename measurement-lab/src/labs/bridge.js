// The Wheatstone bridge (Schrüfer et al. 2012, section 3.3; the lab script's tasks 3.1.1 and 3.3): balanced it measures
// a resistance by ratio; unbalanced, its diagonal voltage follows a strain gauge's change, nearly straight for one
// active arm, exactly straight for opposite changes in one divider or four arms (Bild 3.9 f, h).
import { ARRANGEMENTS, deflection, loaded, arms, si } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const R0 = 350;

export default {
  id: "bridge",
  art: () => a.picture("A diamond of four resistors with a meter across its middle",
    a.line([[100, 15], [40, 75], [100, 135], [160, 75], [100, 15]], a.INK, 3) +
      a.rect(58, 33, 16, 16, a.INK, 3, "#0F172A") + a.rect(126, 33, 16, 16, a.INK, 3, "#0F172A") + a.rect(58, 101, 16, 16, a.ACC, 3, "#0F172A") + a.rect(126, 101, 16, 16, a.INK, 3, "#0F172A") +
      a.line([[40, 75], [86, 75]], a.COOL, 2) + a.line([[114, 75], [160, 75]], a.COOL, 2) + a.circle(100, 75, 13, a.COOL, 3)),
  mount(root) {
    let key = "quarter", U0 = 5, x = 0.01, RM = 1e6;
    const box = h("div", {}), rD = readout("Diagonal voltage Ud"), rL = readout("Straight-line value"), rN = readout("Non-linearity"), rM = readout("With the meter");
    const update = () => {
      const xs = Array.from({ length: 101 }, (_, k) => -0.2 + k * 0.004), lin = ARRANGEMENTS[key].approx;
      const top = 1e3 * U0 * 0.2 * lin * 1.2; // the straight line's end and room for the quarter bridge's bend
      box.replaceChildren(lineChart({ label: `Diagonal voltage of the ${ARRANGEMENTS[key].name.toLowerCase()} against the relative change`,
        lines: [{ x: xs.map(v => 100 * v), y: xs.map(v => 1e3 * deflection(key, U0, R0, v).exact), name: "eq. 3.12, exact" },
                { x: xs.map(v => 100 * v), y: xs.map(v => 1e3 * lin * U0 * v), name: "straight line", cls: "second" }],
        marks: [{ x: 100 * x, y: 1e3 * deflection(key, U0, R0, x).exact, shape: "dot" }],
        xLabel: "Relative change ΔR/R0 [%]", yLabel: "Diagonal voltage Ud [mV]", yMin: -top, yMax: top, xFormat: v => v.toFixed(0), yFormat: v => v.toFixed(0) }));
      const d = deflection(key, U0, R0, x), m = loaded(U0, arms(key, R0, x), RM);
      rD.set(si(d.exact, "V"), "", `R0 = ${R0} Ω, the arms ${arms(key, R0, x).map(r => r.toFixed(1)).join(", ")} Ω`);
      rL.set(si(d.linear, "V"), "", `${lin === 1 ? "" : `${lin === 0.5 ? "½" : "¼"} · `}U0 · ΔR/R0`);
      const nl = d.linear ? d.exact / d.linear - 1 : 0;
      rN.set(`${(100 * nl).toFixed(2)} %`, Math.abs(nl) > 0.01 ? "warn" : "", key === "quarter" ? "the quarter bridge bends: ΔR/(4R0 + 2ΔR), eq. 3.18" : "none: exactly straight");
      rM.set(si(m.UM, "V"), m.UM / d.exact < 0.99 ? "warn" : "", `Ri = ${si(m.Ri, "Ω")} (eq. 3.22): the meter sees ${(100 * m.UM / (d.exact || 1)).toFixed(1)} %`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Active arms", Object.entries(ARRANGEMENTS).map(([k, v]) => [k, v.name]), key, v => { key = v; update(); }),
      slider({ label: "Relative change ΔR/R0", unit: "%", min: -20, max: 20, value: 100 * x, step: 0.1, format: v => `${v.toFixed(1)} %`, onInput: v => { x = v / 100; update(); } }).el,
      slider({ label: "Supply U0", unit: "V", min: 1, max: 10, value: U0, step: 0.5, onInput: v => { U0 = v; update(); } }).el,
      slider({ label: "Meter resistance RM", unit: "Ω", min: 100, max: 1e8, log: true, value: RM, onInput: v => { RM = v; update(); } }).el,
      rD.el, rL.el, rN.el, rM.el,
      h("p", { class: "hint" }, "At ΔR = 0 the bridge is balanced, R2·R3 = R1·R4 (eq. 3.13), whatever the supply: the balanced bridge measures a ratio, the deflected bridge a change. A strain gauge changes by ΔR/R0 = K·ε, K about 2, so ε = 5·10⁻⁴ gives 0.1 % and 1.25 mV from a 5 V quarter bridge (Beispiel 3.2). Opposite changes in one divider double the signal and stay straight (Bild 3.9 f). A passive second gauge cancels temperature (eq. 3.78); glued across the load it also adds its Poisson change, (1 + μ) times the quarter bridge (eq. 3.79); the lab script compares a half and a full bridge on a load cell (task 3.3)."))));
    update();
  },
};
