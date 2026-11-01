// The MOSFET (Strasser 2015, sections 6.2.2–6.2.3; Hobler 2009, part 3): the threshold Ut = ΦMS + 2ΦF − QB/Cox from the
// substrate doping, the oxide and the substrate voltage; then ID = β((UGS − Ut)UDS − UDS²/2) up to pinch-off at
// UDS = UGS − Ut and ID = β/2 (UGS − Ut)² beyond, the current-source region.
import { threshold, drain, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "mosfet",
  art: () => a.picture("A gate over an oxide over a thin channel between source and drain",
    a.rect(60, 30, 80, 18, a.INK, 3) + a.line([[50, 56], [150, 56]], a.DIM, 3) + a.rect(15, 62, 45, 30, a.INK, 2) + a.rect(140, 62, 45, 30, a.INK, 2) +
      a.line([[60, 66], [140, 66]], a.ACC, 4) + a.line([[100, 10], [100, 30]], a.INK, 2)),
  mount(root) {
    let NA = 1e16, dox = 50, USB = 0, phiMS = -0.9, UGS = 3, beta = 1;
    const box = h("div", {}), rT = readout("Threshold Ut"), rI = readout("Drain current in the current-source region"), rP = readout("Pinch-off at UDS = UGS − Ut"), rG = readout("gm = √(2β ID)");
    const update = () => {
      const t = threshold({ NA, dox: dox * 1e-7, phiMS, USB }), prm = { beta: beta * 1e-3, Ut: t.Ut };
      const Us = Array.from({ length: 201 }, (_, k) => k * 6 / 200), steps = [1, 2, 3, 4, 5].map(k => t.Ut + k);
      const pinch = Math.max(UGS - t.Ut, 0);
      box.replaceChildren(lineChart({ label: "Drain current against drain–source voltage, one curve per gate voltage, and the pinch-off parabola",
        lines: [...steps.map(u => ({ x: Us, y: Us.map(v => drain(u, v, prm) * 1e3), cls: "faint" })),
                { x: Us, y: Us.map(v => drain(UGS, v, prm) * 1e3), name: `UGS = ${UGS.toFixed(1)} V` },
                { x: Us, y: Us.map(v => beta / 2 * v * v), name: "UDS = UGS − Ut", cls: "second" }],
        marks: [{ x: pinch, y: drain(UGS, pinch, prm) * 1e3, shape: "dot" }],
        xLabel: "Drain–source voltage UDS [V]", yLabel: "Drain current ID [mA]", yMin: 0, yMax: 15, xFormat: v => v.toFixed(0) }));
      const ID = drain(UGS, 10, prm);
      rT.set(si(t.Ut, "V"), "", `2ΦF ${(2 * t.phiF).toFixed(2)} V, −QB/Cox ${t.body.toFixed(2)} V`);
      rI.set(si(ID, "A"), ID === 0 ? "warn" : "", ID === 0 ? "below threshold: no channel" : ""); rP.set(si(pinch, "V")); rG.set(si(Math.sqrt(2 * prm.beta * ID), "S"));
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Gate–source voltage UGS", unit: "V", min: -1, max: 6, value: UGS, step: 0.1, format: v => `${v.toFixed(1)} V`, onInput: v => { UGS = v; update(); } }),
      slider({ label: "Substrate doping NA", unit: "cm⁻³", min: 1e14, max: 1e18, value: NA, log: true, format: v => `${v.toExponential(1)} cm⁻³`, onInput: v => { NA = v; update(); } }),
      slider({ label: "Oxide thickness dox", unit: "nm", min: 2, max: 100, value: dox, log: true, format: v => `${v} nm`, onInput: v => { dox = v; update(); } }),
      slider({ label: "Source–substrate voltage USB", unit: "V", min: 0, max: 5, value: USB, step: 0.1, format: v => `${v.toFixed(1)} V`, onInput: v => { USB = v; update(); } }),
      slider({ label: "Work-function difference ΦMS", unit: "V", min: -1.2, max: 0.2, value: phiMS, step: 0.05, format: v => `${v.toFixed(2)} V`, onInput: v => { phiMS = v; update(); } }),
      slider({ label: "Gain factor β", unit: "mA/V²", min: 0.2, max: 5, value: beta, step: 0.1, format: v => `${v.toFixed(1)} mA/V²`, onInput: v => { beta = v; update(); } }),
      rT.el, rI.el, rP.el, rG.el,
      h("p", { class: "hint" }, "n-channel on p-silicon, no oxide charge, εox = 3.9 ε0. Heavier doping or a thicker oxide raises the threshold; so does reverse bias on the substrate, the body effect. The curves are flat beyond pinch-off: channel-length modulation is left out."))));
    update();
  },
};
