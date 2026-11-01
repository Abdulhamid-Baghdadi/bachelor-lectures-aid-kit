// Conservation of charge, I(∂V) = −dQ/dt (Tab. 2.1, row 5): a capacitor plate charged through a resistor. The
// current flowing into the plate is the rate its charge grows; take a closed surface round the plate and count.
import { charging, si } from "../core/index.js";
import { h, s, slider, readout } from "../ui/kit.js";
import { lineChart } from "../ui/chart.js";
import { clock } from "../ui/field.js";
import * as a from "../ui/art.js";

export default {
  id: "continuity",
  art: () => a.picture("A wire bringing charge into a capacitor plate inside a closed surface",
    a.line([[20, 75], [86, 75]], a.INK, 3) + a.line([[90, 40], [90, 110]], a.INK, 5) + a.line([[110, 40], [110, 110]], a.INK, 5) +
      a.line([[114, 75], [180, 75]], a.INK, 3) + a.arrow(30, 62, 70, 62, a.ACC, 3) + a.circle(90, 75, 38, a.DIM, 2) +
      [50, 65, 85, 100].map(y => a.text(80, y, "+", 12, a.HOT)).join("")),
  mount(root) {
    let R = 1e3, Cap = 1e-6;
    const U0 = 10;
    const pic = s("svg", { viewBox: "0 0 300 150", class: "schematic", role: "img", "aria-label": "A capacitor charging; plus signs gather on one plate, minus on the other" });
    const chartBox = h("div", {});
    const q = readout("Charge on the plate Q"), i = readout("Current into the closed surface I");
    const draw = t => {
      const c = charging(U0, R, Cap, 0);
      const tt = (t * c.tau / 1.5) % (5 * c.tau); // five time constants every 7.5 s
      const now = charging(U0, R, Cap, tt), share = now.Q / (Cap * U0), n = Math.round(share * 8);
      pic.replaceChildren(s("polyline", { points: "20,75 128,75", class: "wire" }), s("polyline", { points: "172,75 280,75", class: "wire" }),
        s("line", { x1: 132, y1: 30, x2: 132, y2: 120, class: "plate" }), s("line", { x1: 168, y1: 30, x2: 168, y2: 120, class: "plate" }),
        s("ellipse", { cx: 132, cy: 75, rx: 34, ry: 60, class: "surface" }),
        ...Array.from({ length: n }, (_, k) => s("text", { x: 122, y: 40 + k * 11, class: "letter pos", "text-anchor": "middle" }, "+")),
        ...Array.from({ length: n }, (_, k) => s("text", { x: 178, y: 40 + k * 11, class: "letter neg", "text-anchor": "middle" }, "−")),
        s("text", { x: 60, y: 64, class: "tick", "text-anchor": "middle" }, `I = ${si(now.I, "A")}`));
      q.set(si(now.Q, "C")); i.set(si(now.I, "A"), "", "the slope of the Q curve at this instant");
      const ts = Array.from({ length: 101 }, (_, k) => k * 5 * c.tau / 100);
      chartBox.replaceChildren(lineChart({ label: "Charge and current while the capacitor charges, as a share of their largest values",
        lines: [{ x: ts.map(x => x / c.tau), y: ts.map(x => charging(U0, R, Cap, x).Q / (Cap * U0)), name: "Q / (C U0)" },
                { x: ts.map(x => x / c.tau), y: ts.map(x => charging(U0, R, Cap, x).I / (U0 / R)), name: "I / (U0 / R)", cls: "second" },
                { x: [tt / c.tau, tt / c.tau], y: [0, 1], name: "now", cls: "marker" }],
        xLabel: "Time in time constants t / RC [1]", yLabel: "Share [1]", yMin: 0, yMax: 1 }));
    };
    const c = clock(draw);
    root.append(h("div", { class: "stage" }, h("div", {}, pic, chartBox), h("div", { class: "controls" },
      slider({ label: "Resistance R", unit: "Ω", min: 100, max: 1e5, value: R, log: true, onInput: v => { R = v; c.draw(); } }),
      slider({ label: "Capacitance C", unit: "F", min: 1e-8, max: 1e-4, value: Cap, log: true, onInput: v => { Cap = v; c.draw(); } }),
      c.el, q.el, i.el,
      h("p", { class: "hint" }, "Charge cannot appear or vanish: what flows into the surface stays inside as charge. Read the current off the steepness of the Q curve. Charged from 10 V."))));
  },
};
