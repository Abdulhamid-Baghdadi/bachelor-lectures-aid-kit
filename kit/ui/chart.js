// A line chart with both axes labelled "Quantity [unit]": lines by position first, told apart by dash as well as
// colour, and named in a legend. Marks (poles as ×, zeros as ○, a dot for the state now) sit on top of the lines.
import { s } from "./kit.js";

const W = 520, H = 270, L = 56, R = 12, T = 34, B = 50;

/** lines: [{ x: [], y: [], name, cls }]; marks: [{ x, y, shape: "x" | "o" | "dot", name }]; ranges from the data
 *  unless given. */
export function lineChart({ lines, marks = [], xLabel, yLabel, xMin, xMax, yMin, yMax, label,
                            xFormat = v => v.toFixed(0), yFormat = v => String(Number(v.toFixed(2))) }) {
  const xs = [...lines.flatMap(l => l.x), ...marks.map(m => m.x)].filter(Number.isFinite);
  const ys = [...lines.flatMap(l => l.y), ...marks.map(m => m.y)].filter(Number.isFinite);
  const x0 = xMin ?? Math.min(...xs), x1 = xMax ?? Math.max(...xs);
  const y0 = yMin ?? Math.min(0, ...ys), y1 = yMax ?? Math.max(...ys);
  const px = x => L + (x - x0) / (x1 - x0 || 1) * (W - L - R);
  const py = y => H - B - (y - y0) / (y1 - y0 || 1) * (H - B - T);
  // A value off the chart is clamped just past its edge, so a line leaves the frame instead of vanishing.
  const cx = x => Math.max(L - 2, Math.min(W - R + 2, px(x))), cy = y => Math.max(T - 2, Math.min(H - B + 2, py(y)));
  const ticks = [y0, (y0 + y1) / 2, y1].map(v => [s("line", { x1: L - 4, y1: py(v), x2: W - R, y2: py(v), class: "grid" }),
    s("text", { x: L - 8, y: py(v) + 4, class: "tick", "text-anchor": "end" }, yFormat(v))]).flat();
  const named = [...lines.filter(l => l.name), ...marks.filter(m => m.name)];
  const legend = named.map((l, k) => s("g", {},
    l.shape ? mark(L + 21 + k * 150, 12, l.shape, l.cls)
            : s("line", { x1: L + 8 + k * 150, y1: 12, x2: L + 34 + k * 150, y2: 12, class: `series ${l.cls ?? ""}` }),
    s("text", { x: L + 40 + k * 150, y: 16, class: "tick" }, l.name)));
  const zeroY = y0 < 0 && y1 > 0 ? py(0) : H - B;
  const zeroX = x0 < 0 && x1 > 0 ? [s("line", { x1: px(0), y1: T, x2: px(0), y2: H - B, class: "grid zero" })] : [];
  return s("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", class: "chart", "aria-label": label },
    ...ticks, ...zeroX,
    s("line", { x1: L, y1: zeroY, x2: W - R, y2: zeroY, class: "axis" }),
    s("line", { x1: L, y1: T, x2: L, y2: H - B, class: "axis" }),
    ...lines.map(l => s("polyline", { points: l.x.map((x, k) => [x, l.y[k]]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
                                                .map(([x, y]) => `${cx(x).toFixed(1)},${cy(y).toFixed(1)}`).join(" "),
                                      class: `series ${l.cls ?? ""}`, fill: "none" })),
    ...marks.filter(m => Number.isFinite(m.x) && Number.isFinite(m.y)).map(m => mark(cx(m.x), cy(m.y), m.shape, m.cls)),
    s("text", { x: L, y: H - B + 18, class: "tick" }, xFormat(x0)),
    s("text", { x: W - R, y: H - B + 18, class: "tick", "text-anchor": "end" }, xFormat(x1)),
    s("text", { x: (W + L) / 2, y: H - 10, class: "axis-label", "text-anchor": "middle" }, xLabel),
    s("text", { x: 14, y: (H - B + T) / 2, class: "axis-label", "text-anchor": "middle", transform: `rotate(-90 14 ${(H - B + T) / 2})` }, yLabel),
    ...legend);
}

/** A mark: × for a pole, ○ for a zero, a filled dot for a point of interest. */
function mark(x, y, shape = "dot", cls = "") {
  if (shape === "x") return s("g", { class: `mark ${cls}` }, s("line", { x1: x - 6, y1: y - 6, x2: x + 6, y2: y + 6 }), s("line", { x1: x - 6, y1: y + 6, x2: x + 6, y2: y - 6 }));
  if (shape === "o") return s("circle", { cx: x, cy: y, r: 6, class: `mark ${cls}`, fill: "none" });
  return s("circle", { cx: x, cy: y, r: 5, class: `mark dot ${cls}` });
}
