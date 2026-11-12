// The binary search tree, Klima and Selberherr (2010) § 19.4, pp. 276–286: smaller keys to the left, larger to the
// right, equal ones to the left by the book's convention. Insertion searches down to a free link; the order of
// insertion decides the tree's shape, from bushy (few levels) to a chain as long as a list.
import { emptyTree, bstFrom, bstInsert, bstSearch, bstDelete, traverse, depths, height, completeHeight } from "../core/index.js";
import { h, s, readout, choice } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";

const ORDERS = [["in", "Inorder"], ["pre", "Preorder"], ["post", "Postorder"], ["level", "Level order"]];
const START = { book: [..."EINBEISPIEL"], sorted: [..."ABCDEFG"], balanced: [..."DBFACEG"] };

export default {
  id: "tree",
  art: () => a.picture("A tree of circles: a root with a smaller key down to the left and a larger one down to the right",
    a.circle(100, 34, 12, a.ACC, 3) + a.circle(60, 80, 11, a.INK, 2) + a.circle(140, 80, 11, a.INK, 2) + a.circle(120, 126, 10, a.DIM, 2) +
      a.line([[92, 43], [66, 71]], a.DIM, 2) + a.line([[108, 43], [134, 71]], a.DIM, 2) + a.line([[134, 89], [124, 117]], a.DIM, 2)),
  mount(root) {
    let tree = emptyTree(), plan = START.book, next = 0, order = "in", marks = { path: [], hit: -1 };
    const box = h("div", {}), rT = readout("Traversal"), rH = readout("Height"), rS = readout("Last step");
    const key = h("input", { type: "text", id: "tree-key", maxlength: 1, value: "N", size: 3, class: "letter", autocomplete: "off" });
    const update = () => {
      const live = tree.nodes.map((n, i) => n ? i : -1).filter(i => i !== -1), d = depths(tree), H = height(tree);
      // x by inorder rank, so every left subtree sits left of its node; y by depth.
      const rank = new Map(traverse(tree, "in").map((i, k) => [i, k]));
      const X = i => 20 + (rank.get(i) + 0.5) * 420 / Math.max(live.length, 1), Y = i => 24 + (d[i] - 1) * Math.min(48, 250 / Math.max(H, 1));
      const edges = live.flatMap(i => [tree.nodes[i].left, tree.nodes[i].right].filter(c => c !== -1)
        .map(c => s("line", { x1: X(i), y1: Y(i), x2: X(c), y2: Y(c), class: "edge" })));
      const nodes = live.flatMap(i => [s("circle", { cx: X(i), cy: Y(i), r: 14, class: `node ${marks.path.includes(i) ? "moved" : ""} ${i === marks.hit ? "found" : ""}` }),
        s("text", { x: X(i), y: Y(i) + 5, class: "value-text", "text-anchor": "middle" }, String(tree.nodes[i].key))]);
      box.replaceChildren(s("svg", { viewBox: "0 0 460 300", class: "schematic", role: "img",
        "aria-label": `A binary search tree of ${live.length} keys in ${H} levels` }, ...edges, ...nodes));
      const t = traverse(tree, order).map(i => tree.nodes[i].key);
      rT.set(t.length ? t.join(" ") : "empty tree", "", order === "in" ? "left, node, right: the keys come out sorted (p. 282)" : order === "pre" ? "node, left, right (p. 282)" : order === "post" ? "left, right, node (p. 282)" : "row by row from the left (p. 282)");
      rH.set(`${H} level${H === 1 ? "" : "s"}`, "", live.length ? `a complete tree of ${live.length} nodes would have ${completeHeight(live.length)} (p. 280)` : "");
    };
    const k = () => key.value.trim().toUpperCase().slice(0, 1);
    const insertKey = c => { if (!c || tree.nodes.length >= 24) return; const r = bstInsert(tree, c); tree = r.tree; marks = { path: r.path, hit: r.node };
      update(); rS.set(`${c} inserted after ${r.path.length} comparison${r.path.length === 1 ? "" : "s"}`, "", r.path.map(i => tree.nodes[i].key).join(" → ") || "the tree was empty"); };
    const search = () => { const c = k(); if (!c) return; const r = bstSearch(tree, c); marks = { path: r.path, hit: r.found }; update();
      rS.set(r.found === -1 ? `${c} not found after ${r.path.length} comparisons` : `${c} found after ${r.path.length} comparison${r.path.length === 1 ? "" : "s"}`, r.found === -1 ? "warn" : "", r.path.map(i => tree.nodes[i].key).join(" → ")); };
    const remove = () => { const c = k(); if (!c) return; const r = bstDelete(tree, c); tree = r.tree; marks = { path: [], hit: r.replacement }; update();
      rS.set(!r.found ? `${c} is not in the tree` : r.replacement === -1 ? `${c} deleted; it had no successor` : `${c} deleted; ${tree.nodes[r.replacement].key} took its place`, r.found ? "" : "warn", "next larger key, or the left successor when there is no right one (p. 285)"); };
    const start = which => { plan = START[which]; tree = emptyTree(); next = 0; marks = { path: [], hit: -1 }; update(); rS.set(`empty; next keys: ${plan.join(" ")}`); };
    const form = h("form", { class: "control", onsubmit: e => { e.preventDefault(); insertKey(k()); } },
      h("label", { for: "tree-key" }, "Key (one letter)"), key);
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Keys to insert in turn", [["book", "The book's E I N B E I S P I E L"], ["sorted", "A to G, sorted"], ["balanced", "D B F A C E G"]], "book", start),
      h("div", { class: "buttons" },
        h("button", { type: "button", onclick: () => { if (next < plan.length) insertKey(plan[next++]); } }, "Insert the next key"),
        h("button", { type: "button", onclick: () => { while (next < plan.length) insertKey(plan[next++]); } }, "Insert all")),
      form,
      h("div", { class: "buttons" },
        h("button", { type: "button", onclick: () => insertKey(k()) }, "Insert this key"),
        h("button", { type: "button", onclick: search }, "Search"),
        h("button", { type: "button", onclick: remove }, "Delete")),
      choice("Traversal", ORDERS, order, v => { order = v; update(); }),
      rT.el, rH.el, rS.el,
      h("p", { class: "hint" }, "The book's keys build Fig. 19.18 in five levels (Fig. 19.21). Now insert A to G sorted: every key goes right, and the tree is a chain of seven levels that searches no faster than a list. D B F A C E G, the same keys, gives three levels. The nodes compared in the last step are marked."))));
    start("book");
  },
};
