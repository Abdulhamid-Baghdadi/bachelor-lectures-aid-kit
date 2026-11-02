// Pointers and arrays, Klima and Selberherr (2010) ch. 14, pp. 179–187: a pointer holds an address; adding k to it
// moves it k elements on, that is k times the element's size in bytes (pointer arithmetic, § 14.4, p. 186), and
// p + k is the address of feld[k], the duality of pointers and arrays (§ 14.3, p. 185).
import { h, s, slider, readout, choice } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";

const BASE = 1000;

export default {
  id: "pointers",
  art: () => a.picture("A row of memory cells with an arrow pointing into it",
    [0, 1, 2, 3, 4, 5, 6].map(k => a.rect(14 + k * 25, 80, 23, 26, k >= 2 && k <= 3 ? a.ACC : a.DIM, 2)).join("") + a.arrow(76, 30, 76, 76, a.INK, 3)),
  mount(root) {
    let size = 4, k = 2;
    const box = h("div", {}), rA = readout("Address in p + k"), rE = readout("The element there");
    const values = [17, 42, 8, 99, 23];
    const update = () => {
      const cell = 440 / 20, bytes = values.length * size, x0 = 10;
      const byteCells = Array.from({ length: Math.min(bytes, 20) }, (_, b) => s("rect", { x: x0 + b * cell, y: 150, width: cell - 2, height: 34,
        class: `cell ${Math.floor(b / size) === k ? "hit" : ""}` }));
      const labels = values.map((v, i) => i * size < 20 ? s("text", { x: x0 + (i * size + size / 2) * cell, y: 140, class: "value-text", "text-anchor": "middle" }, `feld[${i}] = ${v}`) : null).filter(Boolean);
      const addr = Array.from({ length: Math.min(bytes, 20) }, (_, b) => b % size === 0 ? s("text", { x: x0 + b * cell + 2, y: 200, class: "index-text" }, String(BASE + b)) : null).filter(Boolean);
      const px = x0 + k * size * cell + 4;
      box.replaceChildren(s("svg", { viewBox: "0 0 460 300", class: "schematic", role: "img", "aria-label": `An array of ${values.length} elements of ${size} bytes; p + ${k} points at element ${k}` },
        ...byteCells, ...labels, ...addr,
        k * size < 20 ? s("line", { x1: px, y1: 60, x2: px, y2: 146, class: "pointer" }) : s("text", { x: 230, y: 60, class: "label", "text-anchor": "middle" }, "beyond the drawing"),
        s("text", { x: px, y: 50, class: "label" }, `p + ${k}`)));
      rA.set(`${BASE + k * size}`, "", `${BASE} + ${k} · ${size} bytes`);
      rE.set(k < values.length ? `*(p + ${k}) = feld[${k}] = ${values[k]}` : "past the end: undefined", k < values.length ? "" : "danger");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Element type and size", [[1, "char, 1 byte"], [2, "short, 2 bytes"], [4, "long, 4 bytes"]], size, v => { size = Number(v); update(); }),
      slider({ label: "k in p + k", unit: "", min: 0, max: 5, value: k, step: 1, format: v => String(v), onInput: v => { k = v; update(); } }),
      rA.el, rE.el,
      h("p", { class: "hint" }, "p = feld points at the first element, address 1000 in this drawing. p + k does not add k bytes but k elements, so the step in the address is the element's size. k = 5 is one past the end of the five elements: the pointer may be formed, but reading through it is an error. The sizes shown are typical, not fixed by C."))));
    update();
  },
};
