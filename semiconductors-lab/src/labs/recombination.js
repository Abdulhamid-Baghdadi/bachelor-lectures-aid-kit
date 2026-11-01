// Generation and recombination with the minority-carrier lifetime (Strasser 2015, sections 3.2 and 3.4.4): under light
// the excess rises as Gτ(1 − e^(−t/τ)) and dies away with τ when the light goes off; injected at one end, it decays into
// the sample over the diffusion length L = √(D τ).
import { transient, injected, diffusivity, diffusionLength, SI, si } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "recombination",
  art: () => a.picture("Excess carriers rising while a light shines, then decaying when it stops",
    a.line([[15, 125], [185, 125]], a.DIM, 2) + a.path("M20 125 C40 50 60 40 100 40 C120 40 125 120 180 122", a.ACC, 3) +
      a.line([[20, 22], [100, 22]], a.COOL, 4) + a.text(60, 16, "light", 12, a.COOL)),
  mount(root) {
    let view = "time", tau = 10e-6, G = 1e20, W = 0.1;
    const box = h("div", {}), r1 = readout(""), r2 = readout("");
    const update = () => {
      const Dp = diffusivity(SI.mup), L = diffusionLength(Dp, tau);
      if (view === "time") {
        const tOff = 60e-6, ts = Array.from({ length: 401 }, (_, k) => k * 120e-6 / 400);
        box.replaceChildren(lineChart({ label: "Excess hole density under light switched off at 60 µs",
          lines: [{ x: ts.map(t => t * 1e6), y: ts.map(t => transient(t, G, tau, tOff)), name: "Δp(t)" }, { x: [0, 120], y: [G * tau, G * tau], name: "G τ", cls: "faint" }],
          xLabel: "Time t [µs]", yLabel: "Excess density Δp [cm⁻³]", yMin: 0, yFormat: v => v.toExponential(1) }));
        r1.el.querySelector(".label").textContent = "Steady excess Δp = G τ"; r1.set(`${(G * tau).toExponential(2)} cm⁻³`);
        r2.el.querySelector(".label").textContent = "Down to 1/e after"; r2.set(si(tau, "s"), "", "the lifetime");
      } else {
        const xs = Array.from({ length: 301 }, (_, k) => k * W / 300);
        box.replaceChildren(lineChart({ label: "Excess holes injected at x = 0, decaying into a sample of length W",
          lines: [{ x: xs.map(x => x * 10), y: xs.map(x => injected(x, 1, L, W)), name: "length W" }, { x: xs.map(x => x * 10), y: xs.map(x => injected(x, 1, L)), name: "very long", cls: "second" }],
          xLabel: "Position x [mm]", yLabel: "Excess Δp / Δp(0) [1]", yMin: 0, yMax: 1, xFormat: v => v.toFixed(1) }));
        r1.el.querySelector(".label").textContent = "Diffusion length L = √(Dp τ)"; r1.set(si(L / 100, "m"));
        r2.el.querySelector(".label").textContent = "Sample against L"; r2.set(`W/L = ${(W / L).toFixed(2)}`, "", W < L ? "short: the profile is nearly a straight line (3.4.38)" : "long: the profile is e^(−x/L) (3.4.35)");
      }
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Show", [["time", "In time: light on, light off"], ["space", "In space: injected at one end"]], view, v => { view = v; update(); }),
      slider({ label: "Lifetime τ", unit: "µs", min: 0.1, max: 100, value: 10, log: true, format: v => `${v} µs`, onInput: v => { tau = v * 1e-6; update(); } }),
      slider({ label: "Generation rate G", unit: "cm⁻³ s⁻¹", min: 1e18, max: 1e22, value: G, log: true, format: v => `${v.toExponential(1)} cm⁻³ s⁻¹`, onInput: v => { G = v; update(); } }),
      slider({ label: "Sample length W", unit: "mm", min: 0.05, max: 5, value: 1, log: true, format: v => `${v} mm`, onInput: v => { W = v / 10; update(); } }),
      r1.el, r2.el,
      h("p", { class: "hint" }, "Holes as minority carriers in n-silicon. A longer lifetime stores more carriers under the same light and lets them diffuse further. A sample much shorter than L loses almost none to recombination: this is the thin base of a bipolar transistor."))));
    update();
  },
};
