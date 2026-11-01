// Shifting, reversing and scaling the time axis (Prechtl 2010, section 1.2; Doblinger 2015, section 2.2): x(at − t0)
// for a signal, x[dMn + n0] for a sequence. Scaling a sequence by M keeps only every M-th sample: unlike a signal, it
// loses values.
import { SHAPES, SEQUENCES, reindex, range } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "timeaxis",
  art: () => a.picture("A triangle and its mirrored, shifted copy on one time axis",
    a.line([[15, 120], [185, 120]], a.DIM, 2) + a.line([[25, 120], [55, 60], [85, 120]], a.INK, 3) +
      a.line([[105, 120], [150, 50], [175, 120]], a.ACC, 3) + a.arrow(60, 40, 120, 40, a.COOL, 2)),
  mount(root) {
    let mode = "ct", scale = 1, shift = 0, reverse = false;
    const chartBox = h("div", {}), rule = readout("Transformed signal");
    const update = () => {
      if (mode === "ct") {
        const ts = range(-4, 4, 401), s = reverse ? -scale : scale;
        const x = t => SHAPES.tri(t);
        chartBox.replaceChildren(lineChart({ label: "The signal x(t) and the transformed y(t)",
          lines: [{ x: ts, y: ts.map(x), name: "x(t)", cls: "faint" }, { x: ts, y: ts.map(t => x(s * t - shift)), name: "y(t)" }],
          xLabel: "Time t [s]", yLabel: "Value [1]", yMin: 0, yMax: 1.1, xFormat: v => v.toFixed(0) }));
        rule.set(`y(t) = x(${reverse ? "−" : ""}${scale} t ${shift < 0 ? "+" : "−"} ${Math.abs(shift)} s)`);
      } else {
        const ns = Array.from({ length: 21 }, (_, k) => k - 10), M = Math.round(scale), n0 = -Math.round(shift);
        const y = reindex(SEQUENCES.tri, 0, { M, n0, reverse }, ns);
        chartBox.replaceChildren(lineChart({ label: "The sequence x[n] and the transformed y[n]",
          lines: [{ x: ns, y: reindex(SEQUENCES.tri, 0, {}, ns), name: "x[n]", cls: "faint", stem: true },
                  { x: ns, y, name: "y[n]", stem: true }],
          xLabel: "Index n [1]", yLabel: "Value [1]", yMin: 0, yMax: 1.1 }));
        rule.set(`y[n] = x[${reverse ? "−" : ""}${M} n ${n0 < 0 ? "−" : "+"} ${Math.abs(n0)}]`, "",
          M > 1 ? `${y.filter(v => v).length} of 7 samples are left: the rest fall between the kept indices` : "");
      }
    };
    const sc = slider({ label: "Scale a (sequences: whole numbers)", min: 0.5, max: 3, value: scale, step: 0.25, format: v => v.toFixed(2), onInput: v => { scale = v; update(); } });
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      choice("Time", [["ct", "Continuous, x(t)"], ["dt", "Discrete, x[n]"]], mode, v => { mode = v; update(); }),
      sc,
      slider({ label: "Shift t0 (or −n0)", min: -4, max: 4, value: shift, step: 1, format: v => v.toFixed(0), onInput: v => { shift = v; update(); } }),
      choice("Direction", [["f", "Forward"], ["r", "Reversed"]], "f", v => { reverse = v === "r"; update(); }),
      rule.el,
      h("p", { class: "hint" }, "Shift first, then scale: x(at − t0) has its start where at − t0 = 0, at t = t0/a, not at t0. For a sequence the scale must be a whole number, and a scale of 2 keeps only the even-indexed samples; scaling a signal by 2 loses nothing."))));
    update();
  },
};
