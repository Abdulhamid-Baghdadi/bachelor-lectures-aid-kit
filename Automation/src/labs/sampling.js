// Sampled systems (Kugi 2015, 6.2 and 6.4): a P-T2 plant behind a zero-order hold becomes x_{k+1} = Φx_k + Γu_k
// (6.19); its poles go to z = e^{sTa} (Satz 6.3); the sample time should give 4 to 10 samples per rise time (6.62).
import { step, loopDiscretise, loopStairs, loopZPoles, loopRisePT2, roots, charpoly, cAbs } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const TE = 12;
const z = ([re, im]) => im ? `${re.toFixed(3)} ± ${Math.abs(im).toFixed(3)}I` : re.toFixed(3);

export default {
  id: "sampling",
  art: () => a.picture("A smooth step response with a staircase of held samples over it",
    a.path("M 10 130 C 50 130, 60 30, 110 40 S 160 50, 190 50", a.DIM, 2) +
      a.line([[10, 130], [40, 130], [40, 105], [70, 105], [70, 55], [100, 55], [100, 40], [130, 40], [130, 48], [160, 48], [160, 50], [190, 50]], a.ACC, 3)),
  mount(root) {
    let Ta = 0.4, xi = 0.5;
    const chart = h("div", { class: "plot" });
    const rate = readout("Samples per rise time tr/Ta"), poles = readout("Poles of the sampled system"), rise = readout("Rise time tr (6.61)");
    const update = () => {
      const G = { num: [1], den: [1, 2 * xi, 1] }, c = step(G, TE, 600), D = loopDiscretise(G, Ta), N = Math.floor(TE / Ta);
      const y = loopStairs(D, N), sx = [], sy = [];
      y.forEach((v, k) => { sx.push(k * Ta, Math.min(TE, (k + 1) * Ta)); sy.push(v, v); });
      chart.replaceChildren(lineChart({ lines: [{ x: c.t, y: c.y, name: "continuous y(t)", cls: "faint" }, { x: sx, y: sy, name: "held samples y_k", cls: "second" }],
        marks: y.map((v, k) => ({ x: k * Ta, y: v, shape: "dot" })), xMin: 0, xMax: TE, yMin: 0, yMax: 1.6,
        xLabel: "Time t [s]", yLabel: "Output y [1]", label: "Step response of the continuous plant and of the sampled system" }));
      const tr = loopRisePT2(1, xi), n = tr / Ta;
      rise.set(`${tr.toFixed(2)} s`);
      rate.set(n.toFixed(1), n < 4 ? "warn" : "", n < 4 ? "too few: (6.62) asks for 4 to 10" : n > 10 ? "more than needed by (6.62)" : "within 4 to 10 (6.62)");
      const zs = loopZPoles(G.den, Ta), eig = roots(charpoly(D.Phi));
      poles.set(z(zs[0]), "", `eigenvalues of Φ: ${z(eig[0])}; |z| = ${cAbs(zs[0]).toFixed(3)} < 1, inside the unit circle`);
    };
    root.append(h("div", { class: "stage" }, chart, h("div", { class: "controls" },
      slider({ label: "Sample time Ta", unit: "s", min: 0.05, max: 2, value: Ta, log: true, onInput: v => { Ta = v; update(); }, format: v => `${v.toFixed(2)} s` }),
      slider({ label: "Damping ξ of the plant", unit: "", min: 0.1, max: 0.95, value: xi, step: 0.05, onInput: v => { xi = v; update(); }, format: v => v.toFixed(2) }),
      rise.el, rate.el, poles.el,
      h("p", { class: "hint" }, "The plant is the P-T2 element 1/(1 + 2ξs + s²) (6.60) with T2 = 1 s. The samples lie exactly on the continuous curve, because the hold keeps the input constant between them. Lengthen Ta and the poles e^{sTa} move towards the origin while the staircase loses the shape of the response."))));
    update();
  },
};
