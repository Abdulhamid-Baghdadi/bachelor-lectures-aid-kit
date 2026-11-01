// Slew rate (Zimmermann 2010, section 4.4): the compensation capacitor can be charged only so fast, so the output of an
// op-amp never changes faster than SR. A sine is safe up to the power bandwidth fp = SR/(2π Ûa); beyond, it becomes a
// triangle.
import { slewFollower, powerBandwidth, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const FT = 1e6;

export default {
  id: "slewrate",
  art: () => a.picture("A sine at the input and a triangle at the output, its slopes limited",
    a.path("M15 75 C35 15 55 15 75 75 C95 135 115 135 135 75 C155 15 175 15 185 40", a.DIM, 2) +
      a.line([[15, 105], [55, 40], [100, 110], [145, 40], [185, 100]], a.ACC, 3)),
  mount(root) {
    let A = 10, f = 20e3, SR = 0.6e6;
    const box = h("div", {}), rP = readout("Power bandwidth fp"), rM = readout("Largest clean amplitude at f"), rS = readout("Output");
    const update = () => {
      const r = slewFollower({ A, f, SR, fT: FT }), fp = powerBandwidth(SR, A);
      box.replaceChildren(lineChart({ label: "Input sine and the slew-limited output of a voltage follower",
        lines: [{ x: r.t.map(t => t * f), y: r.ue, name: "ue", cls: "faint" }, { x: r.t.map(t => t * f), y: r.ua, name: "ua" }],
        xLabel: "Time t/T [1]", yLabel: "Voltage [V]", yMin: -A * 1.1, yMax: A * 1.1, xFormat: v => v.toFixed(0) }));
      rP.set(si(fp, "Hz"), "", "SR/(2π Ûa)"); rM.set(si(Math.min(A, SR / (2 * Math.PI * f)), "V"), "", "SR/(2π f)");
      rS.set(f > fp ? "slew-limited: a triangle" : "a clean sine", f > fp ? "warn" : "");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Frequency f", unit: "Hz", min: 1e3, max: 300e3, value: f, log: true, format: v => si(v, "Hz"), onInput: v => { f = v; update(); } }),
      slider({ label: "Amplitude Ûa", unit: "V", min: 0.1, max: 12, value: A, step: 0.1, format: v => `${v.toFixed(1)} V`, onInput: v => { A = v; update(); } }),
      slider({ label: "Slew rate SR", unit: "V/µs", min: 0.1, max: 20, value: 0.6, log: true, format: v => `${v} V/µs`, onInput: v => { SR = v * 1e6; update(); } }),
      rP.el, rM.el, rS.el,
      h("p", { class: "hint" }, "A follower with a unity-gain bandwidth of 1 MHz and the script's 741 slew rate, 0.6 V/µs. At 10 V the sine stays clean only to about 10 kHz, a hundredth of the small-signal bandwidth; smaller swings go faster. A large-signal limit: the loop's bandwidth does not explain it."))));
    update();
  },
};
