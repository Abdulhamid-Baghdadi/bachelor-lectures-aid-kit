// The two-tank system of section 1.5 (1.29) against its linearisation about the rest state (Ruhelage) for an inflow qR,
// (2.53) and (2.54) as Aufgabe 2.18 works them out: small steps of the inflow agree, large ones part.
import { tankRhs, tankRest, tankLinear, simulate, matVec, si } from "../core/index.js";
import { h, slider, readout } from "../ui/kit.js";
import { lineChart } from "../ui/chart.js";
import * as a from "../ui/art.js";

// Example values, not from the notes: tanks of 0.02 m² with outlets of 0.5 cm².
const P = { A: 0.02, a: 5e-5 };

export default {
  id: "tank",
  art: () => a.picture("Two tanks one above the other, the upper draining into the lower",
    a.line([[30, 30], [30, 70], [90, 70], [90, 30]]) + a.rect(32, 45, 56, 23, a.COOL, 0, "rgba(125,211,252,.4)") +
      a.line([[90, 66], [120, 66], [120, 82]], a.COOL, 3) + a.line([[100, 80], [100, 125], [160, 125], [160, 80]]) +
      a.rect(102, 100, 56, 23, a.COOL, 0, "rgba(125,211,252,.4)") + a.line([[160, 121], [185, 121]], a.COOL, 3) + a.arrow(55, 10, 55, 40, a.ACC, 3)),
  mount(root) {
    let qR = 1e-4, step = 50;
    const chartBox = h("div", {});
    const rRest = readout("Rest level h1,R = h2,R = qR²/(2g a²)"), rEnd = readout("Final level of tank 2: nonlinear, linearised");
    const update = () => {
      const hR = tankRest(P, qR), dq = qR * step / 100, lin = tankLinear(P, qR), T = 8 * P.A * qR / (P.a ** 2 * 9.81);
      const non = simulate(tankRhs(P, qR + dq), [hR, hR], T, 300);
      const lnr = simulate((t, x) => matVec(lin.A, x).map((v, i) => v + lin.b[i] * dq), [0, 0], T, 300);
      chartBox.replaceChildren(lineChart({ label: "Level of tank 2 after a step of the inflow: the nonlinear model and its linearisation",
        lines: [{ x: non.t, y: non.x.map(x => x[1] * 100), name: "nonlinear (1.29)" },
                { x: lnr.t, y: lnr.x.map(x => (hR + x[1]) * 100), name: "linearised (2.53)", cls: "second" }],
        xLabel: "Time t [s]", yLabel: "Level h2 [cm]" }));
      rRest.set(si(hR, "m"));
      const hn = non.x.at(-1)[1], hl = hR + lnr.x.at(-1)[1], far = Math.abs(hl - hn) > 0.1 * Math.abs(hn - hR);
      rEnd.set(`${si(hn, "m")}, ${si(hl, "m")}`, far ? "warn" : "", far ? "too far from the rest state for the linear model" : "close: the step is small enough");
    };
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      slider({ label: "Steady inflow qR", unit: "m³/s", min: 5e-5, max: 2e-4, value: qR, step: 5e-6, onInput: v => { qR = v; update(); } }),
      slider({ label: "Step of the inflow Δq", unit: "% of qR", min: -80, max: 200, value: step, step: 5, format: v => `${v} %`, onInput: v => { step = v; update(); } }),
      rRest.el, rEnd.el,
      h("p", { class: "hint" }, "The outflow grows with the square root of the level, so a step up raises the level more than the tangent predicts and a step down lowers it less. Shrink the step and the two curves meet. Example tanks: A = 0.02 m², a = 0.5 cm²."))));
    update();
  },
};
