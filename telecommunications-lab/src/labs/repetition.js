// Repetition and residual errors (Goiser 2016, set 6, slides 36–63): the probability that a word of n bits has more
// errors than its code corrects, for the repetition code decided by majority, and a seeded count beside it.
import { repetitionError, repetitionCounted, errorsExactly, uniform, sci } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "repetition",
  art: () => a.picture("Three copies of a bit, one of them flipped, and a vote that keeps the right one",
    [40, 75, 110].map((y, k) => a.rect(20, y - 13, 40, 26, k === 1 ? a.HOT : a.INK, 2) + a.text(40, y + 6, k === 1 ? "0" : "1", 18, k === 1 ? a.HOT : a.INK)).join("") +
      a.line([[60, 40], [120, 75], [60, 110]], a.DIM, 2) + a.line([[60, 75], [120, 75]], a.DIM, 2) +
      a.rect(125, 55, 50, 40, a.ACC, 3) + a.text(150, 82, "1", 22, a.ACC)),
  mount(root) {
    let n = 3, p = 0.05;
    const box = h("div", {}), rW = readout("Word error after the vote"), rC = readout("Counted"), rR = readout("Code rate");
    const update = () => {
      const ms = Array.from({ length: n + 1 }, (_, m) => m), t = (n - 1) / 2;
      box.replaceChildren(lineChart({ label: `How many of the ${n} copies arrive wrong`,
        lines: [{ x: ms.filter(m => m <= t), y: ms.filter(m => m <= t).map(m => errorsExactly(n, m, p)), name: "corrected", stem: true },
                { x: ms.filter(m => m > t), y: ms.filter(m => m > t).map(m => errorsExactly(n, m, p)), name: "decided wrongly", stem: true, cls: "second" }],
        xLabel: "Bit errors in the word m [1]", yLabel: "Probability P(m) [1]", yMin: 0, yMax: 1, xMin: -0.5, xMax: n + 0.5 }));
      rW.set(sci(repetitionError(n, p)), "", `more than ${t} of ${n} wrong; uncoded ${p}`);
      rC.set(sci(repetitionCounted(n, p, uniform(n * 1000 + Math.round(p * 1e4)), 100000)), "", "100 000 seeded words");
      rR.set(`1/${n}`, n > 3 ? "warn" : "", `${n} channel bits for every data bit`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Copies n (odd)", unit: "", min: 1, max: 11, value: n, step: 2, format: v => `${v}`, onInput: v => { n = v; update(); } }),
      slider({ label: "Channel bit error probability p", unit: "", min: 0.001, max: 0.4, value: p, log: true, format: v => `${v}`, onInput: v => { p = v; update(); } }),
      rW.el, rC.el, rR.el,
      h("p", { class: "hint" }, "The slides' example (slide 42): n = 3, p = 0.001 gives 3·10⁻⁶. The vote helps only while p is below one half. Each copy costs rate: at the same transmit power each copy also carries less energy, which is why better codes than repetition exist."))));
    update();
  },
};
