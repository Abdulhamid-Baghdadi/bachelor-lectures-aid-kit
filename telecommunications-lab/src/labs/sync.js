// Carrier phase and timing errors (Goiser 2016, Synchronisation, slides 7–32): the bit error probability of BPSK and
// QPSK when the receiver's carrier is off by φ or its timing by ε, against Eb/N0.
import { bpskPhaseError, qpskPhaseError, timingError, fromDB, sci } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "sync",
  art: () => a.picture("Two antipodal points turned by an angle away from the axis",
    a.line([[20, 75], [180, 75]], a.DIM, 2) + a.line([[100, 15], [100, 135]], a.DIM, 2) + a.circle(100, 75, 55, a.DIM, 1) +
      a.circle(150, 52, 7, a.ACC, 3, a.ACC) + a.circle(50, 98, 7, a.ACC, 3, a.ACC) + a.path("M155 75 A55 55 0 0 0 150 52", a.HOT, 3)),
  mount(root) {
    let phi = 20, eps = 0.1;
    const box = h("div", {}), rB = readout("BPSK at 9.6 dB"), rQ = readout("QPSK at 9.6 dB"), rT = readout("Timing, BPSK at 9.6 dB");
    const update = () => {
      const xs = Array.from({ length: 57 }, (_, k) => k * 0.25), p = phi * Math.PI / 180, lg = f => xs.map(x => Math.log10(f(fromDB(x))));
      box.replaceChildren(lineChart({ label: `Bit error probability with a phase error of ${phi}° and a timing error of ${eps}`,
        lines: [{ x: xs, y: lg(e => bpskPhaseError(e, 0)), cls: "faint" },
                { x: xs, y: lg(e => bpskPhaseError(e, p)), name: `BPSK, φ` },
                { x: xs, y: lg(e => qpskPhaseError(e, p)), name: `QPSK, φ`, cls: "second" },
                { x: xs, y: lg(e => timingError(e, eps)), name: "BPSK, ε", cls: "marker" }],
        xLabel: "Eb/N0 [dB]", yLabel: "Bit error probability, log₁₀ Pb [1]", yMin: -8, yMax: 0, yFormat: v => sci(10 ** v, 1) }));
      const e = fromDB(9.6);
      rB.set(sci(bpskPhaseError(e, p)), "", `${(-20 * Math.log10(Math.cos(p))).toFixed(2)} dB lost: cos²φ`);
      rQ.set(sci(qpskPhaseError(e, p)), qpskPhaseError(e, p) > 1e-3 ? "warn" : "", "the cross-talk between I and Q adds to the loss");
      rT.set(sci(timingError(e, eps)), "", "half the bits lose 2ε of their integral");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Carrier phase error φ", unit: "°", min: 0, max: 44, value: phi, step: 1, format: v => `${v}°`, onInput: v => { phi = v; update(); } }),
      slider({ label: "Timing error ε, share of a bit", unit: "", min: 0, max: 0.45, value: eps, step: 0.01, format: v => v.toFixed(2), onInput: v => { eps = v; update(); } }),
      rB.el, rQ.el, rT.el,
      h("p", { class: "hint" }, "The faint dashed curve is BPSK in sync, which reaches 10⁻⁵ at 9.6 dB. A PLL locks the carrier through its phase detector sin(φ − θ); for BPSK, whose data flip the carrier, a squaring or Costas loop removes the data first (slides 24–27). An early–late gate holds the timing (slides 30–32). At φ = 45° QPSK's two branches cross over and fail."))));
    update();
  },
};
