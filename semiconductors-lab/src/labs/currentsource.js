// The transistor current source (Zimmermann 2010, section 1.2): the output curves are nearly flat, but the Early effect
// tilts them, ra = UA/Ia (1.13). An emitter resistor feeds the current back and raises ra towards β rCE (1.19).
import { sourceR, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const UT = 0.025;

export default {
  id: "currentsource",
  art: () => a.picture("A current source symbol and two output lines, one tilted, one nearly flat",
    a.circle(50, 75, 25, a.INK, 3) + a.arrow(50, 92, 50, 58, a.INK, 2) + a.line([[100, 120], [185, 60]], a.DIM, 2) + a.line([[100, 95], [185, 88]], a.ACC, 3)),
  mount(root) {
    let Ia = 1e-3, UA = 100, beta = 100, RE = 0;
    const box = h("div", {}), rR = readout("Output resistance ra"), rS = readout("Without feedback, UA/Ia"), rG = readout("Gain over the plain transistor");
    const update = () => {
      const ra = sourceR(Ia, { UA, beta, RE, UT }), r0 = UA / Ia, us = [1, 20];
      box.replaceChildren(lineChart({ label: "Output current against output voltage, with and without emitter feedback",
        lines: [{ x: us, y: us.map(u => (Ia + (u - 5) / ra) * 1e3), name: `with RE = ${si(RE, "Ω")}` }, { x: us, y: us.map(u => (Ia + (u - 5) / r0) * 1e3), name: "RE = 0", cls: "faint" }],
        xLabel: "Output voltage Ua [V]", yLabel: "Output current Ia [mA]", yMin: Ia * 1e3 * 0.8, yMax: Ia * 1e3 * 1.2, xFormat: v => v.toFixed(0), yFormat: v => v.toPrecision(3) }));
      rR.set(si(ra, "Ω")); rS.set(si(r0, "Ω"));
      rG.set(`× ${(ra / r0).toFixed(1)}`, "", `at most β + 1 = ${beta + 1}, reached when RE ≫ rBE = ${si(beta * UT / Ia, "Ω")}`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Output current Ia", unit: "mA", min: 0.01, max: 10, value: 1, log: true, format: v => `${v} mA`, onInput: v => { Ia = v * 1e-3; update(); } }),
      slider({ label: "Emitter resistor RE", unit: "Ω", min: 0, max: 10000, value: 0, step: 50, format: v => `${v} Ω`, onInput: v => { RE = v; update(); } }),
      slider({ label: "Early voltage UA", unit: "V", min: 20, max: 200, value: UA, step: 5, format: v => `${v} V`, onInput: v => { UA = v; update(); } }),
      slider({ label: "Current gain β", unit: "", min: 50, max: 500, value: beta, step: 10, format: v => String(v), onInput: v => { beta = v; update(); } }),
      rR.el, rS.el, rG.el,
      h("p", { class: "hint" }, "The lines are drawn about the operating point at 5 V. Raise RE: the line flattens until the voltage across RE passes about β UT ≈ 2.6 V (p. 7); beyond, more RE buys nothing and only a better transistor, a larger UA β, helps. The cascode (section 1.3) goes further."))));
    update();
  },
};
