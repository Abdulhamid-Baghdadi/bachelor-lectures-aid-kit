// The Laplace equation ∇²ϕ = 0 (3.9) in a charge-free region: electrodes held at fixed potentials inside an earthed
// box, the potential between them worked out on a grid by successive over-relaxation.
import { laplace } from "../core/index.js";
import { h, s, slider, readout, choice } from "../ui/kit.js";
import { heatmap } from "../ui/field.js";
import * as a from "../ui/art.js";

const NX = 46, NY = 30, CELL = 10;

/** The electrode layouts: each marks grid cells with their potential, as a share of U1 or U2. */
const LAYOUTS = {
  plates: (i, j) => (j === 13 && i > 6 && i < 23) ? 1 : (j === 32 && i > 6 && i < 23) ? 2 : 0,
  coax: (i, j) => { const r = Math.hypot(i - 14.5, j - 22.5); return r < 4 ? 1 : (r > 12 && r < 13.2) ? 2 : 0; },
  tip: (i, j) => (j === 23 && i > 4 && i < 16) ? 1 : (i === 24 && j > 5 && j < 40) ? 2 : 0,
};

export default {
  id: "laplace",
  art: () => a.picture("Two electrodes with equipotential lines between them",
    a.line([[50, 30], [50, 120]], a.HOT, 5) + a.line([[150, 30], [150, 120]], a.COOL, 5) +
      [75, 100, 125].map(x => a.path(`M${x} 22 C${x - 6} 60 ${x - 6} 90 ${x} 128`, a.ACC, 2)).join("")),
  mount(root) {
    let U1 = 10, U2 = -10, layout = "plates";
    const pic = s("svg", { viewBox: `0 0 ${NX * CELL} ${NY * CELL}`, class: "schematic field", role: "img", "aria-label": "Colour map of the potential between electrodes in an earthed box, with equipotential lines" });
    const rIter = readout("Sweeps until it settled"), rMid = readout("Potential at the centre");
    const update = () => {
      const mark = LAYOUTS[layout];
      const fixed = Array.from({ length: NY }, (_, i) => Array.from({ length: NX }, (_, j) => {
        if (i === 0 || j === 0 || i === NY - 1 || j === NX - 1) return 0;
        const m = mark(i, j);
        return m === 1 ? U1 : m === 2 ? U2 : null;
      }));
      const { phi, iter } = laplace(fixed, { tol: 1e-3 });
      const max = Math.max(Math.abs(U1), Math.abs(U2), 1);
      const at = (x, y) => phi[Math.min(NY - 1, Math.floor(y / CELL))][Math.min(NX - 1, Math.floor(x / CELL))];
      // Equipotentials every tenth of the largest potential: where a cell and its right or lower neighbour straddle a level.
      const lines = [];
      for (let i = 0; i < NY - 1; i++) for (let j = 0; j < NX - 1; j++) for (let k = -9; k <= 9; k++) {
        const lv = k * max / 10, p = phi[i][j];
        if ((p - lv) * (phi[i][j + 1] - lv) < 0) lines.push(`M${(j + 1) * CELL} ${i * CELL + 2}v${CELL - 4}`);
        if ((p - lv) * (phi[i + 1][j] - lv) < 0) lines.push(`M${j * CELL + 2} ${(i + 1) * CELL}h${CELL - 4}`);
      }
      const electrodes = [];
      fixed.forEach((row, i) => row.forEach((v, j) => { if (v !== null && v !== 0 && mark(i, j)) electrodes.push(s("rect", { x: j * CELL, y: i * CELL, width: CELL, height: CELL, class: "electrode" })); }));
      pic.replaceChildren(heatmap(NX * CELL, NY * CELL, NX, NY, at, max), s("path", { d: lines.join(""), class: "contour" }), ...electrodes,
        s("rect", { x: 1, y: 1, width: NX * CELL - 2, height: NY * CELL - 2, class: "box" }));
      rIter.set(String(iter)); rMid.set(`${at(NX * CELL / 2, NY * CELL / 2).toFixed(2)} V`);
    };
    root.append(h("div", { class: "stage" }, pic, h("div", { class: "controls" },
      choice("Electrodes", [["plates", "Two plates"], ["coax", "Coaxial cylinders"], ["tip", "Tip over a plane"]], layout, v => { layout = v; update(); }),
      slider({ label: "Potential of electrode 1, U1", unit: "V", min: -10, max: 10, value: U1, step: 1, onInput: v => { U1 = v; update(); } }),
      slider({ label: "Potential of electrode 2, U2", unit: "V", min: -10, max: 10, value: U2, step: 1, onInput: v => { U2 = v; update(); } }),
      rIter.el, rMid.el,
      h("p", { class: "hint" }, "The box is earthed (0 V). Away from the electrodes each point is the average of its neighbours: that is what ∇²ϕ = 0 says on a grid. The lines are equipotentials, one every tenth of the largest voltage; the field crosses them at right angles and is strongest where they crowd, near the tip."))));
    update();
  },
};
