// PSK and QAM in noise (Goiser 2016, sets 7–8): the points, a seeded cloud of received symbols around them, and the
// symbol error rate counted beside the slides' formula.
import { constellation, symbolError, receive, uniform, gaussian, fromDB, sci } from "../core/index.js";
import { h, slider, choice, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const NOISE = gaussian(1024, 120000), SCHEMES = [["psk-2", "BPSK"], ["psk-4", "QPSK"], ["psk-8", "8-PSK"], ["qam-16", "16-QAM"], ["qam-64", "64-QAM"]];

export default {
  id: "constellation",
  art: () => a.picture("Sixteen points in a square grid, each with a small cloud of noise",
    Array.from({ length: 16 }, (_, k) => { const x = 40 + (k % 4) * 40, y = 15 + Math.floor(k / 4) * 40;
      return a.circle(x, y, 9, a.DIM, 2) + a.circle(x, y, 3, k === 6 ? a.ACC : a.INK, 3, k === 6 ? a.ACC : a.INK); }).join("")),
  mount(root) {
    let scheme = "qam-16", es = 16;
    const box = h("div", {}), rF = readout("Symbol error, formula"), rC = readout("Symbol error, counted"), rS = readout("Bits per symbol");
    const update = () => {
      const [kind, Ms] = scheme.split("-"), M = Number(Ms), pts = constellation(kind, M), EsN0 = fromDB(es);
      const shown = receive(pts, EsN0, uniform(M), NOISE, 600), counted = receive(pts, EsN0, uniform(M + 7), NOISE, 50000).ser;
      const r = kind === "qam" ? 1.5 : 1.4;
      box.replaceChildren(lineChart({ label: `${M} points and 600 received symbols at Es/N0 = ${es} dB; wrong decisions as rings`,
        lines: [], marks: [...shown.out.map(o => ({ x: o.i, y: o.q, ...(o.sent === o.decided ? { shape: "dot", cls: "cloud" } : { shape: "o", cls: "second" }) })),
          ...pts.map(p => ({ x: p.i, y: p.q, shape: "x" }))],
        xLabel: "In-phase I / √Es [1]", yLabel: "Quadrature Q / √Es [1]", xMin: -r, xMax: r, yMin: -r, yMax: r, xFormat: v => v.toFixed(1) }));
      rF.set(sci(symbolError(kind, M, EsN0)), "", kind === "qam" ? "4 (√M − 1)/√M · Q(√(3Es/((M − 1)N0)))" : M > 4 ? "2 Q(√(2Es/N0) sin(π/M))" : M === 4 ? "2Pb − Pb²" : "Q(√(2Es/N0))");
      rC.set(counted ? sci(counted) : "none", "", "50 000 seeded symbols");
      rS.set(`${Math.log2(M)}`, "", `Eb/N0 = ${(es - 10 * Math.log10(Math.log2(M))).toFixed(1)} dB`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Modulation", SCHEMES, scheme, v => { scheme = v; update(); }),
      slider({ label: "Symbol energy over noise density Es/N0", unit: "dB", min: 0, max: 30, value: es, step: 0.5, format: v => `${v} dB`, onInput: v => { es = v; update(); } }),
      rF.el, rC.el, rS.el,
      h("p", { class: "hint" }, "The receiver decides for the nearest point (×); a ring marks a symbol it got wrong. Gray labels (slide 6) make a neighbour's mistake cost one bit. Every scheme's mean symbol energy is the same here, so the points of 64-QAM stand much closer: it needs about 12 dB more than QPSK for the same error rate, but carries three times the bits in the same bandwidth (set 8, slides 3, 40)."))));
    update();
  },
};
