# Scientific audit of the Measurement Lab

Done on 1 November 2026, against the primary texts, never from memory:

- **Book**: Schrüfer, Reindl and Zagar (2012), *Elektrische Messtechnik*, 10th ed., chapter PDFs in `Messtechnik\Buch\`.
  Printed page = chapter start + PDF page − 1 (chapter starts 17, 83, 195, 248, 280, 304, 337).
- **Lab script**: Schitter (2015), *Laborübung Messtechnik Labor (376.046)*, WS 2015/16. Printed Seite = PDF page − 4.

How: each PDF was extracted with `pdftotext -layout` and searched for every equation number the lab cites, its page
counted from the form feeds. The symbol font drops out of the text layer (Δ, ∂, φ, Ω vanish), so where the extracted
text was ambiguous the page was rendered and read: Bild 3.9 (p. 203, which arms change in each bridge), eq. 2.96
(p. 115, underlined phasors) and eqs. 2.61–2.66 (p. 103, φ). Page numbers below are printed ones. "By hand" means
derived from the cited equation and recomputed by the core in `tests/unit/labs-data.test.js`, not printed in the book.

Regression tests for every correction: `tests/unit/audit.test.js`. Seven of its eight tests failed before the fixes and
all pass after them. Every equation and law now has its LaTeX (`tests/unit/labs-math.test.js`). Lab tests 67 of 67,
kit tests 20 of 20 (the kit's test typesets every `tex` and `lawTex`).

## One row per lab

| Lab | Checked against | What was wrong | Fix |
|---|---|---|---|
| Repeated readings and their mean | eqs. 1.46, p. 37; 1.47–1.49, p. 38; 1.53, p. 39; 1.55, p. 40; 1.83 and Table 1.6, p. 44; Beispiel 1.3 and Table 1.5, p. 40 | Nothing. All t values of Table 1.6 match the core's table, row by row. | The LaTeX writes s(xᵢ) as the book does where the plain text says s. |
| Propagation of uncertainty | eqs. 1.37, p. 35; 1.43, p. 36; 1.73–1.74, p. 42; Beispiel 1.2 (p. 36) and 1.4 (p. 43); Schitter eq. 2.1, task 2.5, Seite 21 | Nothing. Gauss 1821 (p. 42) and both practice answers (+0.009, 10.3 g) match. | — The worst case Σ\|∂f/∂xᵢ\| s(xᵢ) is the lab's own, uncited, as before. |
| The meter loads the circuit | eqs. 2.24, p. 89; 2.28, p. 90; 2.31, Beispiel 2.1, p. 91; 2.32–2.35, pp. 92–93; Schitter task 1.1.1, Seite 5 | (a) The voltmeter and ammeter laws had no source. (b) The hint said halving the reading "is how the lab script finds a meter's own resistance"; task 1.1.1 computes it from the divider with a known R1 = 100 kΩ. The halving rule is the book's (p. 91). | (a) Cited as eqs. 2.28 and 2.24, with the book's own symbols (UM, UL, RM) in the ref. (b) Hint rewritten. Tests. |
| Resistance from voltage and current | eqs. 3.1, p. 195; 3.2, 3.3, p. 196; Thomson bridge p. 201; Schitter task 1.1.3, Seite 10 (100 Ω and 100 kΩ) | Nothing. | The crossover √(RA·RV) stays marked as derived. |
| Mean, rectified mean and RMS | eqs. 2.36–2.39, p. 95; 2.41, p. 95; 2.42–2.44, p. 96; rectifier scale ×1.11, p. 98; Schitter task 1.2.3, Seite 14 | Nothing. | Square +11 % and triangle −3.8 % stay "by hand". |
| Compensating a 10 : 1 probe | eqs. 2.96–2.98, p. 115; 2.100–2.102, p. 116; RE ≈ 1 MΩ, CE ≈ 25 pF, p. 115; Bild 2.43; Schitter task 1.2.1, Seite 11 (100 Hz–100 kHz) | Nothing. | The LaTeX underlines the phasors U̲₁, U̲₂ as the book does. The settling time constant is the lab's own, uncited. |
| The Wheatstone bridge | eqs. 3.10–3.14, pp. 199–200; 3.18–3.19 and Bild 3.9, p. 203; text p. 204; 3.22–3.23, p. 205; 3.68, p. 235; 3.74, p. 236; 3.75–3.79 and Beispiel 3.2, pp. 238–239 | (a) The half bridge was named "two opposite arms". In Bild 3.9, d (+ΔR in two opposite arms) is only approximate. The exact one is f, with +ΔR and −ΔR in one divider, which is what the core computes. (b) The hint said a second gauge "doubles the signal and cancels temperature (eqs. 3.78–3.79)". Eq. 3.78 keeps the quarter bridge's U0/4·ΔRS/R0. Eq. 3.79 gives (1 + μ) times, about 1.3. (c) K = ΔR/R / (Δl/l) is eq. 3.68, p. 235, not 3.75–3.76. | (a) Renamed "opposite changes in one divider" in core, idea and header. (b) Hint rewritten. (c) Ref corrected. Tests, including eq. 3.12 showing d bends and f does not. |
| Active power and the wattmeter | eqs. 2.49–2.51, p. 101; 2.56–2.58, p. 102; 2.60–2.65, p. 103; Bild 2.26, p. 102; Schitter task 2.8, Seite 26 | Nothing. The two connection errors U²/RU and I²RI are derived (the book says only that neither is right) and agree with the core's complex-number circuit. | — |
| The seismic vibration sensor | eqs. 7.108–7.113, p. 369; 7.114–7.117, p. 370; D ≈ 0.7 for meter movements, p. 63 | The readout above resonance said "xa follows xe". By eq. 7.110 the mass stands still and xa = −xe. The amplitudes are equal (7.116), but the phase is −180°. | Readout rewritten; test. The sign question of eq. 7.113 was checked again: with ẍe = −ω²xe the right side of 7.112 gives +Ω², as printed. |
| Counting frequency and period | eqs. 5.7 and ±1 count, p. 295; 5.9, p. 297; 5.10, p. 298; Table 5.8, p. 299 | Nothing. Table 5.8 read row by row: 10 ms → 1003, 100 ms → 0031, 1 s → 0314, 10 s → 3143. | The crossover √(f0/T) stays marked as derived. |
| Flash, successive approximation, dual slope | §6.2.3 and Table 6.1, pp. 307–308; §6.2.5 and Bild 6.6 c, p. 310; eqs. 6.9–6.16, pp. 313–314; hum rejection and no sample-and-hold, p. 314 | Nothing. Table 6.1's thresholds at odd multiples of U0/16 match the core. | Noted, not changed: the book's text says a weight is kept while ux > Ur, and its circuit description drops it when Ur is too large. The core keeps it at ux = Ur. These agree except at exact equality. |
| Resolution and quantisation noise | eqs. 6.36–6.37, p. 323; 6.41–6.43, p. 324; 6.44–6.45, p. 325; Schitter task 1.2.4, Seite 15 | The hint's "8-bit scope on 8 divisions of 1 V" read as if from task 1.2.4, but the script names no bit count (it asks for it). | Marked "for example"; test. |

## Notation

`kit/MATH.md` says the source's symbols win. Followed for: x̄, s(xᵢ), u(x̄) (ch. 1); underlined phasors and φ
(ch. 2); ΔR/R0, K, ε, σ (ch. 3); Ω, D, T, x_a, x_e (ch. 7); Δu, U_R, n_eff, SNR_gem (ch. 6). **Not followed,
deliberately**: the loading lab keeps the lab script's UV, Uq, RV, RA for a voltmeter and ammeter where the book writes
UM, UL and RM for either meter. The ref names the book's form beside each.

## What could not be verified

- Bild 3.9 and Bild 2.26 are figures. Their circuits were read on the rendered page, and only for the arms and
  connections the lab uses.
- The probe's cable capacitance of 75 pF (CE* = 100 pF) is an example. The book gives only CE ≈ 25 pF.
- The VO slides (2016) were not used. The lab cites only the book and the lab script.

## For the kit (not changed here)

At 375 px, equation boxes that scroll sideways (for example three in the seismic lab) are not keyboard focusable: the
kit gives `.math-display` no `tabindex`, so `kit/MATH.md`'s check "Tab reaches a box that scrolls" fails in every lab.
A `tabindex="0"` with a label on boxes whose `scrollWidth` exceeds `clientWidth` would fix it.
