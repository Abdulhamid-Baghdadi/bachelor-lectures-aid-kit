// The complex plane for phasors and space vectors: equal scale on both axes, so angles read true, which a line chart
// does not keep. Arrows start at the origin or at another arrow's tip (a phasor sum); paths draw loci. Each arrow is
// told apart by dash and a name in the legend as well as by colour. Not a lab: the labs that draw phasors share it.
import { s } from "../../../kit/ui/kit.js";
import { arrow } from "../../../kit/ui/field.js";

const SIZE = 340, PAD = 40;

/** arrows: [{ z: [re, im], from?: [re, im], name, cls }]; paths: [{ pts: [[re, im]], cls }]; r: the half-width shown. */
export function plane({ label, xLabel, yLabel, r, arrows = [], paths = [], axes = [] }) {
  const k = (SIZE / 2 - PAD) / r, cx = SIZE / 2, cy = SIZE / 2 - 10;
  const X = re => cx + re * k, Y = im => cy - im * k;
  // The legend one name a row under the plane, so long names never run into each other.
  const legend = arrows.filter(a => a.name).map((a, n) => s("g", {},
    s("line", { x1: 8, y1: SIZE + 4 + n * 20, x2: 34, y2: SIZE + 4 + n * 20, class: `key ${a.cls ?? ""}` }),
    s("text", { x: 42, y: SIZE + 9 + n * 20, class: "tick" }, a.name)));
  const rows = legend.length;
  return s("svg", { viewBox: `0 0 ${SIZE} ${SIZE + rows * 20 + 6}`, role: "img", class: "chart plane", "aria-label": label },
    s("line", { x1: PAD - 10, y1: cy, x2: SIZE - PAD + 10, y2: cy, class: "axis" }),
    s("line", { x1: cx, y1: cy - (SIZE / 2 - PAD) - 10, x2: cx, y2: cy + (SIZE / 2 - PAD) + 10, class: "axis" }),
    // Winding axes or other fixed directions, faint and named at their end.
    ...axes.flatMap(a => [s("line", { x1: X(0), y1: Y(0), x2: X(a.z[0]), y2: Y(a.z[1]), class: "grid" }),
      s("text", { x: X(a.z[0] * 1.08), y: Y(a.z[1] * 1.08) + 4, class: "tick", "text-anchor": "middle" }, a.name)]),
    ...paths.map(p => s("polyline", { points: p.pts.map(([re, im]) => `${X(re).toFixed(1)},${Y(im).toFixed(1)}`).join(" "), class: `series ${p.cls ?? ""}`, fill: "none" })),
    ...arrows.filter(a => Math.hypot(...a.z) * k > 1).map(a => {
      const [x0, y0] = a.from ?? [0, 0];
      return arrow(X(x0), Y(y0), Math.atan2(-a.z[1], a.z[0]), Math.hypot(...a.z) * k, `vec phasor ${a.cls ?? ""}`);
    }),
    s("text", { x: SIZE - PAD + 10, y: cy - 6, class: "tick", "text-anchor": "end" }, `${r}`),
    s("text", { x: cx + 6, y: cy - (SIZE / 2 - PAD) + 2, class: "tick" }, `${r}`),
    s("text", { x: SIZE / 2, y: SIZE - 14, class: "axis-label", "text-anchor": "middle" }, xLabel),
    s("text", { x: 12, y: cy, class: "axis-label", "text-anchor": "middle", transform: `rotate(-90 12 ${cy})` }, yLabel),
    ...legend);
}
