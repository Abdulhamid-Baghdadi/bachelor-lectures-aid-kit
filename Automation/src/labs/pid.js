// The controller elements of sections 3.8.3–3.8.9: P (3.141), I (3.143), PI (3.145), D-T1 (3.148), PD (3.150), lead
// (3.151) and PID (3.157), each as its step response or its Bode diagram. The ideal D and PD elements are not
// realisable (Satz 3.6), so they have a Bode diagram but no step response here.
import { transferElement, step, bode, logspace, leadMax } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const KINDS = [["P", "P"], ["I", "I"], ["PI", "PI"], ["DT1", "D-T1"], ["PD", "PD"], ["lead", "Lead"], ["PID", "PID"]];
const WS = logspace(1e-2, 1e3, 300), LX = WS.map(Math.log10), tick = v => String(Number((10 ** v).toPrecision(1)));

export default {
  id: "pid",
  art: () => a.picture("Three blocks marked P, I and D added together into one controller",
    a.rect(30, 20, 50, 28) + a.text(55, 40, "P", 16) + a.rect(30, 60, 50, 28) + a.text(55, 80, "I", 16) + a.rect(30, 100, 50, 28) + a.text(55, 120, "D", 16) +
      a.line([[80, 34], [130, 74]], a.ACC, 2) + a.line([[80, 74], [130, 74]], a.ACC, 2) + a.line([[80, 114], [130, 74]], a.ACC, 2) +
      a.circle(140, 74, 10, a.ACC, 3) + a.arrow(150, 74, 185, 74, a.ACC, 3)),
  mount(root) {
    let kind = "PI", show = "step", gain = 2, T1 = 0.5, alpha = 0.1;
    const chartBox = h("div", {});
    const rNote = readout("Transfer function"), rLead = readout("Lead: largest phase lift (3.156) at ωmax (3.155)");
    const params = () => ({ VP: gain, VI: gain, VD: gain, V: gain, TI: T1, TD: T1, T: T1, TR: 0.1 * T1, alpha });
    const update = () => {
      const G = transferElement(kind, params()), proper = G.num.length <= G.den.length;
      if (show === "step" && !proper) chartBox.replaceChildren(h("p", { class: "hint" }, "The ideal D and PD elements have a numerator of higher degree than the denominator: they are not realisable (Satz 3.6) and have no step response. Look at their Bode diagram, or pick D-T1 or Lead."));
      else if (show === "step") {
        const r = step(G, 4, 400);
        chartBox.replaceChildren(lineChart({ label: `Step response of the ${kind} element`, lines: [{ x: r.t, y: r.y, name: "h(t)" }],
          xMin: 0, xMax: 4, yMin: 0, xLabel: "Time t [s]", yLabel: "Step response h(t) [–]", xFormat: v => v.toFixed(1) }));
      } else {
        const B = bode(G, WS);
        chartBox.replaceChildren(lineChart({ label: `Bode diagram of the ${kind} element`,
          lines: show === "mag" ? [{ x: LX, y: B.map(p => p.db), name: "|G(jω)|" }] : [{ x: LX, y: B.map(p => p.phase), name: "arg G(jω)" }],
          xLabel: "Angular frequency ω [rad/s]", yLabel: show === "mag" ? "Magnitude |G(jω)| [dB]" : "Phase arg G(jω) [°]", xFormat: tick, yFormat: v => v.toFixed(0) }));
      }
      const fmt = p => p.map(c => Number(c.toPrecision(3))).join(", ");
      rNote.set(`num [${fmt(G.num)}], den [${fmt(G.den)}]`, "", "coefficients of s from the highest power down");
      const m = leadMax(T1, alpha);
      rLead.set(`${m.phi.toFixed(1)}° at ${m.w.toFixed(2)} rad/s`, "", kind === "lead" ? "" : "pick Lead to see it in the phase");
    };
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      choice("Element", KINDS, kind, v => { kind = v; update(); }),
      choice("Show", [["step", "Step response"], ["mag", "Magnitude"], ["phase", "Phase"]], show, v => { show = v; update(); }),
      slider({ label: "Gain VP, VI, VD or V", unit: "", min: 0.5, max: 10, value: gain, step: 0.5, format: v => v.toFixed(1), onInput: v => { gain = v; update(); } }),
      slider({ label: "Time constant TI, TD or T", unit: "s", min: 0.1, max: 2, value: T1, step: 0.05, onInput: v => { T1 = v; update(); } }),
      slider({ label: "Lead ratio α", unit: "", min: 0.02, max: 0.9, value: alpha, step: 0.01, format: v => v.toFixed(2), onInput: v => { alpha = v; update(); } }),
      rNote.el, rLead.el,
      h("p", { class: "hint" }, "The I part keeps rising for as long as the input lasts and adds −90° of phase; the D part jumps at the start and adds +90°. PI starts at VI·TI and climbs with slope VI. The lead element lifts the phase most at ωmax = 1/(T√α). TR is 0.1·T for D-T1 and PID."))));
    update();
  },
};
