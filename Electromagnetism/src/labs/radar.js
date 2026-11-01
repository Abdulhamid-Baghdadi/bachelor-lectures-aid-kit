// The radar equation, Lasser (2012) p. 143: a monostatic radar receives P_e/P_s = σ G² (λ/4π)² / (4π d⁴) (12.17) from a
// target of radar cross-section σ; for a plate square to the beam σ = 4πA²/λ² (12.18), for a large sphere σ = πr²
// (12.19). The echo falls with d⁴, not d².
import { radar, plateRCS, sphereRCS, dB, fromdB, C0, si } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "radar",
  art: () => a.picture("A radar dish sending a beam to a target and an echo coming back, weaker",
    a.path("M20 60 Q40 75 20 90", a.INK, 3) + a.line([[30, 75], [44, 75]], a.INK, 3) + a.arrow(50, 65, 150, 65, a.ACC, 3) +
      a.arrow(150, 85, 50, 85, a.ACC, 1.5) + a.rect(158, 60, 22, 30, a.INK, 3)),
  mount(root) {
    let PsdBW = 60, G = 35, f = 3e9, d = 50e3, target = "sphere", size = 1, min = -130;
    const chartBox = h("div", {});
    const rS = readout("Radar cross-section σ"), rP = readout("Echo power P_e"), rR = readout("Range where the echo meets the minimum");
    const update = () => {
      const lam = C0 / f, sigma = target === "plate" ? plateRCS(size * size, lam) : sphereRCS(size);
      const Pe = radar(fromdB(PsdBW), fromdB(G), sigma, f, d);
      // From (12.17), d⁴ ∝ 1/P_e: the range for the minimum echo.
      const range = d * (Pe / fromdB(min)) ** 0.25;
      const ds = Array.from({ length: 121 }, (_, k) => 1e3 * 10 ** (k * 3 / 120));
      chartBox.replaceChildren(lineChart({ label: "Echo power against range, with the receiver's minimum",
        lines: [{ x: ds.map(x => Math.log10(x / 1e3)), y: ds.map(x => dB(radar(fromdB(PsdBW), fromdB(G), sigma, f, x))), name: "echo P_e" },
                { x: [0, 3], y: [min, min], name: "minimum", cls: "marker" }],
        xLabel: "Range, log10 of d in km [1]", yLabel: "Echo power [dBW]", xFormat: v => `${10 ** v} km`, yMin: Math.min(min, dB(radar(fromdB(PsdBW), fromdB(G), sigma, f, 1e6))) - 5 }));
      rS.set(si(sigma, "m²"), "", target === "plate" ? `${(sigma / (size * size)).toFixed(0)} times the plate's area` : "the shadow area πr², independent of λ");
      rP.set(`${dB(Pe).toFixed(1)} dBW = ${si(Pe, "W")}`, Pe < fromdB(min) ? "danger" : "", Pe < fromdB(min) ? "below the minimum: not detected" : "");
      rR.set(si(range, "m"));
    };
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      choice("Target", [["sphere", "Metal sphere, radius"], ["plate", "Flat plate square to the beam, side"]], target, v => { target = v; update(); }),
      slider({ label: "Target size", unit: "m", min: 0.05, max: 10, value: size, log: true, onInput: v => { size = v; update(); } }),
      slider({ label: "Transmit power P_s", unit: "dBW", min: 0, max: 70, value: PsdBW, step: 1, format: v => `${v} dBW`, onInput: v => { PsdBW = v; update(); } }),
      slider({ label: "Antenna gain G", unit: "dBi", min: 10, max: 50, value: G, step: 1, format: v => `${v} dBi`, onInput: v => { G = v; update(); } }),
      slider({ label: "Frequency f", unit: "Hz", min: 3e8, max: 3e10, value: f, log: true, onInput: v => { f = v; update(); } }),
      slider({ label: "Range d", unit: "m", min: 1e3, max: 1e6, value: d, log: true, onInput: v => { d = v; update(); } }),
      slider({ label: "Receiver minimum", unit: "dBW", min: -160, max: -90, value: min, step: 1, format: v => `${v} dBW`, onInput: v => { min = v; update(); } }),
      rS.el, rP.el, rR.el,
      h("p", { class: "hint" }, "To triple the range at the same echo, the transmitter needs 3⁴ = 81 times the power (p. 143). A flat plate square to the beam returns far more than its area: 4πA²/λ², which is why stealth designs avoid flat faces turned to the radar."))));
    update();
  },
};
