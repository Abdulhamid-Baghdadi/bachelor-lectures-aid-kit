// The Nyquist criterion (Kugi 2015, 4.4.3): the locus of the open loop L(Iω) against the point −1 decides the closed
// loop's stability (4.45); for L of the form (4.54) the phase margin Φ = arg L(IωC) + π (4.55) must be positive.
import { bode, logspace, closeLoop, step, loopMargins, loopRouthKmax } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const DEN = [1, 2, 1, 0]; // s(s + 1)², Aufgabe 4.12

export default {
  id: "nyquist",
  art: () => a.picture("A Nyquist locus curling in towards the origin, passing to the right of the point minus one",
    a.line([[10, 75], [190, 75]], a.DIM, 1) + a.line([[120, 10], [120, 140]], a.DIM, 1) + a.circle(80, 75, 4, a.HOT, 2, a.HOT) +
      a.path("M 100 140 C 100 90, 60 70, 95 60 S 125 72, 120 75", a.ACC, 3) + a.text(72, 98, "−1", 14, a.HOT)),
  mount(root) {
    let K = 0.5;
    const locus = h("div", { class: "plot" }), stepChart = h("div", { class: "plot" });
    const pm = readout("Phase margin Φ (4.55)"), gm = readout("Gain margin"), wc = readout("Crossover frequency ωC");
    const Kc = loopRouthKmax({ num: [1], den: DEN });
    const update = () => {
      const L = { num: [K], den: DEN }, B = bode(L, logspace(0.05, 50, 500)), m = loopMargins(L);
      const ring = Array.from({ length: 73 }, (_, k) => k * Math.PI / 36);
      locus.replaceChildren(lineChart({ lines: [{ x: B.map(p => p.re), y: B.map(p => p.im), name: "L(Iω), ω > 0" },
        { x: ring.map(Math.cos), y: ring.map(Math.sin), name: "unit circle", cls: "faint" }],
        marks: [{ x: -1, y: 0, shape: "dot", name: "−1", cls: "second" }],
        xMin: -3, xMax: 1, yMin: -3, yMax: 1, xLabel: "Real part Re L(Iω) [1]", yLabel: "Imaginary part Im L(Iω) [1]", xFormat: v => v.toFixed(1),
        label: "Nyquist locus of the open loop with the critical point minus one" }));
      const r = step(closeLoop(L), 40, 400);
      stepChart.replaceChildren(lineChart({ lines: [{ x: r.t, y: r.y, name: "closed-loop step h(t)" }], yMin: -0.5, yMax: 2,
        xLabel: "Time t [s]", yLabel: "Output y [1]", label: "Step response of the closed loop" }));
      const stable = K < Kc;
      pm.set(`${m.phaseMargin.toFixed(1)}°`, stable ? "" : "danger", stable ? "positive: the closed loop is stable" : "negative: the locus encircles −1, the loop is unstable");
      gm.set(m.gainMargin.toFixed(2), m.gainMargin < 1 ? "danger" : "", `the gain may grow by this factor; at K = ${Kc.toFixed(2)} the locus runs through −1`);
      wc.set(`${m.wc.toFixed(3)} rad/s`);
    };
    root.append(h("div", { class: "stage" }, locus, stepChart, h("div", { class: "controls" },
      slider({ label: "Gain K in L(s) = K/(s(s + 1)²)", unit: "", min: 0.1, max: 5, value: K, step: 0.05, onInput: v => { K = v; update(); }, format: v => v.toFixed(2) }),
      pm.el, gm.el, wc.el,
      h("p", { class: "hint" }, "Raising K stretches the locus without turning it. While it passes to the right of −1 the step settles; at K = 2 it runs through −1 and the loop oscillates, beyond that the locus encircles −1 and the step grows without bound, as Aufgabe 4.12 finds for K = 5. The gain margin is not defined in the notes; it is the usual reading of the same locus."))));
    update();
  },
};
