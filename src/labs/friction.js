// Dissipative forces (Kugi et al. 2015, section 2.2.5): a block on a rough floor with Coulomb friction (2.99), (2.100)
// and viscous friction (2.106). It slides by (2.101) until it stops, then sticks while the push stays below fH (2.102).
import { mechSlide, mechFriction, si } from "../core/index.js";
import { h, slider, readout } from "../ui/kit.js";
import { lineChart } from "../ui/chart.js";
import * as a from "../ui/art.js";

const m = 1, G = 9.81, TEND = 3;

export default {
  id: "friction",
  art: () => a.picture("A block sliding on a rough floor, slowed by friction",
    a.line([[10, 110], [190, 110]], a.INK, 3) + [20, 50, 80, 110, 140, 170].map(x => a.line([[x, 110], [x - 8, 120]], a.DIM, 2)).join("") +
      a.rect(70, 70, 50, 40) + a.arrow(125, 60, 170, 60, a.ACC, 3) + a.arrow(68, 100, 30, 100, a.HOT, 3)),
  mount(root) {
    let v0 = 2, fe = 0, muH = 0.5, muC = 0.3, muV = 0.5;
    const chartV = h("div", {}), chartF = h("div", {});
    const stop = readout("Comes to rest after"), dist = readout("Distance slid"), stick = readout("Static limit fH = µH m g (2.99)");
    const update = () => {
      if (muC > muH) muH = muC; // the sliding coefficient does not exceed the static one
      const r = mechSlide({ m, v0, fe, muH, muC, muV, g: G, T: TEND, n: 900 });
      const k = r.v.findIndex((v, i) => i > 0 && v === 0);
      stop.set(k > 0 ? si(r.t[k], "s") : "still sliding", "", k > 0 && Math.abs(fe) <= muH * m * G ? "then it sticks: the push is below fH" : "");
      dist.set(si(r.x.at(-1), "m")); stick.set(si(muH * m * G, "N"), "", `the push fe = ${si(fe, "N")}`);
      chartV.replaceChildren(lineChart({ label: "Speed of the block against time", lines: [{ x: r.t, y: r.v, name: "v" }],
        xLabel: "Time t [s]", yLabel: "Velocity v [m/s]", yMin: 0, xFormat: v => v.toFixed(1) }));
      const vs = Array.from({ length: 201 }, (_, i) => -2 + i * 0.02);
      chartF.replaceChildren(lineChart({ label: "Friction force against sliding speed, Coulomb plus viscous",
        lines: [{ x: vs, y: vs.map(v => mechFriction(v, muC, muV, m, G)), name: "fr(v)" }, { x: [0, 0], y: [-muH * m * G, muH * m * G], name: "sticking range", cls: "second" }],
        xLabel: "Velocity v [m/s]", yLabel: "Friction force fr [N]", xFormat: v => v.toFixed(0) }));
    };
    const sl = (label, unit, min, max, value, step, set) => slider({ label, unit, min, max, value, step, onInput: v => { set(v); update(); } });
    root.append(h("div", { class: "stage" }, h("div", {}, chartV, chartF), h("div", { class: "controls" },
      sl("Initial speed v0", "m/s", 0, 4, v0, 0.1, v => v0 = v), sl("Push fe", "N", 0, 8, fe, 0.1, v => fe = v),
      slider({ label: "Static coefficient µH", min: 0.05, max: 1, value: muH, step: 0.01, format: v => v.toFixed(2), onInput: v => { muH = v; update(); } }),
      slider({ label: "Sliding coefficient µC", min: 0, max: 1, value: muC, step: 0.01, format: v => v.toFixed(2), onInput: v => { muC = v; update(); } }),
      sl("Viscous coefficient µV", "N s/m", 0, 3, muV, 0.05, v => muV = v),
      stop.el, dist.el, stick.el,
      h("p", { class: "hint" }, "Coulomb friction alone slows the block at a constant rate, a straight line; viscous friction alone fades it exponentially and never quite stops it. A push above fH keeps it moving. The block weighs 1 kg; the static coefficient is raised to at least the sliding one."))));
    update();
  },
};
