// Moving clocks and rods, Einstein (1905) pp. 903–904: a clock resting in k reads τ = t √(1 − (v/c)²) while t passes in
// K, and a rod along the motion measures L √(1 − (v/c)²). Both shrink by the same factor 1/γ, drawn against v.
import { lorentzFactor, clockTime, rodLength, C0 } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const W = 460, H = 150;

export default {
  id: "dilation",
  art: () => a.picture("Two clocks and two rods: the moving rod shorter, the moving clock's hand behind",
    a.circle(55, 50, 26, a.INK, 3) + a.line([[55, 50], [55, 30]], a.INK, 3) + a.circle(145, 50, 26, a.ACC, 3) + a.line([[145, 50], [130, 38]], a.ACC, 3) +
      a.rect(20, 105, 70, 14, a.INK, 3) + a.rect(118, 105, 54, 14, a.ACC, 3) + a.arrow(118, 132, 178, 132, a.ACC, 2)),
  mount(root) {
    let beta = 0.8, t = 10, L = 1;
    const pic = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic", role: "img", "aria-label": "A rod at rest above the same rod moving, drawn to scale" });
    const chartBox = h("div", {});
    const rG = readout("Lorentz factor γ"), rT = readout("Moving clock reads τ"), rL = readout("Moving rod measures");
    const update = () => {
      const v = beta * C0, Lm = rodLength(L, v), sc = (W - 60) / L;
      pic.replaceChildren(
        s("rect", { x: 30, y: 30, width: L * sc, height: 22, class: "medium" }), s("text", { x: 30, y: 24, class: "tick" }, `at rest in K: ${L.toFixed(2)} m`),
        s("rect", { x: 30, y: 95, width: Lm * sc, height: 22, class: "medium" }), s("text", { x: 30, y: 89, class: "tick" }, `at rest in k, moving at ${beta.toFixed(2)} c0: ${Lm.toFixed(3)} m`),
        s("text", { x: 30, y: H - 8, class: "axis-label" }, "Length along the motion [m], measured in K"));
      rG.set(lorentzFactor(v).toFixed(4));
      rT.set(`${clockTime(t, v).toFixed(3)} s`, "", `while ${t} s pass in K`);
      rL.set(`${Lm.toFixed(3)} m`, "", "across the motion: unchanged");
      const bs = Array.from({ length: 199 }, (_, k) => k * 0.005);
      chartBox.replaceChildren(lineChart({ label: "The factor 1/γ = √(1 − (v/c0)²) against the speed, with the speed now marked",
        lines: [{ x: bs, y: bs.map(b => 1 / lorentzFactor(b * C0)), name: "τ/t = L/L0 = 1/γ" }, { x: [beta, beta], y: [0, 1], name: "now", cls: "marker" }],
        xLabel: "Speed v/c0 [1]", yLabel: "Moving over resting [1]", xMin: 0, xMax: 1, yMin: 0, yMax: 1, xFormat: v => v.toFixed(1) }));
    };
    root.append(h("div", { class: "stage" }, h("div", {}, pic, chartBox), h("div", { class: "controls" },
      slider({ label: "Speed v/c0", unit: "", min: 0, max: 0.99, value: beta, step: 0.01, format: v => v.toFixed(2), onInput: v => { beta = v; update(); } }),
      slider({ label: "Time passing in K, t", unit: "s", min: 1, max: 100, value: t, step: 1, format: v => `${v} s`, onInput: v => { t = v; update(); } }),
      slider({ label: "Rest length L0", unit: "m", min: 0.5, max: 2, value: L, step: 0.05, format: v => `${v.toFixed(2)} m`, onInput: v => { L = v; update(); } }),
      rG.el, rT.el, rL.el,
      h("p", { class: "hint" }, "Below 0.1 c0 the factor hardly leaves 1: Einstein notes the moving clock falls behind by about ½ (v/c)² per second. Near c0 it plunges; at c0 a moving body would be flat (p. 903). The effect is mutual: k sees K's clocks slow too."))));
    update();
  },
};
