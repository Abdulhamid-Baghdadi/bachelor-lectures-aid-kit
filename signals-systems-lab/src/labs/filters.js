// Digital filters (Doblinger 2015, sections 6.2 and 6.3): an IIR low-pass made from the analogue Butterworth filter
// by the bilinear transform, pre-warped so the cut-off lands where asked, its poles inside the unit circle; and an FIR
// low-pass by the window method, linear in phase.
import { butterworth, firLowpass, response, dB, cAbs, range } from "../core/index.js";
import { h, s, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const FS = 8000;

/** The z-plane: the unit circle, poles as crosses, zeros as rings (shape, not colour, tells them apart). */
function zplane(poles, zeros) {
  const S = 240, c = S / 2, R = 90, X = p => c + p[0] * R, Y = p => c - p[1] * R;
  return s("svg", { viewBox: `0 0 ${S} ${S}`, class: "chart zplane", role: "img", "aria-label": `Pole-zero plot: ${poles.length} poles inside the unit circle, ${zeros.length} zeros` },
    s("circle", { cx: c, cy: c, r: R, class: "unit" }), s("line", { x1: 10, y1: c, x2: S - 10, y2: c, class: "grid" }), s("line", { x1: c, y1: 10, x2: c, y2: S - 10, class: "grid" }),
    ...poles.flatMap(p => [s("line", { x1: X(p) - 5, y1: Y(p) - 5, x2: X(p) + 5, y2: Y(p) + 5, class: "pole" }), s("line", { x1: X(p) - 5, y1: Y(p) + 5, x2: X(p) + 5, y2: Y(p) - 5, class: "pole" })]),
    ...zeros.map((q, k) => s("circle", { cx: X(q), cy: Y(q), r: 5 + k * 1.5, class: "zero" })),
    s("text", { x: S - 12, y: c - 6, class: "tick", "text-anchor": "end" }, "Re z"), s("text", { x: c + 6, y: 18, class: "tick" }, "Im z"));
}

export default {
  id: "filters",
  art: () => a.picture("A low-pass response falling off, beside a unit circle with crosses inside it",
    a.path("M15 40 L70 40 C85 40 90 60 95 120", a.ACC, 3) + a.circle(145, 75, 40, a.DIM, 2) +
      a.line([[150, 60], [160, 70]], a.HOT, 3) + a.line([[160, 60], [150, 70]], a.HOT, 3) + a.line([[150, 80], [160, 90]], a.HOT, 3) + a.line([[160, 80], [150, 90]], a.HOT, 3)),
  mount(root) {
    let kind = "iir", N = 4, fc = 1000, taps = 31, win = "hamming";
    const box = h("div", {}), r1 = readout("At the cut-off"), r2 = readout("Pre-warped analogue cut-off");
    const update = () => {
      const fsL = range(1, FS / 2, 400);
      if (kind === "iir") {
        const f = butterworth(N, fc, FS);
        box.replaceChildren(
          lineChart({ label: "The digital filter's response against the analogue Butterworth it came from", lines: [
            { x: fsL, y: fsL.map(v => -10 * Math.log10(1 + (v / fc) ** (2 * N))), name: "analogue |Ha|", cls: "faint" },
            { x: fsL, y: fsL.map(v => dB(f.at(v / FS))), name: "digital |H|" }],
            xLabel: "Frequency f [Hz]", yLabel: "Gain [dB]", yMin: -80, yMax: 3 }),
          zplane(f.poles, f.zeros));
        r1.set(`${dB(f.at(fc / FS)).toFixed(2)} dB`, "", "−3 dB: the pre-warp puts the cut-off where asked");
        r2.set(`${(f.wa / (2 * Math.PI)).toFixed(0)} Hz`, "", "the bilinear transform squeezes the whole analogue axis into 0 … fs/2");
      } else {
        const hh = firLowpass(taps, fc / FS, win), ns = hh.map((_, n) => n);
        box.replaceChildren(
          lineChart({ label: "The FIR filter's response", lines: [{ x: fsL, y: fsL.map(v => dB(response(hh, [1], v / FS))), name: "|H|" }],
            xLabel: "Frequency f [Hz]", yLabel: "Gain [dB]", yMin: -100, yMax: 3 }),
          lineChart({ label: "Its impulse response, a windowed sinc", lines: [{ x: ns, y: hh, name: "h[n]", stem: true }],
            xLabel: "Index n [1]", yLabel: "Coefficient h[n] [1]", yMin: Math.min(...hh), yMax: Math.max(...hh) }));
        r1.set(`${dB(response(hh, [1], fc / FS)).toFixed(2)} dB`, "", "about −6 dB: the window method splits the edge in half");
        r2.set("none needed", "", `${taps} taps, delay ${(taps - 1) / 2} samples at every frequency`);
      }
    };
    const controls = h("div", {});
    const build = () => controls.replaceChildren(...(kind === "iir"
      ? [slider({ label: "Order N", min: 1, max: 8, value: N, step: 1, format: v => v.toFixed(0), onInput: v => { N = v; update(); } })]
      : [slider({ label: "Length (taps)", min: 5, max: 101, value: taps, step: 2, format: v => v.toFixed(0), onInput: v => { taps = v; update(); } }),
         choice("Window", [["rectangular", "Rectangular"], ["hann", "Hann"], ["hamming", "Hamming"], ["blackman", "Blackman"]], win, v => { win = v; update(); })]).map(c => c.el ?? c));
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Filter", [["iir", "IIR: Butterworth, bilinear"], ["fir", "FIR: window method"]], kind, v => { kind = v; build(); update(); }),
      slider({ label: "Cut-off fc", unit: "Hz", min: 200, max: 3500, value: fc, step: 50, format: v => `${v} Hz`, onInput: v => { fc = v; update(); } }),
      controls, r1.el, r2.el,
      h("p", { class: "hint" }, "Sampling rate 8 kHz. The IIR filter is the analogue one carried over: same −3 dB point, a steeper fall near fs/2 where the bilinear transform puts an N-fold zero at z = −1. The FIR filter has no poles to make unstable, and its symmetric coefficients delay every frequency alike."))));
    build(); update();
  },
};
