// The microstrip line, Lasser (2012) p. 96: the field runs partly in the substrate and partly in the air, so the wave
// sees an effective permittivity ε_eff = 1 + q(ε_r − 1) between 1 and ε_r; the line is shorter and its impedance
// lower than the same strip in air: Z_L = Z_L,0/√ε_eff, λ = λ0/√ε_eff. A quasi-TEM wave.
import { microstrip, C0, si } from "../core/index.js";
import { h, s, slider, readout } from "../ui/kit.js";
import * as a from "../ui/art.js";

export default {
  id: "microstrip",
  art: () => a.picture("A strip on a substrate over a ground plane, field lines partly in air and partly in the substrate",
    a.rect(20, 90, 160, 30, a.DIM, 2) + a.line([[20, 122], [180, 122]], a.INK, 5) + a.line([[80, 86], [120, 86]], a.INK, 5) +
      a.path("M80 88 C60 92 55 110 55 120", a.ACC, 2) + a.path("M120 88 C140 92 145 110 145 120", a.ACC, 2) + a.path("M80 84 C40 50 20 100 30 120", a.ACC, 2, "4 4")),
  mount(root) {
    let epsr = 4.4, q = 0.7, ZL0 = 120, f = 2.4e9;
    const pic = s("svg", { viewBox: "0 0 300 150", class: "schematic", role: "img", "aria-label": "Cross-section of a microstrip: the strip over a substrate on a ground plane; the share of field in the substrate grows with q" });
    const rE = readout("Effective permittivity ε_eff"), rZ = readout("Line impedance Z_L"), rL = readout("Wavelength on the line λ"), rQ = readout("A quarter wave on the board");
    const update = () => {
      const m = microstrip(epsr, q, ZL0, f);
      const lines = [];
      // Field lines from the strip to the ground: the share in the substrate grows with q.
      const nIn = Math.round(q * 10), all = 10;
      for (let k = 0; k < all; k++) {
        const side = k % 2 ? 1 : -1, spread = 10 + Math.floor(k / 2) * 18, inside = k < nIn;
        lines.push(s("path", { d: inside ? `M${150 + side * 20} 82 Q${150 + side * (30 + spread)} 92 ${150 + side * (30 + spread)} 118`
                                         : `M${150 + side * 20} 76 Q${150 + side * (50 + spread)} ${40 - spread / 3} ${150 + side * (60 + spread)} 118`, class: inside ? "fline in" : "fline out" }));
      }
      pic.replaceChildren(s("rect", { x: 10, y: 80, width: 280, height: 40, class: "medium" }), ...lines,
        s("line", { x1: 10, y1: 121, x2: 290, y2: 121, class: "plate" }), s("line", { x1: 130, y1: 79, x2: 170, y2: 79, class: "plate" }),
        s("text", { x: 14, y: 100, class: "tick" }, `εr = ${epsr}`), s("text", { x: 14, y: 30, class: "tick" }, "air"));
      rE.set(m.eff.toFixed(2), "", `between 1 (all field in air) and εr = ${epsr}`);
      rZ.set(si(m.Z, "Ω")); rL.set(si(m.lambda, "m"), "", `in air it would be ${si(C0 / f, "m")}`); rQ.set(si(m.lambda / 4, "m"));
    };
    root.append(h("div", { class: "stage" }, pic, h("div", { class: "controls" },
      slider({ label: "Substrate permittivity εr", unit: "", min: 1, max: 12, value: epsr, step: 0.1, format: v => v.toFixed(1), onInput: v => { epsr = v; update(); } }),
      slider({ label: "Filling factor q", unit: "", min: 0.5, max: 1, value: q, step: 0.01, format: v => v.toFixed(2), onInput: v => { q = v; update(); } }),
      slider({ label: "Impedance of the same strip in air Z_L,0", unit: "Ω", min: 30, max: 300, value: ZL0, step: 1, onInput: v => { ZL0 = v; update(); } }),
      slider({ label: "Frequency f", unit: "Hz", min: 1e8, max: 3e10, value: f, log: true, onInput: v => { f = v; update(); } }),
      rE.el, rZ.el, rL.el, rQ.el,
      h("p", { class: "hint" }, "Narrow strips put about half the field in air (q → 0.5), wide strips nearly all in the substrate (q → 1). The notes find w/h and q from charts by iteration; design tools use Hammerstad's formulas, which the notes name but do not print, so q is set by hand here. FR-4 (εr ≈ 4.4) at 2.4 GHz is the default."))));
    update();
  },
};
