// The separately excited DC motor of section 1.4 with its excitation held constant (kΨF = K): (1.25a) and (1.25d)
// give the armature current and speed after the armature voltage and the load torque m g r are switched on.
import { dcMotorRhs, dcMotorRest, simulate, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

// Example values, not from the notes: a small motor, its drum and load lumped into J.
const P = { RA: 1, LA: 0.01, K: 0.1, J: 2e-4 };

export default {
  id: "dcmotor",
  art: () => a.picture("A DC motor turning a cable drum that lifts a hanging load",
    a.circle(60, 70, 30) + a.text(60, 76, "M", 18) + a.line([[90, 70], [120, 70]]) + a.circle(140, 70, 20, a.ACC, 3) +
      a.line([[160, 70], [160, 115]], a.INK, 2) + a.rect(148, 115, 24, 20, a.INK, 3) + a.arrow(60, 30, 85, 38, a.ACC, 2)),
  mount(root) {
    let uA = 12, ML = 0.05;
    const chartBox = h("div", {});
    const rW = readout("Speed at rest ω = (uA − RA·ML/K)/K"), rI = readout("Armature current at rest iA = ML/K");
    const update = () => {
      const run = simulate(dcMotorRhs(P, uA, ML), [0, 0], 0.2, 400);
      chartBox.replaceChildren(lineChart({ label: "Speed and armature current of the motor after switching on",
        lines: [{ x: run.t.map(t => t * 1000), y: run.x.map(x => x[1]), name: "ω [rad/s]" },
                { x: run.t.map(t => t * 1000), y: run.x.map(x => x[0] * 10), name: "10·iA [A]", cls: "second" }],
        xLabel: "Time t [ms]", yLabel: "Speed ω [rad/s], 10·iA [A]" }));
      const rest = dcMotorRest(P, uA, ML);
      rW.set(si(rest.w, "rad/s"), rest.w < 0 ? "warn" : "", rest.w < 0 ? "the load wins: the drum turns backwards" : "");
      rI.set(si(rest.iA, "A"));
    };
    root.append(h("div", { class: "stage" }, chartBox, h("div", { class: "controls" },
      slider({ label: "Armature voltage uA", unit: "V", min: 0, max: 24, value: uA, step: 0.5, onInput: v => { uA = v; update(); } }),
      slider({ label: "Load torque ML = m g r", unit: "N·m", min: 0, max: 0.3, value: ML, step: 0.01, onInput: v => { ML = v; update(); } }),
      rW.el, rI.el,
      h("p", { class: "hint" }, "The voltage sets the speed, the load sets the current: at rest the motor's torque K·iA equals the load, and the induced voltage K·ω takes what RA·iA leaves of uA. Example motor: RA = 1 Ω, LA = 10 mH, K = 0.1 V·s, J = 0.2 g·m²."))));
    update();
  },
};
