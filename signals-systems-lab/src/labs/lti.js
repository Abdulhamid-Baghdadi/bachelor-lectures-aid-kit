// Linearity and time invariance (Prechtl 2010, section 1.4; Doblinger 2015, section 3.1): put 2x1 + x2 through the
// system and compare with 2S{x1} + S{x2}; put in a delayed signal and compare with the delayed output.
import { SHAPES, SEQUENCES, SYSTEMS, DSYSTEMS, linearityError, shiftError, range } from "../core/index.js";
import { h, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const seq = v => n => Number.isInteger(n) && n >= 0 && n < v.length ? v[n] : 0;

export default {
  id: "lti",
  art: () => a.picture("A box with two inputs added before it and their outputs added after it, equal",
    a.rect(75, 50, 50, 50, a.INK, 3) + a.text(100, 82, "S", 22) + a.arrow(20, 75, 73, 75, a.ACC, 3) + a.arrow(127, 75, 180, 75, a.ACC, 3) +
      a.text(40, 60, "x1+x2", 14, a.COOL) + a.text(155, 60, "y1+y2", 14, a.COOL)),
  mount(root) {
    let mode = "ct", id = "lowpass";
    const box = h("div", {}), rL = readout("Superposition"), rT = readout("Time invariance");
    const systemBox = h("div", {});
    const update = () => {
      const table = mode === "ct" ? SYSTEMS : DSYSTEMS, run = table[id].run;
      const x1 = mode === "ct" ? SHAPES.rect : seq(SEQUENCES.rect), x2 = mode === "ct" ? SHAPES.tri : seq(SEQUENCES.tri);
      const t0 = mode === "ct" ? 1 : 3;
      const ts = mode === "ct" ? range(-0.5, 5, 111) : Array.from({ length: 16 }, (_, n) => n);
      const both = run(t => 2 * x1(t) + x2(t)), y1 = run(x1), y2 = run(x2), late = run(t => x2(t - t0)), y2l = run(x2);
      const stem = mode === "dt", unit = mode === "ct" ? "Time t [s]" : "Index n [1]";
      box.replaceChildren(
        lineChart({ label: "The output of the sum, against the sum of the outputs",
          lines: [{ x: ts, y: ts.map(both), name: "S{2x1 + x2}", stem }, { x: ts, y: ts.map(t => 2 * y1(t) + y2(t)), name: "2S{x1} + S{x2}", cls: "second" }],
          xLabel: unit, yLabel: "Output [1]", xFormat: v => v.toFixed(0) }),
        lineChart({ label: "The output of a delayed input, against the delayed output",
          lines: [{ x: ts, y: ts.map(late), name: "S{x(t − t0)}", stem }, { x: ts, y: ts.map(t => y2l(t - t0)), name: "y(t − t0)", cls: "second" }],
          xLabel: unit, yLabel: "Output [1]", xFormat: v => v.toFixed(0) }));
      const eL = linearityError(run, x1, x2, 2, 1, ts), eT = shiftError(run, x2, t0, ts);
      rL.set(eL < 1e-2 ? "holds" : "fails", eL < 1e-2 ? "" : "danger", eL < 1e-2 ? "linear" : `largest gap ${eL.toFixed(2)}: not linear`);
      rT.set(eT < 2e-2 ? "holds" : "fails", eT < 2e-2 ? "" : "danger", eT < 2e-2 ? "time-invariant" : `largest gap ${eT.toFixed(2)}: time-varying`);
    };
    const pickSystem = () => {
      const table = mode === "ct" ? SYSTEMS : DSYSTEMS;
      if (!table[id]) id = Object.keys(table)[0];
      systemBox.replaceChildren(choice("System", Object.entries(table).map(([k, s]) => [k, s.name]), id, v => { id = v; update(); }));
    };
    // The course switch sits above the chart, where it is seen first: SS1 is continuous time, SS2 discrete.
    root.append(h("div", { class: "course-switch" }, choice("Course", [["ct", "SS1, continuous"], ["dt", "SS2, discrete"]], mode, v => { mode = v; if (v === "dt" && id === "lowpass") id = "average"; if (v === "ct" && id === "average") id = "lowpass"; pickSystem(); update(); })), h("div", { class: "stage" }, box, h("div", { class: "controls" },
      systemBox, rL.el, rT.el,
      h("p", { class: "hint" }, "x1 is a pulse, x2 a triangle. When both pairs of lines lie on top of each other, the system is linear and time-invariant (LTI), and its impulse response alone tells everything it does. The offset y = x + 0.5 looks harmless but is not linear: zero in gives 0.5 out."))));
    pickSystem(); update();
  },
};
