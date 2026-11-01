// The first-order lag (P-T1 element) of section 3.8.1, G(s) = V/(1 + sT) (3.133): its step response
// h(t) = V(1 − e^(−t/T)) (3.134), with the tangent at t = 0 of slope V/T (Aufgabe 3.33) reaching V at t = T.
import { pt1Step, si } from "../core/index.js";
import { h, slider, readout } from "../ui/kit.js";
import { lineChart } from "../ui/chart.js";
import * as a from "../ui/art.js";

export default {
  id: "pt1",
  art: () => a.picture("A step response rising quickly then levelling off, with its starting tangent",
    a.line([[20, 130], [185, 130]], a.INK, 2) + a.line([[20, 130], [20, 15]], a.INK, 2) + a.line([[20, 35], [185, 35]], a.DIM, 2, "5 4") +
      a.line([[20, 130], [70, 35]], a.DIM, 2, "5 4") + a.path("M20 130 C45 70 80 42 185 37", a.ACC, 3)),
  mount(root) {
    let V = 10, T = 0.5;
    const chartBox = h("div", {});
    const rT = readout("h(T) = V(1 − e⁻¹)"), rSlope = readout("Slope at t = 0, V/T");
    const update = () => {
      const tEnd = 3.5, ts = Array.from({ length: 201 }, (_, k) => k * tEnd / 200);
      chartBox.replaceChildren(lineChart({ label: "Step response of the first-order lag with its tangent at t = 0",
        lines: [{ x: ts, y: ts.map(t => pt1Step(V, T, t)), name: "h(t)" }, { x: [0, T], y: [0, V], name: "tangent at t = 0", cls: "faint" }],
        marks: [{ x: T, y: pt1Step(V, T, T), shape: "dot" }],
        xMin: 0, xMax: tEnd, yMin: 0, yMax: 21, xLabel: "Time t [s]", yLabel: "Step response h(t) [–]", xFormat: v => v.toFixed(1) }));
      rT.set(pt1Step(V, T, T).toFixed(2), "", "63 % of the final value V");
      rSlope.set(si(V / T, "1/s"));
    };
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      slider({ label: "Gain V", unit: "", min: 1, max: 20, value: V, step: 0.5, format: v => v.toFixed(1), onInput: v => { V = v; update(); } }),
      slider({ label: "Time constant T", unit: "s", min: 0.05, max: 2, value: T, step: 0.05, onInput: v => { T = v; update(); } }),
      rT.el, rSlope.el,
      h("p", { class: "hint" }, "V sets where the response ends, T how fast it gets there: the tangent at the start meets the final value at t = T, where h has reached 63 %. After about 5T it is within 1 %. The defaults are the notes' example (3.136)."))));
    update();
  },
};
