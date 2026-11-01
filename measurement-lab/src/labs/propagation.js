// Propagation of uncertainty (Schrüfer et al. 2012, sections 1.3.3 and 1.3.6; the lab script's task 2.5): a result
// computed from several measured quantities; Gauss's law against the worst case and a seeded Monte Carlo of the model.
import { MODELS, gauss, worstCase, monteCarlo, partials, si } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const BINS = 41, DRAWS = 20000;

export default {
  id: "propagation",
  art: () => a.picture("Two small bell curves feeding through a box into one wider bell curve",
    a.path("M12 60 C22 60 24 30 32 30 C40 30 42 60 52 60", a.INK, 2) + a.path("M12 120 C22 120 24 90 32 90 C40 90 42 120 52 120", a.INK, 2) +
      a.arrow(56, 45, 82, 70, a.DIM, 2) + a.arrow(56, 105, 82, 80, a.DIM, 2) + a.rect(84, 58, 34, 34, a.ACC, 3) + a.text(101, 81, "f", 18, a.ACC) +
      a.arrow(120, 75, 136, 75, a.DIM, 2) + a.path("M138 110 C150 110 154 45 166 45 C178 45 182 110 192 110", a.COOL, 3)),
  mount(root) {
    let key = "power";
    const rel = { power: [1, 2, 3], weight: [1.5, 6.25], heating: [1, 1] }; // relative s of each input, in %
    const box = h("div", {}), sliders = h("div", { class: "controls" });
    const rG = readout("Gauss's law"), rW = readout("Worst case, all errors one way"), rC = readout("Seeded Monte Carlo"), rD = readout("Largest share");
    const build = () => {
      const m = MODELS[key];
      sliders.replaceChildren(...m.inputs.map(([name, unit, x0], i) => slider({ label: `Uncertainty of ${name} = ${x0} ${unit}, relative`, unit: "%",
        min: 0, max: 10, value: rel[key][i], step: 0.25, format: v => `${v} %`, onInput: v => { rel[key][i] = v; update(); } }).el));
      update();
    };
    const update = () => {
      const m = MODELS[key], x = m.inputs.map(i => i[2]), s = x.map((xi, i) => Math.abs(xi) * rel[key][i] / 100), y0 = m.f(x);
      const g = gauss(m.f, x, s), w = worstCase(m.f, x, s), mc = monteCarlo(m.f, x, s, 42, DRAWS);
      const span = 4 * Math.max(g, 1e-9 * Math.abs(y0)), lo = y0 - span, width = 2 * span / BINS, count = Array(BINS).fill(0);
      for (const y of mc.ys) { const b = Math.floor((y - lo) / width); if (b >= 0 && b < BINS) count[b]++; }
      const centres = count.map((_, b) => lo + (b + 0.5) * width), density = count.map(c => c / DRAWS / width);
      box.replaceChildren(lineChart({ label: `Spread of ${m.name}: ${DRAWS} seeded draws against the normal curve of Gauss's law`,
        lines: [{ x: centres, y: density, name: "Monte Carlo", stem: true }, { x: centres, y: centres.map(v => Math.exp(-(((v - y0) / g) ** 2) / 2) / (g * Math.sqrt(2 * Math.PI))), name: "Gauss", cls: "second" }],
        xLabel: `Result ${m.name.split(" =")[0]} [${m.unit}]`, yLabel: `Probability density [1/${m.unit}]`, yMin: 0, xFormat: v => v.toPrecision(4), yFormat: v => v.toPrecision(2) }));
      rG.set(`± ${si(g, m.unit)}`, "", `${(100 * g / Math.abs(y0)).toFixed(2)} % of ${si(y0, m.unit)}`);
      rW.set(`± ${si(w, m.unit)}`, "", "the sum of eq. 1.37, signs all alike");
      rC.set(`± ${si(mc.s, m.unit)}`, "", "the spread of the drawn results");
      const parts = partials(m.f, x).map((d, i) => (d * s[i]) ** 2), top = parts.indexOf(Math.max(...parts));
      rD.set(m.inputs[top][0], "", `${(100 * parts[top] / (g * g || 1)).toFixed(0)} % of the variance`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Model", Object.entries(MODELS).map(([k, v]) => [k, v.name]), key, v => { key = v; build(); }),
      sliders, rG.el, rW.el, rC.el, rD.el,
      h("p", { class: "hint" }, "Independent errors add as squares (eq. 1.73): one large contribution swamps the rest, so improve that one first. The worst case is safe but pessimistic. The lab script's task 2.5 asks exactly this for P = U·I·cos φ, with U known; Beispiel 1.4 is the weighing. When the errors are known and systematic, correct for them instead (eq. 1.37)."))));
    build();
  },
};
