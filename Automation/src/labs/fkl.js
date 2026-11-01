// PI design by loop shaping, the Frequenzkennlinienverfahren (Kugi 2015, 5.1): targets for the crossover ωC and the
// phase margin Φ, read from ωC·tr ≈ 1.5 (5.2) and Φ[°] + ü[%] ≈ 70 (5.3), fix TI (5.16) and VI (5.17) of the PI
// controller (5.14) for the plant (5.13).
import { series, closeLoop, step, stepInfo, bode, logspace, loopPiShape, loopTangentRise } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const G = { num: [5], den: [1, 2 * 0.707, 1] }; // (5.13)

export default {
  id: "fkl",
  art: () => a.picture("A Bode magnitude line falling through zero decibels at the crossover frequency",
    a.line([[10, 75], [190, 75]], a.DIM, 1) + a.line([[15, 25], [95, 55], [175, 125]], a.ACC, 3) + a.circle(116, 75, 5, a.HOT, 2, a.HOT) +
      a.text(116, 100, "ωC", 15, a.HOT) + a.text(176, 68, "0 dB", 12, a.DIM)),
  mount(root) {
    let wc = 0.5, phi = 60;
    const bodeChart = h("div", { class: "plot" }), stepChart = h("div", { class: "plot" });
    const pi = readout("PI controller R(s) = VI(1 + sTI)/s"), tr = readout("Rise time tr"), os = readout("Overshoot ü");
    const update = () => {
      const d = loopPiShape(G, wc, phi);
      if (!d.possible) { pi.set("—", "danger", `the zero would have to turn the phase by ${d.lift.toFixed(1)}°; a PI zero gives 0° to 90°`); }
      else pi.set(`VI = ${d.VI.toFixed(3)}, TI = ${d.TI.toFixed(2)} s`, "", `arg L1(IωC) = ${d.argL1.toFixed(1)}°, so the zero lifts ${d.lift.toFixed(1)}° (5.16)`);
      const L = d.possible ? series(d.R, G) : { num: G.num, den: [...G.den, 0] };
      const ws = logspace(0.01, 10, 300), B = bode(L, ws), B1 = bode({ num: G.num, den: [...G.den, 0] }, ws);
      bodeChart.replaceChildren(lineChart({ lines: [{ x: ws.map(Math.log10), y: B.map(p => p.db), name: "|L(Iω)|" }, { x: ws.map(Math.log10), y: B1.map(p => p.db), name: "|L1(Iω)|", cls: "faint" }],
        marks: [{ x: Math.log10(wc), y: 0, shape: "dot" }], yMin: -60, yMax: 60, xFormat: v => `10^${v.toFixed(0)}`,
        xLabel: "Frequency log₁₀ ω [rad/s]", yLabel: "Magnitude [dB]", label: "Bode magnitude of the open loop with the chosen crossover" }));
      const T = 8 * 1.5 / wc, r = step(closeLoop(L), T, 800), info = stepInfo(r.t, r.y);
      stepChart.replaceChildren(lineChart({ lines: [{ x: r.t, y: r.y, name: "closed-loop step h(t)" }], yMin: 0, yMax: 1.6,
        xLabel: "Time t [s]", yLabel: "Output y [1]", label: "Step response of the closed loop" }));
      tr.set(`${loopTangentRise(r.t, r.y).toFixed(2)} s`, "", `(5.2) predicts 1.5/ωC = ${(1.5 / wc).toFixed(2)} s`);
      os.set(`${info.overshoot.toFixed(1)} %`, "", `(5.3) predicts 70 − Φ = ${(70 - phi).toFixed(0)} %`);
    };
    root.append(h("div", { class: "stage" }, bodeChart, stepChart, h("div", { class: "controls" },
      slider({ label: "Crossover frequency ωC", unit: "rad/s", min: 0.1, max: 2, value: wc, log: true, onInput: v => { wc = v; update(); }, format: v => `${v.toFixed(2)} rad/s` }),
      slider({ label: "Phase margin Φ", unit: "°", min: 30, max: 80, value: phi, step: 1, onInput: v => { phi = v; update(); }, format: v => `${v.toFixed(0)}°` }),
      pi.el, tr.el, os.el,
      h("p", { class: "hint" }, "The notes' own design: ωC = 0.5 rad/s and Φ = 60° give TI = 0.47 s and VI = 0.1 (5.18). The rise time is read as in Abb. 5.2, from the tangent at the inflection point. The two rules of thumb are close for this plant; they drift apart where the response is no longer ruled by one pair of poles."))));
    update();
  },
};
