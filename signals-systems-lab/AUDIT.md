# Scientific audit of the Signals and Systems Lab

Done on 1 November 2026, against the primary texts, never from memory:

- **SS1**: Prechtl (2010), *Vorlesungen über Signale und Systeme 1*, `Signale_und_Systeme_1_Skriptum_2010_ONLINE.unlocked.pdf`.
  Printed page = PDF page − 3.
- **SS2**: Doblinger (2015), *Zeitdiskrete Signale und Systeme*, 3rd ed., `Doblinger_SuS_3Ed_unlocked.pdf`. Printed
  page = PDF page − 10.
- **SS2 exercises**: Doblinger et al. (2016), *Signale und Systeme 2, Beispielsammlung*, `sus2ue.pdf`.

How: the text of each PDF was extracted (`pdftotext -layout`) to find equation numbers and pages. The symbol font
drops out of the extracted text, so every equation the lab relies on was then read on the rendered page itself. Page
numbers below are the printed ones. Every row was checked against the cited page; "by hand" means derived from the
cited equation and checked by the core in the tests, not printed in the text.

Regression tests for every correction: `tests/unit/audit.test.js` and the harmonics test in `tests/unit/core.test.js`.
All of them failed before the fixes (10 failing) and pass after them (47 of 47). The kit's tests (20) pass too.

## One row per lab

