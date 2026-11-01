// The solution behaviour of ẋ = Ax (3.45) for a 2 × 2 matrix A: trajectories x(t) = Φ(t)x0 with Φ(t) = exp(At) (2.22)
// from starts on a circle; the eigenvalues decide node, focus, saddle or centre (Satz 3.3) and stability (Satz 3.4).
import { eigen2, phaseTrajectory } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

// Example 3.3 of the notes first; the others are example matrices for each kind of rest point.
const PRESETS = { ex33: [[1.4, -1.2], [-1.2, -0.4]], node: [[-1, 0.5], [0, -2]], focus: [[-0.3, 1], [-1, -0.3]], centre: [[0, 1], [-1, 0]] };
const fmt = ([re, im]) => im === 0 ? re.toFixed(2) : `${re.toFixed(2)} ${im < 0 ? "−" : "+"} j${Math.abs(im).toFixed(2)}`;

export default {
  id: "phase",
  art: () => a.picture("Spiral trajectories winding into a rest point at the origin",
    a.line([[20, 75], [180, 75]], a.DIM, 2) + a.line([[100, 10], [100, 140]], a.DIM, 2) +
      a.path("M160 75 C160 20 50 20 50 75 C50 115 135 115 135 75 C135 50 75 50 75 75 C75 90 115 90 112 75", a.ACC, 3) + a.circle(100, 75, 4, a.INK, 3, a.INK)),
  mount(root) {
    let M = PRESETS.ex33.map(r => [...r]);
    const chartBox = h("div", {});
    const rEig = readout("Eigenvalues λ1, λ2 of A"), rKind = readout("Kind of rest point xR = 0");
    const sliders = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([i, j]) =>
      slider({ label: `Entry a${i + 1}${j + 1}`, unit: "", min: -2, max: 2, value: M[i][j], step: 0.1, format: v => v.toFixed(1),
               onInput: v => { M[i][j] = v; update(); } }));
    const update = () => {
      const starts = Array.from({ length: 10 }, (_, k) => [1.8 * Math.cos(k * Math.PI / 5 + 0.3), 1.8 * Math.sin(k * Math.PI / 5 + 0.3)]);
      const lines = starts.map(x0 => { const xs = phaseTrajectory(M, x0, 6, 150), stop = xs.findIndex(x => Math.hypot(...x) > 4);
        const kept = stop < 0 ? xs : xs.slice(0, stop + 1); return { x: kept.map(x => x[0]), y: kept.map(x => x[1]) }; });
      chartBox.replaceChildren(lineChart({ label: "Phase portrait: trajectories of ẋ = Ax from ten starting points",
        lines, marks: [...starts.map(([x, y]) => ({ x, y, shape: "dot" })), { x: 0, y: 0, shape: "o" }],
        xMin: -2.5, xMax: 2.5, yMin: -2.5, yMax: 2.5, xLabel: "State x1 [–]", yLabel: "State x2 [–]", xFormat: v => v.toFixed(1) }));
      const { ev, kind, stable } = eigen2(M);
      rEig.set(`${fmt(ev[0])}, ${fmt(ev[1])}`);
      rKind.set(kind, stable ? "" : "warn", stable ? "globally asymptotically stable: both real parts negative" : "not asymptotically stable");
    };
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      choice("Start from", [["ex33", "Example 3.3"], ["node", "Node"], ["focus", "Focus"], ["centre", "Centre"]], "ex33",
        v => { M = PRESETS[v].map(r => [...r]); sliders.forEach((s, k) => s.set(M[k >> 1][k & 1])); update(); }),
      ...sliders, rEig.el, rKind.el,
      h("p", { class: "hint" }, "Dots mark the starts, ○ the rest point. Real eigenvalues give straight runs along the eigenvectors (a node, or a saddle when their signs differ); complex ones σ ± jω make the states turn, inwards when σ < 0. In Example 3.3 a start on the eigenvector of λ1 = −1 would run straight in; every other start leaves along λ2 = 2."))));
    update();
  },
};
