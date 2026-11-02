// Dynamic memory in C (Klima and Selberherr 2010, ch. 20, pp. 303–310): malloc asks for a block on the heap, realloc
// resizes it and may move it, free gives it back. Every slip the chapter lists shows here: leaks, double free, use
// after free, and the pointer set to 0 after free that makes a second free harmless.
import { emptyHeap, malloc, free, realloc, setNull, use, leaks, ROUND } from "../core/index.js";
import { h, s, slider, readout, choice } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";

const SIZE = 64;

export default {
  id: "malloc",
  art: () => a.picture("A strip of memory with blocks taken and freed, one block with no arrow pointing at it",
    a.rect(10, 80, 180, 30, a.DIM, 2) + a.rect(10, 80, 40, 30, a.ACC, 3) + a.rect(80, 80, 50, 30, a.HOT, 3) +
      a.arrow(30, 30, 30, 76, a.INK, 2) + a.text(105, 135, "leak", 14, a.HOT)),
  mount(root) {
    let st = emptyHeap(SIZE), name = "p", n = 10;
    const box = h("div", {}), rV = readout("Pointers"), rL = readout("Leaked bytes"), log = h("ol", { class: "log", "aria-live": "polite" });
    const update = () => {
      const cell = 440 / SIZE, lost = leaks(st);
      const blocks = st.blocks.filter(b => !b.freed).map(b => s("rect", { x: 10 + b.at * cell, y: 130, width: b.length * cell - 2, height: 40,
        class: `block ${lost.includes(b) ? "leaked" : ""}` }));
      const freed = st.blocks.filter(b => b.freed && !st.blocks.some(o => !o.freed && o.at < b.at + b.length && b.at < o.at + o.length))
        .map(b => s("rect", { x: 10 + b.at * cell, y: 130, width: b.length * cell - 2, height: 40, class: "block freed" }));
      const arrows = Object.entries(st.vars).filter(([, v]) => v).flatMap(([k, v], i) => {
        const x = 10 + (v - 1) * cell + 6;
        return [s("line", { x1: x, y1: 70 - i * 0, x2: x, y2: 126, class: "pointer" }), s("text", { x: x - 2, y: 60 - (i % 2) * 18, class: "label" }, k)];
      });
      const ticks = Array.from({ length: SIZE / ROUND + 1 }, (_, i) => s("text", { x: 10 + i * ROUND * cell, y: 192, class: "index-text", "text-anchor": "middle" }, String(i * ROUND + 1)));
      box.replaceChildren(s("svg", { viewBox: "0 0 460 300", class: "schematic", role: "img", "aria-label": `A heap of ${SIZE} bytes with ${st.blocks.filter(b => !b.freed).length} blocks in use` },
        s("rect", { x: 10, y: 130, width: 440, height: 40, class: "heap-strip" }), ...freed, ...blocks, ...arrows, ...ticks,
        s("text", { x: 230, y: 230, class: "index-text", "text-anchor": "middle" }, `heap of ${SIZE} bytes; addresses start at 1, 0 is the null pointer`)));
      rV.set(Object.entries(st.vars).map(([k, v]) => `${k} = ${v}`).join(", ") || "none yet");
      const lb = lost.reduce((t, b) => t + b.length, 0);
      rL.set(String(lb), lb ? "warn" : "", lb ? "blocks no pointer reaches: they stay taken until the program ends" : "");
      log.replaceChildren(...st.log.slice(-8).map(e => h("li", { "data-tone": e.tone }, e.text)));
    };
    const act = f => () => { st = f(st); update(); };
    root.append(h("div", { class: "stage" }, h("div", {}, box, log), h("div", { class: "controls" },
      choice("Pointer", [["p", "p"], ["q", "q"]], name, v => { name = v; }),
      slider({ label: "Bytes asked for", unit: "", min: 1, max: 40, value: n, step: 1, format: v => String(v), onInput: v => { n = v; } }),
      h("div", { class: "buttons" },
        h("button", { type: "button", onclick: act(t => malloc(t, name, n)) }, "malloc"),
        h("button", { type: "button", onclick: act(t => realloc(t, name, n)) }, "realloc"),
        h("button", { type: "button", onclick: act(t => free(t, name)) }, "free"),
        h("button", { type: "button", onclick: act(t => setNull(t, name)) }, "set to 0"),
        h("button", { type: "button", onclick: act(t => use(t, name)) }, "write through it"),
        h("button", { type: "button", onclick: act(t => ({ ...t, vars: { ...t.vars, q: t.vars.p ?? 0 }, log: [...t.log, { text: "q = p: two pointers, one block", tone: "" }] })) }, "q = p"),
        h("button", { type: "button", onclick: act(() => emptyHeap(SIZE)) }, "Start again")),
      rV.el, rL.el,
      h("p", { class: "hint" }, "Try the book's slips: malloc twice into p without free (a leak, § 20.5.11); free(p) twice (§ 20.5.3); free, then write through p (§ 20.5.7); q = p, then realloc(p) to a larger size so the block moves and q is left pointing at freed memory (p. 308). The safe habit: free(p), then p = 0 (p. 308)."))));
    update();
  },
};