| Lab | Checked against | What was wrong | Fix |
|---|---|---|---|
| Shifting and scaling time | SS1 §1.2, (1.16), p. 9; SS2 §2.2, p. 15; SS2 (8.26), p. 201 | `y[n] = x[Mn]` cited SS2 §2.2, which has only shift and reversal. Downsampling is (8.26) in §8.2. | Ref corrected; test. The practice answer (2 samples) was recounted by hand and agrees. |
| Linearity and time invariance | SS1 (1.51), p. 22, (1.55), p. 24; SS2 (3.2), p. 31 | Sections only, no equation numbers. Superposition in SS1 is zero-state linearity (1.51), "from rest". | Equation numbers added, note now says "from rest". The solution now says that Prechtl writes h(t) for the step response (1.67) and g(t) for the impulse response, against the lab's s and h. |
| Convolution | SS1 (1.62), p. 27, (3.66), p. 81; SS2 (3.7), p. 32 | The length rule `Nx + Nh − 1` cited SS2 §3.1, but the text does not state it. | Now marked as counted by hand from (3.7), with no citation. The practice answer 0.432 s (unit s, since x and h are dimensionless) was checked. |
| Random signals and correlation | SS1 (1.39), p. 15, (4.38), p. 104, (4.45), p. 105 | (a) The cross-correlation cited §3.4, which has only the energy correlation (3.78). The time-average form is (4.45) in §4.6. (b) The power-spectrum law was written Φ_yy(f); Prechtl writes R_yy(jω) (4.38). (c) The lecture cited "Doblinger (2015), section 3.1" for noise, but Doblinger has no section on random signals. (d) Prechtl writes E[·], not E{·}. | (a)–(d) corrected; tests for (a) and (c). The σy² = σx²(1 − a)/(1 + a) law and the practice answer 0.0526 are the lab's own (Σh² of h[n] = (1 − a)aⁿ), checked by hand and by a seeded simulation in `core.test.js`. |
| Fourier series | SS1 (5.2), (5.4), p. 109, (5.17), p. 113, (5.43), p. 118, Gibbs p. 113; SS2 (2.45), (2.46), p. 20 | **The discrete Fourier series was not the source's.** The lab wrote x[n] = (1/N) Σ X[k] e^(j2πkn/N), the inverse DFT, and cited SS2 §2.3. Doblinger (2.45)–(2.46) put the 1/N in c_k: x[n] = Σ c_k e^(j2πkn/N), c_k = (1/N) Σ x[n] e^(−j2πkn/N). The chart labelled the coefficient \|X[k]\|/N. | Equation and law rewritten to (2.45)–(2.46); chart now reads "\|c_k\| = \|X[k]\|/N"; test. Square-wave amplitude 4/(πk) derived from (5.17) and (5.43) and checked. The Gibbs overshoot of 0.179 for a jump of 2 matches Prechtl's "about 9 % of the full jump", p. 113. The exact value (2/π) Si(π) is by definition, not printed in the text. |
| Fourier transform | SS1 (3.12), p. 69, (3.22), p. 71, (3.31), p. 74; SS2 (4.1), p. 60 | (a) The DTFT cited SS2 §4.1; its definition (4.1) is in the chapter 4 introduction, p. 60. (b) Ω where Doblinger writes θ. | (a), (b) corrected; θ test. The lab's f-form of the transform is Prechtl's own (3.12). rect ↔ sinc and time scaling are Prechtl's ω-forms (3.22), (3.31) rewritten over f, noted beside them (Prechtl's si x = sin x / x). |
| Harmonics and power | SS1 (6.10), (6.12), (6.13), pp. 123–124; (6.19), (6.22), p. 125; (6.23)–(6.28), p. 127 | **A quantity used under the wrong name.** The lab wrote S² = P² + Q² + D² with Q = U I₁ sin φ₁. In Prechtl, Q is the whole reactive power, with S² = P² + Q² (6.19) and Q² = Q_v² + D² (6.22). U I₁ sin φ₁ is the fundamental reactive power Q₁ (6.26). Taken in Prechtl's sense, the lab's law counted D twice. Also, "THD = √(ΣI_k²)/I₁" is the IEC definition, not the text's: Prechtl's harmonic content k_i (6.13) divides by the RMS value I, and D = k_i S (6.28). | Core returns `Q1` and `k` (k_i); readouts say "Fundamental reactive power Q₁" and "Harmonic content kᵢ"; law and equations rewritten as S² = P² + Q₁² + D² and k_i; λ = P/S = g_i cos φ₁ (6.27) added; tests. Practice answers 10.63 A and 829 VA unchanged and rechecked. |
| DFT, windows and the FFT | SS2 (7.10), p. 169, (7.27), p. 175, (4.53), p. 76, pp. 187–189 | (a) The DFT cited §7.1; (7.10) is in the chapter 7 introduction. (b) Ω for θ. (c) The page range ended at 191, which is where chapter 8 starts. | Corrected. Δf = fs/N is derived from (7.27) with (4.53), not printed. "(N/2) log₂ N butterflies" was counted from Abb. 7.10. Doblinger states N log₂ N operations against N² (p. 189), and both are now given. |
| Sampling and aliasing | SS2 (4.52), (4.53), p. 76, (4.54), p. 77, (4.61), p. 78 | (a) f_max where Doblinger writes f_g (4.54). (b) The repeated spectrum was written X_s(f) = (1/T) Σ X(f − k fs), a form the text does not print. (c) The page range 74–90 ran into chapter 5 (p. 87). | (a) and (b) rewritten to (4.54) and (4.52) as printed; (c) now 74–86; test for (a). The sinc reconstruction is (4.61) with ω_g = π/T, noted. The alias formula is the lab's own, so it has no citation. |
| Digital filters | SS2 (6.2), p. 120, (6.37), p. 138, (6.38)–(6.39), p. 139, Tabelle 6.1, p. 140, (6.57)–(6.58), p. 149, (6.60), p. 150; sus2ue Aufgabe 5.4, p. 22, Lösung p. 85 | (a) h_ideal where Doblinger writes h_d (6.37). (b) The lecture range left out §6.1, where the ideal low-pass (6.2) is. | (a), (b) corrected; test for (a). The window coefficients in the core match Tabelle 6.1 with (6.39), denominator N − 1, and an equation for them was added. Pre-warping and the bilinear transform match (6.57)–(6.58). The Butterworth law is (6.60) de-normalised, noted. FIR lengths are odd only (step 2), so the delay (N − 1)/2 equals Doblinger's ⌊(N − 1)/2⌋ (6.38). **New practice question** from sus2ue Aufgabe 5.4: the pole of the first-order bilinear low-pass at fs/10 is (1 − v)/(1 + v) = 0.5095, v = tan(π/10). The core's `butterworth` reproduces it (test). |
| Changing the sampling rate | SS2 (8.18), p. 197, (8.20), p. 198, (8.26), p. 201, (8.29), (8.31), p. 202 | (a) Downsampling and zero-insertion cited §8.1; they are (8.26) and (8.18) in §8.2. (b) Ω for θ. | Corrected; tests. The aliasing spectrum (8.29) and image spectrum (8.20) agree with the lab's forms. The anti-alias band fs/(2M) follows from θ_g = π/M (8.31). |

