// Push-pull output stages (Zimmermann 2010, section 2.2): a complementary emitter follower in class B wastes nothing at
// rest but leaves a dead zone of ±UBE, the crossover distortion; a bias of about 1.1 V between the bases (class AB)
// closes it. Efficiency (π/4) Ûa/UB, at most 78.5 %.
import { pushPull, classBPowers, classBEfficiency, si } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const UB = 15, RL = 8;

export default {
  id: "poweramp",
  art: () => a.picture("A sine whose zero crossings are flattened by the dead zone of a class B stage",
    a.line([[15, 75], [185, 75]], a.DIM, 2) + a.path("M15 75 C30 25 60 25 75 75 C90 125 120 125 135 75", a.DIM, 2, "4 4") +
      a.path("M15 75 L25 75 C35 30 60 30 70 70 L80 75 L90 75 C100 120 125 120 135 80 L145 75 L185 75", a.ACC, 3)),
  mount(root) {
    let mode = "B", amp = 3;
    const box = h("div", {}), rP = readout("Load power PL"), rE = readout("Efficiency η, class B"), rT = readout("Loss in both transistors PT"), rD = readout("Worst error near the crossing");
    const update = () => {
      const prm = { UB, RL, Ubias: mode === "B" ? 0 : 1.2 }, ts = Array.from({ length: 401 }, (_, k) => k / 400 * 2);
      const ue = ts.map(t => amp * Math.sin(2 * Math.PI * t)), ua = ue.map(u => pushPull(u, prm));
      box.replaceChildren(lineChart({ label: "Input and output of the push-pull stage over two periods",
        lines: [{ x: ts, y: ue, name: "ue", cls: "faint" }, { x: ts, y: ua, name: "ua" }],
        xLabel: "Time t/T [1]", yLabel: "Voltage [V]", yMin: -UB, yMax: UB, xFormat: v => v.toFixed(0) }));
      const peak = Math.max(...ua), p = classBPowers(peak, UB, RL), err = Math.max(...ue.map((u, k) => (Math.abs(u) < 1.5 ? Math.abs(u - ua[k]) : 0)));
      rP.set(si(p.PL, "W")); rE.set(`${(classBEfficiency(peak, UB) * 100).toFixed(1)} %`, "", "(π/4) Ûa/UB, ideal transistors");
      rT.set(si(p.PT, "W"), "", "largest at Ûa = 0.637 UB");
      rD.set(si(err, "V"), err > 0.3 ? "warn" : "", err > 0.3 ? "crossover distortion" : "");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Operating class", [["B", "B: no bias"], ["AB", "AB: 1.2 V between the bases"]], mode, v => { mode = v; update(); }),
      slider({ label: "Input amplitude Ûe", unit: "V", min: 0.2, max: 15, value: amp, step: 0.1, format: v => `${v.toFixed(1)} V`, onInput: v => { amp = v; update(); } }),
      rP.el, rE.el, rT.el, rD.el,
      h("p", { class: "hint" }, `Supplies ±${UB} V, load ${RL} Ω, transistors by the exponential law of the bipolar lab. Small signals show the dead zone worst: in class B the output stays near zero until the input passes about 0.6 V. The power readouts are the script's ideal class B; class AB adds a small quiescent loss. Class A, at most 6.25 % as an emitter follower (2.16), is left out.`))));
    update();
  },
};
