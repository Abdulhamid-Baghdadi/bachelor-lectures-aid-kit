// The heap as a data structure, Klima and Selberherr (2010) § 19.5, pp. 287–291: a complete binary tree stored in an
// array, every key at least as large as its children's. Inserting repairs upwards (UpHeap), removing the root repairs
// downwards (DownHeap); removing the root again and again gives the keys in order, which is sorting with heaps.
import { seeded, heapInsert, heapRemoveMax, isHeap } from "../core/index.js";
import { h, s, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";

const X = (i) => { const d = Math.floor(Math.log2(i + 1)), k = i - (2 ** d - 1); return (k + 0.5) * 460 / 2 ** d; };
const Y = (i) => 30 + Math.floor(Math.log2(i + 1)) * 52;

export default {
  id: "heap",
  art: () => a.picture("A small tree of circles, the largest at the top, beside the same keys in a row of boxes",
    a.circle(100, 30, 12, a.ACC, 3) + a.circle(60, 75, 11, a.INK, 2) + a.circle(140, 75, 11, a.INK, 2) + a.circle(40, 120, 10, a.DIM, 2) +
      a.line([[92, 39], [66, 66]], a.DIM, 2) + a.line([[108, 39], [134, 66]], a.DIM, 2) + a.line([[54, 84], [44, 111]], a.DIM, 2)),
  mount(root) {
    let heap = [], keys = seeded(31, 3), next = 0, moved = [], out = [];
    const box = h("div", {}), rA = readout("The heap as an array"), rO = readout("Keys removed, largest first"), rC = readout("Heap condition");
    const update = () => {
      const edges = heap.map((_, i) => i).filter(i => i > 0).map(i => s("line", { x1: X(i), y1: Y(i), x2: X(Math.floor((i - 1) / 2)), y2: Y(Math.floor((i - 1) / 2)), class: "edge" }));
      const nodes = heap.flatMap((v, i) => [s("circle", { cx: X(i), cy: Y(i), r: 15, class: `node ${moved.includes(i) ? "moved" : ""}` }),
        s("text", { x: X(i), y: Y(i) + 5, class: "value-text", "text-anchor": "middle" }, String(v))]);
      box.replaceChildren(s("svg", { viewBox: "0 0 460 300", class: "schematic", role: "img", "aria-label": `A heap of ${heap.length} keys drawn as a tree` }, ...edges, ...nodes));
      rA.set(heap.length ? heap.join(" ") : "empty", "", "children of index i at 2i + 1 and 2i + 2");
      rO.set(out.length ? out.join(" ") : "none yet");
      rC.set(isHeap(heap) ? "holds" : "broken", isHeap(heap) ? "" : "danger");
    };
    const insert = () => { if (heap.length >= 31) return; const r = heapInsert(heap, keys[next++ % keys.length]); heap = r.heap; moved = r.moves.flat(); update(); };
    const remove = () => { const r = heapRemoveMax(heap); if (r.max === null) return; heap = r.heap; out = [...out, r.max]; moved = r.moves.flat(); update(); };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      h("button", { type: "button", onclick: insert }, "Insert the next key (UpHeap)"),
      h("button", { type: "button", onclick: remove }, "Remove the largest (DownHeap)"),
      h("button", { type: "button", onclick: () => { heap = []; out = []; moved = []; next = 0; update(); } }, "Start again"),
      rA.el, rO.el, rC.el,
      h("p", { class: "hint" }, "Insert a dozen keys, then remove them one by one: they come out largest first, already sorted. The keys that moved in the last step are marked. The tree is only a picture: the heap is the array, and a node's children are found by arithmetic, not by stored links (p. 287)."))));
    update();
  },
};
