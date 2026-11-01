// The page's building blocks every lab draws with: a labelled slider, a readout, an SVG helper and the practice
// question. Each lab composes these; none of them knows a law.
import { si, isRight } from "../core/index.js";

/** An element with attributes and children; strings become text. */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (v !== false && v !== null && v !== undefined) el.setAttribute(k, v === true ? "" : v);
  }
  // A control from this kit ({ el, ... }) can be given as it is.
  el.append(...children.flat().filter(c => c !== null && c !== undefined && c !== false).map(c => c.el instanceof Node ? c.el : c));
  return el;
}

const SVGNS = "http://www.w3.org/2000/svg";
export function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.append(...children);
  return el;
}

let uid = 0;

/** A slider on a logarithmic or linear scale, labelled "Quantity [unit]", with its value typed beside it.
 *  onInput gets the value in SI units. */
export function slider({ label, unit, min, max, value, log = false, step, onInput, help, format = v => si(v, unit) }) {
  const id = `in${++uid}`;
  const toPos = v => log ? Math.log10(v) : v;
  const fromPos = p => log ? 10 ** p : p;
  const range = h("input", { type: "range", id, min: toPos(min), max: toPos(max),
                             step: step ?? (log ? 0.01 : (max - min) / 200), value: toPos(value) });
  const out = h("output", { for: id, class: "value" }, format(value));
  const set = v => { range.value = toPos(v); out.textContent = format(v); };
  range.addEventListener("input", () => {
    let v = fromPos(Number(range.value));
    if (log) v = Number(v.toPrecision(2));
    out.textContent = format(v);
    onInput(v);
  });
  const row = h("div", { class: "control" },
    h("label", { for: id }, unit ? `${label} [${unit}]` : label), range, out,
    help ? h("p", { class: "hint" }, help) : null);
  return { el: row, set, get: () => fromPos(Number(range.value)) };
}

/** A labelled result that updates; tone "warn" or "danger" adds a word, never colour alone. */
export function readout(label) {
  const value = h("span", { class: "value" });
  const note = h("span", { class: "note" });
  const el = h("div", { class: "readout", role: "status" }, h("span", { class: "label" }, label), value, note);
  return {
    el,
    set(text, tone = "", why = "") {
      value.textContent = text;
      el.dataset.tone = tone;
      note.textContent = why;
    },
  };
}

/** A group of buttons that pick one of several options (radio semantics, keyboard by the browser). */
export function choice(label, options, value, onChange) {
  const name = `c${++uid}`;
  return h("fieldset", { class: "choice" }, h("legend", {}, label),
    options.map(([v, text]) => h("label", {},
      h("input", { type: "radio", name, value: v, checked: v === value, onchange: () => onChange(v) }), text)));
}

/** A practice question from the course's exercise sheet: the student types an answer with its prefix ("22.5 m"),
 *  and it is right within the tolerance. The worked solution opens on request. */
/** The placeholder of a practice answer: "Number in Hz", or "A number" when the answer has no unit ("" or "1"). */
export const answerHint = unit => unit && unit !== "1" ? `Number in ${unit}` : "A number";

export function practice({ question, source, answer, unit, tolerance = 0.02, solution, parse }) {
  const id = `q${++uid}`;
  // The hint names what this question expects; a sample value would mislead, since every question has its own scale.
  const input = h("input", { id, type: "text", inputmode: "decimal", autocomplete: "off", placeholder: answerHint(unit) });
  const verdict = h("p", { class: "verdict", role: "status" });
  const check = e => {
    e.preventDefault();
    const v = parse(input.value);
    if (v === null) { verdict.textContent = `Write a number, with a prefix if you like (k, m, µ). Unit: ${unit}.`; verdict.dataset.tone = "warn"; return; }
    const ok = isRight(v, answer, tolerance);
    verdict.dataset.tone = ok ? "ok" : "danger";
    verdict.textContent = ok ? `Right: ${si(answer, unit)}.` : `Not yet: you have ${si(v, unit)}. Check your units, then try again.`;
  };
  return h("form", { class: "practice", onsubmit: check },
    h("label", { for: id }, question), h("div", { class: "row" }, input, h("span", {}, unit), h("button", { type: "submit" }, "Check")),
    verdict,
    h("details", {}, h("summary", {}, "Show the solution"), h("p", {}, solution)),
    h("p", { class: "source" }, `Source: ${source}`));
}
