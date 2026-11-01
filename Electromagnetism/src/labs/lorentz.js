// The force on charge and current, f = ϱE + J×B (2.100), for one point charge: F = q (E + v × B). An electron fired
// across crossed fields; its path, worked step by step.
import { lorentzPath, gyroRadius, si } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";

const QE = -1.602176634e-19, ME = 9.1093837e-31, W = 460, H = 300;

export default {
  id: "lorentz",
  art: () => a.picture("A charged particle curling in a magnetic field shown as crosses",
    [0, 1, 2, 3].map(i => [0, 1, 2, 3, 4].map(j => a.text(30 + 35 * j, 30 + 32 * i, "×", 14, a.DIM)).join("")).join("") +
      a.path("M20 120 C60 120 110 110 130 70 C150 30 110 20 95 45 C80 70 120 90 150 80", a.ACC, 3) + a.circle(20, 120, 5, a.HOT, 3, a.HOT)),
  mount(root) {
    let B = 1e-4, E = 0, v = 2e6;
    const pic = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic", role: "img", "aria-label": "The path of an electron in a magnetic field into the page and an electric field down the page" });
    const rr = readout("Radius in B alone r = m v / (|q| B)"), drift = readout("Drift speed E / B");
    const update = () => {
      const T = 2 * Math.PI * ME / (Math.abs(QE) * B);
      const pts = lorentzPath({ q: QE, m: ME, Ex: 0, Ey: -E, Bz: B, vx: v, vy: 0, dt: T / 200, steps: 800 });
      const scale = 1000; // 1 px = 1 mm
      const marks = [];
      for (let i = 0; i < 7; i++) for (let j = 0; j < 10; j++) marks.push(s("text", { x: 23 + 46 * j, y: 28 + 44 * i, class: "bmark", "text-anchor": "middle" }, "×"));
      pic.replaceChildren(...marks,
        s("polyline", { points: pts.map(([x, y]) => `${(40 + x * scale).toFixed(1)},${(150 - y * scale).toFixed(1)}`).join(" "), class: "path", fill: "none" }),
        s("circle", { cx: 40, cy: 150, r: 6, class: "electron" }),
        s("text", { x: 10, y: H - 8, class: "tick" }, "× B into the page; E points down; 1 square = 46 mm"));
      rr.set(si(gyroRadius(QE, ME, v, B), "m"));
      drift.set(E ? si(E / B, "m/s") : "—", "", E ? "the path drifts sideways at this speed, whatever the charge" : "switch on E to see the drift");
    };
    root.append(h("div", { class: "stage" }, pic, h("div", { class: "controls" },
      slider({ label: "Flux density B", unit: "T", min: 2e-5, max: 5e-4, value: B, log: true, onInput: x => { B = x; update(); } }),
      slider({ label: "Electric field E", unit: "V/m", min: 0, max: 200, value: E, step: 5, onInput: x => { E = x; update(); } }),
      slider({ label: "Start speed v", unit: "m/s", min: 2e5, max: 1e7, value: v, log: true, onInput: x => { v = x; update(); } }),
      rr.el, drift.el,
      h("p", { class: "hint" }, "B alone bends the path into a circle and never changes the speed: v × B is always across the motion. Add E and the circles drift sideways at E/B. Four turns, worked with the Boris method."))));
    update();
  },
};
