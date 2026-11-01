// Charge relaxation, ∂tϱ + (γ/ε) ϱ = 0 (3.103 at rest): charge placed inside a conductor dies away as e^(−t/T_R) with
// the relaxation time T_R = ε/γ (3.105), and turns up on the surface.
import { relaxationTime, relaxed, si } from "../core/index.js";
import { h, s, readout, choice, slider } from "../ui/kit.js";
import { lineChart } from "../ui/chart.js";
import { clock } from "../ui/field.js";
import * as a from "../ui/art.js";

// Typical room-temperature values [εr, γ in S/m], for illustration.
const STUFF = { copper: [1, 5.8e7], seawater: [80, 4], water: [80, 1e-4], glass: [6, 1e-12] };

export default {
  id: "relaxation",
  art: () => a.picture("Charges inside a body moving out to its surface",
    a.circle(100, 75, 55, a.INK, 3) + [[90, 70], [110, 82], [100, 60]].map(([x, y]) => a.text(x, y, "+", 16, a.DIM)).join("") +
      [0, 1, 2, 3, 4, 5, 6, 7].map(k => { const t = k * Math.PI / 4; return a.text(100 + 55 * Math.cos(t), 80 + 55 * Math.sin(t), "+", 16, a.ACC); }).join("") +
      a.arrow(108, 72, 140, 52, a.DIM, 2)),
  mount(root) {
    let epsr = 80, gamma = 1e-4;
    const pic = s("svg", { viewBox: "0 0 220 200", class: "schematic", role: "img", "aria-label": "A body with charge inside that moves out to the surface" });
    const chartBox = h("div", {});
    const rT = readout("Relaxation time T_R = ε / γ");
    const draw = t => {
      const TR = relaxationTime(epsr, gamma), tt = t % 5; // in units of T_R, five every 5 s
      const left = relaxed(1, tt, 1), n = 16;
      const marks = [];
      for (let k = 0; k < n; k++) {
        const ang = k * 2.39996, rad = 15 + (k % 4) * 15;
        const inner = [110 + rad * Math.cos(ang), 100 + rad * Math.sin(ang)], outer = [110 + 75 * Math.cos(ang), 100 + 75 * Math.sin(ang)];
        const f = 1 - left;
        marks.push(s("text", { x: inner[0] + f * (outer[0] - inner[0]), y: inner[1] + f * (outer[1] - inner[1]) + 5, class: "letter pos", "text-anchor": "middle" }, "+"));
      }
      pic.replaceChildren(s("circle", { cx: 110, cy: 100, r: 78, class: "body" }), ...marks);
      rT.set(si(TR, "s"), "", `inside after T_R: ${Math.round(relaxed(100, 1, 1))} % of the charge`);
      const ts = Array.from({ length: 101 }, (_, k) => k * 5 / 100);
      chartBox.replaceChildren(lineChart({ label: "Charge density left inside, against time in relaxation times",
        lines: [{ x: ts, y: ts.map(x => relaxed(1, x, 1)), name: "ϱ / ϱ0" }, { x: [tt, tt], y: [0, 1], name: "now", cls: "marker" }],
        xLabel: "Time in relaxation times t / T_R [1]", yLabel: "Charge left ϱ / ϱ0 [1]", yMin: 0, yMax: 1, xFormat: v => v.toFixed(0) }));
    };
    const c = clock(draw);
    const gSlider = slider({ label: "Conductivity γ", unit: "S/m", min: 1e-14, max: 1e8, value: gamma, log: true, onInput: v => { gamma = v; c.draw(); } });
    root.append(h("div", { class: "stage" }, h("div", {}, pic, chartBox), h("div", { class: "controls" },
      choice("Material", [["copper", "Copper"], ["seawater", "Sea water"], ["water", "Pure water"], ["glass", "Glass"]], "water",
        k => { [epsr, gamma] = STUFF[k]; gSlider.set(gamma); c.draw(); }),
      gSlider, c.el, rT.el,
      h("p", { class: "hint" }, "The curve is the same for every material; only the time scale T_R changes, from 10⁻¹⁹ s in copper to hours in glass. That is why a conductor's charge sits on its surface. Material values are typical, for illustration."))));
  },
};
