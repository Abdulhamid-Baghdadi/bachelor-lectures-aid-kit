// The transformer's equivalent circuit and its voltage change under load (Gawlik 2015, section 4.2.3; slides V11+12):
// u_k and u_r from the short-circuit test give the series impedance; the secondary voltage then follows the load's size
// and power factor. Typical values from table 4-9.
import { receivingVoltage, uSigma, transformerLosses } from "../core/index.js";
import { h, slider, choice, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

// Table 4-9: S_rT → i0, p_v, u_k, u_r. Where the table gives a range of u_k, its middle is taken.
const TYPES = { "0.1": [0.015, 0.0025, 0.04, 0.013], "1": [0.0075, 0.0012, 0.06, 0.007], "10": [0.005, 0.0008, 0.085, 0.005],
  "100": [0.0025, 0.0005, 0.10, 0.0035], "1000": [0.0015, 0.0002, 0.125, 0.0015] };

export default {
  id: "transformer",
  art: () => a.picture("Two coils on an iron core, a resistor and an inductor in series",
    a.rect(55, 30, 90, 90, a.DIM, 3) + [0, 1, 2, 3].map(k => a.circle(55, 50 + k * 15, 7, a.INK, 3) + a.circle(145, 50 + k * 15, 7, a.INK, 3)).join("") +
      a.line([[10, 50], [48, 50]], a.INK, 2) + a.line([[152, 50], [190, 50]], a.ACC, 3) + a.resistor(172, 50, false, a.ACC)),
  mount(root) {
    let type = "1", load = 1, phi = 37;
    const box = h("div", {}), rU = readout("Secondary voltage"), rD = readout("Voltage change"), rZ = readout("Short-circuit impedance"), rE = readout("Efficiency");
    const update = () => {
      const [i0, pv, uk, ur] = TYPES[type], x = uSigma(uk, ur), c = Math.cos(phi * Math.PI / 180), sn = Math.sin(phi * Math.PI / 180);
      const ss = Array.from({ length: 61 }, (_, k) => k * 0.02), curve = f => ss.map(s => receivingVoltage(1, ur, x, s * Math.cos(f), s * Math.sin(f)));
      box.replaceChildren(lineChart({ label: `Secondary voltage against load for a ${type} MVA transformer`,
        lines: [{ x: ss, y: curve(phi * Math.PI / 180), name: "your load" },
                { x: ss, y: curve(0), name: "cos φ = 1", cls: "faint" }, { x: ss, y: curve(-Math.PI / 6), name: "capacitive 30°", cls: "second" }],
        marks: [{ x: load, y: receivingVoltage(1, ur, x, load * c, load * sn), shape: "dot" }],
        xLabel: "Load S/S_rT [1]", yLabel: "Secondary voltage U₂/U_r [1]", xMin: 0, xMax: 1.2, yMin: 0.86, yMax: 1.04, xFormat: v => v.toFixed(1), yFormat: v => v.toFixed(2) }));
      const U2 = receivingVoltage(1, ur, x, load * c, load * sn), losses = transformerLosses(pv, ur, load);
      rU.set(`${U2.toFixed(4)} U_r`, "", "primary held at its rated voltage");
      rD.set(`${(100 * (1 - U2)).toFixed(2)} %`, U2 < 0.95 ? "warn" : "", `u_r cos φ + u_σ sin φ ≈ ${(100 * load * (ur * c + x * sn)).toFixed(2)} % (first-order estimate)`);
      rZ.set(`u_k = ${(100 * uk).toFixed(1)} %`, "", `u_r = ${(100 * ur).toFixed(2)} %, u_σ = √(u_k² − u_r²) = ${(100 * x).toFixed(2)} % (4-82); i₀ = ${(100 * i0).toFixed(2)} %`);
      rE.set(load * c > 0 ? `${(100 * load * c / (load * c + losses)).toFixed(2)} %` : "—", "", `iron p_v = ${(100 * pv).toFixed(2)} %, copper u_r s² = ${(100 * ur * load * load).toFixed(2)} % of S_rT`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Rated power S_rT", [["0.1", "100 kVA"], ["1", "1 MVA"], ["10", "10 MVA"], ["100", "100 MVA"], ["1000", "1000 MVA"]], type, v => { type = v; update(); }),
      slider({ label: "Load S/S_rT", unit: "", min: 0, max: 1.2, value: load, step: 0.02, format: v => v.toFixed(2), onInput: v => { load = v; update(); } }),
      slider({ label: "Load angle φ (positive: inductive)", unit: "°", min: -60, max: 60, value: phi, step: 1, format: v => `${v}°`, onInput: v => { phi = v; update(); } }),
      rU.el, rD.el, rZ.el, rE.el,
      h("p", { class: "hint" }, "The short-circuit test drives rated current through the shorted transformer: its voltage, u_k, is the series impedance per unit, its losses P_k give u_r (4-77 to 4-81). The open-circuit test gives the iron losses and the magnetising current (4-75, 4-76), small enough to leave out here. Large transformers are almost purely inductive (u_σ ≈ u_k, 4-83): their voltage drops with an inductive load and rises with a capacitive one."))));
    update();
  },
};
