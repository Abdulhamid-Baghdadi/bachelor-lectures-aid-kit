// The linked list, Klima and Selberherr (2010) § 19.2, pp. 266–274: each node holds an element and the index of the
// next node, kept in an array as the book does (Fig. 19.4). Inserting and removing change one or two links and move
// no element; the order lives in the links, not in the array.
import { listFrom, listOrder, listInsert, listRemove } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";

const nextText = n => n === -1 ? "−1" : n === -2 ? "−2" : String(n);

export default {
  id: "list",
  art: () => a.picture("Four boxes in a row, each with an arrow to the next, the last ending in a cross",
    [0, 1, 2, 3].map(k => a.rect(14 + k * 46, 80, 28, 28, k === 1 ? a.ACC : a.INK, 2) + (k < 3 ? a.arrow(42 + k * 46, 94, 60 + k * 46, 94, a.DIM, 2) : "")).join("") +
      a.line([[176, 86], [188, 102]], a.INK, 2) + a.line([[188, 86], [176, 102]], a.INK, 2)),
  mount(root) {
    let list = listFrom("LISTE"), position = 1, last = { walked: [], links: [], node: -1 };
    const box = h("div", {}), rO = readout("The list, following the links"), rA = readout("The array: element and next index"), rL = readout("Links set in the last step");
    const letter = h("input", { type: "text", id: "list-letter", maxlength: 1, value: "E", size: 3, class: "letter", autocomplete: "off" });
    const update = () => {
      const order = listOrder(list), n = list.nodes.length, w = Math.min(64, 440 / Math.max(n, 1)), x0 = (460 - w * n) / 2;
      // Top: the nodes in list order with their links; bottom: the same nodes where they sit in the array.
      const lw = Math.min(64, 400 / Math.max(order.length, 1)), lx = k => 40 + k * lw;
      const top = order.flatMap((k, j) => [
        s("rect", { x: lx(j), y: 60, width: lw - 18, height: 34, class: `cell ${k === last.node ? "hit" : last.walked.includes(k) ? "probe" : ""}` }),
        s("text", { x: lx(j) + (lw - 18) / 2, y: 82, class: "value-text", "text-anchor": "middle" }, list.nodes[k].element),
        s("text", { x: lx(j) + (lw - 18) / 2, y: 110, class: "index-text", "text-anchor": "middle" }, `[${k}]`),
        s("line", { x1: lx(j) + lw - 18, y1: 77, x2: lx(j) + lw - 2, y2: 77, class: "edge link" }),
      ]);
      const end = order.length ? lx(order.length - 1) + lw - 2 : 40;
      const head = [s("rect", { x: 6, y: 70, width: 14, height: 14, class: "frame" }),
        s("text", { x: 13, y: 52, class: "index-text", "text-anchor": "middle" }, "head"),
        s("line", { x1: 20, y1: 77, x2: 38, y2: 77, class: "edge link" }),
        s("text", { x: Math.min(end + 8, 450), y: 82, class: "value-text", "text-anchor": "middle" }, "×")];
      const bottom = list.nodes.flatMap((nd, k) => [
        s("rect", { x: x0 + k * w + 1, y: 180, width: w - 2, height: 34, class: `cell ${nd.next === -2 ? "out" : ""} ${last.links.some(([f]) => f === k) ? "swap" : ""}` }),
        s("text", { x: x0 + k * w + w / 2, y: 202, class: "value-text", "text-anchor": "middle" }, w >= 40 ? `${nd.element}→${nextText(nd.next)}` : nd.element),
        s("text", { x: x0 + k * w + w / 2, y: 232, class: "index-text", "text-anchor": "middle" }, String(k)),
      ]);
      box.replaceChildren(s("svg", { viewBox: "0 0 460 260", class: "schematic", role: "img",
        "aria-label": `A list of ${order.length} nodes: ${order.map(k => list.nodes[k].element).join(" ")}, kept in an array of ${n} cells` },
        s("text", { x: 230, y: 24, class: "index-text", "text-anchor": "middle" }, "in list order"),
        s("text", { x: 230, y: 168, class: "index-text", "text-anchor": "middle" }, "in the array (index under each cell)"),
        ...head, ...top, ...bottom));
      rO.set(order.length ? order.map(k => list.nodes[k].element).join(" → ") : "empty", "", `head = ${nextText(list.head)}`);
      rA.set(list.nodes.map((nd, k) => `${k}: ${nd.element} ${nextText(nd.next)}`).join(" · ") || "empty", "", "−1 ends the list (p. 268); −2 marks a removed node (p. 272)");
      rL.set(last.links.length ? last.links.map(([f, t]) => `${f === "head" ? "head" : `[${f}].next`} = ${nextText(t)}`).join("; ") : "none yet");
      posSlider.set(Math.min(position, order.length));
    };
    const posSlider = slider({ label: "Insert after how many nodes (0: at the head)", unit: "", min: 0, max: 12, value: position, step: 1, format: v => String(v), onInput: v => { position = v; } });
    const insert = () => {
      const ch = letter.value.trim().slice(0, 1);
      if (!ch || list.nodes.length >= 12) return;
      const r = listInsert(list, ch, position); list = r.list; last = r; update();
    };
    const remove = () => {
      const ch = letter.value.trim().slice(0, 1);
      if (!ch) return;
      const r = listRemove(list, ch); list = r.list; last = { ...r, node: -1 };
      update();
      if (!r.found) rL.set(`'${ch}' is not in the list: nothing changed`, "warn", "ListeEntfernen returns 0 (p. 272)");
    };
    const form = h("form", { class: "control", onsubmit: e => { e.preventDefault(); insert(); } },
      h("label", { for: "list-letter" }, "Element (one letter)"), letter);
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      form, posSlider,
      h("div", { class: "buttons" },
        h("button", { type: "button", onclick: insert }, "Insert (ListeEinfuegen)"),
        h("button", { type: "button", onclick: remove }, "Remove the first such element (ListeEntfernen)"),
        h("button", { type: "button", onclick: () => { list = listFrom("LISTE"); last = { walked: [], links: [], node: -1 }; update(); } }, "Start again: L I S T E")),
      rO.el, rA.el, rL.el,
      h("p", { class: "hint" }, "Insert E after 1 node: the new node lands at the end of the array, yet the list reads L E I S T E, because only two links changed (Fig. 19.6, p. 270). Remove T: its predecessor now points past it, and T stays in the array marked −2 (p. 272). Finding the place still means walking from the head; the walked nodes are marked."))));
    update();
  },
};
