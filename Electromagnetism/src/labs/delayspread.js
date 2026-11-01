// Frequency-selective fading, Lasser (2012) pp. 145–146: a channel with two paths, h(τ) = A1 δ(τ − τ1) + A2 δ(τ − τ2)
// (13.2), has the transfer function |H(jω)| = √(A1² + A2² + 2A1A2 cos ωΔτ) (13.4): notches every 1/Δτ. A signal
// narrower than that spacing sees a flat channel; a wider one is cut by notches and smeared in time.
import { twoPath, fadeDepth, si } from "../core/index.js";
import { h, slider, readout } from "../ui/kit.js";
import { lineChart } from "../ui/chart.js";
import * as a from "../ui/art.js";

export default {
  id: "delayspread",
  art: () => a.picture("A transfer function with regular notches, and a signal band laid over it",
    a.path("M15 40 C30 40 35 115 45 115 C55 115 60 40 75 40 C90 40 95 115 105 115 C115 115 120 40 135 40 C150 40 155 115 165 115 C175 115 180 40 190 40", a.ACC, 3) +
      a.rect(60, 30, 50, 95, a.COOL, 2)),
  mount(root) {
    let dtau = 20e-9, ddB = 2, B = 10e6;
    const chartBox = h("div", {});
    const rN = readout("Distance between notches 1/Δτ"), rD = readout("Depth of the notches"), rI = readout("Largest symbol rate without strong ISI 1/(2Δτ)"), rB = readout("The signal band is");
    const update = () => {
      const A2 = 10 ** (-ddB / 20), spacing = 1 / dtau, span = 4 * spacing;
      const fs = Array.from({ length: 401 }, (_, k) => k * span / 400);
      const peak = 1 + A2;
      chartBox.replaceChildren(lineChart({ label: "Magnitude of the channel's transfer function over frequency, with the signal band",
        lines: [{ x: fs.map(x => x / 1e6), y: fs.map(x => 20 * Math.log10(twoPath(1, A2, x, dtau) / peak)), name: "|H| / |H|max" },
                { x: [0, 0, B / 1e6, B / 1e6], y: [-40, 0, 0, -40], name: "signal band", cls: "second" }],
        xLabel: "Frequency offset in the band f [MHz]", yLabel: "Transfer function |H| [dB]", yMin: -40, yMax: 0, xFormat: x => x.toFixed(0) }));
      rN.set(si(spacing, "Hz"));
      rD.set(`${(20 * Math.log10(fadeDepth(1, A2))).toFixed(1)} dB`);
      rI.set(si(1 / (2 * dtau), "Bd"), "", "the collection's working rule: strong ISI from half a symbol of delay");
      const narrow = B < spacing / 3;
      rB.set(narrow ? "narrowband" : "wideband", narrow ? "" : "warn", narrow ? "much narrower than the notch spacing: the channel looks flat" : "notches fall inside the band: the channel needs equalising");
    };
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      slider({ label: "Delay difference Δτ = τ2 − τ1", unit: "s", min: 1e-9, max: 1e-5, value: dtau, log: true, onInput: x => { dtau = x; update(); } }),
      slider({ label: "Second path weaker by", unit: "dB", min: 0, max: 20, value: ddB, step: 0.5, format: x => `${x} dB`, onInput: x => { ddB = x; update(); } }),
      slider({ label: "Signal bandwidth B", unit: "Hz", min: 1e4, max: 1e8, value: B, log: true, onInput: x => { B = x; update(); } }),
      rN.el, rD.el, rI.el, rB.el,
      h("p", { class: "hint" }, "Indoors a path 6 m longer than the direct one gives Δτ = 20 ns, notches 50 MHz apart (exercise 25). Mobile radio with paths kilometres apart has Δτ of microseconds and notches only kHz apart, which is why it needs equalisers or many narrow subcarriers. The 'narrowband' line at a third of the notch spacing is a rule of thumb, not from the notes."))));
    update();
  },
};
