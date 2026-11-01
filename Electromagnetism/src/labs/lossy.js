// A plane wave in a lossy medium, Lasser (2012) p. 38: the complex permittivity δ = ε(1 − js) with the loss tangent
// s = σ/(εω) turns the propagation constant into γ = α + jβ = jω√(μδ). One formula from a good dielectric (s ≪ 1)
// to a good conductor (s ≫ 1), where 1/α becomes the skin depth.
import { lossyWave, skinDepth, si } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import { clock } from "../../../kit/ui/field.js";
import * as a from "../../../kit/ui/art.js";

// Typical values [εr, σ in S/m], for illustration.
const STUFF = { dry: [4, 1e-3], wet: [20, 0.05], sea: [80, 4], copper: [1, 5.8e7] };

export default {
  id: "lossy",
  art: () => a.picture("A wave entering a lossy medium and dying away within it",
    a.rect(80, 20, 105, 110, a.DIM, 2) + a.path("M15 75 C25 35 35 35 45 75 C55 115 65 115 75 75 C85 45 95 45 105 75 C112 95 120 95 128 75 C134 65 140 68 150 75 L180 75", a.ACC, 3)),
  mount(root) {
    let f = 1e8, epsr = 80, sigma = 4;
    const chartBox = h("div", {});
    const rs = readout("Loss tangent s = σ/(εω)"), rA = readout("Attenuation α"), rD = readout("Depth 1/α where the field falls to 37 %"), rL = readout("Wavelength in the medium λ = 2π/β");
    const draw = t => {
      const w = lossyWave(f, epsr, sigma), ph = t * 2;
      const span = Math.min(5 * w.lambda, w.alpha > 0 ? 4 / w.alpha : 5 * w.lambda);
      const zs = Array.from({ length: 241 }, (_, k) => k * span / 240);
      chartBox.replaceChildren(lineChart({ label: "Field strength along the direction of travel, now, with its envelope",
        lines: [{ x: zs, y: zs.map(z => Math.exp(-w.alpha * z) * Math.cos(ph - w.beta * z)), name: "E / Ê now" },
                { x: zs, y: zs.map(z => Math.exp(-w.alpha * z)), name: "envelope e^(−αz)", cls: "faint" }],
        xLabel: "Distance into the medium z [m]", yLabel: "Field E / Ê [1]", yMin: -1, yMax: 1, xFormat: v => si(v, "m") }));
      rs.set(w.s.toPrecision(3), "", w.s < 0.1 ? "a good dielectric: nearly lossless" : w.s > 10 ? "a good conductor" : "neither: both terms count");
      rA.set(`${si(w.alpha, "Np/m")} = ${w.dBperMetre.toPrecision(3)} dB/m`);
      rD.set(w.alpha ? si(w.depth, "m") : "∞", "", w.s > 10 ? `Prechtl's skin depth √(2/(μωσ)) gives ${si(skinDepth(f, sigma), "m")}` : "");
      rL.set(si(w.lambda, "m"));
    };
    const c = clock(draw);
    const se = slider({ label: "Permittivity number εr", unit: "", min: 1, max: 100, value: epsr, step: 1, format: v => String(v), onInput: v => { epsr = v; c.draw(); } });
    const ss = slider({ label: "Conductivity σ", unit: "S/m", min: 1e-6, max: 1e8, value: sigma, log: true, onInput: v => { sigma = v; c.draw(); } });
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      choice("Medium", [["dry", "Dry soil"], ["wet", "Wet soil"], ["sea", "Sea water"], ["copper", "Copper"]], "sea",
        k => { [epsr, sigma] = STUFF[k]; se.set(epsr); ss.set(sigma); c.draw(); }),
      se, ss,
      slider({ label: "Frequency f", unit: "Hz", min: 1e3, max: 1e10, value: f, log: true, onInput: v => { f = v; c.draw(); } }),
      c.el, rs.el, rA.el, rD.el, rL.el,
      h("p", { class: "hint" }, "Sea water at 100 MHz: the wave is gone within centimetres, which is why submarines are reached at very low frequencies. Lower the frequency: s grows and the medium behaves more and more like a conductor. Material values are typical, for illustration."))));
  },
};
