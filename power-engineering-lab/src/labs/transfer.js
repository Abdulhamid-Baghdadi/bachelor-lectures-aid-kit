// Power over a reactance and the nose curve (Gawlik 2015, section 6.2.1; slides V15+16): a load at the end of a line
// of reactance X, the sending end held at 1 p.u. The PV curves of figure 6-2 for five power factors, and the
// operating point for the power set.
import { receivingVoltage, receivingVoltageLow } from "../core/index.js";
import { h, slider, choice, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const PHIS = [60, 30, 0, -15, -30];

export default {
  id: "transfer",
  art: () => a.picture("A nose-shaped curve: voltage falling as power grows, then turning back",
    a.path("M20 30 C90 32 140 50 160 80 C170 100 150 115 120 125", a.INK, 3) + a.circle(160, 82, 6, a.ACC, 3, a.ACC) + a.line([[20, 135], [180, 135]], a.DIM, 2)),
  mount(root) {
    let X = 0.5, phi = 30, P = 0.4;
    const box = h("div", {}), rU = readout("Voltage at the load"), rD = readout("Angle across the line"), rM = readout("Most power at this power factor");
    const update = () => {
      const ps = Array.from({ length: 201 }, (_, k) => k * 0.01), q = f => Math.tan(f * Math.PI / 180);
      // The chosen power factor solid, its lower branch dashed, the other four faint behind them.
      const others = PHIS.filter(f => f !== phi), lines = PHIS.flatMap(f => {
        const sel = f === phi, up = ps.map(p => receivingVoltage(1, 0, X, p, p * q(f))), lo = ps.map(p => receivingVoltageLow(1, 0, X, p, p * q(f)));
        return [{ x: ps, y: up, name: sel ? `upper, φ = ${f}°` : f === others[0] ? "other φ" : undefined, cls: sel ? "" : "faint" },
                { x: ps, y: lo, name: sel ? "lower" : undefined, cls: sel ? "second" : "faint" }];
      }).sort((l, m) => (l.cls === "faint") - (m.cls === "faint")).reverse();
      const U2 = receivingVoltage(1, 0, X, P, P * q(phi));
      box.replaceChildren(lineChart({ label: `Voltage at the load against its power over X = ${X} p.u.`, lines,
        marks: Number.isFinite(U2) ? [{ x: P, y: U2, shape: "dot" }] : [],
        xLabel: "Active power P [p.u.]", yLabel: "Voltage at the load U₂ [p.u.]", xMin: 0, xMax: 2, yMin: 0, yMax: 1.4, xFormat: v => v.toFixed(1), yFormat: v => v.toFixed(1) }));
      // The nose: where the root vanishes, P_max = U1²/(2X) · (√(1 + tan²φ) − tan φ) for Q = P tan φ.
      const t = q(phi), Pmax = (Math.sqrt(1 + t * t) - t) / (2 * X);
      if (Number.isFinite(U2)) {
        rU.set(`${U2.toFixed(3)} p.u.`, U2 < 0.9 ? "warn" : "", U2 < 0.9 ? "below 0.9: not allowed for long" : "upper branch: the stable operating point");
        rD.set(`${(Math.asin(P * X / U2) * 180 / Math.PI).toFixed(1)}°`, "", "from P = U₁ U₂ sin δ / X (6-4)");
      } else {
        rU.set("none", "danger", "beyond the nose: the voltage collapses");
        rD.set("—", "", "");
      }
      rM.set(`${Pmax.toFixed(3)} p.u.`, "", phi === 0 ? "U₁²/(2X) at δ = 45°, U₂ = U₁/√2 (6-11 to 6-13)" : "where the upper and lower branch meet");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Load angle φ (positive: inductive)", PHIS.map(f => [String(f), `${f}°`]), String(phi), v => { phi = Number(v); update(); }),
      slider({ label: "Active power of the load P", unit: "p.u.", min: 0, max: 2, value: P, step: 0.01, format: v => `${v.toFixed(2)} p.u.`, onInput: v => { P = v; update(); } }),
      slider({ label: "Line reactance X", unit: "p.u.", min: 0.1, max: 1, value: X, step: 0.05, format: v => `${v.toFixed(2)} p.u.`, onInput: v => { X = v; update(); } }),
      rU.el, rD.el, rM.el,
      h("p", { class: "hint" }, "Active power flows with the angle between the two ends, reactive power with the difference of their voltages (6-4, 6-5). An inductive load pulls the voltage down early; a capacitive one first lifts it, then collapses it all the more suddenly (p. 200). The faint curves are the other power factors of figure 6-2; the lower branch is the second, unstable solution."))));
    update();
  },
};
