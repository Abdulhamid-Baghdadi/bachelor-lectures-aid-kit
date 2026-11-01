# Writing the equations in LaTeX

For the sessions converting and auditing each lab. The pilot, fully converted: `signals-systems-lab/data/labs.json`.

## Where it goes

In a lab's `data/labs.json`, beside the plain text that stays:

```json
"law": "Δf = fs/N",
"lawTex": "\\Delta f = \\frac{f_\\mathrm{s}}{N}",
"equations": [
  { "eq": "x[n] = x(nT),  fs = 1/T", "tex": "x[n] = x(nT), \\qquad f_\\mathrm{s} = \\frac{1}{T}", "note": "ideal sampling", "ref": "SS2 §4.1" }
]
```

- `tex` and `lawTex` are optional. Without them the page shows `eq` and `law` as before, so a lab can be converted one
  equation at a time. Keep `eq` and `law`: they are the plain-text fallback and what a search finds.
- Backslashes are doubled in JSON. Insert with a small script (`JSON.stringify(String.raw`...`)`) rather than by hand.
- The page sets every equation in display style. Several equations on one line are separated by `\qquad`.
- `node --test "kit/tests/*.test.js"` typesets every `tex` and `lawTex` of every lab and fails on any that does not
  parse. On the page, one that does not parse shows its source with a red note saying why.
- Add the lab's own test that every equation has its `tex` once it is fully converted (as
  `signals-systems-lab/tests/unit/labs-math.test.js`).

## Notation

ISO 80000-2 style, as LaTeX sets it; where the source writes otherwise, the source wins (last rule).

| What | Write | Not |
|---|---|---|
| Variables, functions of them | italic, the default: `x(t)`, `U`, `f` | |
| Euler's e, imaginary unit j, differential d | upright: `\mathrm{e}^{\mathrm{j}\omega t}`, `\,\mathrm{d}t` | `e^{jωt}`, `dt` |
| Named functions | `\sin`, `\cos`, `\tan`, `\log_2`, `\operatorname{sinc}`, `\operatorname{rect}`, `\operatorname{E}\{\cdot\}` | `sinc(x)` in italic |
| Subscripts that are words or abbreviations | upright: `f_\mathrm{s}`, `f_\mathrm{max}`, `h_\mathrm{ideal}`, `H_\mathrm{a}`, `U_\mathrm{eff}` | `f_s`, `f_{max}` |
| Subscripts that are indices or variables | italic: `c_k`, `I_1`, `r_{xx}`, `N_x` | |
| Numbers with units | thin space, upright unit: `8\,\mathrm{kHz}`, `230\,\mathrm{V}`, `25\,^\circ\mathrm{C}` | `8 kHz`, `8kHz` |
| Phasors, complex amplitudes | as the source marks them: `\hat{B}`, `\underline{U}` | |
| Vectors | as the source writes them: bold `\mathbf{E}` (bold italic: `\boldsymbol{E}`) or arrow `\vec{E}` | mixing both in one lab |
| Fractions | `\frac{a}{b}` on the main line; `a/b` inside exponents and arguments: `\mathrm{e}^{\mathrm{j}2\pi k n/N}` | |
| Brackets that must grow | `\big(`, `\Big(`, or `\left( … \right)` | |
| Text inside an equation | `\text{period } 2\pi`, `\quad \text{for } n \ge 0` | bare words in italic |
| Transform pairs | the source's symbol: `\leftrightarrow`, or `\;\circ\!\!-\!\!\bullet\;` where a German text draws ○—● | |

**German source symbols stay as the source writes them**: its letters for quantities (`U` not `V` for voltage, `\Phi`
for a power spectrum if the text says so), its accents and underlines, and its correspondence symbol. The audit
checks each against the source and notes the page it read; the LaTeX never "corrects" the source's notation.

## Example

Plain text: `x(t) = Σₙ x[n] sinc((t − nT)/T)`, ideal reconstruction.

```latex
x(t) = \sum_n x[n] \operatorname{sinc}\!\Big(\frac{t - nT}{T}\Big)
```

Upright sinc, `\!` pulling the bracket to the function name, `\Big` brackets around the fraction, `\sum_n` with its
index below in display style.

## Check before committing

1. `node --test "kit/tests/*.test.js"` and the lab's own `node --test "tests/unit/*.test.js"`.
2. Open the lab in the browser pane: each converted equation in light and dark, at 375 px width (a long one scrolls
   inside its own box, the page never sideways), and by keyboard (Tab reaches a box that scrolls).
