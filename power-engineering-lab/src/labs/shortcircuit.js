// The short-circuit current and its DC component (Gawlik 2015, sections 6.3.2 and 6.3.5; slides V17+18): an R–L
// circuit switched onto a sine at angle α. The current is a steady AC part plus a DC part that starts where the AC
// part would have to jump and decays with T = L/R; its first peak is κ √2 I″k.
import { shortCircuitCurrent, acPart, dcPart, kappa, peakSearched } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "shortcircuit",
  art: () => a.picture("A sine wave lifted by a decaying offset, its first peak tall",
    a.path(`M20 75 ${Array.from({ length: 81 }, (_, i) => { const t = i / 80 * 0.06; return `L${20 + i * 2} ${75 - 30 * (Math.sin(314 * t - 1.47) + Math.exp(-t / 0.032))}`; }).join(" ")}`, a.INK, 3) +
      a.path(`M20 45 ${Array.from({ length: 41 }, (_, i) => `L${20 + i * 4} ${75 - 30 * Math.exp(-i / 40 * 0.06 / 0.032)}`).join(" ")}`, a.ACC, 2, "6 5")),
  mount(root) {
    let rx = 0.1, alpha = 0;
    const box = h("div", {}), rK = readout("Peak factor κ by (6-43)"), rP = readout("First peak of this current"), rW = readout("Worst switching angle"), rT = readout("DC time constant");
    const update = () => {
      const ts = Array.from({ length: 301 }, (_, k) => k * 0.0002), al = alpha * Math.PI / 180;
      const i = ts.map(t => shortCircuitCurrent(t, al, rx));
      box.replaceChildren(lineChart({ label: `Short-circuit current for R/X = ${rx} switched at α = ${alpha}°`,
        lines: [{ x: ts.map(t => t * 1e3), y: i, name: "i(t)" }, { x: ts.map(t => t * 1e3), y: ts.map(t => acPart(t, al, rx)), name: "AC part", cls: "faint" },
                { x: ts.map(t => t * 1e3), y: ts.map(t => dcPart(t, al, rx)), name: "DC part", cls: "second" }],
        xLabel: "Time after the fault t [ms]", yLabel: "Current i/(√2 I″k) [1]", xMin: 0, xMax: 60, yMin: -2, yMax: 2, xFormat: v => v.toFixed(0), yFormat: v => v.toFixed(0) }));
      const peak = Math.max(...i.map(Math.abs)), worst = peakSearched(rx);
      rK.set(kappa(rx).toFixed(3), "", `1 + e^(−π R/X): the DC part left after 10 ms`);
      rP.set(`${peak.toFixed(3)} √2 I″k`, "", peak > 1.5 ? "the DC part lifts the first peak" : "switched near the current's zero crossing: little DC part");
      rW.set(`${worst.toFixed(3)} √2 I″k`, "", "the largest peak over every α, searched");
      rT.set(`${(1e3 / (rx * 2 * Math.PI * 50)).toFixed(1)} ms`, "", "T = L/R = X/(ωR) (6-30, 6-41)");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Ratio R/X of the fault path", unit: "", min: 0.02, max: 1, value: rx, step: 0.01, format: v => v.toFixed(2), onInput: v => { rx = v; update(); } }),
      slider({ label: "Switching angle α of the voltage", unit: "°", min: 0, max: 180, value: alpha, step: 1, format: v => `${v}°`, onInput: v => { alpha = v; update(); } }),
      rK.el, rP.el, rW.el, rT.el,
      h("p", { class: "hint" }, "The current cannot jump, so at t = 0 a DC part cancels the AC part (6-27, 6-28). It is largest when the fault strikes at the voltage's zero, α − φ = 90° (p. 208). Table 6-3: an overhead network, R/X = 0.1, gives κ = 1.73; a cable network, R/X = 1, 1.043. A fault near a generator also has a decaying AC part (figure 6-15); this lab shows the far fault, whose AC part stays."))));
    update();
  },
};
