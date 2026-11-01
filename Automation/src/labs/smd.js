// The spring-mass-damper (Kugi et al. 2015, section 2.2.6): one mass of (2.121), m q̈ + d q̇ + c q = f, released from
// q0 and shaken by f = F sin(ωt). The damper takes energy out at the rate d q̇² (2.124).
import { smdResponse, smdParams, smdAmplitude, logspace, si } from "../core/index.js";
import { h, slider, readout } from "../ui/kit.js";
import { lineChart } from "../ui/chart.js";
import * as a from "../ui/art.js";

const m = 1, F = 1;

export default {
  id: "smd",
  art: () => a.picture("A mass hanging from a spring and a damper side by side",
    a.line([[40, 20], [160, 20]], a.INK, 3) + a.path("M70 20 v10 l-10 6 l20 8 l-20 8 l20 8 l-10 6 v12", a.INK, 2) +
      a.line([[130, 20], [130, 45]], a.INK, 2) + a.rect(120, 45, 20, 20, a.INK, 2) + a.line([[130, 55], [130, 78]], a.INK, 2) +
      a.rect(50, 78, 100, 40, a.ACC, 3) + a.arrow(100, 122, 100, 142, a.COOL, 2)),
  mount(root) {
    let c = 100, d = 2, w = 8, q0 = 0;
    const chartT = h("div", {}), chartA = h("div", {});
    const w0 = readout("Natural frequency ω0 = √(c/m)"), z = readout("Damping ratio ζ = d / (2√(cm))"), amp = readout("Steady amplitude at ω");
    const update = () => {
      const p = smdParams(m, d, c), r = smdResponse({ m, d, c, F, w, q0, T: 10, n: 2000 });
      w0.set(si(p.w0, "rad/s")); z.set(p.zeta.toFixed(3), "", p.zeta < 1 ? "below 1: it rings" : "1 or more: it creeps back without ringing");
      const A = smdAmplitude(m, d, c, F, w);
      amp.set(si(A, "m"), "", `${(A * c / F).toFixed(2)} × the static deflection F/c`);
      chartT.replaceChildren(lineChart({ label: "Displacement of the mass against time", lines: [{ x: r.t, y: r.q, name: "q" },
        { x: [0, 10], y: [A, A], name: "steady amplitude", cls: "faint" }], xLabel: "Time t [s]", yLabel: "Displacement q [m]", xFormat: v => v.toFixed(0), yFormat: v => v.toFixed(3) }));
      const ws = logspace(1, 40, 200);
      chartA.replaceChildren(lineChart({ label: "Steady amplitude against forcing frequency, with the present frequency marked",
        lines: [{ x: ws, y: ws.map(x => smdAmplitude(m, d, c, F, x)), name: "amplitude" }], marks: [{ x: w, y: A, shape: "dot", name: "ω now" }],
        xLabel: "Forcing frequency ω [rad/s]", yLabel: "Amplitude [m]", yMin: 0, yFormat: v => v.toFixed(3) }));
    };
    const sl = (label, unit, min, max, value, step, set) => slider({ label, unit, min, max, value, step, onInput: v => { set(v); update(); } });
    root.append(h("div", { class: "stage" }, h("div", {}, chartT, chartA), h("div", { class: "controls" },
      sl("Spring rate c", "N/m", 10, 400, c, 5, v => c = v), sl("Damping d", "N s/m", 0.1, 30, d, 0.1, v => d = v),
      sl("Forcing frequency ω", "rad/s", 1, 40, w, 0.1, v => w = v), sl("Initial displacement q0", "m", -0.05, 0.05, q0, 0.005, v => q0 = v),
      w0.el, z.el, amp.el,
      h("p", { class: "hint" }, "Set ω near ω0 with little damping: the amplitude climbs far above F/c (resonance). The free part from q0 dies away at a rate set by d; what is left follows the force. Mass 1 kg, force amplitude 1 N."))));
    update();
  },
};