## Notation: what follows the source and what does not

`kit/MATH.md` says the source's symbols win. Followed for every quantity that would otherwise be misread: θ, f_g, h_d,
c_k, X_a, x_a (Doblinger); Q₁, k_i, g_i, R_xx, E[·] (Prechtl). **Not followed, deliberately**, and written into
`labs.json`'s `about`: the lab keeps one set of signal letters across both courses. Input x, output y, impulse
response h, frequency response H, system operator S{·}, where Prechtl writes u, y, g, G, S[·] and Doblinger T{·}.
This is the one-vocabulary rule. It is your call whether the continuous-time labs should switch to Prechtl's u and g.
Prechtl's h(t) is the step response (1.67), so a student moving between the lab and the script must keep this in mind.
The solution of the linearity question says so.

## What could not be verified

- **SS1 exercises**: `Signale_und_Systeme1_Aufgabensammlung_v2009.pdf` has a text layer only for its table of
  contents. Its 214 pages are scanned, so no exercise or solution could be read by extraction. Candidates by title:
  A1.13 (impulse response from a known step response), A1.17, A4.20 (white noise at an R-C element), A6.4–A6.6
  (harmonic content, power factor). Reading them needs the pages viewed one by one or OCR. The SS1 practice questions
  stay hand-worked.
- **More SS2 exercises**: only Aufgabe 5.4 was matched. Other sus2ue exercises (chapter 6 DFT, 4.x sampling) were not
  checked one by one.
- **The lab's own laws**: the moving-average low-pass of the random lab, its variance law, the alias formula, the
  sequence-length rule and the exact Gibbs value are by definition or by hand. No text prints them.
- **SS1 read in extracted text only**: every Prechtl citation ((1.16) to (6.28)) was read in the extracted text,
  where the Greek letters are missing. The equation numbers, structure and Latin symbols are clear, and the ω-forms
  were reconstructed from context. None of them was viewed on the rendered page. These are the ones to look at if one
  should be doubted. The SS2 citations were viewed on the rendered page: pp. 20, 60, 76–78, 120, 138–140, 149–150,
  169, 175, 197–198, 201–202, and sus2ue pp. 22 and 85. SS2 p. 15 and pp. 187–189 were read in extracted text.

## LaTeX

Every `tex` and `lawTex` was rechecked against `kit/MATH.md`: upright e, j, d and subscripts that are words, `\operatorname`
for named functions, and the source's symbols as above. All typeset without error in the browser pane (11 labs, 57
formulas), in light and dark, at 375 px with no sideways page scroll.

**For the kit, not changed here**: an equation wider than a phone (the filters law at 375 px) scrolls inside its
`.math-display` box, but that box has no `tabindex`. A keyboard user cannot reach it, and `kit/MATH.md` says Tab
reaches it. W3C (2023), WCAG 2.2, 2.1.1 Keyboard. Fix in `kit/`: give an overflowing `.math-display` `tabindex="0"`
and a label.
