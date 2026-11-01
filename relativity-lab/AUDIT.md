# Scientific audit, 1 Nov 2026

What was checked: every equation, constant, unit, readout text, hint text, chart label and practice answer of the four
labs. Sources: Einstein (1905), the scanned original (no text layer), pp. 897, 901–910 read as page images (PDF page =
printed page − 890); Prechtl (2010), eq. (2.43) on p. 38 and eq. (3.13) on p. 61, read in the PDF's text layer. Einstein
numbers no equations, so the references are pages. Each correction has its test in `tests/unit/audit.test.js`, which
failed before the fix. Every equation now has its LaTeX (`tex`, `lawTex`). They typeset without error (`kit/tests`), and
`tests/unit/labs-math.test.js` checks that none is missing.

**Notation.** The lab now writes modern symbols throughout: c0 for Einstein's V, γ for his β, t', x', y', z' for his
τ, ξ, η, ζ, w_x', w_y' for his w_ξ, w_η, and E, B for his X, Y, Z and L, M, N. Each equation's note states its mapping.
Before, the equations mixed Einstein's V with the modern γ.

## One row per lab

| Lab | Checked against | Wrong, and the fix | Not verified |
|---|---|---|---|
| Minkowski diagram | pp. 901–902: light sphere, φ(v) = 1, the transformation and β | Nothing in the physics. The equations wrote Einstein's V and ξ, τ beside a modern γ; now all modern, with the mapping in the notes. The interval had no reference; it now reads "derived from p. 902", because Einstein shows it only for the light sphere. | — |
| Moving clocks and rods | p. 903: ellipsoid axes R√(1 − (v/V)²), R, R, flattening at v = V, the reciprocity sentence; p. 904: τ = t√(1 − (v/V)²) and the lag ½(v/V)² "up to fourth and higher order" | Nothing. The lag's note now quotes the order as the source states it. | — |
| Adding velocities | p. 905: x(t), y(t) of a point in k, "parallelogram … only to a first approximation"; p. 906: U for angle α, U along x, U < V, U = V for light | **Readout**: the note "light stays at c0 in every frame" appeared whenever \|U\| ≥ 0.9999 c0, so 0.99 c0 ⊕ 0.99 c0 = 0.99995 c0 (no light involved) was labelled light. Now the note follows the body's speed: only \|w\| = c0. Test: `lightNote`, and checked in the page. | — |
| Fields of a moving charge | p. 909: X' … N' with factor v/V; p. 910: the sentence on the forces' dependence on the frame; Prechtl (2010) (2.43), p. 38, and (3.13), p. 61 | (1) **Source misnamed**: the core and labs.json called Prechtl's (3.13) Coulomb's field. It is the point-charge potential; the field is its negative gradient. Wording corrected; a test checks the core's field against −grad of (3.13). (2) **Practice solution**: said γvB and Prechtl's v × B agree "to 6 digits". They differ by 5.6 parts per million, so 1.00001 against 1.00000 × 10⁶ V/m at 6 digits. Now "to 5 digits". (3) The SI rows said "with B = N/c". The precise mapping is Gaussian B ↔ c0 B (SI), with a unit factor common to E and B that cancels; note reworded. | Einstein does not name his unit system. "Gaussian" is read from p. 909 (a unit charge exerts 1 dyn at 1 cm) and the 1/V in the field equations of p. 907. The moving-charge field is derived, not printed in either source; it is tested against Gauss's law. That test cites Prechtl (2010) Tab. 2.1, row 4, which this audit did not reread. |

## Limits

- Chapter page ranges (§ 3 from p. 897, § 6 from p. 907) were checked; pp. 898–900 and 908 were not read in full.
- Practice answers are worked by hand, as the course left no exercises; `tests/unit/labs-data.test.js` recomputes each.

## For `kit/` (not changed here)

- At 375 px two equation boxes of this lab scroll sideways, but `div.math.math-display` (from `kit/ui/math.js`) has no
  `tabindex`, so a keyboard user cannot scroll them. kit/MATH.md asks that Tab reaches such a box. The Telecommunications
  audit reported the same; it affects every lab.
