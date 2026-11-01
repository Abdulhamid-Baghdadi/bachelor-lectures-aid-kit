// The Biot–Savart formula, B = μI/(4π) ∮ s′ × e_R / R² ds′ (3.144): a circular loop cut into n straight pieces, each
// adding its share at points on the axis; the sum against the integral's closed form.
import { loopAxisB, loopAxisBNumeric, si } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "biotsavart",
  art: () => a.picture("A current loop seen at an angle, with small pieces each sending a contribution to a point on the axis",
    a.path("M40 95 A60 22 0 1 0 160 95 A60 22 0 1 0 40 95", a.INK, 3) + a.line([[100, 140], [100, 15]], a.DIM, 2, "4 5") + a.circle(100, 35, 5, a.ACC, 3, a.ACC) +
      a.line([[40, 95], [100, 35]], a.ACC, 2) + a.line([[160, 95], [100, 35]], a.ACC, 2) + a.arrow(100, 35, 100, 12, a.ACC, 3)),
  mount(root) {
    let I = 5, R = 0.05, n = 8;
    const pic = s("svg", { viewBox: "0 0 240 200", class: "schematic", role: "img", "aria-label": "A loop made of straight pieces, seen from the front" });
    const chartBox = h("div", {});
    const rC = readout("B at the centre, summed"), rE = readout("B at the centre, closed form μI/(2a)");
    const update = () => {
      const pts = Array.from({ length: n + 1 }, (_, k) => { const t = k * 2 * Math.PI / n; return `${(120 + 80 * Math.cos(t)).toFixed(1)},${(100 + 80 * Math.sin(t)).toFixed(1)}`; });
      pic.replaceChildren(s("polyline", { points: pts.join(" "), class: "loop", fill: "none" }),
        s("circle", { cx: 120, cy: 100, r: 5, class: "probe" }), s("text", { x: 120, y: 196, class: "tick", "text-anchor": "middle" }, `${n} pieces`));
      const zs = Array.from({ length: 81 }, (_, k) => -4 * R + k * 8 * R / 80);
      chartBox.replaceChildren(lineChart({ label: "Flux density along the loop's axis: the sum over pieces and the closed form",
        lines: [{ x: zs.map(z => z * 100), y: zs.map(z => loopAxisB(I, R, z) * 1e6), name: "closed form" },
                { x: zs.map(z => z * 100), y: zs.map(z => loopAxisBNumeric(I, R, z, n) * 1e6), name: `${n} pieces`, cls: "second" }],
        xLabel: "Distance along the axis z [cm]", yLabel: "Flux density B [µT]", yMin: 0, xFormat: v => v.toFixed(0) }));
      const sum = loopAxisBNumeric(I, R, 0, n), exact = loopAxisB(I, R, 0);
      rC.set(si(sum, "T")); rE.set(si(exact, "T"));
    };
    root.append(h("div", { class: "stage" }, h("div", {}, pic, chartBox), h("div", { class: "controls" },
      slider({ label: "Current I", unit: "A", min: 0.5, max: 20, value: I, step: 0.5, onInput: v => { I = v; update(); } }),
      slider({ label: "Loop radius a", unit: "m", min: 0.01, max: 0.1, value: R, step: 0.005, onInput: v => { R = v; update(); } }),
      slider({ label: "Pieces n", unit: "", min: 3, max: 64, value: n, step: 1, format: v => String(v), onInput: v => { n = v; update(); } }),
      rC.el, rE.el,
      h("p", { class: "hint" }, "Each piece is taken as a short element at its midpoint, the way the integral is defined. With a handful of pieces the sum is already close; at 64 the two curves lie on top of each other."))));
    update();
  },
};
