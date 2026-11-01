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

/** An element showing tex as typeset mathematics. Inline it is a span; display: true sets it on its own line. A long
 *  equation scrolls inside its own box, never the page. If the LaTeX does not parse, the source is shown as it is with
 *  a note saying why, so a typo is seen and fixed rather than hidden. */
export function math(tex, { display = false } = {}) {
  const el = document.createElement(display ? "div" : "span");
  el.className = display ? "math math-display" : "math";
  const { markup, error } = typeset(tex, { display });
  if (!error) {
    el.innerHTML = markup;
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
