// A line chart with both axes labelled "Quantity [unit]": lines by position first, told apart by dash as well as
// colour, and named in a legend.
import { s } from "./kit.js";

const W = 520, H = 270, L = 56, R = 12, T = 34, B = 50;

/** lines: [{ x: [], y: [], name, cls }]; x and y ranges taken from the data unless given. */
export function lineChart({ lines, xLabel, yLabel, yMin, yMax, label, xFormat = v => v.toFixed(0) }) {
  const xs = lines.flatMap(l => l.x), ys = lines.flatMap(l => l.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = yMin ?? Math.min(0, ...ys), y1 = yMax ?? Math.max(...ys);
  const px = x => L + (x - x0) / (x1 - x0 || 1) * (W - L - R);
  const py = y => H - B - (y - y0) / (y1 - y0 || 1) * (H - B - T);
  const ticks = [y0, (y0 + y1) / 2, y1].map(v => [s("line", { x1: L - 4, y1: py(v), x2: W - R, y2: py(v), class: "grid" }),
    s("text", { x: L - 8, y: py(v) + 4, class: "tick", "text-anchor": "end" }, String(Number(v.toFixed(1))))]).flat();
  const legend = lines.map((l, k) => s("g", {},
    s("line", { x1: L + 8 + k * 150, y1: 12, x2: L + 34 + k * 150, y2: 12, class: `series ${l.cls ?? ""}` }),
    s("text", { x: L + 40 + k * 150, y: 16, class: "tick" }, l.name)));
  return s("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", class: "chart", "aria-label": label },
    ...ticks,
    s("line", { x1: L, y1: py(0) > H - B ? H - B : py(0), x2: W - R, y2: py(0) > H - B ? H - B : py(0), class: "axis" }),
    s("line", { x1: L, y1: T, x2: L, y2: H - B, class: "axis" }),
    ...lines.map(l => s("polyline", { points: l.x.map((x, k) => `${px(x).toFixed(1)},${py(l.y[k]).toFixed(1)}`).join(" "),
                                      class: `series ${l.cls ?? ""}`, fill: "none" })),
    s("text", { x: L, y: H - B + 18, class: "tick" }, xFormat(x0)),
    s("text", { x: W - R, y: H - B + 18, class: "tick", "text-anchor": "end" }, xFormat(x1)),
    s("text", { x: (W + L) / 2, y: H - 10, class: "axis-label", "text-anchor": "middle" }, xLabel),
    s("text", { x: 14, y: (H - B + T) / 2, class: "axis-label", "text-anchor": "middle", transform: `rotate(-90 14 ${(H - B + T) / 2})` }, yLabel),
    ...legend);
}
