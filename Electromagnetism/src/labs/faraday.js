// The induction law, U(∂A) = −dΦ/dt (Tab. 2.1, row 1): a loop in a field B̂ sin(ωt); the flux and the voltage round
// the loop, a quarter period apart.
import { induction, si } from "../core/index.js";
import { h, s, slider, readout } from "../ui/kit.js";
import { lineChart } from "../ui/chart.js";
import { clock } from "../ui/field.js";
import * as a from "../ui/art.js";

export default {
  id: "faraday",
  art: () => a.picture("A wire loop with field crosses inside and a voltage arrow beside it",
    a.rect(40, 30, 100, 90, a.INK, 3) + [0, 1, 2].map(i => [0, 1, 2].map(j => a.text(65 + 25 * j, 61 + 25 * i, "×", 18, a.COOL)).join("")).join("") +
      a.arrow(162, 110, 162, 40, a.ACC, 3) + a.text(180, 82, "U", 18, a.ACC)),
  mount(root) {
    let A = 0.01, B = 0.2, f = 50;
    const loop = s("svg", { viewBox: "0 0 220 210", class: "schematic", role: "img", "aria-label": "A square loop in a magnetic field that grows and shrinks; the marks show its strength and direction" });
    const chartBox = h("div", {});
    const flux = readout("Flux Φ(A) now"), volt = readout("Voltage round the loop U(∂A) now");
    const draw = t => {
      const T = 1 / f, tt = t * 0.02 % (2 * T); // shown 50 times slower than real
      const { Phi, U } = induction(A, B, f, tt);
      const side = 40 + Math.sqrt(A) * 700, x0 = 110 - side / 2, y0 = 95 - side / 2;
      const k = Phi / (A * B), marks = [];
      for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++)
        marks.push(s("text", { x: 22 + 44 * j, y: 22 + 40 * i, class: "bmark", "text-anchor": "middle", opacity: (0.15 + 0.85 * Math.abs(k)).toFixed(2) }, k >= 0 ? "×" : "•"));
      loop.replaceChildren(...marks, s("rect", { x: x0, y: y0, width: side, height: side, class: "loop" }),
        s("text", { x: 110, y: 206, class: "tick", "text-anchor": "middle" }, k >= 0 ? "× B into the page" : "• B out of the page"));
      flux.set(si(Phi, "Wb")); volt.set(si(U, "V"));
      const ts = Array.from({ length: 121 }, (_, i) => i * 2 * T / 120);
      const peakPhi = A * B, peakU = A * B * 2 * Math.PI * f;
      chartBox.replaceChildren(lineChart({ label: "Flux and voltage over two periods, both as a share of their peak",
        lines: [{ x: ts.map(x => x * 1000), y: ts.map(x => induction(A, B, f, x).Phi / peakPhi), name: "Φ / Φ̂" },
                { x: ts.map(x => x * 1000), y: ts.map(x => induction(A, B, f, x).U / peakU), name: "U / Û", cls: "second" },
                { x: [tt * 1000, tt * 1000], y: [-1, 1], name: "now", cls: "marker" }],
        xLabel: "Time t [ms]", yLabel: "Share of peak [1]", yMin: -1, yMax: 1 }));
    };
    const c = clock(draw);
    root.append(h("div", { class: "stage" }, h("div", {}, loop, chartBox), h("div", { class: "controls" },
      slider({ label: "Loop area A", unit: "m²", min: 0.001, max: 0.04, value: A, step: 0.001, onInput: v => { A = v; c.draw(); } }),
      slider({ label: "Peak flux density B̂", unit: "T", min: 0.01, max: 1, value: B, step: 0.01, onInput: v => { B = v; c.draw(); } }),
      slider({ label: "Frequency f", unit: "Hz", min: 10, max: 200, value: f, step: 5, onInput: v => { f = v; c.draw(); } }),
      c.el, flux.el, volt.el,
      h("p", { class: "hint" }, "The voltage peaks when the flux crosses zero, where it changes fastest: U = −dΦ/dt. Double the frequency and the peak voltage doubles though the flux does not. Shown 50 times slower than real."))));
  },
};
