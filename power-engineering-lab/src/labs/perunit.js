// Per-unit values (Gawlik 2015, section 6.3.4; slides V17+18), on the notes' own example network: a 110 kV feeder, a
// 110/30 kV transformer and a 40 km line, shorted at 30 kV. Choose the base power: every per-unit value changes, the
// fault current in kiloamperes does not.
import { exampleNetwork, baseImpedance, ik3, cAbs, si } from "../core/index.js";
import { h, choice, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const NET = { c: 1.1, SkQ: 5e9, RXQ: 0.1, uk: 0.12, ST: 31e6, Pk: 0.14e6, Rl: 0.12, Xl: 0.35, len: 40 }, UB = 30e3;
const PARTS = [["feeder", "Feeder, 5 GVA"], ["transformer", "Transformer, 31 MVA"], ["line", "Line, 40 km"]];

export default {
  id: "perunit",
  art: () => a.picture("Three boxes in a row whose sizes read the same on two scales",
    [0, 1, 2].map(k => a.rect(20 + k * 60, 55, 40, 40, k === 1 ? a.ACC : a.INK, 3)).join("") + a.text(100, 130, "p.u.", 22, a.DIM) + a.text(100, 38, "Ω", 22, a.DIM)),
  mount(root) {
    let SB = 100e6;
    const box = h("div", {}), table = h("table", { class: "eqs units" }), rZ = readout("Base impedance at 30 kV"), rT = readout("Total impedance"), rI = readout("Fault current I″k3");
    const update = () => {
      const net = exampleNetwork(NET, UB), ZB = baseImpedance(UB, SB), z = Object.fromEntries(PARTS.map(([k]) => [k, cAbs(net[k])]));
      box.replaceChildren(lineChart({ label: `Per-unit impedances of the example network on a ${SB / 1e6} MVA base`,
        lines: [{ x: [1, 2, 3, 4], y: [...PARTS.map(([k]) => z[k] / ZB), cAbs(net.total) / ZB], name: "|z| on this base", stem: true }],
        xLabel: "Feeder 1, transformer 2, line 3, total 4 [1]", yLabel: "Impedance |z| [p.u.]", xMin: 0.5, xMax: 4.5, yMin: 0, xFormat: () => "", yFormat: v => v.toPrecision(2) }));
      table.replaceChildren(h("thead", {}, h("tr", {}, h("th", {}, "Part"), h("th", {}, "|Z| at 30 kV"), h("th", {}, `|z| on ${SB / 1e6} MVA`))),
        h("tbody", {}, [...PARTS, ["total", "Total"]].map(([k, name]) => h("tr", {}, h("td", {}, name),
          h("td", {}, si(cAbs(net[k]), "Ω")), h("td", {}, `${(cAbs(net[k]) / ZB).toPrecision(3)} p.u.`)))));
      const IB = SB / (Math.sqrt(3) * UB);
      rZ.set(si(ZB, "Ω"), "", "Z_B = U_B²/S_B: only two bases are free (6-33)");
      rT.set(`${(cAbs(net.total) / ZB).toPrecision(3)} p.u.`, "", `R/X = ${(net.total[0] / net.total[1]).toFixed(2)}`);
      rI.set(si(ik3(NET.c, UB, cAbs(net.total)), "A"), "", `i = c/|z| = ${(NET.c / (cAbs(net.total) / ZB)).toFixed(3)} p.u. × I_B = ${si(IB, "A")}: the same on every base`);
    };
    root.append(h("div", { class: "stage" }, h("div", {}, box, table), h("div", { class: "controls" },
      choice("Base power S_B", [["10", "10 MVA"], ["31", "31 MVA (the transformer's)"], ["100", "100 MVA"], ["1000", "1000 MVA"]], "100", v => { SB = Number(v) * 1e6; update(); }),
      rZ.el, rT.el, rI.el,
      h("p", { class: "hint" }, "Data from p. 215: feeder S″kQ = 5 GVA at 110 kV, c = 1.1, R/X = 0.1; transformer 110/30 kV, 31 MVA, u_k = 12 %, P_k = 0.14 MW; line R' = 0.12, X' = 0.35 Ω/km. A machine's x″d or a transformer's u_k is already per unit of its own rating; on another base it scales with S_B/S_r. On the 31 MVA base the transformer's z is its u_k, 0.12. The current's time course is the next lab."))));
    update();
  },
};
