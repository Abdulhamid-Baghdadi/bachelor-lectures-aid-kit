// Who gives memory back: the same three situations in C, C++, Java, Python and JavaScript, each answer taken from
// that language's own documentation (src/core/memory.js names the source of each rule).
import { LANGUAGES, SCENARIOS, fate } from "../core/index.js";
import { h, readout, choice } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";

const WORDS = { now: "freed at once", later: "freed at a later collection", never: "never freed by itself: a leak", "n/a": "not covered here" };

export default {
  id: "languages",
  art: () => a.picture("Five columns, one per language, each with an object freed at a different time",
    [0, 1, 2, 3, 4].map(k => a.rect(14 + k * 36, 40, 28, 90, a.DIM, 2) + a.circle(28 + k * 36, 60 + [60, 30, 50, 30, 50][k], 7, [a.HOT, a.ACC, a.COOL, a.ACC, a.COOL][k], 3)).join("")),
  mount(root) {
    let scenario = "drop";
    const box = h("div", { class: "lang-table" }), rS = readout("Freed at once"), rN = readout("Never freed by itself");
    const update = () => {
      const rows = Object.entries(LANGUAGES).map(([k, L]) => { const f = fate(k, scenario); return { k, L, f }; });
      box.replaceChildren(h("table", { class: "eqs" },
        h("caption", {}, SCENARIOS[scenario]),
        h("thead", {}, h("tr", {}, h("th", {}, "Language"), h("th", {}, "What happens to the object"), h("th", {}, "Why"), h("th", {}, "Rule and source"))),
        h("tbody", {}, rows.map(({ L, f }) => h("tr", { "data-when": f.when },
          h("th", { scope: "row" }, L.name), h("td", {}, h("strong", {}, WORDS[f.when])), h("td", {}, f.why), h("td", { class: "note" }, `${L.rule}. ${L.source}`))))));
      rS.set(rows.filter(r => r.f.when === "now").map(r => r.L.name).join(", ") || "none");
      rN.set(rows.filter(r => r.f.when === "never").map(r => r.L.name).join(", ") || "none", rows.some(r => r.f.when === "never") ? "warn" : "");
    };
    root.append(h("div", { class: "stage wide" }, box, h("div", { class: "controls" },
      choice("Situation", Object.entries(SCENARIOS), scenario, v => { scenario = v; update(); }),
      rS.el, rN.el,
      h("p", { class: "hint" }, "Three ways to give memory back. C leaves it to the programmer. C++ ties it to an owner whose end is known. Java, Python and JavaScript find unreachable objects themselves: CPython by counting references, which frees most objects at once but cannot see a cycle by itself; Java and JavaScript by tracing from the roots, which handles cycles but runs when the collector decides. Only the rules quoted from the sources are shown; real runtimes add much more."))));
    update();
  },
};
