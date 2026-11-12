// The program stack, Klima and Selberherr (2010) § 18.2, pp. 258–259: every call of a function puts a frame with its
// own local variables on the stack, every return takes it off. A recursive factorial shows the stack grow and shrink.
import { factorialFrames } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "stack",
  art: () => a.picture("A pile of frames, the newest on top",
    [0, 1, 2, 3].map(k => a.rect(50, 120 - k * 26, 100, 22, k === 3 ? a.ACC : a.INK, 2)).join("") + a.arrow(170, 50, 170, 20, a.DIM, 2)),
  mount(root) {
    let n = 5, k = 0;
    const box = h("div", {}), rD = readout("Frames on the stack"), rW = readout("What happens now");
    const update = () => {
      const events = factorialFrames(n), e = events[Math.min(k, events.length - 1)];
      const frames = e.stack.map((v, i) => [
        s("rect", { x: 130, y: 260 - (i + 1) * 30, width: 200, height: 26, class: `frame ${i === e.stack.length - 1 ? "top" : ""}` }),
        s("text", { x: 230, y: 260 - (i + 1) * 30 + 18, class: "value-text", "text-anchor": "middle" }, `factorial: n = ${v}`)]).flat();
      box.replaceChildren(s("svg", { viewBox: "0 0 460 300", class: "schematic", role: "img", "aria-label": `The stack with ${e.stack.length} frames` },
        s("line", { x1: 120, y1: 262, x2: 340, y2: 262, class: "axis" }), s("text", { x: 230, y: 285, class: "index-text", "text-anchor": "middle" }, "bottom of the stack"), ...frames));
      rD.set(String(e.stack.length), "", `at most ${n + 1} for factorial(${n}): n = ${n} down to 0`);
      rW.set(e.what);
      stepSlider.el.querySelector("input").max = String(events.length - 1);
    };
    const stepSlider = slider({ label: "Step", unit: "", min: 0, max: 9, value: k, step: 1, format: v => String(v), onInput: v => { k = v; update(); } });
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "n in factorial(n)", unit: "", min: 1, max: 8, value: n, step: 1, format: v => String(v), onInput: v => { n = v; k = 0; stepSlider.set(0); update(); } }),
      stepSlider, rD.el, rW.el,
      h("p", { class: "hint" }, "Step through: each call adds a frame with its own n, so the calls do not overwrite each other's variables; each return removes the top frame. A recursion that never stops fills the stack until the program fails. Memory from malloc does not live here: it lives on the heap until free, as the next labs show."))));
    update();
  },
};
