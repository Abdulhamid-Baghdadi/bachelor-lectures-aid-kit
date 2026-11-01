// Reflection at a smooth boundary, Lasser (2012) pp. 45–46: a ray hits the boundary at Θ1; Snell's law bends the
// transmitted ray, the Fresnel formulas split the power between reflection and transmission, separately for the TE
// and the TM case. Drag on the drawing to aim the ray.
import { fresnel, brewsterAngle, criticalAngle } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import { draggable } from "../../../kit/ui/field.js";
import * as a from "../../../kit/ui/art.js";

const W = 460, H = 280, X0 = 230, Y0 = 140, L = 120, deg = Math.PI / 180;

export default {
  id: "fresnel",
  art: () => a.picture("A ray meeting a boundary, one part reflected and one part bent into the second medium",
    a.line([[15, 75], [185, 75]], a.DIM, 2) + a.rect(15, 75, 170, 60, a.DIM, 0, "rgba(125,211,252,.15)") +
      a.arrow(40, 20, 100, 75, a.INK, 3) + a.arrow(100, 75, 160, 20, a.ACC, 3) + a.arrow(100, 75, 130, 135, a.COOL, 3)),
  mount(root) {
    let n1 = 1, n2 = 1.5, th = 40;
    const pic = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic", role: "img", "aria-label": "A ray from the upper medium meets the boundary; the reflected and transmitted rays, their widths showing the power share" });
    const chartBox = h("div", {});
    const rT = readout("Reflected power, TE |Γ_TE|²"), rM = readout("Reflected power, TM |Γ_TM|²"), rB = readout("Brewster angle Θ_B"), rC = readout("Critical angle for total reflection");
    const update = () => {
      const t = th * deg, r = fresnel(n1, n2, t);
      const ix = X0 - L * Math.sin(t), iy = Y0 - L * Math.cos(t);
      const ray = (x1, y1, x2, y2, cls, w) => s("line", { x1, y1, x2, y2, class: `ray ${cls}`, "stroke-width": Math.max(1, w).toFixed(1) });
      const share = (r.RTE + r.RTM) / 2; // unpolarised: the mean of the two cases
      const parts = [s("rect", { x: 0, y: Y0, width: W, height: H - Y0, class: "medium" }), s("line", { x1: 0, y1: Y0, x2: W, y2: Y0, class: "axis" }),
        s("line", { x1: X0, y1: 20, x2: X0, y2: H - 20, class: "grid" }),
        ray(ix, iy, X0, Y0, "in", 6), ray(X0, Y0, X0 + L * Math.sin(t), iy, "reflected", 6 * share),
        s("text", { x: 10, y: Y0 - 10, class: "tick" }, `n1 = ${n1}`), s("text", { x: 10, y: Y0 + 24, class: "tick" }, `n2 = ${n2}`)];
      if (!r.total) parts.push(ray(X0, Y0, X0 + L * Math.sin(r.theta2), Y0 + L * Math.cos(r.theta2), "transmitted", 6 * (1 - share)));
      else parts.push(s("text", { x: X0 + 12, y: Y0 + 50, class: "letter" }, "total reflection"));
      pic.replaceChildren(...parts);
      rT.set(`${(r.RTE * 100).toFixed(1)} %`); rM.set(`${(r.RTM * 100).toFixed(1)} %`);
      rB.set(`${(brewsterAngle(n1, n2) / deg).toFixed(1)} °`, "", "TM light passes without reflection");
      const tc = criticalAngle(n1, n2);
      rC.set(tc === null ? "none" : `${(tc / deg).toFixed(1)} °`, "", tc === null ? "only from the denser medium (n1 > n2)" : "");
      const angles = Array.from({ length: 181 }, (_, k) => k * 0.5);
      chartBox.replaceChildren(lineChart({ label: "Reflected power share against the angle of incidence, TE and TM",
        lines: [{ x: angles, y: angles.map(x => fresnel(n1, n2, x * deg).RTE), name: "|Γ_TE|²" },
                { x: angles, y: angles.map(x => fresnel(n1, n2, x * deg).RTM), name: "|Γ_TM|²", cls: "second" },
                { x: [th, th], y: [0, 1], name: "now", cls: "marker" }],
        xLabel: "Angle of incidence Θ1 [°]", yLabel: "Reflected power share [1]", yMin: 0, yMax: 1 }));
    };
    const st = slider({ label: "Angle of incidence Θ1", unit: "°", min: 0, max: 89, value: th, step: 0.5, format: v => `${v} °`, onInput: v => { th = v; update(); } });
    // Drag in the upper medium to aim the ray at the point where it meets the boundary.
    draggable(pic, (x, y) => { if (y >= Y0) return; th = Math.round(Math.min(89, Math.abs(Math.atan2(X0 - x, Y0 - y)) / deg) * 2) / 2; st.set(th); update(); });
    root.append(h("div", { class: "stage" }, h("div", {}, pic, chartBox), h("div", { class: "controls" },
      slider({ label: "Refractive index above n1", unit: "", min: 1, max: 3, value: n1, step: 0.05, format: v => v.toFixed(2), onInput: v => { n1 = v; update(); } }),
      slider({ label: "Refractive index below n2", unit: "", min: 1, max: 3, value: n2, step: 0.05, format: v => v.toFixed(2), onInput: v => { n2 = v; update(); } }),
      st, rT.el, rM.el, rB.el, rC.el,
      h("p", { class: "hint" }, "Drag in the upper half to aim the ray. Line widths show the power share for unpolarised light. At the Brewster angle the TM curve touches zero: reflected light is then purely TE, which is how polarising filters cut glare. Swap the indices (n1 > n2) to see total reflection, the principle of the optical fibre."))));
    update();
  },
};
