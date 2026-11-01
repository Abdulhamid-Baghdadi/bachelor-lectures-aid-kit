// Diffusion of a magnetic field into a conductor (Prechtl 2010, section 4.2): an alternating field at the surface
// enters as B = B̂0 e^(−x/δ) cos(ωt − x/δ) (4.28), damped and delayed, with the skin depth δ = √(2/(μωγ)) (from 4.31).
import { skinDepth, skinB, si } from "../core/index.js";
import { h, slider, readout, choice } from "../ui/kit.js";
import { lineChart } from "../ui/chart.js";
import { clock } from "../ui/field.js";
import * as a from "../ui/art.js";

// Typical values [γ in S/m, μr], for illustration.
const STUFF = { copper: [5.8e7, 1], aluminium: [3.7e7, 1], steel: [6e6, 100], seawater: [4, 1] };

export default {
  id: "skin",
  art: () => a.picture("A wave entering a conductor and dying away inside it, between two shrinking envelopes",
    a.rect(60, 20, 130, 110, a.DIM, 2) + a.line([[20, 75], [60, 75]], a.DIM, 2) +
      a.path("M60 30 C80 120 95 120 110 65 C120 40 130 70 140 80 C150 90 160 70 180 75", a.ACC, 3) +
      a.path("M60 30 C100 55 140 70 185 74", a.COOL, 2, "4 5") + a.path("M60 120 C100 95 140 80 185 76", a.COOL, 2, "4 5")),
  mount(root) {
    let f = 50, gamma = 5.8e7, mur = 1;
    const chartBox = h("div", {});
    const rD = readout("Skin depth δ = √(2 / (μωγ))");
    const draw = t => {
      const d = skinDepth(f, gamma, mur), tt = t * 0.4 / f; // one period every 2.5 s
      const xs = Array.from({ length: 121 }, (_, k) => k * 5 * d / 120);
      chartBox.replaceChildren(lineChart({ label: "Flux density inside the conductor against depth, now and its envelope",
        lines: [{ x: xs.map(x => x / d), y: xs.map(x => skinB(1, x, tt, f, d)), name: "B / B̂0 now" },
                { x: xs.map(x => x / d), y: xs.map(x => Math.exp(-x / d)), name: "envelope ±e^(−x/δ)", cls: "faint" },
                { x: xs.map(x => x / d), y: xs.map(x => -Math.exp(-x / d)), name: "", cls: "faint" }],
        xLabel: "Depth in skin depths x / δ [1]", yLabel: "Flux density B / B̂0 [1]", yMin: -1, yMax: 1, xFormat: v => v.toFixed(0) }));
      rD.set(si(d, "m"), "", `at depth δ the field is down to 37 %, at 3δ to 5 %`);
    };
    const c = clock(draw);
    const fs = slider({ label: "Frequency f", unit: "Hz", min: 1, max: 1e7, value: f, log: true, onInput: v => { f = v; c.draw(); } });
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      fs,
      choice("Conductor", [["copper", "Copper"], ["aluminium", "Aluminium"], ["steel", "Steel (μr = 100)"], ["seawater", "Sea water"]], "copper",
        k => { [gamma, mur] = STUFF[k]; c.draw(); }),
      c.el, rD.el,
      h("p", { class: "hint" }, "The surface is on the left, x = 0. Deeper in, the field is weaker and later: the crests move inward. Raise the frequency 100 times and δ shrinks 10 times; that is why high-frequency current runs only in a conductor's skin. Material values are typical, for illustration."))));
  },
};
