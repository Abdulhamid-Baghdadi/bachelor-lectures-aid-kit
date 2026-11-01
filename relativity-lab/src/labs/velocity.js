// Adding speeds, Einstein (1905) p. 906: k moves at v in K, a body moves at w in k, both along x; in K the body moves
// at U = (v + w)/(1 + v w/c²), never past c. Drawn against Galileo's v + w.
import { addVelocities, C0 } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "velocity",
  art: () => a.picture("A train moving right with a ball thrown forward inside it, the two speeds adding to less than their sum",
    a.rect(25, 70, 110, 40, a.INK, 3) + a.arrow(40, 130, 120, 130, a.INK, 3) + a.circle(80, 90, 7, a.ACC, 3, a.ACC) +
      a.arrow(90, 90, 150, 90, a.ACC, 3) + a.line([[175, 20], [175, 140]], a.HOT, 2, "5 4") + a.text(175, 15, "c", 14, a.HOT)),
  mount(root) {
    let v = 0.6, w = 0.6;
    const chartBox = h("div", {});
    const rU = readout("Speed in K, U"), rG = readout("Galileo's sum v + w"), rD = readout("Shortfall of U against v + w");
    const update = () => {
      const U = addVelocities(v * C0, w * C0) / C0;
      rU.set(`${U.toFixed(4)} c0`, "", Math.abs(U) >= 0.9999 ? "light stays at c0 in every frame" : "");
      rG.set(`${(v + w).toFixed(4)} c0`, Math.abs(v + w) > 1 ? "warn" : "", Math.abs(v + w) > 1 ? "faster than light: wrong" : "");
      rD.set(`${((v + w - U) / (v + w || 1) * 100).toFixed(2)} %`);
      const ws = Array.from({ length: 201 }, (_, k) => -1 + k * 0.01);
      chartBox.replaceChildren(lineChart({ label: "Speed of the body in K against its speed in k, Einstein's sum and Galileo's",
        lines: [{ x: ws, y: ws.map(x => addVelocities(v * C0, x * C0) / C0), name: "Einstein U" },
                { x: ws, y: ws.map(x => v + x), name: "Galileo v + w", cls: "second" },
                { x: [w, w], y: [-1, 1], name: "now", cls: "marker" }],
        xLabel: "Speed in k, w/c0 [1]", yLabel: "Speed in K, U/c0 [1]", xMin: -1, xMax: 1, yMin: -1, yMax: 1, xFormat: x => x.toFixed(1) }));
    };
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      slider({ label: "Speed of k in K, v/c0", unit: "", min: -0.99, max: 0.99, value: v, step: 0.01, format: x => x.toFixed(2), onInput: x => { v = x; update(); } }),
      slider({ label: "Speed of the body in k, w/c0", unit: "", min: -1, max: 1, value: w, step: 0.01, format: x => x.toFixed(2), onInput: x => { w = x; update(); } }),
      rU.el, rG.el, rD.el,
      h("p", { class: "hint" }, "Set w to 1: light sent from the moving frame still runs at c0. At small speeds the two curves agree; the parallelogram of velocities holds only to a first approximation (p. 905). The same U comes from two boosts in a row, which is how the tests check it."))));
    update();
  },
};
