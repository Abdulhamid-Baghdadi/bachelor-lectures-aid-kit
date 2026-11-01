// Repeated readings (Schrüfer et al. 2012, sections 1.3.4–1.3.7): seeded readings scatter about the true value; their
// mean is uncertain by s/√N, and for few readings Student's factor widens the interval.
import { readings, repeated, LEVELS, si } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const TRUTH = 6.5;

export default {
  id: "scatter",
  art: () => a.picture("Dots scattered about a line, and a narrow band around their mean",
    [18, 34, 50, 66, 82, 98, 114, 130, 146, 162, 178].map((x, k) => a.circle(x, 75 + [20, -14, 8, -30, 26, -6, 14, -22, 4, 30, -18][k], 4, a.INK, 2, a.INK)).join("") +
      a.line([[10, 75], [190, 75]], a.ACC, 3) + a.line([[10, 66], [190, 66]], a.COOL, 2, "6 5") + a.line([[10, 84], [190, 84]], a.COOL, 2, "6 5")),
  mount(root) {
    let N = 10, s = 0.15, seed = 1, level = 1;
    const box = h("div", {}), rM = readout("Mean"), rS = readout("Standard deviation s of one reading"),
      rU = readout("Uncertainty of the mean s/√N"), rI = readout("Interval for the true value");
    const update = () => {
      const xs = readings(1000 + seed, N, TRUTH, s), r = repeated(xs, level), k = xs.map((_, i) => i + 1);
      const flat = y => [y, y];
      box.replaceChildren(lineChart({ label: `${N} readings with their mean and the ${LEVELS[level - 1]} interval`,
        lines: [{ x: [0, N + 1], y: flat(r.mean), name: "mean" },
                { x: [0, N + 1], y: flat(r.mean + r.expanded), name: "interval", cls: "second" },
                { x: [0, N + 1], y: flat(r.mean - r.expanded), cls: "second" }, { x: [0, N + 1], y: flat(TRUTH), cls: "faint" }],
        marks: k.map((x, i) => ({ x, y: xs[i], shape: "dot", name: i ? undefined : "readings" })),
        xLabel: "Reading number i [1]", yLabel: "Reading xᵢ [V]", yMin: TRUTH - 4 * s, yMax: TRUTH + 4 * s, xMin: 0, xMax: N + 1,
        yFormat: v => v.toFixed(2) }));
      rM.set(si(r.mean, "V", 4), "", `the true value here is ${TRUTH} V`);
      rS.set(si(r.s, "V"), "", "eq. 1.48, with N − 1");
      rU.set(si(r.u, "V"), "", `${Math.sqrt(N).toFixed(2)} times smaller than s`);
      const hit = Math.abs(r.mean - TRUTH) <= r.expanded;
      rI.set(`${r.mean.toFixed(3)} ± ${r.expanded.toFixed(3)} V`, hit ? "" : "warn", `t = ${r.t} for N = ${N}; ${hit ? "covers" : "misses"} the true value`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Number of readings N", unit: "", min: 2, max: 50, value: N, step: 1, format: v => String(v), onInput: v => { N = v; update(); } }).el,
      slider({ label: "Scatter of one reading σ", unit: "V", min: 0.02, max: 0.5, value: s, step: 0.01, onInput: v => { s = v; update(); } }).el,
      choice("Confidence", LEVELS.map((l, i) => [i + 1, l]), level, v => { level = Number(v); update(); }),
      h("button", { type: "button", class: "again", onclick: () => { seed++; update(); } }, "Draw new readings"),
      rM.el, rS.el, rU.el, rI.el,
      h("p", { class: "hint" }, "Four times the readings halve the uncertainty of the mean, never the scatter of one reading. With N = 2 or 3 the 95.5 % interval needs a t of 18 or 5 instead of 2 (Table 1.6): draw new readings a few times and count how often the band misses the faint line. Repeating never removes a systematic error."))));
    update();
  },
};
