// Drift and diffusion together: the Shockley–Haynes experiment (Strasser 2015, sections 3.4.1–3.4.5). A pulse of holes
// injected into n-silicon drifts at µp E, spreads with Dp = UT µp and shrinks with the lifetime τ; its peak position
// gives the mobility, its width the diffusion constant.
import { haynes, diffusivity, SI, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import { clock } from "../../../kit/ui/field.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "drift",
  art: () => a.picture("A narrow pulse of carriers drifting right and spreading into a wider, lower bump",
    a.line([[15, 125], [185, 125]], a.DIM, 2) + a.path("M25 125 C38 125 40 35 45 35 C50 35 52 125 65 125", a.INK, 3) +
      a.path("M90 125 C115 125 120 80 135 80 C150 80 155 125 180 125", a.ACC, 3) + a.arrow(70, 50, 120, 50, a.COOL, 2)),
  mount(root) {
    let E = 10, tau = 200e-6, t = 40e-6, follow = true;
    const box = h("div", {}), rX = readout("Peak at"), rW = readout("Width (one standard deviation)"), rA = readout("Holes left");
    let ts = null;
    const draw = time => {
      if (follow && time !== undefined) { t = ((time * 25e-6) % 130e-6) + 20e-6; ts?.set(Math.round(t * 1e6)); }
      const prm = { N: 1, mu: SI.mup, E, D: diffusivity(SI.mup), tau }, xs = Array.from({ length: 401 }, (_, k) => -0.05 + k * 0.85 / 400);
      const ref = haynes(SI.mup * E * 20e-6, 20e-6, prm);
      box.replaceChildren(lineChart({ label: "Excess hole density along the bar at the time chosen",
        lines: [{ x: xs.map(x => x * 10), y: xs.map(x => haynes(x, t, prm) / ref), name: "Δp now" }, { x: xs.map(x => x * 10), y: xs.map(x => haynes(x, 20e-6, prm) / ref), name: "at 20 µs", cls: "faint" }],
        xLabel: "Position x [mm]", yLabel: "Excess density Δp / peak at 20 µs [1]", yMin: 0, yMax: 1.05, xFormat: v => v.toFixed(1) }));
      rX.set(si(SI.mup * E * t / 100, "m"), "", "µp E t"); rW.set(si(Math.sqrt(2 * prm.D * t) / 100, "m"), "", "√(2 Dp t)");
      rA.set(`${(Math.exp(-t / tau) * 100).toFixed(0)} %`, "", "e^(−t/τ)");
    };
    const c = clock(draw, { label: "Run" });
    ts = slider({ label: "Time after injection t", unit: "µs", min: 20, max: 150, value: 40, step: 1, format: v => `${Math.round(v)} µs`, onInput: v => { t = v * 1e-6; follow = false; c.draw(); } });
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      c.el, ts,
      slider({ label: "Field E", unit: "V/cm", min: 0, max: 30, value: E, step: 0.5, format: v => `${v} V/cm`, onInput: v => { E = v; c.draw(); } }),
      slider({ label: "Lifetime τ", unit: "µs", min: 5, max: 500, value: 200, log: true, format: v => `${v} µs`, onInput: v => { tau = v * 1e-6; c.draw(); } }),
      rX.el, rW.el, rA.el,
      h("p", { class: "hint" }, `Holes in silicon, µp = ${SI.mup} cm²/(V s), Dp = UT µp at 300 K. Set E to zero: the pulse only spreads and fades. The drift moves it as a whole; diffusion widens it as √t, recombination takes away its area.`))));
    c.el.addEventListener("click", () => { follow = true; });
  },
};
