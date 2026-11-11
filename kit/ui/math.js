// Typeset mathematics: LaTeX in, MathML out, through Temml (kit/vendor, the one library the labs use; why in
// ../ARCHITECTURE.md). The browser draws the MathML itself, so no font is loaded and a screen reader reads the
// equation; the LaTeX source rides along as its annotation.
import temml from "../vendor/temml.mjs";

/** The MathML markup for tex, or why it could not be typeset. Pure: runs without a DOM.
 *  Temml's own throwOnError: false shows an unknown command as red text and says nothing, so the error is caught here
 *  instead and reported; nothing is thrown. */
export function typeset(tex, { display = false } = {}) {
  if (typeof tex !== "string" || !tex.trim()) return { markup: "", error: "no LaTeX given" };
  try {
    return { markup: temml.renderToString(tex, { displayMode: display, throwOnError: true, annotate: true }), error: "" };
  } catch (e) {
    // Temml's second line repeats the source with the fault underlined; the element shows the source already.
    return { markup: "", error: String(e?.message ?? e).replace(/^\s*ParseError:\s*/, "").split("\n")[0].trim() };
  }
}

/** Does a box this wide hold content this wide only by scrolling? Then the keyboard must reach it (WCAG 2.1.1); one
 *  pixel of slack, since browsers round the two widths differently. Pure, so it is tested without a layout. */
export const scrolls = (scrollWidth, clientWidth) => scrollWidth > clientWidth + 1;

// One observer for every display equation: when a box's width changes (the page lays it out, the window narrows),
// it is a Tab stop exactly while its equation is wider than it. A box that fits adds no stop to the page.
const watcher = typeof ResizeObserver === "function" ? new ResizeObserver(entries => {
  for (const { target: el } of entries) {
    if (scrolls(el.scrollWidth, el.clientWidth)) {
      el.tabIndex = 0;
      el.setAttribute("role", "region");
      el.setAttribute("aria-label", "Equation, scrolls sideways");
    } else {
      el.removeAttribute("tabindex");
      el.removeAttribute("role");
      el.removeAttribute("aria-label");
    }
  }
}) : null;

/** Under an equation, what each of its symbols means (asked for 11 Nov 2026): "where", then each symbol typeset as in
 *  the equation beside its meaning in plain words. list: [{ tex, means }]; none or empty gives null, so a caller can
 *  pass an equation's list as it is. */
export function symbolList(list) {
  if (!Array.isArray(list) || !list.length) return null;
  const dl = document.createElement("dl");
  dl.className = "where";
  const head = document.createElement("span");
  head.className = "where-head";
  head.textContent = "where";
  dl.append(head);
  for (const s of list) {
    const row = document.createElement("div"), dt = document.createElement("dt"), dd = document.createElement("dd");
    dt.append(math(s.tex));
    dd.textContent = s.means;
    row.append(dt, dd);
    dl.append(row);
  }
  return dl;
}

/** An element showing tex as typeset mathematics. Inline it is a span; display: true sets it on its own line. A long
 *  equation scrolls inside its own box, never the page. If the LaTeX does not parse, the source is shown as it is with
 *  a note saying why, so a typo is seen and fixed rather than hidden. */
export function math(tex, { display = false } = {}) {
  const el = document.createElement(display ? "div" : "span");
  el.className = display ? "math math-display" : "math";
  const { markup, error } = typeset(tex, { display });
  if (!error) {
    el.innerHTML = markup;
    if (display) watcher?.observe(el);
    return el;
  }
  el.classList.add("math-error");
  const code = document.createElement("code");
  code.textContent = tex ?? "";
  const note = document.createElement("span");
  note.className = "math-error-note";
  note.textContent = `Could not typeset this equation: ${error}`;
  el.append(code, " ", note);
  return el;
}
