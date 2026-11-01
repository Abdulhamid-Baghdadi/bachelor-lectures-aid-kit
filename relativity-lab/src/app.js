// The page has two views. The overview: the chapters of the lecture notes in order, each with a row of cards, one per
// lab it teaches, a picture of the idea on each. A lab: its chapter above it, its field, its practice, and the previous
// and next lab as small cards below. The address (#minkowski) says which lab is open; none means the overview.
// Reads the words from data/labs.json; a lab with no words there, or words with no lab, is reported, not skipped.
import { h, practice } from "../../kit/ui/kit.js";
import { parseSi } from "./core/index.js";
import { labs } from "./labs/index.js";

const main = document.querySelector("main");

/** "§§ 3–5": the labs follow the sections of Einstein (1905), grouped in his two parts. */
const chapterOf = lecture => `${String(lecture.number).includes("–") ? "§§" : "§"} ${lecture.number}`;

function fail(message) {
  main.replaceChildren(h("p", { class: "error", role: "alert" }, message));
}

async function start() {
  let data;
  try {
    data = await (await fetch("data/labs.json")).json();
  } catch (error) {
    fail(`The labs' texts (data/labs.json) could not be read: ${error.message}. Open the page through a web server ` +
         "(the published site, or python -m http.server in this folder), not by double-clicking the file.");
    return;
  }
  const words = new Map(data.labs.map(l => [l.id, l]));
  const code = new Map(labs.map(l => [l.id, l]));
  const missing = [...labs.filter(l => !words.has(l.id)).map(l => l.id),
                   ...data.labs.filter(w => !code.has(w.id)).map(w => w.id)];
  if (missing.length) console.error(`Labs and data/labs.json disagree about: ${missing.join(", ")}`);

  // The notes' order: chapter by chapter, the labs in the order each lecture lists them.
  const order = data.lectures.flatMap(lecture => lecture.labs.filter(id => code.has(id) && words.has(id)).map(id => ({ id, lecture })));
  const at = new Map(order.map((entry, k) => [entry.id, k]));
  const family = new Map(data.families.map(f => [f.id, f.name]));

  /** A card for a lab: its picture, its title, its lecture. The whole card is the link. */
  const card = ({ id, lecture }, small = false, label = "") => {
    // The picture is decoration inside the link, whose name is the title; it is the lab's own SVG text, never input.
    const art = h("span", { class: "art", "aria-hidden": "true" });
    art.innerHTML = code.get(id).art();
    return h("a", { href: `#${id}`, class: `card${small ? " small" : ""}`, "data-family": lecture.family },
      art, h("span", { class: "plate" },
        label ? h("span", { class: "dir" }, label) : null,
        h("span", { class: "name" }, words.get(id).title),
        h("span", { class: "meta" }, `${chapterOf(lecture)} · ${family.get(lecture.family)}`)));
  };

  const overview = h("div", { class: "overview" },
    h("p", { class: "lead" }, "Pick an idea. They follow Einstein (1905), section by section."),
    h("div", { class: "lecture-rows" }, data.lectures.filter(lecture => lecture.labs.some(id => at.has(id))).map(lecture => h("section", { class: "lecture-row" },
      h("h2", {}, h("span", { class: "number" }, `${chapterOf(lecture)}`), " ", lecture.title,
        h("span", { class: "date" }, lecture.pages)),
      h("div", { class: "cards" }, lecture.labs.filter(id => at.has(id)).map(id => card(order[at.get(id)])))))));

  const panels = new Map();
  const panel = id => {
    if (panels.has(id)) return panels.get(id);
    const w = words.get(id), { lecture } = order[at.get(id)];
    const prev = order[at.get(id) - 1], next = order[at.get(id) + 1];
    const body = h("div", { class: "lab" });
    // The lab opens with its card, large: the same picture and frame as on the overview, so the two read as one.
    const art = h("span", { class: "art", "aria-hidden": "true" });
    art.innerHTML = code.get(id).art();
    const section = h("section", { class: "panel", "data-family": lecture.family, "aria-labelledby": `title-${id}` },
      h("a", { href: "#", class: "back" }, "← All labs"),
      h("header", { class: "hero" },
        h("div", { class: "hero-card" }, art, h("span", { class: "plate" },
          h("span", { class: "name" }, w.title), h("span", { class: "meta" }, `${chapterOf(lecture)} · ${family.get(lecture.family)}`))),
        h("div", { class: "intro" },
          h("p", { class: "eyebrow" }, `${chapterOf(lecture)} · ${lecture.pages} · ${lecture.title}`),
          h("h2", { id: `title-${id}`, tabindex: "-1" }, w.title), h("p", { class: "idea" }, w.idea),
          h("p", { class: "law" }, w.law), h("p", { class: "source" }, `Source: ${w.lecture}`))),
      body,
      // The full set for readers who know the subject: each equation with what it is and its number in the notes.
      w.equations?.length ? h("section", { class: "equations" }, h("h3", {}, "The equations"),
        h("table", { class: "eqs" }, h("tbody", {}, w.equations.map(e => h("tr", {},
          h("td", { class: "eq" }, e.eq), h("td", { class: "note" }, e.note), h("td", { class: "ref" }, e.ref || "derived")))))) : null,
      w.practice.length ? h("section", { class: "practice-list" }, h("h3", {}, "Practise"),
        w.practice.map(q => practice({ ...q, parse: parseSi }))) : null,
      h("nav", { class: "steps", "aria-label": "Previous and next lab" },
        prev ? card(prev, true, "← Previous") : h("span"), next ? card(next, true, "Next →") : h("span")));
    code.get(id).mount(body);
    panels.set(id, section);
    return section;
  };

  let last = "";
  const show = focus => {
    const id = location.hash.slice(1);
    if (at.has(id)) {
      // A lab keeps its knobs where the student left them when they come back to it.
      main.replaceChildren(panel(id));
      document.title = `${words.get(id).title} · Special Relativity Lab`;
      if (focus) { scrollTo({ top: 0 }); main.querySelector("h2").focus({ preventScroll: true }); }
    } else {
      main.replaceChildren(overview);
      document.title = "Special Relativity Lab";
      // Back on the overview, the card of the lab just left keeps the focus, so the keyboard does not start over.
      const from = overview.querySelector(`a[href="#${last}"]`);
      if (focus && from) { from.focus({ preventScroll: true }); from.scrollIntoView({ block: "center" }); }
    }
    last = id;
  };
  addEventListener("hashchange", () => show(true));
  show(false);
}

document.querySelector("#theme").addEventListener("click", () => {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch { /* private window: the choice lasts this visit */ }
});

start();
