// The finite difference method (Kugi et al. 2015, section 3.6.1): a steel rod, insulated at x = 0 and held at TL at
// x = L, cools from a uniform start. Space is cut into N intervals (3.106) and time into steps Δt (3.107); the explicit
// Euler scheme (3.110) is stable only if aΔt/Δx² ≤ 1/2 (3.111). Beside it, the exact series solution (worked by hand).
import { heatFdmStep, heatRodSeries, si } from "../core/index.js";
import { h, slider, readout } from "../ui/kit.js";
import { lineChart } from "../ui/chart.js";
import { clock } from "../ui/field.js";
import * as a from "../ui/art.js";

// Steel as in the notes' Aufgabe 3.14/3.15: λ = 60 W/(m K), ρ = 7850 kg/m³, cp = 450 J/(kg K); L = 0.5 m.
const ROD = { a: 60 / (7850 * 450), L: 0.5, TA: 80, TL: 20 };

export default {
  id: "fdm",
  art: () => a.picture("A rod cut into grid cells with a temperature dot on each node",
    a.rect(20, 95, 160, 20, a.INK, 3) + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(k => a.line([[20 + 20 * k, 95], [20 + 20 * k, 115]], a.DIM, 2) +
      a.circle(20 + 20 * k, 30 + 50 * (k / 8) ** 0.6, 4, a.ACC, 2, a.ACC)).join("")),
  mount(root) {
    let N = 10, r = 0.4, T = [], steps = 0, shown = -1, base = 0, now = 0;
    const chartBox = h("div", {});
    const rDt = readout("Time step Δt"), rT = readout("Time t"), rS = readout("aΔt/Δx²");
    const reset = () => { T = Array.from({ length: N + 1 }, (_, i) => i === N ? ROD.TL : ROD.TA); steps = 0; shown = -1; base = now; };
    const draw = time => {
      const dx = ROD.L / N, dt = r * dx * dx / ROD.a;
      // Ten grid steps per animation second; restart once the rod has nearly settled or the scheme has blown up.
      now = time;
      if ((time - base) * 10 >= 600) reset();
      const want = Math.floor((time - base) * 10);
      while (steps < want) { T = heatFdmStep(T, r, ROD.TL); steps++; }
      if (steps === shown) return;
      shown = steps;
      const t = steps * dt, xs = Array.from({ length: 101 }, (_, k) => k * ROD.L / 100);
      chartBox.replaceChildren(lineChart({ label: "Temperature along the rod: grid values and the exact solution",
        lines: [{ x: xs.map(x => x * 100), y: xs.map(x => heatRodSeries(x, t, ROD)), name: "exact", cls: "faint" },
                { x: T.map((_, i) => i * dx * 100), y: T, name: "grid (3.110)" }],
        marks: T.map((v, i) => ({ x: i * dx * 100, y: v, shape: "dot" })),
        xLabel: "Position x [cm]", yLabel: "Temperature T [°C]", yMin: 0, yMax: 100, yFormat: v => v.toFixed(0) }));
      rDt.set(si(dt, "s")); rT.set(`${(t / 60).toFixed(1)} min`, "", `step ${steps}`);
      rS.set(r.toFixed(2), r > 0.5 ? "danger" : "", r > 0.5 ? "above 1/2: unstable, the grid oscillates and grows" : "at most 1/2: stable");
    };
    reset();
    const c = clock(draw);
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      slider({ label: "Step ratio aΔt/Δx²", unit: "", min: 0.1, max: 0.6, value: r, step: 0.01, format: v => v.toFixed(2), onInput: v => { r = v; reset(); c.draw(); } }),
      slider({ label: "Number of intervals N", unit: "", min: 4, max: 30, value: N, step: 1, format: v => String(v), onInput: v => { N = v; reset(); c.draw(); } }),
      c.el, rDt.el, rT.el, rS.el,
      h("p", { class: "hint" }, "The left end is insulated, so its slope stays flat; the right end is held at 20 °C. At each step a node moves towards the average of its neighbours by aΔt/Δx² times their difference. Up to 1/2 the grid follows the exact curve; push the ratio past 1/2 and a zigzag appears and grows. Halving Δx forces Δt down four times."))));
  },
};
