// The common-emitter stage (Zimmermann 2010, section 1.1.1): the base drive sets the collector current by the diode
// law, the collector resistor turns it into a voltage. Small signals see the slope, A = −S RC/(1 + S RE); large ones see
// the exponential bend, which the emitter resistor straightens at the price of gain.
import { ceTransfer, ceGain, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const IS = 1e-15, U0 = 12, UT = 0.025;

export default {
  id: "cestage",
  art: () => a.picture("A transistor with a collector resistor, its transfer curve falling steeply through the operating point",
    a.resistor(60, 35, true) + a.line([[60, 51], [60, 70]], a.INK, 3) + a.line([[45, 70], [45, 100]], a.INK, 3) + a.line([[45, 78], [60, 70]], a.INK, 3) +
      a.line([[45, 92], [60, 100], [60, 125]], a.INK, 3) + a.path("M110 30 C140 30 145 32 150 75 C155 118 160 120 185 120", a.ACC, 3) + a.circle(150, 75, 4, a.COOL, 2, a.COOL)),
  mount(root) {
    let RC = 5e3, RE = 0, ue0 = 0.695;
    const box = h("div", {}), rI = readout("Collector current IC"), rU = readout("Output at rest Ua"), rA = readout("Small-signal gain A");
    const update = () => {
      const prm = { Is: IS, RC, RE, U0, UT }, op = ceTransfer(ue0, prm), span = 0.08 + RE * U0 / RC / 6;
      const us = Array.from({ length: 301 }, (_, k) => ue0 - span + k * 2 * span / 300), A = ceGain(op.IC, RC, RE, UT);
      box.replaceChildren(lineChart({ label: "Output voltage against base drive, with the small-signal tangent at the operating point",
        lines: [{ x: us, y: us.map(u => ceTransfer(u, prm).ua), name: "ua(ue)" }, { x: us, y: us.map(u => op.ua + A * (u - ue0)), name: "tangent, slope A", cls: "second" }],
        marks: [{ x: ue0, y: op.ua, shape: "dot" }],
        xLabel: "Base drive ue [V]", yLabel: "Output voltage ua [V]", yMin: 0, yMax: U0, xFormat: v => v.toFixed(2) }));
      rI.set(si(op.IC, "A"));
      rU.set(si(op.ua, "V"), op.ua < 0.5 || op.ua > U0 - 0.3 ? "warn" : "", op.ua < 0.5 ? "saturated: no room to swing" : op.ua > U0 - 0.3 ? "nearly off" : "");
      rA.set(A.toFixed(1), "", RE ? `≈ −RC/RE = ${(-RC / RE).toFixed(1)} for S RE ≫ 1` : "−S RC = −IC RC / UT");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Base drive at rest ue", unit: "V", min: 0.5, max: 3, value: ue0, step: 0.002, format: v => `${v.toFixed(3)} V`, onInput: v => { ue0 = v; update(); } }),
      slider({ label: "Collector resistor RC", unit: "kΩ", min: 0.5, max: 20, value: 5, step: 0.5, format: v => `${v} kΩ`, onInput: v => { RC = v * 1e3; update(); } }),
      slider({ label: "Emitter resistor RE", unit: "Ω", min: 0, max: 2000, value: 0, step: 50, format: v => `${v} Ω`, onInput: v => { RE = v; update(); } }),
      rI.el, rU.el, rA.el,
      h("p", { class: "hint" }, "npn, Is = 1 fA, U0 = 12 V, UT = 25 mV. With RE = 0 the gain is huge but the curve bends at once: the stage distorts and its operating point drifts with temperature. Add RE: the curve straightens and the gain falls to about −RC/RE, no longer set by the transistor. The transistor alone is in the bipolar lab."))));
    update();
  },
};
