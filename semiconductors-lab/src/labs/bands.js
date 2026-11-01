// Energy bands from coupled wells (Strasser 2015, sections 2.1 and 2.2.3): N wells side by side split each level of one
// well into N; as N grows the levels fill the bands of the Kronig–Penney model, P sin(αa)/(αa) + cos(αa) = cos(ka).
import { kpLhs, kpBands, kpEnergy, kpDispersion, coupledLevels } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const X = 3 * Math.PI + 0.3;

export default {
  id: "bands",
  art: () => a.picture("Single levels of separate wells spreading into bands as the wells come together",
    a.line([[20, 120], [60, 120]], a.INK) + a.line([[20, 70], [60, 70]], a.INK) +
      [0, 1, 2, 3, 4].map(k => a.line([[110, 126 - k * 3], [180, 126 - k * 3]], a.ACC, 2) + a.line([[110, 82 - k * 6], [180, 82 - k * 6]], a.COOL, 2)).join("") +
      a.arrow(70, 95, 100, 95, a.DIM, 2)),
  mount(root) {
    let P = 3 * Math.PI / 2, N = 6;
    const box = h("div", {}), rB = readout("Allowed bands"), rL = readout("Levels in band 1");
    const update = () => {
      const bands = kpBands(P, X), levels = coupledLevels(P, N, X), xs = Array.from({ length: 600 }, (_, k) => 0.02 + k * (X - 0.02) / 599);
      const disp = kpDispersion(P, X);
      box.replaceChildren(
        lineChart({ label: "The left side of the Kronig–Penney equation against αa; bands where it lies between −1 and 1",
          lines: [{ x: xs, y: xs.map(x => kpLhs(P, x)), name: "P sin(αa)/(αa) + cos(αa)" },
                  { x: [0, X], y: [1, 1], cls: "faint" }, { x: [0, X], y: [-1, -1], cls: "faint" },
                  ...bands.map(b => ({ x: [b.lo, b.hi], y: [-1.25, -1.25], cls: "second" }))],
          marks: levels.map(x => ({ x, y: -1.25, shape: "dot" })),
          xLabel: "Energy variable αa [rad]", yLabel: "Left side of (2.2.13) [1]", yMin: -1.5, yMax: 3, xFormat: v => v.toFixed(1) }),
        lineChart({ label: "E(k) in the reduced zone, energy in units of the single well's ground level",
          lines: [], marks: disp.filter((_, k) => k % 3 === 0).map(p => ({ x: p.ka / Math.PI, y: p.E, shape: "dot" })),
          xLabel: "Wave number ka/π [1]", yLabel: "Energy E/E1 [1]", xMin: 0, xMax: 1, yMin: 0, yMax: 10, xFormat: v => v.toFixed(0) }));
      rB.set(bands.slice(0, 3).map(b => `${kpEnergy(b.lo).toFixed(2)}–${kpEnergy(b.hi).toFixed(2)}`).join(", ") + " E1");
      rL.set(levels.filter(x => x <= Math.PI + 1e-9).map(x => kpEnergy(x).toFixed(2)).join(", ") + " E1", "", `${N} wells, ${N} levels`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Barrier strength P", unit: "", min: 0.1, max: 50, value: P, log: true, format: v => v.toFixed(2), onInput: v => { P = v; update(); } }),
      slider({ label: "Number of wells N", unit: "", min: 1, max: 20, value: N, step: 1, format: v => String(v), onInput: v => { N = v; update(); } }),
      rB.el, rL.el,
      h("p", { class: "hint" }, "Dots on the bottom line are the N wells' levels; dashes are the infinite crystal's bands. One well gives one level; two give a bonding and an anti-bonding pair; many fill the band. Raise P: the wells decouple and each band shrinks onto the single well's level n². Lower P: the gaps close and the electron is free."))));
    update();
  },
};
