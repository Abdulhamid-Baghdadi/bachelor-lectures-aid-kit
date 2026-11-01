// Thermal and shot noise (Zimmermann 2010, sections 6.2–6.3): every resistor's electrons jitter, v² = 4 kT R Δf; every
// current that crosses a barrier comes in charges, i² = 2 q I Δf. Both are white and Gaussian; the trace here is seeded,
// so it is the same at every visit.
import { thermalNoise, shotNoise, gaussian, Q, K, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const SHOT = gaussian(2015, 200), HEAT = gaussian(2010, 200);

export default {
  id: "noise",
  art: () => a.picture("A jagged noise trace beside a resistor",
    a.resistor(35, 75) + a.line([[60, 75], [185, 75]], a.DIM, 2) +
      a.line(Array.from({ length: 25 }, (_, k) => [65 + k * 5, 75 + 30 * Math.sin(k * 2.3) * Math.cos(k * 1.7)]), a.ACC, 2)),
  mount(root) {
    let R = 1e3, I = 1e-3, T = 300, B = 1e6;
    const box = h("div", {}), rV = readout("Thermal noise of R, RMS"), rI = readout("Shot noise of I, RMS"), rX = readout("Thermal current noise of R");
    const update = () => {
      const iT = thermalNoise(R, T, B) / R, iS = shotNoise(I, B), ks = SHOT.map((_, k) => k);
      box.replaceChildren(lineChart({ label: "Seeded traces of the two noise currents, each scaled to its RMS",
        lines: [{ x: ks, y: SHOT.map(g => g * iS * 1e9), name: "shot" }, { x: ks, y: HEAT.map(g => g * iT * 1e9), name: "thermal", cls: "second" }],
        xLabel: "Sample [1]", yLabel: "Noise current [nA]", xFormat: v => v.toFixed(0) }));
      const equal = 2 * K * T / Q;
      rV.set(si(thermalNoise(R, T, B), "V"), "", "√(4 kT R Δf)"); rI.set(si(iS, "A"), "", "√(2 q I Δf)");
      rX.set(si(iT, "A"), "", I * R > equal ? `I R > 2kT/q = ${si(equal, "V")}: shot noise dominates` : `I R < 2kT/q = ${si(equal, "V")}: thermal noise dominates`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Resistance R", unit: "Ω", min: 10, max: 1e6, value: R, log: true, format: v => si(v, "Ω"), onInput: v => { R = v; update(); } }),
      slider({ label: "Current I", unit: "A", min: 1e-7, max: 1e-2, value: I, log: true, format: v => si(v, "A"), onInput: v => { I = v; update(); } }),
      slider({ label: "Bandwidth Δf", unit: "Hz", min: 1, max: 1e8, value: B, log: true, format: v => si(v, "Hz"), onInput: v => { B = v; update(); } }),
      slider({ label: "Temperature T", unit: "K", min: 4, max: 400, value: T, step: 1, format: v => `${v} K`, onInput: v => { T = v; update(); } }),
      rV.el, rI.el, rX.el,
      h("p", { class: "hint" }, "Seeded Gaussian samples, scaled to each RMS. Both grow as √Δf: quarter the bandwidth and the noise halves. The thermal current noise 4kT/R and the shot noise 2qI are equal where the voltage I R is 2kT/q, about 52 mV. 1/f and popcorn noise (sections 6.4–6.6) are left out."))));
    update();
  },
};
