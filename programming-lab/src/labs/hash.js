// The hash with separate chaining, Klima and Selberherr (2010) § 19.6, pp. 293–300: a hash function turns a key into
// an index 0 … N − 1, and each array cell holds the head of a list of the records that share that index. Few records
// per list mean few comparisons; a short array or a poor spread of keys makes the lists long.
import { emptyHash, hashInsert, hashSearch, hashIndex, hashCosts } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";

const BOOK = ["Wald", "Wiese", "Dorf", "Bach", "Holz"];

export default {
  id: "hash",
  art: () => a.picture("A column of boxes, two of them with short chains of boxes hanging to the right",
    [0, 1, 2, 3, 4].map(k => a.rect(30, 22 + k * 24, 20, 20, k === 2 ? a.ACC : a.INK, 2)).join("") +
      a.arrow(50, 80, 74, 80, a.DIM, 2) + a.rect(76, 70, 34, 20, a.INK, 2) + a.arrow(110, 80, 130, 80, a.DIM, 2) + a.rect(132, 70, 34, 20, a.INK, 2) +
      a.arrow(50, 32, 74, 32, a.DIM, 2) + a.rect(76, 22, 34, 20, a.INK, 2)),
  mount(root) {
    let n = 11, words = [...BOOK], next = BOOK.length, last = { index: -1, word: "" };
    const box = h("div", {}), rI = readout("Index of the word"), rC = readout("Mean comparisons"), rS = readout("Last step");
    const word = h("input", { type: "text", id: "hash-word", maxlength: 20, value: "Wald", size: 12, autocomplete: "off" });
    const table = () => words.slice(0, next).reduce((t, w) => hashInsert(t, w).table, emptyHash(n));
    const update = () => {
      const t = table(), rowH = 26, wide = Math.max(320, 84 + Math.max(...t.map(l => l.length)) * 76);
      const rows = t.flatMap((list, i) => [
        s("rect", { x: 40, y: 10 + i * rowH, width: 26, height: rowH - 4, class: `cell ${i === last.index ? "probe" : ""}` }),
        s("text", { x: 30, y: 10 + i * rowH + rowH / 2 + 2, class: "index-text", "text-anchor": "end" }, String(i)),
        ...list.flatMap((w, k) => [
          s("line", { x1: k ? 74 + k * 76 - 8 : 66, y1: 8 + i * rowH + rowH / 2, x2: 76 + k * 76, y2: 8 + i * rowH + rowH / 2, class: "edge link" }),
          s("rect", { x: 76 + k * 76, y: 10 + i * rowH, width: 66, height: rowH - 4, class: `cell ${i === last.index && w === last.word ? "hit" : ""}` }),
          s("text", { x: 109 + k * 76, y: 10 + i * rowH + rowH / 2 + 3, class: "value-text", "text-anchor": "middle" }, w.length > 7 ? w.slice(0, 6) + "…" : w)]),
      ]);
      box.replaceChildren(s("svg", { viewBox: `0 0 ${wide} ${12 + n * rowH}`, class: "schematic", role: "img",
        "aria-label": `A hash of length ${n} holding ${words.slice(0, next).length} words in ${t.filter(l => l.length).length} lists` }, ...rows));
      const c = hashCosts(t);
      rC.set(`${c.unsuccessful.toFixed(2)} unsuccessful, ${c.successful.toFixed(2)} successful`, "",
        `${c.m} records in ${n} lists: sum of list lengths / N, and sum of the records' places / M (pp. 299–300)`);
      const w = word.value.trim();
      if (w) {
        const r = hashIndex(w, n);
        rI.set(String(r.index), "", `index = (64 · index + code) % ${n} over ${[...w].slice(0, 20).length} letters: ${r.steps.join(", ")} (p. 297)`);
      } else rI.set("—", "", "type a word");
    };
    const insert = () => { const w = word.value.trim(); if (!w || next >= 40) return; words = [...words.slice(0, next), w]; next = words.length;
      last = { index: hashIndex(w, n).index, word: w }; update(); rS.set(`${w} put at the head of list ${last.index}`); };
    const search = () => { const w = word.value.trim(); if (!w) return; const r = hashSearch(table(), w); last = { index: r.index, word: r.found ? w : "" }; update();
      rS.set(r.found ? `${w} found in list ${r.index} after ${r.comparisons} comparison${r.comparisons === 1 ? "" : "s"}` : `${w} not found: ${r.comparisons} comparison${r.comparisons === 1 ? "" : "s"} along list ${r.index}`, r.found ? "" : "warn"); };
    const form = h("form", { class: "control", onsubmit: e => { e.preventDefault(); insert(); } },
      h("label", { for: "hash-word" }, "Word"), word);
    word.addEventListener("input", update);
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Length of the array N", unit: "", min: 2, max: 23, value: n, step: 1, format: v => String(v), onInput: v => { n = v; last = { index: -1, word: "" }; update(); } }),
      form,
      h("div", { class: "buttons" },
        h("button", { type: "button", onclick: insert }, "Insert"),
        h("button", { type: "button", onclick: search }, "Search"),
        h("button", { type: "button", onclick: () => { words = [...BOOK]; next = BOOK.length; last = { index: -1, word: "" }; update(); rS.set("the book's five words, Fig. 19.34(f)"); } }, "Start again: the book's five words"),
        h("button", { type: "button", onclick: () => { words = []; next = 0; last = { index: -1, word: "" }; update(); rS.set("an empty hash, Fig. 19.34(a)"); } }, "Empty the hash")),
      rI.el, rC.el, rS.el,
      h("p", { class: "hint" }, "With N = 11, Wald, Dorf and Holz all land in list 5 (Table 19.2, p. 299), so a search for Wald looks at three words. Change N and every word is hashed again: try 16, which divides 64, so only the last letter decides the index (the effect the book shows for N = 256, p. 297), against a prime such as 13 or 17, as the book advises."))));
    update();
    rS.set("the book's five words, Fig. 19.34(f)");
  },
};
