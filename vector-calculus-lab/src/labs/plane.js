// The drawing every lab here shares: the plane from −2.3 to 2.3 across and −1.5 to 1.5 up, 100 pixels a unit, with the
// field's arrows faint underneath. Not a lab: src/labs/index.js does not list it.
import { s } from "../../../kit/ui/kit.js";
import { arrows } from "../../../kit/ui/field.js";

export const W = 460, H = 300, UNIT = 100;
/** A point of the plane in pixels, y upwards on the page. */
export const px = ([x, y]) => [W / 2 + x * UNIT, H / 2 - y * UNIT];
export const scaled = p => px(p).map(v => v.toFixed(1)).join(",");
/** A readout to three decimals; a sum that rounds to zero reads 0.000, never −0.000. */
export const fixed3 = v => (Math.abs(v) < 5e-4 ? 0 : v).toFixed(3);
/** A pixel back to the plane, for dragging. */
export const toPlane = (X, Y) => [(X - W / 2) / UNIT, (H / 2 - Y) / UNIT];

/** The field F as faint arrows in the plane z = 0, with the lab's own shapes on top. */
export function view(F, shapes, label) {
  const field = arrows(W, H, 23, 15, (X, Y) => { const [x, y] = toPlane(X, Y), v = F(x, y, 0); return [v[0], v[1]]; }, "vec faint");
  return s("svg", { viewBox: `0 0 ${W} ${H}`, class: "schematic field", role: "img", "aria-label": label },
    field, s("line", { x1: 0, y1: H / 2, x2: W, y2: H / 2, class: "axis faint" }), s("line", { x1: W / 2, y1: 0, x2: W / 2, y2: H, class: "axis faint" }), ...shapes);
}
