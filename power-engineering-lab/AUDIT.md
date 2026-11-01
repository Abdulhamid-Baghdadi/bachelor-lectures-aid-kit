# Scientific audit, 1 Nov 2026

Every equation, constant, readout, hint and practice answer of the eleven labs, checked against the primary sources. All
page numbers are printed page numbers.

- **Gawlik (2015)**: the lecture notes, `EV 2014W V007.pdf`. Pages were rendered with `pdftoppm` and read as images.
  Printed page = PDF page − 8. Equation numbers were found in the text layer.
- **Schrödl (2012)**: a scan. Pages were rendered at 80 dpi and read as images. Printed page = PDF page + 51 from
  p. 117 to p. 146. Beyond that the numbering jumps (PDF 96 is p. 149, PDF 98 is p. 152, PDF 112 is p. 224). I mapped
  each page from its own printed number.

Corrections are tested in `tests/unit/audit.test.js`. Each test failed before its fix. Every equation now has `tex`
and every lab has `lawTex` (kit/MATH.md). All of them typeset, which `kit/tests/math.test.js` checks.

| Lab | What was checked, against which page | Wrong, and how it was fixed | Not verified |
|---|---|---|---|
| Star and delta | (3-27) p. 39; (3-29), (3-30) p. 41; (3-34), (3-35) p. 42; table 3-2 p. 40 (±10 %) | Nothing wrong. | The KCL line-current equation has no source equation: it is derived, by definition. |
| Power in three phases | (3-15) p. 37; (3-17)–(3-26) pp. 37–38; (3-37) p. 42; (3-40)–(3-45) p. 43 | The rms form p = U I [...] is (3-26). (3-15) prints it with amplitudes. The ref now names both. The hint now writes cos(φ_u − φ_i) as (3-26) does. | — |
| Transformer | (4-70) p. 106; (4-75) p. 108; (4-76)–(4-83) p. 109; table 4-9 p. 110; (4-89) and example p. 111 | Ref of the circulating-current ratio: it is the example on p. 111, which (4-89) leads to. (4-77) R = U_k²/P_k disagrees with (4-80) in the notes themselves; the lab keeps (4-80) and says so, as before. | The voltage-drop equation U₁² = \|U₂ + z I\|² is derived, not in the notes. |
| Long line | (4-9), (4-44) p. 86; (4-13), (4-25), (4-48), (4-51), (4-54) p. 87; line data and example pp. 90–93 | (4-19) is printed on **p. 77**, not p. 91 (p. 91 only uses it). The notes' "152 %" for 567/380 kV is 149 %, already noted. | — |
| Power over a line | (6-1)–(6-5) p. 199; (6-6), (6-7) p. 200; (6-11)–(6-13) p. 202 | Nothing wrong. The per-unit PV equation drops (6-6)'s factors 3 and 9, which is correct per unit. | — |
| Per-unit values | (6-31), (6-32) p. 212; (6-33), (6.34) and example p. 213; example p. 215 | The notes give S_B = U_B I_B. The lab's I_B = S_B/(√3 U_B) is right for line voltages. The note now says so, and the identity c/\|z\|·I_B = I″k3 on every base is tested. | The base-change formula is derived. |
| Short-circuit current | (6-20) p. 207; (6-22)–(6-30) p. 208; (6-31), table 6-2 p. 212; (6-42), (6-43), fig. 6-18 p. 214; table 6-3 and example pp. 215–216 | Nothing wrong. | — |
| Equal areas | (6-80) p. 235; fig. 6-45 p. 236; criterion p. 237 | **Physics:** the core called A2 = A1 stable (`A2 >= A1`) and the law said "A2 ≥ A1". p. 237 requires A2 greater than A1. Equal areas leave the rotor at the unstable point (p. 236), which is the limit. Fixed in `faults.js`, the law and the readout. | The critical-angle formula is derived from the two integrals (and tested by Simpson's rule). It is not printed in the notes. |
| Rotating field | Schrödl (M.7)–(M.9) p. 11; (A.2) p. 152; (A.28), (A.29) PDF p. 105; Gawlik (4-94) p. 118, (4-95) p. 120 | The (A.28)/(A.29) page had none. It is PDF page 105, whose printed number the scan does not show. That is now in the note. | The printed page of (A.28), (A.29). |
| DC machine | Schrödl (G.29), (G.30) p. 119; (G.33), (G.34) p. 120; (G.37)–(G.41) p. 121; (G.46)–(G.48) and exercise p. 123; (G.49) p. 124; (G.80)–(G.83) p. 137 | The PM DC exercise is on **p. 123**, not p. 126. The steady state is (G.46) p. 123 with (G.49) p. 124. The hint cited (G.38), which still has L dJ/dt. | The exam of 24 July 2013 was not re-read in this audit. Its answers are recomputed by `labs-data.test.js`. The slips noted earlier were not re-checked against the exam PDF. |
| PMSM | Schrödl (P.1) p. 224; (P.4)–(P.8) p. 226; (P.18), (P.19) p. 230; "little field weakening" p. 226 | Nothing wrong. | The exam of 24 June 2013: as for the DC exam, recomputed but not re-read. Ref (P.2) p. 225 was located by its label in the OCR layer; the page image was not read. |

## Also found

- **Kit, not changed here:** a display equation wider than its box scrolls inside `div.math-display`, but that box has
  no `tabindex="0"`, so the keyboard cannot reach it. kit/MATH.md asks for this. Seen on every lab at 375 px.
- Checked in the browser pane: all eleven labs typeset with no parse errors, in light and dark. At 375 px no lab scrolls
  sideways. That needed one long reference shortened, because the `ref` cells don't wrap.
