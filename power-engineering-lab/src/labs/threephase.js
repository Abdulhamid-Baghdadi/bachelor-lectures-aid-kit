// Star and delta (Gawlik 2015, section 3.2; slides V05+06): one balanced load on the 0.4 kV network, connected in star
// or in delta. The voltages' phasors on the left, the currents' on the right; the readouts name line and branch values.
import { balancedLoad, polar, cAbs, arg, si } from "../core/index.js";
import { h, slider, choice, readout } from "../../../kit/ui/kit.js";
import { plane } from "./plane.js";
import * as a from "../../../kit/ui/art.js";

const UL = 400;

export default {
  id: "threephase",
  art: () => a.picture("Three arrows 120 degrees apart, and the arrow between two tips",
    a.arrow(100, 80, 160, 80, a.INK) + a.arrow(100, 80, 70, 28, a.INK) + a.arrow(100, 80, 70, 132, a.INK) + a.line([[160, 80], [72, 30]], a.ACC, 3, "6 5")),
  mount(root) {
    let connection = "star", z = 20, phi = 30;
    const box = h("div", { class: "pair" }), rU = readout("Voltage across a branch"), rI = readout("Current in a branch"),
      rL = readout("Line current"), rP = readout("Power taken");
    const update = () => {
      const r = balancedLoad(UL, polar(z, phi), connection);
      box.replaceChildren(
        plane({ label: `Voltage phasors of the 0.4 kV network, the load in ${connection}`, xLabel: "Real part [V]", yLabel: "Imaginary part [V]", r: 450,
          arrows: [...r.U.map((u, k) => ({ z: u, name: k ? null : "line to neutral U_a, U_b, U_c", cls: "faint" })),
                   { z: r.UL[0], from: r.U[1], name: "line to line U_ab = U_a − U_b", cls: "a" },
                   ...r.UL.slice(1).map((u, k) => ({ z: u, from: r.U[(k + 2) % 3], cls: "a thin" }))] }),
        plane({ label: `Current phasors: line currents and the branch current, ${connection}`, xLabel: "Real part [A]", yLabel: "Imaginary part [A]", r: Math.ceil(cAbs(r.lineI[0]) / 10) * 10 + 10,
          arrows: [...r.lineI.map((i, k) => ({ z: i, name: k ? null : "line currents I_a, I_b, I_c", cls: "a" })),
                   { z: r.branchI[0], name: connection === "star" ? "branch current = I_a" : "branch current I_ab", cls: "s" }] }));
      rU.set(si(cAbs(r.branchU[0]), "V"), "", connection === "star" ? "U_L/√3, line to neutral" : "the full line voltage");
      rI.set(si(cAbs(r.branchI[0]), "A"), "", `|U| / |Z| at ${phi}° behind its voltage`);
      rL.set(si(cAbs(r.lineI[0]), "A"), "", connection === "star" ? "the branch current itself" : `√3 × branch current, ${(arg(r.branchI[0]) - arg(r.lineI[0])).toFixed(0)}° behind it`);
      rP.set(`${si(r.S[0], "W")}, ${si(r.S[1], "var")}`, "", `P = √3 U_L I_L cos φ; in ${connection === "star" ? "delta" : "star"} it would be ${connection === "star" ? "three times as much" : "a third"}`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Connection of the load", [["star", "Star (Y)"], ["delta", "Delta (Δ)"]], connection, v => { connection = v; update(); }),
      slider({ label: "Impedance of a branch |Z|", unit: "Ω", min: 5, max: 60, value: z, step: 1, format: v => `${v} Ω`, onInput: v => { z = v; update(); } }),
      slider({ label: "Load angle φ", unit: "°", min: -80, max: 80, value: phi, step: 1, format: v => `${v}°`, onInput: v => { phi = v; update(); } }),
      rU.el, rI.el, rL.el, rP.el,
      h("p", { class: "hint" }, "The 0.4 kV network: 230 V line to neutral, 400 V line to line (table 3-2). The line voltages are the differences of the line-to-neutral ones, √3 times as long and 30° ahead. A positive φ is an inductive load: the current lags. Phasor arithmetic itself, and impedances of R, L and C, are in the Automation lab."))));
    update();
  },
};
