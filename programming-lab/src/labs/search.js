// Searching (Klima and Selberherr 2010, § 13.7, pp. 173–174): sequential search looks at one element after another;
// binary search halves a sorted array each step, so it needs about log₂ N looks instead of up to N.
import { seeded, sequentialSearch, binarySearch } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { cells } from "./cells.js";

export default {
  id: "search",
  art: () => a.picture("A row of boxes with a range closing in on one box from both sides",
    [0, 1, 2, 3, 4, 5, 6, 7].map(k => a.rect(14 + k * 22, 70, 20, 20, k === 5 ? a.ACC : a.DIM, 2)).join("") +
      a.arrow(14, 110, 120, 110, a.INK, 2) + a.arrow(190, 110, 126, 110, a.INK, 2)),
  mount(root) {
    let n = 24, target = 0, method = "binary", step = 99;
    const box = h("div", {}), rS = readout("Elements looked at"), rR = readout("Result");
    const data = () => [...new Set(seeded(60, 11))].slice(0, n).sort((x, y) => x - y);
    const update = () => {
      const arr = data(), value = arr[Math.min(target, arr.length - 1)];
      const res = method === "binary" ? binarySearch(arr, value) : sequentialSearch(arr, value);
      const looks = method === "binary" ? res.steps.map(s => s.m) : res.probes, k = Math.min(step, looks.length);
      const marks = {};
      if (method === "binary" && k > 0) {
        const { l, r } = res.steps[k - 1];
        arr.forEach((_, i) => { if (i < l || i > r) marks[i] = "out"; });
      }
      looks.slice(0, k).forEach(i => { marks[i] = "probe"; });
      if (k === looks.length && res.found >= 0) marks[res.found] = "hit";
      box.replaceChildren(cells(arr, marks, { label: `Searching ${value} in ${arr.length} sorted numbers, ${method} search, step ${k}` }));
      rS.set(`${k} of ${looks.length}`, "", method === "binary" ? `at most ${Math.floor(Math.log2(arr.length)) + 1} for ${arr.length} elements` : `at most ${arr.length}`);
      rR.set(k === looks.length ? `${value} found at index ${res.found}` : `looking for ${value}…`);
    };
    const stepSlider = slider({ label: "Steps shown", unit: "", min: 0, max: 30, value: 30, step: 1, format: v => String(v), onInput: v => { step = v; update(); } });
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Method", [["binary", "Binary search"], ["sequential", "Sequential search"]], method, v => { method = v; update(); }),
      slider({ label: "Number of elements N", unit: "", min: 4, max: 40, value: n, step: 1, format: v => String(v), onInput: v => { n = v; update(); } }),
      slider({ label: "Index of the number sought", unit: "", min: 0, max: 39, value: target, step: 1, format: v => String(v), onInput: v => { target = v; update(); } }),
      stepSlider, rS.el, rR.el,
      h("p", { class: "hint" }, "Binary search needs a sorted array: it looks in the middle, keeps the half that can hold the number and greys out the other. Doubling N adds only one look. Sequential search works on any array but looks at up to all N."))));
    update();
  },
};
