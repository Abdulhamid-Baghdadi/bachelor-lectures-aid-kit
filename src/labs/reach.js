// Reachability (Kugi 2015, 7.1): x' = Ax + bu (7.10) is completely reachable when R(A, b) = [b, Ab] has rank n
// (7.11); then the input (7.18) built from the Gramian (7.15) steers the state from 0 to any target in the time T.
import { simulate, rank, det, loopReachMatrix, loopSteer } from "../core/index.js";
import { h, slider, readout } from "../ui/kit.js";
import { lineChart } from "../ui/chart.js";
import * as a from "../ui/art.js";

const TARGET = [1, -0.5];

export default {
  id: "reach",
  art: () => a.picture("A state path in the plane steered from the origin to a target point",
    a.line([[20, 130], [190, 130]], a.DIM, 1) + a.line([[30, 140], [30, 10]], a.DIM, 1) + a.circle(30, 130, 4, a.INK, 2, a.INK) +
      a.path("M 30 130 C 60 40, 140 140, 160 50", a.ACC, 3) + a.circle(160, 50, 7, a.HOT, 3)),
  mount(root) {
    let lam = 3, b2 = 1, T = 2;
    const chart = h("div", { class: "plot" });
    const rk = readout("Rank of R(A, b) = [b, Ab] (7.11)"), end = readout("State reached at t = T"), peak = readout("Largest input |u|");
    const update = () => {
      const A = [[-1, 0], [0, -lam]], b = [1, b2], R = loopReachMatrix(A, b), r = rank(R, 1e-6);
      rk.set(`${r} of 2`, r < 2 ? "danger" : "", `det R = ${det(R).toFixed(3)}${r < 2 ? ": not reachable" : ": completely reachable"}`);
      const u = r === 2 ? loopSteer(A, b, T, TARGET) : () => 1;
      const run = simulate((t, x) => [-x[0] + u(t), -lam * x[1] + b2 * u(t)], [0, 0], T, 200);
      const xT = run.x.at(-1), us = run.t.map(u);
      chart.replaceChildren(lineChart({ lines: [{ x: run.t, y: run.x.map(x => x[0]), name: "x₁(t)" }, { x: run.t, y: run.x.map(x => x[1]), name: "x₂(t)", cls: "second" }],
        marks: [{ x: T, y: TARGET[0], shape: "o" }, { x: T, y: TARGET[1], shape: "o", cls: "second" }], xMin: 0, xMax: T, yMin: -1.5, yMax: 1.5,
        xLabel: "Time t [s]", yLabel: "State x [1]", label: "The two states steered from zero towards the target at the final time" }));
      end.set(`(${xT[0].toFixed(3)}, ${xT[1].toFixed(3)})`, r < 2 ? "warn" : "", r < 2 ? (b2 === 0 ? "u never reaches x₂" : "the states move in lockstep; with u = 1 shown, no input separates them") : `target (${TARGET.join(", ")})`);
      peak.set(r === 2 ? Math.max(...us.map(Math.abs)).toFixed(2) : "—", "", "grows as T shrinks, since G⁻¹ grows (7.18)");
    };
    root.append(h("div", { class: "stage" }, chart, h("div", { class: "controls" },
      slider({ label: "Second pole λ in A = diag(−1, −λ)", unit: "1/s", min: 0.5, max: 4, value: lam, step: 0.05, onInput: v => { lam = v; update(); }, format: v => v.toFixed(2) }),
      slider({ label: "Input weight b₂ in b = [1, b₂]", unit: "", min: -1, max: 1.5, value: b2, step: 0.05, onInput: v => { b2 = Math.abs(v) < 1e-9 ? 0 : v; update(); }, format: v => v.toFixed(2) }),
      slider({ label: "Final time T", unit: "s", min: 0.5, max: 5, value: T, step: 0.1, onInput: v => { T = v; update(); }, format: v => `${v.toFixed(1)} s` }),
      rk.el, end.el, peak.el,
      h("p", { class: "hint" }, "det R = b₂(1 − λ): the system loses reachability when b₂ = 0, so u never touches x₂, or when λ = 1, so both states are the same mode and one input moves them alike. Elsewhere the input of (7.18) lands exactly on the target circles, and a shorter T costs a larger input."))));
    update();
  },
};
