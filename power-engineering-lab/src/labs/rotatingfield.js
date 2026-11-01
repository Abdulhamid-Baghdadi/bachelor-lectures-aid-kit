// The rotating field from three windings (Schrödl 2012, Drehstromwicklungen and the space-vector chapter): three
// pulsating currents, each along its winding's axis, add up to one vector of constant length that turns with ωt.
// Weaken one phase and the tip runs on an ellipse; swap two and it turns the other way.
import { phaseCurrents, spaceVector, syncSpeed, polar, cAbs, arg } from "../core/index.js";
import { h, slider, choice, readout } from "../../../kit/ui/kit.js";
import { plane } from "./plane.js";
import * as a from "../../../kit/ui/art.js";

const AXES = [0, 120, 240].map((d, k) => ({ z: polar(1.25, d), name: "uvw"[k] }));

export default {
  id: "rotatingfield",
  art: () => a.picture("A circle with three winding axes and one arrow turning on it",
    a.circle(100, 75, 55, a.DIM, 2) + [0, 120, 240].map(d => a.line([[100, 75], [100 + 62 * Math.cos(d * Math.PI / 180), 75 - 62 * Math.sin(d * Math.PI / 180)]], a.DIM, 2)).join("") +
      a.arrow(100, 75, 139, 36, a.ACC, 3) + a.path("M155 75 A55 55 0 0 0 139 36", a.ACC, 2, "4 4")),
  mount(root) {
    let wt = 30, aw = 1, swap = false, p = 2;
    const box = h("div", { class: "pair" }), rL = readout("Length of the space vector"), rA = readout("Its angle"), rS = readout("Synchronous speed");
    const update = () => {
      const amps = [1, 1, aw], now = phaseCurrents(wt * Math.PI / 180, amps, swap), i = spaceVector(...now);
      const locus = Array.from({ length: 121 }, (_, k) => spaceVector(...phaseCurrents(k * Math.PI / 60, amps, swap)));
      const parts = now.map((ik, k) => ({ z: polar(2 / 3 * ik, k * 120), cls: "faint", name: k ? null : "⅔ i_k along each winding axis" }));
      box.replaceChildren(
        plane({ label: `Space vector of the stator current at ωt = ${wt}°`, xLabel: "Real axis, winding u [1]", yLabel: "Imaginary axis [1]", r: 1.5,
          axes: AXES, paths: [{ pts: locus, cls: "faint" }],
          arrows: [...parts, { z: i, name: "space vector i_s", cls: "a" }] }),
        plane({ label: "Phase currents as rotating time phasors projected on the real axis", xLabel: "Real part, the phase current now [1]", yLabel: "Imaginary part [1]", r: 1.5,
          arrows: now.map((_, k) => ({ z: polar(amps[k], wt - (swap ? -1 : 1) * k * 120), name: `i_${"uvw"[k]}`, cls: ["a", "s", "e"][k] })) }));
      const lengths = locus.map(cAbs);
      rL.set(cAbs(i).toFixed(3), Math.max(...lengths) - Math.min(...lengths) > 0.01 ? "warn" : "", Math.max(...lengths) - Math.min(...lengths) > 0.01
        ? `varies from ${Math.min(...lengths).toFixed(2)} to ${Math.max(...lengths).toFixed(2)}: an elliptic field` : "constant: a circular rotating field");
      rA.set(`${((arg(i) + 360) % 360).toFixed(0)}°`, "", swap ? "turns against ωt: the field reverses" : "follows ωt, at the supply's frequency");
      rS.set(`${syncSpeed(50, p)} min⁻¹`, "", `n = 60 f/p at 50 Hz with p = ${p} pole pairs (4-94)`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Time, as the angle ωt", unit: "°", min: 0, max: 360, value: wt, step: 5, format: v => `${v}°`, onInput: v => { wt = v; update(); } }),
      slider({ label: "Amplitude of phase w, share of the others", unit: "", min: 0, max: 1, value: aw, step: 0.05, format: v => v.toFixed(2), onInput: v => { aw = v; update(); } }),
      choice("Phase order", [["uvw", "u, v, w"], ["uwv", "u, w, v (two swapped)"]], "uvw", v => { swap = v === "uwv"; update(); }),
      choice("Pole pairs p", [["1", "1"], ["2", "2"], ["3", "3"], ["8", "8"]], "2", v => { p = Number(v); update(); }),
      rL.el, rA.el, rS.el,
      h("p", { class: "hint" }, "Each winding alone sets up a field that only pulses along its own axis. With the factor 2/3, a balanced set's space vector has the length of one phase's peak (M.9); the three fields together are 3/2 as strong as one (M.7). At 50 Hz with 8 pole pairs the field turns at 375 min⁻¹, as in the notes' hydro generator (p. 118). An induction motor's rotor lags behind it by the slip, s = (n_s − n)/n_s (4-95)."))));
    update();
  },
};
