// Kinetic and potential energy (Kugi et al. 2015, (2.81), (2.92)): a mass on a linear spring trades one for the
// other, and with no friction their sum stays put.
import { smdResponse, mechKinetic, mechSpringEnergy, si } from "../core/index.js";
import { h, s, slider, readout } from "../ui/kit.js";
import { lineChart } from "../ui/chart.js";
import { clock } from "../ui/field.js";
import * as a from "../ui/art.js";

const N = 400;

export default {
  id: "energy",
  art: () => a.picture("A block on a spring, with bars for kinetic and potential energy",
    a.line([[20, 40], [20, 110]], a.INK, 3) + a.path("M20 80 l10 -10 l10 20 l10 -20 l10 20 l10 -20 l10 10", a.INK, 2) +
      a.rect(80, 60, 40, 40) + a.rect(140, 50, 14, 60, a.ACC, 2) + a.rect(162, 80, 14, 30, a.COOL, 2)),
  mount(root) {
    let m = 0.5, c = 200, s0 = 0.1, run;
    const pic = s("svg", { viewBox: "0 0 460 110", class: "schematic", role: "img", "aria-label": "A block on a spring sliding to and fro" });
    const box = h("div", {});
    const Tr = readout("Kinetic energy T (2.81)"), Vr = readout("Potential energy V (2.92)"), Er = readout("Sum E = T + V");
    const draw = t => {
      // Two periods of motion play in 4 s of animation.
      const k = Math.round(((t / 4) % 1) * N), q = run.q[k], v = run.v[k], x = 230 + q * 600;
      const coil = Array.from({ length: 13 }, (_, i) => `${(20 + (x - 40) * i / 12).toFixed(1)},${i % 2 ? 50 : 70}`).join(" ");
      pic.replaceChildren(s("line", { x1: 20, y1: 20, x2: 20, y2: 100, class: "wire" }), s("polyline", { points: coil }),
        s("g", { class: "part" }, s("rect", { x: x - 20, y: 40, width: 40, height: 40, class: "body" })),
        s("line", { x1: 230, y1: 85, x2: 230, y2: 105, class: "grid" }), s("text", { x: 236, y: 104, class: "tick" }, "s = s0"));
      Tr.set(si(mechKinetic(m, v), "J")); Vr.set(si(mechSpringEnergy(c, q), "J")); Er.set(si(run.E[k], "J"), "", "the same at every instant");
      box.replaceChildren(lineChart({ label: "Kinetic, potential and total energy over two periods",
        lines: [{ x: run.t, y: run.v.map(v => mechKinetic(m, v)), name: "T" }, { x: run.t, y: run.q.map(q => mechSpringEnergy(c, q)), name: "V", cls: "second" },
                { x: run.t, y: run.E, name: "E", cls: "faint" }, { x: [run.t[k], run.t[k]], y: [0, run.E[0]], cls: "marker" }],
        xLabel: "Time t [s]", yLabel: "Energy [J]", yMin: 0, xFormat: v => v.toFixed(2) }));
    };
    const update = () => { run = smdResponse({ m, c, d: 0, q0: s0, T: 4 * Math.PI * Math.sqrt(m / c), n: N }); ck.draw(); };
    run = smdResponse({ m, c, d: 0, q0: s0, T: 4 * Math.PI * Math.sqrt(m / c), n: N });
    const ck = clock(draw);
    root.append(h("div", { class: "stage" }, h("div", {}, pic, box), h("div", { class: "controls" },
      slider({ label: "Mass m", unit: "kg", min: 0.1, max: 2, value: m, step: 0.05, onInput: v => { m = v; update(); } }),
      slider({ label: "Spring rate c", unit: "N/m", min: 20, max: 500, value: c, step: 10, onInput: v => { c = v; update(); } }),
      slider({ label: "Initial stretch s − s0", unit: "m", min: 0.02, max: 0.15, value: s0, step: 0.01, onInput: v => { s0 = v; update(); } }),
      ck.el, Tr.el, Vr.el, Er.el,
      h("p", { class: "hint" }, "Released at rest, all the energy starts in the spring. As the block passes s0 the spring is slack and all of it is kinetic. The sum never changes, because no force here dissipates."))));
  },
};
