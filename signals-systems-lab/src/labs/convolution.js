// Convolution (Prechtl 2010, section 1.5; Doblinger 2015, section 3.1): y(t) = ∫ x(τ) h(t − τ) dτ and
// y[n] = Σ x[k] h[n − k]. Flip h, slide it to t, multiply and add up: the area of the product is the output now.
import { SHAPES, SEQUENCES, convolve, convolveSum, range } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import { clock } from "../../../kit/ui/field.js";
import * as a from "../../../kit/ui/art.js";

const seq = v => n => n >= 0 && n < v.length ? v[n] : 0;

export default {
  id: "convolution",
  art: () => a.picture("A pulse and a flipped decay sliding over it, their overlap marked",
    a.line([[15, 125], [185, 125]], a.DIM, 2) + a.line([[30, 125], [30, 60], [100, 60], [100, 125]], a.INK, 3) +
      a.path("M140 125 L140 50 C120 90 100 110 70 122", a.ACC, 3) + a.arrow(150, 35, 180, 35, a.COOL, 2)),
  mount(root) {
    let mode = "ct", xs = "rect", hs = "decay", t = 1.2, follow = true;
    const box = h("div", {}), rY = readout("Output now");
    let ts = null;
    const draw = time => {
      if (follow && time !== undefined) { t = ((time * 0.5) % 5) - 0.5; ts?.set(t); }
      if (mode === "ct") {
        const x = SHAPES[xs], hh = SHAPES[hs], taus = range(-1, 5, 301), tt = range(-1, 5, 241);
        box.replaceChildren(
          lineChart({ label: "x(τ), the flipped and shifted h(t − τ), and their product",
            lines: [{ x: taus, y: taus.map(x), name: "x(τ)", cls: "faint" }, { x: taus, y: taus.map(u => hh(t - u)), name: "h(t − τ)", cls: "second" },
                    { x: taus, y: taus.map(u => x(u) * hh(t - u)), name: "product" }],
            xLabel: "Integration variable τ [s]", yLabel: "Value [1]", yMin: 0, yMax: 1.1, xFormat: v => v.toFixed(0) }),
          lineChart({ label: "The output y(t) so far, and where the slide is now",
            // The whole time axis is fixed by a faint zero line, so it does not grow with y(t).
            lines: [{ x: tt.filter(u => u <= t), y: tt.filter(u => u <= t).map(u => convolve(x, hh, u, { n: 1500 })), name: "y(t)" },
                    { x: [t, t], y: [0, 1.2], name: "now", cls: "marker" }, { x: [-1, 5], y: [0, 0], name: "", cls: "faint" }],
            xLabel: "Time t [s]", yLabel: "Output y [s]", yMin: 0, yMax: 1.2, xFormat: v => v.toFixed(0) }));
        rY.set(`y(${t.toFixed(2)} s) = ${convolve(x, hh, t).toFixed(3)} s`, "", "the area under the product");
      } else {
        const x = seq(SEQUENCES[xs]), hh = seq(SEQUENCES[hs]), n = Math.round(t * 4), ks = Array.from({ length: 24 }, (_, k) => k - 2);
        const y = convolveSum(SEQUENCES[xs], SEQUENCES[hs]);
        box.replaceChildren(
          lineChart({ label: "x[k], the flipped and shifted h[n − k], and their product",
            lines: [{ x: ks, y: ks.map(x), name: "x[k]", cls: "faint", stem: true }, { x: ks, y: ks.map(k => hh(n - k)), name: "h[n − k]", cls: "second", stem: true },
                    { x: ks, y: ks.map(k => x(k) * hh(n - k)), name: "product", stem: true }],
            xLabel: "Summation index k [1]", yLabel: "Value [1]", yMin: 0, yMax: 1.1 }),
          lineChart({ label: "The output y[n] so far",
            lines: [{ x: ks.filter(k => k <= n), y: ks.filter(k => k <= n).map(k => y[k] ?? 0), name: "y[n]", stem: true }, { x: [n, n], y: [0, 5], name: "now", cls: "marker" },
                    { x: [ks[0], ks.at(-1)], y: [0, 0], name: "", cls: "faint" }],
            xLabel: "Index n [1]", yLabel: "Output y [1]", yMin: 0, yMax: 5 }));
        rY.set(`y[${n}] = ${(y[n] ?? 0).toFixed(3)}`, "", "the sum of the products");
      }
    };
    const c = clock(draw, { label: "Slide" });
    ts = slider({ label: "Time t", unit: "s", min: -0.5, max: 4.5, value: t, step: 0.05, format: v => v.toFixed(2), onInput: v => { t = v; follow = false; c.draw(); } });
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Time", [["ct", "Continuous: integral"], ["dt", "Discrete: sum"]], mode, v => { mode = v; c.draw(); }),
      choice("Input x", [["rect", "Pulse"], ["tri", "Triangle"]], xs, v => { xs = v; c.draw(); }),
      choice("Impulse response h", [["decay", "Decay"], ["rect", "Pulse"]], hs, v => { hs = v; c.draw(); }),
      c.el, ts, rY.el,
      h("p", { class: "hint" }, "Press Slide, or drag the time to stop it. Discrete, the slider's time is the index n / 4. A pulse convolved with a pulse gives a triangle; with a decay, the output rises and dies like an RC circuit charging and discharging."))));
    c.el.addEventListener("click", () => { follow = true; });
  },
};
