// Fresnel zones, Lasser (2012) p. 107: a radio link counts as free space as long as the first Fresnel ellipsoid, the
// points whose detour is at most λ/2, stays clear. Its radius r = √(λ d1 d2 / d). Drag the obstacle.
import { fresnelRadius, detour, C0, si } from "../core/index.js";
import { h, s, slider, readout } from "../ui/kit.js";
import { draggable } from "../ui/field.js";
import * as a from "../ui/art.js";

const W = 460, H = 240, X1 = 30, X2 = 430, Y = 100;

export default {
  id: "fresnelzone",
  art: () => a.picture("Two masts with the first Fresnel ellipsoid between them, and a hill reaching into it",
    a.line([[20, 120], [20, 50]], a.INK, 3) + a.line([[180, 120], [180, 50]], a.INK, 3) + a.line([[20, 50], [180, 50]], a.DIM, 2, "4 4") +
      a.path("M20 50 C60 15 140 15 180 50 C140 85 60 85 20 50", a.ACC, 3) + a.path("M70 130 C90 80 110 80 130 130", a.HOT, 3)),
  mount(root) {
    let d = 50e3, f = 6e9, ox = 0.5, oh = 0.4;
    const pic = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic", role: "img", "aria-label": "A radio link from sender to receiver, the first Fresnel ellipsoid drawn around the line of sight, and an obstacle you move" });
    const rR = readout("Largest radius of the 1st zone, at mid-path"), rO = readout("Clearance of the obstacle"), rD = readout("Detour over the obstacle's top");
    const update = () => {
      const lam = C0 / f, rMax = fresnelRadius(lam, d / 2, d / 2), scale = 80 / rMax; // the ellipse is drawn 80 px high, a vertical zoom
      const pts = [];
      for (let k = 0; k <= 100; k++) { const x = k / 100, r = fresnelRadius(lam, x * d, (1 - x) * d); pts.push([X1 + x * (X2 - X1), r]); }
      const d1 = ox * d, rHere = fresnelRadius(lam, d1, d - d1), top = (oh * 2 - 1) * rMax; // obstacle top, metres above (−) or below the line
      const clear = -top; // positive: the top is below the line of sight
      const tx = X1 + ox * (X2 - X1), ty = Y - top * scale;
      pic.replaceChildren(
        s("polygon", { points: pts.map(([x, r]) => `${x.toFixed(1)},${(Y - r * scale).toFixed(1)}`).concat(pts.slice().reverse().map(([x, r]) => `${x.toFixed(1)},${(Y + r * scale).toFixed(1)}`)).join(" "), class: "lobe" }),
        s("line", { x1: X1, y1: Y, x2: X2, y2: Y, class: "radius" }),
        // A quadratic curve peaks halfway between its ends and its control point: control at 2·ty − H puts the peak at ty.
        s("path", { d: `M${tx - 60} ${H} Q${tx} ${2 * ty - H} ${tx + 60} ${H}`, class: clear < rHere * 0.6 ? "hill blocked" : "hill" }),
        s("line", { x1: X1, y1: Y, x2: X1, y2: H, class: "plate" }), s("line", { x1: X2, y1: Y, x2: X2, y2: H, class: "plate" }),
        s("text", { x: X1, y: Y - 10, class: "tick" }, "S"), s("text", { x: X2 - 10, y: Y - 10, class: "tick" }, "E"),
        s("text", { x: W / 2, y: 18, class: "tick", "text-anchor": "middle" }, "heights zoomed: the zone is drawn 80 px high"));
      rR.set(si(rMax, "m"), "", `diameter ${si(2 * rMax, "m")}`);
      const share = `${(clear / rHere * 100).toFixed(0)} % of the zone radius there`;
      rO.set(si(clear, "m"), clear < 0 ? "danger" : clear < 0.6 * rHere ? "warn" : "",
        clear < 0 ? `${share}: the line of sight is blocked` : clear < 0.6 * rHere ? `${share}: inside the 1st zone, expect extra loss` : share);
      rD.set(si(detour(d1, d - d1, Math.abs(clear)), "m"), "", `λ/2 = ${si(lam / 2, "m")}`);
    };
    const sx = slider({ label: "Obstacle position along the path", unit: "", min: 0.05, max: 0.95, value: ox, step: 0.01, format: v => `${Math.round(v * 100)} %`, onInput: v => { ox = v; update(); } });
    const sh = slider({ label: "Obstacle height", unit: "", min: 0, max: 1, value: oh, step: 0.01, format: v => `${Math.round(v * 100)} %`, onInput: v => { oh = v; update(); } });
    draggable(pic, (x, y) => { ox = Math.min(0.95, Math.max(0.05, (x - X1) / (X2 - X1))); oh = Math.min(1, Math.max(0, ((Y - y) / 80 + 1) / 2));
      ox = Math.round(ox * 100) / 100; oh = Math.round(oh * 100) / 100; sx.set(ox); sh.set(oh); update(); });
    root.append(h("div", { class: "stage" }, pic, h("div", { class: "controls" },
      slider({ label: "Path length d", unit: "m", min: 1e3, max: 1e5, value: d, log: true, onInput: v => { d = v; update(); } }),
      slider({ label: "Frequency f", unit: "Hz", min: 1e8, max: 4e10, value: f, log: true, onInput: v => { f = v; update(); } }),
      sx, sh, rR.el, rO.el, rD.el,
      h("p", { class: "hint" }, "Drag the hill. The notes' exercise: 50 km at λ = 5 cm (6 GHz) needs a clear zone 50 m across at mid-path. A hill reaching into the outer half of the zone cuts off waves that would have arrived out of phase, so the field there can even rise (p. 107). The 60 % warning is a common planning rule, not from the notes."))));
    update();
  },
};
