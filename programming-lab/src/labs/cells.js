// The drawing several labs here share: an array as a row of numbered boxes, some marked. Not a lab:
// src/labs/index.js does not list it.
import { s } from "../../../kit/ui/kit.js";

/** A row of boxes for the values, each with its index under it. marks: { index: class } for highlighted boxes
 *  ("probe", "hit", "swap", "done", "out"); bars: true draws each value as a bar above its box as well. */
export function cells(values, marks = {}, { bars = false, label = "An array", top = 0 } = {}) {
  const n = values.length, w = Math.min(44, 440 / n), x0 = (460 - w * n) / 2, max = Math.max(...values, 1);
  const y = bars ? 230 : 120 + top;
  return s("svg", { viewBox: "0 0 460 300", class: "schematic", role: "img", "aria-label": label },
    ...values.flatMap((v, i) => {
      const cls = `cell ${marks[i] ?? ""}`;
      return [
        ...(bars ? [s("rect", { x: x0 + i * w + 2, y: y - 4 - v / max * 190, width: w - 4, height: v / max * 190, class: `${cls} bar-value` })] : []),
        s("rect", { x: x0 + i * w + 1, y, width: w - 2, height: 34, class: cls }),
        ...(w >= 18 ? [s("text", { x: x0 + i * w + w / 2, y: y + 22, class: "value-text", "text-anchor": "middle" }, String(v))] : []),
        ...(w >= 18 ? [s("text", { x: x0 + i * w + w / 2, y: y + 52, class: "index-text", "text-anchor": "middle" }, String(i))] : []),
      ];
    }));
}
