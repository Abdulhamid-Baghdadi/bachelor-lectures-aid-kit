// The Tustin transformation (Kugi 2015, 6.6): replacing s by q = (2/Ta)(z − 1)/(z + 1) (6.90) turns a continuous
// controller into a discrete one whose response at ω equals the continuous one at Ω = (2/Ta)·tan(ωTa/2) (6.89):
// the frequency axis is warped, and every feature slides towards lower frequencies.
import { freq, cAbs, logspace, loopTustin, loopFreqZ, loopUnwarp, loopWarp } from "../core/index.js";
import { h, slider, readout } from "../ui/kit.js";
import { lineChart } from "../ui/chart.js";
import * as a from "../ui/art.js";

const XI = 0.1;

export default {
  id: "tustin",
  art: () => a.picture("Two resonance peaks, the discrete one shifted left of the continuous one",
    a.line([[10, 130], [190, 130]], a.DIM, 1) + a.path("M 10 110 C 80 110, 110 20, 125 20 S 150 125, 190 128", a.DIM, 3) +
      a.path("M 10 110 C 60 110, 85 30, 100 30 S 120 125, 165 140", a.ACC, 3)),
  mount(root) {
    let w0 = 10, Ta = 0.1;
    const chart = h("div", { class: "plot" });
    const peak = readout("Peak of the discrete filter"), warp = readout("Transformed frequency of ω0, Ω = (2/Ta)·tan(ω0·Ta/2)");
    const update = () => {
      const R = { num: [w0 * w0], den: [1, 2 * XI * w0, w0 * w0] }, Rz = loopTustin(R, Ta), wN = Math.PI / Ta;
      const ws = logspace(0.1, Math.min(1000, 0.999 * wN), 500).filter(w => w < wN);
      const db = g => 20 * Math.log10(cAbs(g));
      chart.replaceChildren(lineChart({ lines: [{ x: ws.map(Math.log10), y: ws.map(w => db(freq(R, w))), name: "continuous R(jω)", cls: "faint" },
        { x: ws.map(Math.log10), y: ws.map(w => db(loopFreqZ(Rz, w, Ta))), name: "Tustin R(e^{jωTa})" }],
        yMin: -40, yMax: 20, xFormat: v => `10^${v.toFixed(1)}`, xLabel: "Frequency log₁₀ ω [rad/s]", yLabel: "Magnitude [dB]",
        label: "Magnitude of the continuous filter and of its Tustin discretisation up to half the sampling frequency" }));
      const wp = loopUnwarp(w0, Ta);
      peak.set(`${wp.toFixed(2)} rad/s`, wp < 0.9 * w0 ? "warn" : "", `instead of ω0 = ${w0.toFixed(1)} rad/s; it sits where Ω = ω0`);
      warp.set(`${loopWarp(w0, Ta).toFixed(2)} rad/s`, "", `the limit of the axis is π/Ta = ${wN.toFixed(1)} rad/s`);
    };
    root.append(h("div", { class: "stage" }, chart, h("div", { class: "controls" },
      slider({ label: "Resonance ω0 of the filter", unit: "rad/s", min: 1, max: 30, value: w0, log: true, onInput: v => { w0 = v; update(); }, format: v => `${v.toFixed(1)} rad/s` }),
      slider({ label: "Sample time Ta", unit: "s", min: 0.005, max: 0.25, value: Ta, log: true, onInput: v => { Ta = v; update(); }, format: v => `${v.toFixed(3)} s` }),
      peak.el, warp.el,
      h("p", { class: "hint" }, "The controller is a lightly damped filter ω0²/(s² + 2ξω0 s + ω0²) with ξ = 0.1. For ωTa ≪ 1, tan(ωTa/2) ≈ ωTa/2 and both curves agree; near π/Ta the whole upper half of the axis is squeezed in, so the peak lands low. To keep it at ω0, design the continuous filter at Ω = (2/Ta)·tan(ω0Ta/2) instead (prewarping)."))));
    update();
  },
};
