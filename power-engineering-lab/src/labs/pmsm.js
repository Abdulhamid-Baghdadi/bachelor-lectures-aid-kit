// The permanent-magnet synchronous machine's space-vector diagram (Schrödl 2012, pp. 218–232), in rotor coordinates
// and per unit: the magnet's flux linkage ψ_M on the d axis, the stator current i_s, the stator flux linkage
// ψ_s = l_s i_s + ψ_M and the voltage u_s = r_s i_s + jω ψ_s. Only the q component of the current makes torque.
import { pmsm, toStator, phaseValues, C, cAbs, scale } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { plane } from "./plane.js";
import * as a from "../../../kit/ui/art.js";

const RS = 0.03, LS = 0.4; // example values per unit, not from a named machine

export default {
  id: "pmsm",
  art: () => a.picture("A magnet arrow and a current arrow at right angles, a parallelogram between them",
    a.arrow(40, 110, 140, 110, a.INK, 3) + a.arrow(40, 110, 40, 30, a.ACC, 3) + a.line([[140, 110], [140, 30], [40, 30]], a.DIM, 2, "5 5")),
  mount(root) {
    let m = 0.8, w = 0.9, id = 0, gamma = 0;
    const box = h("div", {}), rU = readout("Stator voltage |u_s|"), rI = readout("Stator current |i_s|"), rM = readout("Torque"), rP = readout("Phase currents now");
    const update = () => {
      const r = pmsm({ id, iq: m, w, rs: RS, ls: LS });
      box.replaceChildren(plane({ label: `Space vectors in rotor coordinates for torque ${m}, speed ${w}, i_d = ${id}`, xLabel: "d axis, along the magnet [p.u.]", yLabel: "q axis [p.u.]", r: 1.5,
        arrows: [{ z: C(1), name: "magnet ψ_M", cls: "faint" }, { z: r.is, name: "current i_s", cls: "s" }, { z: scale(r.is, LS), from: C(1), name: "l_s i_s", cls: "e" },
                 { z: r.psiS, name: "stator flux ψ_s", cls: "a thin" }, { z: r.us, name: "voltage u_s", cls: "a" }] }));
      const us = cAbs(r.us), ph = phaseValues(toStator(r.is, gamma));
      rU.set(us.toFixed(3), us > 1 ? "warn" : "", us > 1 ? "above the reference voltage: weaken the field with a negative i_d" : "within the reference voltage 1");
      rI.set(cAbs(r.is).toFixed(3), cAbs(r.is) > 1 ? "warn" : "", id ? "i_d adds current, no torque: copper losses for less voltage" : "i_d = 0: the least current for this torque (p. 226)");
      rM.set(r.torqueP8.toFixed(3), "", `i_q |ψ_M| (P.8) = −Im(i_s* ψ_s) = ${r.torqueP4.toFixed(3)} (P.4)`);
      rP.set(ph.map(v => v.toFixed(3)).join(", "), "", `i_u, i_v, i_w at rotor angle γ_m = ${gamma}°: Re{i_s e^(jγ_m) e^(−jk·120°)}`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Torque m", unit: "p.u.", min: -1, max: 1, value: m, step: 0.05, format: v => v.toFixed(2), onInput: v => { m = v; update(); } }),
      slider({ label: "Speed ω", unit: "p.u.", min: 0, max: 1.6, value: w, step: 0.05, format: v => v.toFixed(2), onInput: v => { w = v; update(); } }),
      slider({ label: "Current along the magnet i_d", unit: "p.u.", min: -1, max: 0.5, value: id, step: 0.05, format: v => v.toFixed(2), onInput: v => { id = v; update(); } }),
      slider({ label: "Rotor angle γ_m", unit: "°", min: -180, max: 180, value: gamma, step: 5, format: v => `${v}°`, onInput: v => { gamma = v; update(); } }),
      rU.el, rI.el, rM.el, rP.el,
      h("p", { class: "hint" }, "r_s = 0.03 and l_s = 0.4 are example values. In rotor coordinates the steady state has dψ/dτ = 0, so u_s = r_s i_s + jω ψ_s (P.1). The d component of the current leaves the torque alone (P.8) but turns ψ_s and shortens u_s: little field weakening, since l_s is small (p. 226). Set γ_m = −15° and torque 1 for the exam of 24 June 2013: i_u = 0.259, i_v = 0.707, i_w = −0.966."))));
    update();
  },
};
