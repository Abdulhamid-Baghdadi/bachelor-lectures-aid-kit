// The separately excited DC machine's speed–torque lines (Schrödl 2012, pp. 115–137): the machine of the exam of
// 24 July 2013, I_N = 200 A, kΦ_N = 15 V·s, R_A = 50 mΩ. The armature voltage shifts the line up and down; weakening
// the field raises the no-load speed and steepens the line, while the torque at rated current falls with the flux.
import { dcSpeed, dcTorque, dcSlope } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const K = 15, RA = 0.05, IN = 200, MN = dcTorque(K, 1, IN);

export default {
  id: "dcmachine",
  art: () => a.picture("A family of falling straight lines, one steeper and higher",
    a.line([[20, 130], [180, 130]], a.DIM, 2) + a.line([[30, 20], [30, 135]], a.DIM, 2) +
      a.line([[30, 70], [180, 80]], a.INK, 3) + a.line([[30, 100], [180, 110]], a.DIM, 2) + a.line([[30, 35], [180, 75]], a.ACC, 3)),
  mount(root) {
    let UA = 500, phi = 1;
    const box = h("div", {}), rN = readout("No-load speed"), rD = readout("Speed drop"), rM = readout("Torque at rated current"), rP = readout("Power at rated current");
    const update = () => {
      const ms = [-MN, MN], line = (u, f) => ms.map(m => dcSpeed(u, RA, K, f, m));
      box.replaceChildren(lineChart({ label: `Speed against torque at ${UA} V and ${Math.round(phi * 100)} % field`,
        lines: [{ x: ms, y: line(500, 1), name: "rated", cls: "faint" }, { x: ms, y: line(UA, 1), name: "full field", cls: "second" },
                { x: ms, y: line(UA, phi), name: `${Math.round(phi * 100)} % field` }],
        marks: [{ x: dcTorque(K, phi, IN), y: dcSpeed(UA, RA, K, phi, dcTorque(K, phi, IN)), shape: "dot" }],
        xLabel: "Internal torque M_i [N·m]", yLabel: "Speed n [1/min]", xMin: -MN, xMax: MN, yMin: -6500, yMax: 6500, xFormat: v => v.toFixed(0), yFormat: v => v.toFixed(0) }));
      const M = dcTorque(K, phi, IN), n = dcSpeed(UA, RA, K, phi, M);
      rN.set(`${dcSpeed(UA, RA, K, phi, 0).toFixed(0)} min⁻¹`, "", "n₀ = U_A/(kΦ), in proportion to U_A and to 1/Φ (G.49)");
      rD.set(`${dcSlope(RA, K, phi).toFixed(4)} min⁻¹ per N·m`, "", `R_A · 2π · 60/(kΦ)²: ${(1 / phi ** 2).toFixed(1)} × the full-field slope`);
      rM.set(`${M.toFixed(1)} N·m`, phi < 1 ? "warn" : "", `M_i = kΦ I/(2π) (G.34); rated ${MN.toFixed(1)} N·m`);
      rP.set(`${(M * 2 * Math.PI * n / 60 / 1e3).toFixed(1)} kW`, "", "M · 2πn: with field weakening the power stays, the torque falls");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Armature voltage U_A", unit: "V", min: -500, max: 500, value: UA, step: 10, format: v => `${v} V`, onInput: v => { UA = v; update(); } }),
      slider({ label: "Field, share of rated flux Φ/Φ_N", unit: "", min: 0.33, max: 1, value: phi, step: 0.01, format: v => v.toFixed(2), onInput: v => { phi = v; update(); } }),
      rN.el, rD.el, rM.el, rP.el,
      h("p", { class: "hint" }, "U_i = kΦ n with k = z p/a (G.30); U_A = J R_A + kΦ n in the steady state (G.38 with dJ/dt = 0, G.46). Below rated speed the armature voltage sets the speed at constant torque; above it the field is weakened at constant power (p. 137). A negative torque is braking: the machine runs as a generator and the speed rises a little. The machine's transfer function and its control loop are in the Automation lab."))));
    update();
  },
};
