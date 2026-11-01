// The Bode diagram (Definition 3.5) of the notes' composite example (3.128), written in the normalised form (3.129):
// G(s) = V(1 − s/ωz) / (s(1 + 2ξ s/ωn + s²/ωn²)). Its magnitude is the sum of the parts' magnitudes (3.121), each
// drawn as straight asymptotes by (3.122)–(3.125).
import { bode, bodeAsymptote, logspace } from "../core/index.js";
import { h, slider, readout, choice } from "../ui/kit.js";
import { lineChart } from "../ui/chart.js";
import * as a from "../ui/art.js";

const WS = logspace(1e-3, 1e2, 300), LX = WS.map(Math.log10);
const tick = v => String(Number((10 ** v).toPrecision(1)));

export default {
  id: "bode",
  art: () => a.picture("A Bode magnitude plot falling in straight segments with a resonance peak",
    a.line([[20, 30], [90, 60], [120, 70]], a.DIM, 2, "5 4") + a.path("M20 30 L80 56 Q95 40 104 72 L180 130", a.ACC, 3) +
      a.line([[20, 140], [185, 140]], a.INK, 2) + a.line([[20, 140], [20, 15]], a.INK, 2) + a.text(170, 30, "dB", 16, a.INK)),
  mount(root) {
    let V = 10, wz = 10, wn = 0.1, xi = 0.5, show = "mag";
    const chartBox = h("div", {});
    const rRes = readout("Magnitude at ωn: exact, asymptote"), rPh = readout("Phase at low and high frequency");
    const update = () => {
      const G = { num: [-V / wz, V], den: [1 / wn ** 2, 2 * xi / wn, 1, 0] }, B = bode(G, WS), parts = { V, r: 1, z1: [wz], p2: [wn] };
      chartBox.replaceChildren(show === "mag"
        ? lineChart({ label: "Bode magnitude of the composite transfer function with its asymptotes",
            lines: [{ x: LX, y: B.map(p => p.db), name: "|G(jω)|" }, { x: LX, y: WS.map(w => bodeAsymptote(parts, w)), name: "asymptotes", cls: "faint" }],
            yMin: -140, yMax: 80, xLabel: "Angular frequency ω [rad/s]", yLabel: "Magnitude |G(jω)| [dB]", xFormat: tick })
        : lineChart({ label: "Bode phase of the composite transfer function",
            lines: [{ x: LX, y: B.map(p => p.phase), name: "arg G(jω)" }], yMin: -360, yMax: 0,
            xLabel: "Angular frequency ω [rad/s]", yLabel: "Phase arg G(jω) [°]", xFormat: tick, yFormat: v => v.toFixed(0) }));
      const at = bode(G, [wn])[0];
      rRes.set(`${at.db.toFixed(1)} dB, ${bodeAsymptote(parts, wn).toFixed(1)} dB`, "", `the gap is the correction −20 log(2ξ) = ${(-20 * Math.log10(2 * xi)).toFixed(1)} dB`);
      rPh.set(`${B[0].phase.toFixed(0)}°, ${B.at(-1).phase.toFixed(0)}°`, "", "the zero 1 − s/ωz lies in the right half plane, so it lowers the phase");
    };
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      choice("Show", [["mag", "Magnitude"], ["phase", "Phase"]], show, v => { show = v; update(); }),
      slider({ label: "Gain V", unit: "", min: 0.1, max: 100, value: V, log: true, format: v => String(v), onInput: v => { V = v; update(); } }),
      slider({ label: "Zero corner ωz", unit: "rad/s", min: 0.01, max: 50, value: wz, log: true, onInput: v => { wz = v; update(); } }),
      slider({ label: "Pole pair corner ωn", unit: "rad/s", min: 0.01, max: 10, value: wn, log: true, onInput: v => { wn = v; update(); } }),
      slider({ label: "Damping ξ", unit: "", min: 0.05, max: 1, value: xi, step: 0.05, format: v => v.toFixed(2), onInput: v => { xi = v; update(); } }),
      rRes.el, rPh.el,
      h("p", { class: "hint" }, "The integrator draws −20 dB per decade through 20 log V at ω = 1; past ωn the pole pair bends it down by a further 40 dB per decade, and past ωz the zero lifts it back by 20. Small ξ puts a peak above the asymptote at ωn. The defaults are the notes' (3.128)."))));
    update();
  },
};
