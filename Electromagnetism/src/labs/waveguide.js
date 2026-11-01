// The rectangular waveguide, Lasser (2012) pp. 64–66: each mode TE_mn or TM_mn carries power only above its cutoff,
// from κ² = (mπ/a)² + (nπ/b)² = ω²εμ − k_z². The TE10 field across the guide, and the mode chart for its size.
import { waveguideModes, te10, si } from "../core/index.js";
import { h, s, slider, readout } from "../ui/kit.js";
import { heatmap } from "../ui/field.js";
import * as a from "../ui/art.js";

export default {
  id: "waveguide",
  art: () => a.picture("A rectangular metal tube seen end on, the field strongest in the middle",
    a.rect(30, 40, 140, 70, a.INK, 4) + [55, 80, 100, 120, 145].map((x, k) => a.line([[x, 50], [x, 100]], a.ACC, [1, 2, 3, 2, 1][k] + 0.5)).join("")),
  mount(root) {
    let aw = 0.02286, bw = 0.01016, f = 10e9;
    const pic = s("svg", { viewBox: "0 0 300 160", class: "schematic", role: "img", "aria-label": "Cross-section of the guide: the TE10 electric field, strongest in the middle, zero at the side walls" });
    const table = h("table", { class: "method" });
    const rc = readout("TE10 cutoff f_c = c / (2a)"), rZ = readout("Wave impedance Z_W,TE"), rL = readout("Guide wavelength λ_H"), rV = readout("Group speed of the energy");
    const update = () => {
      const t = te10(aw, f), W = 280, Hh = W * bw / aw;
      pic.setAttribute("viewBox", `0 0 300 ${Hh + 20}`);
      pic.replaceChildren(s("g", { transform: "translate(10 10)" }, heatmap(W, Hh, 40, Math.max(4, Math.round(40 * bw / aw)), x => Math.sin(Math.PI * x / W), 1),
        s("rect", { x: 0, y: 0, width: W, height: Hh, class: "box" })));
      rc.set(si(t.cutoff, "Hz"), t.carries ? "" : "warn", t.carries ? "" : "below cutoff: the field dies away along the guide, nothing is carried");
      rZ.set(t.carries ? si(t.Z, "Ω") : "—"); rL.set(t.carries ? si(t.lambdaH, "m") : "—"); rV.set(t.carries ? si(t.groupSpeed, "m/s") : "—");
      const modes = waveguideModes(aw, bw, f).slice(0, 8);
      table.replaceChildren(h("thead", {}, h("tr", {}, h("th", {}, "Mode"), h("th", {}, "Cutoff f_c"), h("th", {}, "At this frequency"))),
        h("tbody", {}, modes.map(m => h("tr", { class: m.carries ? "best" : "" },
          h("td", { class: "text" }, `${m.type}${m.m}${m.n}`), h("td", {}, si(m.fc, "Hz")), h("td", { class: "text" }, m.carries ? "carries power" : "cut off")))));
    };
    root.append(h("div", { class: "stage" }, h("div", {}, pic, table), h("div", { class: "controls" },
      slider({ label: "Broad side a", unit: "m", min: 0.005, max: 0.1, value: aw, step: 0.0005, onInput: v => { aw = v; update(); } }),
      slider({ label: "Narrow side b", unit: "m", min: 0.002, max: 0.05, value: bw, step: 0.0005, onInput: v => { bw = v; update(); } }),
      slider({ label: "Frequency f", unit: "Hz", min: 1e9, max: 40e9, value: f, log: true, onInput: v => { f = v; update(); } }),
      rc.el, rZ.el, rL.el, rV.el,
      h("p", { class: "hint" }, "Starts as WR-90, the standard X-band guide (22.86 × 10.16 mm). Between the first and the second cutoff only TE10 runs, so the guide is used there. Near cutoff the energy crawls (group speed → 0) while the phase races ahead: their product stays c². The colour shows the TE10 field strength across the guide."))));
    update();
  },
};
