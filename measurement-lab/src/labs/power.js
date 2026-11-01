// Active power and the wattmeter's connection (Schrüfer et al. 2012, section 2.1.4; the lab script's task 2.8): the
// instantaneous power swings at twice the line frequency about its mean U·I·cos φ; the meter's own voltage or current
// path adds its loss, depending on where the voltage path is clamped.
import { powers, instantaneous, wattmeter, si } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "power",
  art: () => a.picture("A voltage and a current wave out of step, and their product swinging above a mean line",
    a.path("M10 55 C30 15 50 15 70 55 S110 95 130 55 S170 15 190 55", a.INK, 2) + a.path("M25 55 C45 25 65 25 85 55 S125 85 145 55 S185 25 195 40", a.COOL, 2) +
      a.path("M10 120 C22 95 34 95 46 120 C58 140 64 140 70 125 C80 95 94 95 106 120 C118 140 124 140 130 125 C140 95 156 95 168 120", a.ACC, 3) +
      a.line([[10, 112], [190, 112]], a.HOT, 2, "6 4")),
  mount(root) {
    let phiDeg = 30, at = "load", R = 20, RU = 2000;
    const RI = 0.5, Uq = 10;
    const box = h("div", {}), rP = readout("Active power P"), rQ = readout("Reactive and apparent power"), rW = readout("The wattmeter reads"), rE = readout("Its own consumption");
    const update = () => {
      const phi = phiDeg * Math.PI / 180, Z = R / Math.cos(phi), I = Uq / Z, X = Z * Math.sin(phi), p = powers(Uq, I, phi);
      const xs = Array.from({ length: 301 }, (_, k) => k / 300);
      box.replaceChildren(lineChart({ label: "Instantaneous power and its mean over one period",
        lines: [{ x: xs, y: xs.map(x => instantaneous(Uq, I, phi, x)), name: "p(t)" },
                { x: xs, y: xs.map(() => p.P), name: "mean P", cls: "second" }],
        xLabel: "Time t / period T [1]", yLabel: "Power p [W]", xFormat: v => v.toFixed(1), yFormat: v => v.toFixed(1) }));
      const w = wattmeter({ Uq, R, X, RI, RU }, at);
      rP.set(si(p.P, "W"), "", `U·I·cos φ, power factor ${p.pf.toFixed(3)} (eq. 2.56)`);
      rQ.set(`${si(p.Q, "var")}, ${si(p.S, "VA")}`, "", "U·I·sin φ and U·I (eqs. 2.57–2.58)");
      rW.set(si(w.reading, "W", 4), "", `the load takes ${si(w.trueP, "W", 4)}`);
      rE.set(`${si(w.error, "W")}, ${(100 * w.error / w.trueP).toFixed(2)} %`, Math.abs(w.error / w.trueP) > 0.01 ? "warn" : "",
        at === "load" ? "the voltage path's U²/RU (Bild 2.26 a)" : "the current path's I²·RI (Bild 2.26 b)");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Phase angle φ of the load", unit: "°", min: -85, max: 85, value: phiDeg, step: 1, format: v => `${v}°`, onInput: v => { phiDeg = v; update(); } }).el,
      slider({ label: "Load resistance R, its reactance from φ", unit: "Ω", min: 0.5, max: 1e4, log: true, value: R, onInput: v => { R = v; update(); } }).el,
      slider({ label: "Voltage path resistance RU", unit: "Ω", min: 100, max: 1e6, log: true, value: RU, onInput: v => { RU = v; update(); } }).el,
      choice("Voltage path clamped", [["load", "at the load"], ["source", "at the source"]], at, v => { at = v; update(); }),
      rP.el, rQ.el, rW.el, rE.el,
      h("p", { class: "hint" }, `A 10 V source, the current path ${RI} Ω. Instantaneous power swings at twice the frequency and turns negative when φ ≠ 0: energy flows back to the source. The meter's pointer cannot follow and settles on the mean (eqs. 2.60–2.65). For a small load current clamp the voltage path at the source, for a large one at the load; a correction coil removes the error (Bild 2.26 c, d). Three-phase power and the two-wattmeter method belong to the Power engineering lab.`))));
    update();
  },
};
