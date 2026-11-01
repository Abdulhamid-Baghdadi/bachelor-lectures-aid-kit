// The power-angle curve and the equal-area criterion (Gawlik 2015, section 6.4.4; slides V19+20): a generator feeds
// the network over a double line. A fault on one line cuts the transferable power; the faulted line is switched off at
// the clearing angle δc. The shaded areas are the energy taken up while accelerating, A1, and the most it can give back
// while braking, A2.
import { equalArea, criticalAngle } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const DEG = Math.PI / 180;

export default {
  id: "stability",
  art: () => a.picture("Two sine humps, a level line across them, and two shaded areas between",
    a.path(`M20 130 ${Array.from({ length: 41 }, (_, i) => `L${20 + i * 4} ${130 - 100 * Math.sin(i / 40 * Math.PI)}`).join(" ")}`, a.DIM, 2) +
      a.path(`M20 130 ${Array.from({ length: 41 }, (_, i) => `L${20 + i * 4} ${130 - 75 * Math.sin(i / 40 * Math.PI)}`).join(" ")}`, a.INK, 3) +
      a.line([[20, 80], [180, 80]], a.ACC, 3) + a.path("M45 80 L45 130 L80 130 L80 80 Z", a.HOT, 2) + a.path("M80 80 L80 58 Q110 52 140 72 L140 80 Z", a.COOL, 2)),
  mount(root) {
    const sys = { Pm: 0.8, Ppre: 1.6, Pfault: 0, Ppost: 1.2 };
    let dcDeg = 50;
    const box = h("div", {}), rA = readout("Accelerating area A1"), rB = readout("Braking area A2"), rV = readout("Verdict"), rC = readout("Critical clearing angle");
    const update = () => {
      // The fault cannot be cleared before it strikes: below δ0 the clearing angle counts as δ0.
      const dc = Math.max(dcDeg, Math.asin(sys.Pm / sys.Ppre) / DEG);
      const ds = Array.from({ length: 181 }, (_, k) => k), r = equalArea(sys, dc * DEG), d0 = r.d0 / DEG, dm = r.dmax / DEG;
      const curve = Pmax => ds.map(d => Pmax * Math.sin(d * DEG));
      const span = (from, to) => { const n = Math.max(2, Math.round(to - from) + 1); return Array.from({ length: n }, (_, k) => from + (to - from) * k / (n - 1)); };
      const s1 = span(d0, dc), s2 = span(dc, Math.max(dc, dm));
      // Each area as a closed outline; the stylesheet fills it.
      const A1 = { x: [...s1, ...s1.slice().reverse()], y: [...s1.map(() => sys.Pm), ...s1.slice().reverse().map(d => sys.Pfault * Math.sin(d * DEG))], cls: "area one", name: "A1, A2 dashed" };
      const A2 = { x: [...s2, ...s2.slice().reverse()], y: [...s2.map(d => sys.Ppost * Math.sin(d * DEG)), ...s2.map(() => sys.Pm)], cls: "area two" };
      box.replaceChildren(lineChart({ label: `Power-angle curves; cleared at ${dc.toFixed(0)}°, ${r.stable ? "stable" : "the generator slips"}`,
        lines: [A1, ...(dc < dm ? [A2] : []), { x: ds, y: curve(sys.Ppre), cls: "faint" }, { x: ds, y: curve(sys.Ppost), name: "one line, after" },
                { x: ds, y: curve(sys.Pfault), cls: "second" }, { x: [0, 180], y: [sys.Pm, sys.Pm], name: "turbine P_m", cls: "marker" }],
        marks: [{ x: d0, y: sys.Pm, shape: "dot" }],
        xLabel: "Rotor angle δ [°]", yLabel: "Electrical power P/S_r [1]", xMin: 0, xMax: 180, yMin: 0, yMax: 1.8, yFormat: v => v.toFixed(1) }));
      const cr = criticalAngle(sys) / DEG;
      rA.set(r.A1.toFixed(3), "", "∫ (P_m − P_fault) dδ from δ0 to δc: energy taken up while the line is faulted");
      rB.set(dc < dm ? r.A2.toFixed(3) : "0", "", `∫ (P_one line − P_m) dδ from δc to ${dm.toFixed(0)}°`);
      rV.set(r.stable ? "stable" : "loses step", r.stable ? "" : "danger", r.stable ? "A2 ≥ A1: the rotor swings back" : "A1 > A2: the rotor cannot be braked, the generator slips");
      rC.set(Number.isFinite(cr) ? `${cr.toFixed(1)}°` : "none", "", `start at δ0 = ${d0.toFixed(1)}°; clear before δcr, where A1 = A2`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Clearing angle δc", unit: "°", min: 31, max: 140, value: dcDeg, step: 1, format: v => `${v}°`, onInput: v => { dcDeg = v; update(); } }),
      slider({ label: "Turbine power P_m/S_r", unit: "", min: 0.3, max: 1.1, value: sys.Pm, step: 0.05, format: v => v.toFixed(2), onInput: v => { sys.Pm = v; update(); } }),
      slider({ label: "Peak power during the fault", unit: "", min: 0, max: 0.8, value: sys.Pfault, step: 0.05, format: v => v.toFixed(2), onInput: v => { sys.Pfault = v; update(); } }),
      rA.el, rB.el, rV.el, rC.el,
      h("p", { class: "hint" }, "P = 3 U_p U_N sin δ / X (6-80). The notes' figure 6-45 uses a turbine at 80 % of the rating; the peaks 1.6 before and 1.2 after the fault are example values chosen here. Points on the falling side, beyond 90°, are unstable (p. 236). The faint curve is both lines before the fault, the dashed one the faulted network; a fault near the busbar transfers nothing, peak 0. The time to the critical angle, the critical clearing time, needs the rotor's inertia, which this lab leaves out."))));
    update();
  },
};
