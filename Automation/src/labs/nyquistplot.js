// The Nyquist locus (Ortskurve) of section 3.7.1: G(jω) drawn in the complex plane with ω as the parameter, for the
// notes' examples (3.112) and (3.114) and two of Aufgabe 3.27; the dot is the point for the chosen ω.
import { nyquistLocus, freq, cAbs, cArg } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const SYSTEMS = {
  rc: { num: [1], den: [0.5, 1], name: "1/(1 + s/2), (3.105)" },
  ex2: { num: [10, 15, 10], den: [1, 1, 3], name: "(10s² + 15s + 10)/(s² + s + 3), (3.114)" },
  allpass: { num: [1, -1], den: [1, 1], name: "(s − 1)/(s + 1)" },
  pt2: { num: [10], den: [1, 1, 1], name: "10/(s² + s + 1)" },
};

export default {
  id: "nyquistplot",
  art: () => a.picture("A Nyquist locus curving from the real axis through the complex plane back to the origin",
    a.line([[15, 75], [185, 75]], a.DIM, 2) + a.line([[60, 10], [60, 140]], a.DIM, 2) +
      a.path("M160 75 C160 140 70 140 62 76", a.ACC, 3) + a.path("M160 75 C160 10 70 10 62 74", a.ACC, 2, "5 4") + a.circle(140, 118, 5, a.INK, 3, a.INK)),
  mount(root) {
    let key = "ex2", w = 2.6;
    const chartBox = h("div", {});
    const rPt = readout("G(jω) at this ω: magnitude and phase"), rAx = readout("Real and imaginary part");
    const update = () => {
      const G = SYSTEMS[key], L = nyquistLocus(G, 1e-3, 1e3, 500), g = freq(G, w);
      const span = Math.max(...L.re.map(Math.abs), ...L.im.map(Math.abs), 1) * 1.1;
      chartBox.replaceChildren(lineChart({ label: `Nyquist locus of ${G.name}`,
        lines: [{ x: L.re, y: L.im, name: "ω > 0" }, { x: L.re, y: L.im.map(v => -v), name: "ω < 0", cls: "faint" }],
        marks: [{ x: g[0], y: g[1], shape: "dot", name: `ω = ${w}` }],
        xMin: -span, xMax: span, yMin: -span, yMax: span, xLabel: "Real part Re G(jω) [–]", yLabel: "Imaginary part Im G(jω) [–]", xFormat: v => v.toFixed(1), yFormat: v => v.toFixed(1) }));
      rPt.set(`|G| = ${cAbs(g).toFixed(3)}, arg G = ${(cArg(g) * 180 / Math.PI).toFixed(1)}°`);
      rAx.set(`${g[0].toFixed(3)} ${g[1] < 0 ? "−" : "+"} j${Math.abs(g[1]).toFixed(3)}`);
    };
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      choice("Transfer function G(s)", Object.entries(SYSTEMS).map(([k, s]) => [k, s.name]), key, v => { key = v; update(); }),
      slider({ label: "Angular frequency ω", unit: "rad/s", min: 0.01, max: 100, value: w, log: true, onInput: v => { w = v; update(); } }),
      rPt.el, rAx.el,
      h("p", { class: "hint" }, "Move ω and follow the dot: its distance from the origin is |G(jω)| and its angle is arg G(jω). The locus for negative ω is the mirror image. The RC example is a circle about (½, 0) of radius ½, (3.113); the all-pass keeps |G| = 1 and only turns the phase."))));
    update();
  },
};
