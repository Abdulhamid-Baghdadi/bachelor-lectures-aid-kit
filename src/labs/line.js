// Waves on a two-wire line (Prechtl 2010, section 5.3): the voltage amplitude along a line of length l with load Z_A,
// from (5.121), with γ = √(Y′Z′) (5.116) and the wave impedance Z_W = √(Z′/Y′) (5.117). Matched, the wave runs into the
// load; open or shorted, it comes back and stands.
import { line, si } from "../core/index.js";
import { h, slider, readout, choice } from "../ui/kit.js";
import { lineChart } from "../ui/chart.js";
import * as a from "../ui/art.js";

export default {
  id: "line",
  art: () => a.picture("A two-wire line ending in a load, with a standing wave drawn above it",
    a.line([[20, 100], [160, 100]], a.INK, 3) + a.line([[20, 125], [160, 125]], a.INK, 3) + a.resistor(170, 112, true) +
      a.path("M20 70 C40 30 60 30 80 70 C100 30 120 30 140 70 C150 50 155 45 160 50", a.ACC, 3)),
  mount(root) {
    let load = "matched", Rload = 150, f = 100e6, loss = 0;
    const L = 250e-9, Cp = 100e-12, l = 3;
    const chartBox = h("div", {});
    const rZ = readout("Wave impedance Z_W"), rG = readout("Reflection factor at the load |r|"), rL = readout("Wavelength on the line λ");
    const update = () => {
      const ZA = { matched: [50, 0], open: [1e12, 0], short: [0, 0], resistor: [Rload, 0] }[load];
      const ln = line({ R: loss, L, G: 0, Cp, f, l, ZA });
      const zs = Array.from({ length: 241 }, (_, k) => k * l / 240);
      chartBox.replaceChildren(lineChart({ label: "Voltage amplitude along the line, as a share of the amplitude at the source",
        lines: [{ x: zs, y: zs.map(z => ln.U(z)), name: "|U(z)| / |U(0)|" }],
        xLabel: "Position along the line z [m]", yLabel: "Voltage amplitude |U| / |U(0)| [1]", yMin: 0, xFormat: v => v.toFixed(1) }));
      rZ.set(si(Math.hypot(...ln.ZW), "Ω")); rG.set(Math.hypot(...ln.reflection).toFixed(3)); rL.set(si(ln.lambda, "m"));
    };
    const rs = slider({ label: "Load resistance", unit: "Ω", min: 1, max: 1000, value: Rload, log: true, onInput: v => { Rload = v; load = "resistor"; update(); } });
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      choice("Load at the end", [["matched", "Matched, 50 Ω"], ["open", "Open"], ["short", "Shorted"], ["resistor", "Resistor"]], load, v => { load = v; update(); }),
      rs,
      slider({ label: "Frequency f", unit: "Hz", min: 10e6, max: 300e6, value: f, log: true, onInput: v => { f = v; update(); } }),
      slider({ label: "Resistance per length R′", unit: "Ω/m", min: 0, max: 20, value: loss, step: 0.5, onInput: v => { loss = v; update(); } }),
      rZ.el, rG.el, rL.el,
      h("p", { class: "hint" }, "A 3 m line with L′ = 250 nH/m and C′ = 100 pF/m, so Z_W = 50 Ω. Matched, the amplitude is flat (or falls steadily with losses). Open or shorted, all is reflected and the wave stands, with nodes half a wavelength apart. Shorted at a quarter wavelength from the source, the line looks open."))));
    update();
  },
};
