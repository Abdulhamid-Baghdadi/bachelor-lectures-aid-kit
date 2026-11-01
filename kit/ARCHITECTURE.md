# The shared kit

Every lab of the Bachelor lectures aid kit imports this folder by relative path; each lab's own ARCHITECTURE.md and
architecture.json name its layers, bottom first:

| Layer | Files | May use | Front door |
|---|---|---|---|
| vendor | `vendor/*.mjs` | nothing | Temml, `vendor/temml.mjs`, imported only by `ui/math.js` |
| kit-core | `core/**` | nothing | `core/index.js` |
| kit | `ui/**` | kit-core, vendor | `ui/kit.js`, `ui/chart.js`, `ui/field.js`, `ui/art.js`, `ui/math.js` |

Tests: `node --test "kit/tests/*.test.js"` from the repository root. The layering of each lab, the kit within it, is
checked by `scripts/check-architecture.js`, run from every lab's `tests/unit/architecture.test.js`.

## The one library: Temml

The house rule is plain web: plain JavaScript, no framework, no build step, a library only as a stated exception.
Temml (`vendor/`, version and source in `vendor/README.md`) is that exception, chosen on 1 Nov 2026 over KaTeX and over
writing a typesetter:

- **MathML.** It turns LaTeX into MathML, which the browser lays out itself. Typesetting mathematics as LaTeX sets it is
  a large, solved problem; writing it again would be reinventing it badly.
- **No fonts.** The equations use the system's math font (Cambria Math on Windows), so nothing is loaded from the
  network and the site works offline.
- **Accessible.** MathML is read by screen readers, takes the theme's text colour, zooms with the page, and carries
  its LaTeX source as an annotation.

Only `ui/math.js` imports it: `math(tex, { display })` returns an element, and `typeset(tex)` the markup without a DOM.
Temml's own `throwOnError: false` shows an unknown command as red text and reports nothing, so the helper asks Temml to
throw, catches the error and shows the LaTeX source with a note saying why. Nothing fails silently.

How to write the LaTeX in a lab's `labs.json`: `MATH.md`.
