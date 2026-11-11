# Source errors: review of 11 Nov 2026

The symbol pass over the labs reported these errors in the lecture notes. On 11 Nov I checked each one again against
the page it names: I read the page as text with pdftotext where the text layer is typeset (Strasser, Schrüfer, Prechtl,
Doblinger, Goiser), and as a rendered image with pdftoppm where it is a scan or the formula is drawn. Pages are printed
page numbers; the source files are named in each lab's `CLAUDE.md`.

## Confirmed

| Source | Page | Printed | Meant | How the lab handles it | Check |
|---|---|---|---|---|---|
| Strasser (2015), HL | p. 57 | thin-barrier limit "cosh(βb) ≈ 1 und sin(βb) ≈ βb" | sinh(βb) ≈ βb: the barrier term of the Kronig–Penney equation is a sinh | Energy bands: the barrier strength's `means` says sinh is meant | text layer |
| Strasser (2015), HL | p. 107, (3.4.43) | Shockley–Haynes pulse with exp{(x − μpEt)²/4Dpt} · exp(t/τL) | both exponents negative: exp{−(x − μpEt)²/4Dpt} · exp(−t/τL), as the text on the same page says the area decays as exp(−t/τL) | Drift and diffusion: uses the minus signs; τ_L's `means` and AUDIT.md say so | page image read |
| Strasser (2015), HL | p. 114 | E2 = EC − (mr/mn)(ħω − EG) | E2 = EC + (mr/mn)(ħω − EG): only + gives E2 − E1 = ħω of (4.2.2) | Optical absorption: uses +; AUDIT.md notes it | text layer |
| Strasser (2015), HL | p. 115 | unexcited semiconductor: "fv(E1) = 1 und fc(E2) = 1" | fc(E2) = 0 (empty conduction band); with 1 the factor fv − fc of (4.2.8) and the absorption would vanish | Optical absorption: the occupations' `means` says 0 is meant | text layer |
| Strasser (2015), HL | p. 174 | ΦF = kBT/(q ln(NA/ni)) | ΦF = (kBT/q) ln(NA/ni) | MOSFET: uses the correct form; AUDIT.md notes it | text layer |
| Strasser (2015), HL | p. 165 | IC(UBE) for UCB = +1 V constant "(exp(UCB/UT) = 0)" | exp(UBC/UT) ≈ 0: with UCB = +1 V, UBC = −1 V and the term is small, not zero | Bipolar transistor: U_BC's `means` says so | text layer |
| Strasser (2015), HL | p. 104, (3.4.35) | pn(x) = pn0 + [pn(0) − pn0] · e^(−x/L) | e^(−x/Lp), the diffusion length Lp = √(Dp τL) defined in the next line | Recombination: uses Lp; L_p's `means` says so | page image read |
| Zimmermann (2010), ST | p. 85 | SR = I1max/Ck = 20 µA/30 pF = "0,6 V/µs"; then Δt = 20 V/(0,6 V/µs) = 33 µs | 20 µA/30 pF = 0.67 V/µs (and 30 µs) | Op-amp slew rate: I₀'s `means` gives 0.67 and says 0.6 is printed | page image read; recomputed |
| Schrüfer et al. (2012) | p. 44 (§1.3.7) | "die Gl. (1.44) für die empirische Standardabweichung" | Gl. (1.48), p. 38; (1.44) on p. 36 is the error example ΔU, ΔI, ΔR | Uncertainty labs cite eq. 1.48, p. 38 | text layer. The report gave p. 43; the sentence is on p. 44 (PDF p. 28 of chapter 1) |
| Schrödl (2012) | p. 11, (M.7)–(M.8) | handwritten equations use J_Nenn; the text between them says "Nennstromes √2 I_N,eff" | one quantity, the rated RMS current, under two names | Space vector: J_Nenn's `means` says the text calls it I_N,eff | page image read |
| Gawlik (2015) | p. 212, (6-32) and p. 215 | the network impedance is Z_N in (6-32) and Z_Q in the worked example | the same impedance | Per-unit values: the impedance's `means` names both | page images read |
| Taschner (2013) | p. 285 | φn(t) = cn e^(−n²/(1−n²t²)) "wenn −1/n ≤ t ≤ 1/n", 0 "wenn \|t\| ≥ 1/n" | the first case on the open interval \|t\| < 1/n: the cases overlap at t = ±1/n, where the exponent's denominator is 0 | Bumps lab: draws the open interval | page image read |
| Taschner (2013) | p. 493 | Cauchy's integral theorem: "f : G → C" | f : G → ℂ (the complex numbers, typeset as C in the italic theorem) | Cauchy lab writes ℂ | page image read |
| Einstein (1905) | p. 905 | α = arctg w_y/w_x | α = arctg w_η/w_ξ: the point moves with w_ξ, w_η in k; there is no w_x, w_y | Adding velocities: writes w_x', w_y' for w_ξ, w_η and says so | page image read |
| Kugi (2015) | Seite 90, (3.164)–(3.165) | n(s) = 1 + 2ξ(sT) + (sT)², then the same n(s) = 1/T² + 2ξ s/T + s² | the two differ by the factor T²; (3.165) is n(s)/T² | P-T2 poles: n(s)'s `means` says so | page image read |
| Goiser (2016) | set 3, slide 33 | Q(x) called the "Marcum Q-Funktion" | the Gaussian Q-function, ½ erfc(x/√2); the Marcum Q-function is a different, two-argument function | Q's `means` says so in the four labs that use it | text layer |
| Goiser (2016) | set 5, slide 40 | "Code-Effizienz" η = H/Hmax at the top, η = H/L at the bottom | two different quantities under one name; the code efficiency of a source code is H/L | Mean codeword length: η = H/L, and its `means` notes the first form | text layer |

