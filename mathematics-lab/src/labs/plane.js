// The drawing several labs here share: the plane from −2.3 to 2.3 across and −1.5 to 1.5 up, 100 pixels a unit,
// with its axes. Not a lab: src/labs/index.js does not list it.
import { s } from "../../../kit/ui/kit.js";

export const W = 460, H = 300, UNIT = 100;
/** A point of the plane in pixels, y upwards on the page. */
export const px = ([x, y]) => [W / 2 + x * UNIT, H / 2 - y * UNIT];
export const scaled = p => px(p).map(v => v.toFixed(1)).join(",");
/** A pixel back to the plane, for dragging. */
export const toPlane = (X, Y) => [(X - W / 2) / UNIT, (H / 2 - Y) / UNIT];
/** A readout to n decimals; a value that rounds to zero reads 0.000, never −0.000. */
export const fixed = (v, n = 3) => (Math.abs(v) < 0.5 * 10 ** -n ? 0 : v).toFixed(n);

/** An arrow from the origin (or from p) to q, with a label at its tip. */
export function vector(q, cls, label, p = [0, 0]) {
  const [x1, y1] = px(p), [x2, y2] = px(q), a = Math.atan2(y2 - y1, x2 - x1), L = 9;
  return s("g", { class: `vector ${cls}` },
    s("line", { x1, y1, x2, y2 }),
    s("polygon", { points: `${x2},${y2} ${x2 - L * Math.cos(a - 0.4)},${y2 - L * Math.sin(a - 0.4)} ${x2 - L * Math.cos(a + 0.4)},${y2 - L * Math.sin(a + 0.4)}` }),
    ...(label ? [s("text", { x: x2 + 8, y: y2 - 6, class: "label" }, label)] : []));
}

/** The plane with its axes and the lab's own shapes on top. */
export function board(shapes, label) {
  return s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic field", role: "img", "aria-label": label },
    s("line", { x1: 0, y1: H / 2, x2: W, y2: H / 2, class: "axis faint" }), s("line", { x1: W / 2, y1: 0, x2: W / 2, y2: H, class: "axis faint" }),
    ...shapes.filter(Boolean));
}
