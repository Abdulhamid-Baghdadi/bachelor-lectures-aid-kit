// Sorting (Klima and Selberherr 2010): bubble sort swaps neighbours (§ 13.6.2, p. 172); quicksort puts the rightmost
// element in its place and sorts both sides recursively (§ 18.3.2, pp. 261–263). Step through either and count.
import { seeded, bubbleSort, quickSort } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { clock } from "../../../kit/ui/field.js";
import * as a from "../../../kit/ui/art.js";
import { cells } from "./cells.js";

export default {
  id: "sorting",
  art: () => a.picture("Bars of different heights being swapped into order",
    [5, 2, 7, 3, 6, 1, 4].map((v, k) => a.rect(20 + k * 24, 140 - v * 16, 18, v * 16, k === 2 || k === 3 ? a.ACC : a.DIM, 2)).join("") +
      a.path("M80 20 Q92 6 104 20", a.INK, 2)),
  mount(root) {
    let method = "quick", n = 16, k = 0;
    const box = h("div", {}), rC = readout("Comparisons so far"), rS = readout("Swaps so far");
    let frames = [];
    const build = () => { const input = seeded(n, 5); frames = method === "quick" ? quickSort(input) : bubbleSort(input); k = 0; };
    const update = () => {
      const f = frames[Math.min(k, frames.length - 1)], marks = {};
      if (method === "quick" && f.i >= 0) { for (let x = f.l; x <= f.r; x++) marks[x] = "probe"; marks[f.i] = "swap"; marks[f.j] = "swap"; }
      if (method === "bubble") { marks[f.i] = f.swap ? "swap" : "probe"; marks[f.j] = f.swap ? "swap" : "probe"; }
      if (k >= frames.length - 1) f.a.forEach((_, i) => { marks[i] = "done"; });
      box.replaceChildren(cells(f.a, marks, { bars: true, label: `${method === "quick" ? "Quicksort" : "Bubble sort"} of ${n} numbers, step ${k + 1} of ${frames.length}` }));
      rC.set(String(f.compares), "", k >= frames.length - 1 ? "sorted" : `step ${k + 1} of ${frames.length}`);
      rS.set(String(f.swaps));
    };
    // The kit's clock calls back every frame with the running time; one step every fifth of a second while it runs.
    let tickAt = -1;
    const c = clock(t => {
      const q = Math.floor(t * 5);
      if (q !== tickAt && tickAt >= 0 && frames.length && k < frames.length - 1) { k++; update(); }
      tickAt = q;
    }, { label: "Play" });
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Method", [["quick", "Quicksort"], ["bubble", "Bubble sort"]], method, v => { method = v; build(); update(); }),
      slider({ label: "Number of elements N", unit: "", min: 5, max: 40, value: n, step: 1, format: v => String(v), onInput: v => { n = v; build(); update(); } }),
      c.el, h("button", { type: "button", onclick: () => { if (k < frames.length - 1) { k++; update(); } } }, "One step"),
      rC.el, rS.el,
      h("p", { class: "hint" }, "The same seeded numbers each time, so the two methods meet the same task. Bubble sort compares neighbours and lets the largest rise to the end in each pass. Quicksort marks the part it is working on; the rightmost element there lands in its final place and both sides are sorted the same way. Raise N and compare the counts."))));
    build(); update();
  },
};