## Notation and conventions, not errors

| Source | Page | Printed | Note | How the lab handles it | Check |
|---|---|---|---|---|---|
| Kugi (2015) | Seite 5, (1.10)–(1.11) | e^(−τt) with τ = R/(2L) | τ is a decay rate [1/s], although τ usually names a time constant | RLC: keeps τ and says it is a rate | page image read |
| Goiser (2016) | set 4, slides 55–56 | slide 55 h(t) = k · v*(T0 − t); slide 56 h(t) = v(T0 − t) | slide 56 sets k = 1 and takes v real | Matched filter: uses slide 55; the `means` notes slide 56 drops k and the conjugate | page images read |
| Doblinger (2015) | p. 150, (6.60) and Abb. 6.12 | \|H_a(ω)\|² in (6.60) and the caption; \|H(jω)\|² on the plot's axis | one function, two names | Butterworth: the `means` names both | page image read |
| Prechtl (2010), SS1 | p. 71, footnote 4 | si(x) = sin(x)/x, "in der englischsprachigen [Literatur] dagegen sinc(x)" | much English literature defines sinc x = sin(πx)/(πx); others use sin(x)/x | The lab uses sin(πx)/(πx) and says the footnote equates sinc with si | text layer |
| Strasser (2015), HL | p. 129, (5.2.4) | E_max = −eNA dp/ε = −eND dn/ε | the sign is right for the field pointing from n to p; footnote 5 on p. 131 says the sign is dropped from then on | pn junction: gives the magnitude and says so | text layer |

## Not confirmed

- Gawlik (2015), p. 111, the circulating-current example: reported as a complex number set equal to its magnitude. The
  page, rendered at 200 dpi, prints \|I_Δ\|/I″k = \|1 − e^(−j5·30°)\|/2 = \|0,933 + 0,25j\| = 0,966, with magnitude bars
  on both sides; I found no complex value equated with a real one on the page. The text layer drops the bars, which may
  be where the report came from. Nothing recorded as an error.
