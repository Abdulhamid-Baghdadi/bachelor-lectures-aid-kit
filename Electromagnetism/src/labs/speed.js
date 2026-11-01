// The wave equation's speed, c = 1/√(με) (5.19), and in vacuum the Maxwell relation μ0 ε0 c0² = 1 (2.25): a pulse
// racing through vacuum and through a medium side by side.
import { waveSpeed, C0, si } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import { clock } from "../../../kit/ui/field.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "speed",
  art: () => a.picture("Two pulses on two tracks, the one in a medium falling behind",
    a.line([[20, 50], [180, 50]], a.DIM, 2) + a.line([[20, 110], [180, 110]], a.DIM, 2) + a.rect(20, 92, 160, 36, a.COOL, 2) +
      a.path("M120 50 C130 50 135 22 140 22 C145 22 150 50 160 50", a.ACC, 3) + a.path("M60 110 C70 110 75 82 80 82 C85 82 90 110 100 110", a.ACC, 3)),
  mount(root) {
    let epsr = 4, mur = 1;
    const W = 460;
    const pic = s("svg", { viewBox: `0 0 ${W} 200`, class: "schematic", role: "img", "aria-label": "Two pulses: one in vacuum, one in a medium; the one in the medium is slower" });
    const rc = readout("Speed in the medium c = 1/√(με)"), rn = readout("Refractive index n = c0 / c");
    const draw = t => {
      const c = waveSpeed(epsr, mur), ratio = c / C0;
      const pulse = (pos, y) => {
        const pts = [];
        for (let x = 20; x <= W - 20; x += 4) pts.push(`${x},${(y - 34 * Math.exp(-(((x - pos) / 14) ** 2))).toFixed(1)}`);
        return s("polyline", { points: pts.join(" "), class: "pulse", fill: "none" });
      };
      const span = W - 60, run = (t * 0.5) % 1.2; // the vacuum pulse crosses in 2 s
      const at = k => 30 + Math.min(1, run * k) * span;
      pic.replaceChildren(s("rect", { x: 20, y: 118, width: W - 40, height: 56, class: "medium" }),
        s("text", { x: 24, y: 30, class: "tick" }, "vacuum, c0 = 299 792 458 m/s"), s("text", { x: 24, y: 192, class: "tick" }, `medium, εr = ${epsr}, μr = ${mur}`),
        pulse(at(1), 90), pulse(at(ratio), 170));
      rc.set(si(c, "m/s")); rn.set((1 / ratio).toFixed(3));
    };
    const ck = clock(draw);
    root.append(h("div", { class: "stage" }, pic, h("div", { class: "controls" },
      slider({ label: "Permittivity number εr", unit: "", min: 1, max: 81, value: epsr, step: 0.5, format: v => v.toFixed(1), onInput: v => { epsr = v; ck.draw(); } }),
      slider({ label: "Permeability number μr", unit: "", min: 1, max: 10, value: mur, step: 0.1, format: v => v.toFixed(1), onInput: v => { mur = v; ck.draw(); } }),
      ck.el, rc.el, rn.el,
      h("p", { class: "hint" }, "Nothing in the formula is about light: it falls out of Maxwell's equations as the speed of any electromagnetic wave. Glass (εr ≈ 2.25 at optical frequencies) gives n = 1.5; water's εr = 81 holds only at low frequency."))));
  },
};
