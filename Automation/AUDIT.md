# Scientific audit of the Automation Lab

Checked on 2026-11-01 against the two primary sources. Pages are the printed "Seite N". Each equation, law, note,
readout, hint, chart label and practice answer was read against the rendered page, never from memory.

- **A**: Kugi (2015), *Automatisierung*, `AutomatisierungVO.pdf`. All 20 Automatisierung labs, read page by page.
- **M**: Kugi et al. (2015), *Modellbildung*, chapters 2 and 3. All 13 Modellbildung labs, read by a delegated
  check. I re-read its two substantive findings myself (M Seite 9 and Seite 64).

Every practice answer was recomputed by hand from the source's equation. All 49 are numerically right. The formulas in
`src/core/*.js` agree with the equations they cite. **No sign, factor or unit error was found in any model the labs
simulate.** The errors were in numbering, in symbols, in one intermediate number of a worked solution, and in page
ranges.

Every equation now has a `tex` and every lab a `lawTex`, following `kit/MATH.md`. The source's notation wins, so the
labs use the imaginary unit **I**, as the Automatisierung notes write it (for example (3.112), (4.45) and (6.87)).
Tests: `tests/unit/audit.test.js`. Each correction there fails on the old data and passes now. The kit's
`math.test.js` typesets all of them.

## One row per lab

| Lab | Checked against | Wrong, and how it was fixed | Could not verify |
|---|---|---|---|
| rlc | A Seite 4–5, (1.6)–(1.12) | Decay rate written δ; the notes write **τ** = R/(2L) (1.11). Fixed in the equation, readout and comment. | — |
| dcmotor | A Seite 10–11, (1.17a)–(1.25d) | ΨF and θG, θT; the notes write **ψF(iF)** and **ΘG, ΘT**. The rest-state line is derived and is now labelled so. | — |
| tank | A Seite 12–13, 34–35, (1.27)–(1.29), (2.49a), (2.53), (2.54), Lösung von Aufgabe 2.18 | Nothing wrong. | — |
| phase | A Seite 51–53, (2.22), (3.45)–(3.55) | Satz 3.3 uses α ± Iβ, not σ ± jω (3.46). Eigenvector start written ξ0; the notes write **γ0** (3.54). Fixed, and the hint too. | — |
| nyquistplot | A Seite 69–72, (3.103)–(3.114), Lösung von Aufgabe 3.26 | Page range said pp. 71–73, but (3.103) and (3.105) are on Seite 69; now pp. 69–73. Imaginary unit j → I. | — |
| bode | A Seite 74–77, (3.117)–(3.128) | Imaginary unit only. | — |
| pt1 | A Seite 80, (3.133)–(3.136), Aufgabe 3.33 | Nothing wrong. | — |
| pt2 | A Seite 81–82, (3.137)–(3.139), Lösung von Aufgabe 3.34 | Damping range said 0 < ξ; the notes give 0 ≤ ξ < 1. Envelopes written γ1,2; the notes write **θ1/2**. (3.138) is now set in the notes' own grouping, which is algebraically the same. The poles line is derived and is now labelled so. | — |
| pid | A Seite 83–86, (3.141)–(3.157), Aufgabe 3.42 | The lead element's ratio was written α; the notes write **η** in (3.151)–(3.156). Fixed in the equations, slider and hint. | — |
| deadtime | A Seite 87, (3.158), (3.159) | The frequency response is derived, not numbered; now labelled so. | — |
| polezero | A Seite 67–68, 90–91, (3.101), (3.163)–(3.167) | Pole pair written σ ± jω; the notes write **α ± Iβ** (3.165)–(3.167). Fixed in the equations, sliders and hint. Satz 3.8 had no number; it is **(3.101)**. | — |
| loop1dof | A Seite 101–106, 122, (4.12)–(4.24), (5.10) | Page range missed Seite 122, where (5.10) is; added. | — |
| routh | A Seite 110–112, (4.30)–(4.36) | Imaginary unit only. | — |
| nyquist | A Seite 115–118, (4.43)–(4.55), Aufgabe 4.12 | Degree written deg; the notes write grad. Imaginary unit. | The gain margin is not in the notes, and the lab says so. |
| fkl | A Seite 120–126, (5.1)–(5.18) | (5.16) is the notes' numeric case of the general phase condition the lab shows. The note now says so (13.3°). | — |
| sampling | A Seite 141–142, 152, (6.19), (6.25), (6.60)–(6.62) | Nothing wrong. | The page of Satz 6.3 was not located. Its content matches Abbildung 6.7 (Seite 152). |
| tustin | A Seite 160–161, (6.86)–(6.92) | Imaginary unit only. | — |
| reach | A Seite 185–187, (7.10)–(7.21) | Nothing wrong. | — |
| placement | A Seite 204, 207, 209, 211, 215, (8.3)–(8.46), Lösung von Aufgabe 8.5 (kᵀ = [−1, −2], matches the lab) | (8.46) is x_k = Φ_g^k x_0; the dead-beat statement is Satz 8.3. The ref now reads "Satz 8.3, (8.46)". | — |
| observer | A Seite 220–223, (8.64)–(8.74), Aufgabe 8.9 (Seite 222) | Nothing wrong. | — |
| kinematics | M Seite 8–9, (2.5)–(2.11) | **t3 was labelled (2.10); it is (2.9)**. (2.10) is x3(t3). Fixed in the data and in the `mechanics.js` comment. (2.5) is kept general (v0, x0); the notes set both to 0, and the note now says so. | — |
| collision | M Seite 24–27, 29, (2.62)–(2.71), (2.81) | Page range missed (2.81) on Seite 29; added. | The restitution closure is not in the notes, and the lab says so. |
| energy | M Seite 28–31, (2.79)–(2.92) | The lecture line listed only (2.81) and (2.92); it now lists (2.79)–(2.81), (2.91) and (2.92). | — |
| friction | M Seite 35, 38, (2.99)–(2.106) | The switch merges **(2.102) and (2.103)**; the ref now says both. Viscous friction is fr = µV Δv (relative speed) in (2.106). | — |
| smd | M Seite 42–43, (2.115)–(2.124) | Nothing wrong. ω0, ζ and the amplitude are derived, and labelled so. | — |
| angular | M Seite 44–46, (2.131)–(2.136) | Example 2.13 is on Seite 46 only; the lecture line now says so. | — |
| lagrange | M Seite 60, 62–64, (2.196), (2.205)–(2.214) | Moments of inertia written Θ; the notes write lowercase **θK,zz, θB,zz**. The torque is **τe(0)**. Fixed in the equations, the practice solution and the comment. Page range now includes Seite 60 for (2.196). | — |
| radiation | M Seite 83–84, 86, 89–90, (3.35)–(3.67) | (3.63) and (3.67) are shown rearranged; checked algebraically equal, and the note says so. The tex keeps the notes' q̇° and q̇. | — |
| wall | M Seite 96–98, (3.81)–(3.88), Beispiel 3.2 | The pane thickness was written LG; the notes write **δ** (3.86), (3.87). Fixed in the equations and the practice solution. | — |
| cylinder | M Seite 98–100, (3.89)–(3.93) | Nothing wrong. rc = λ/α is derived and labelled so. | — |
| fin | M Seite 100–101, 107, (3.94), Aufgabe 3.14 | **The practice solution showed the ratio as 0.997; it is 0.983**. Q(0) = 161.5 W and ηf = 0.414 were already right. | The notes solve the fin equation in their appendix, (A.10)–(A.13), which is not in the PDF chapters at hand. The fin profile and Q(0) are checked only as derived (and numerically). |
| transient | M Seite 102–103, (3.97)–(3.104), Beispiel 3.3 | Nothing wrong. | — |
| fdm | M Seite 104–105, (3.105)–(3.111), Aufgabe 3.15 | The semi-discrete model lacked the boundary row (3.108b); it is now added. | — |

## Left as it is, and why

- **Plain-text symbols in the heat labs' readouts.** The readouts keep q and q′ where the notes write q̇ and q̇°. The
  equations' LaTeX uses the notes' symbols.
- **The heat and mechanics practice and readouts.** These were checked for values, not restyled.

## For the kit (not changed here; outside this lab's folder)

- **Keyboard access to long equations.** `kit/ui/math.js` gives a display equation that scrolls inside its own box
  no `tabindex`. Tab therefore never reaches it, against `kit/MATH.md` ("Tab reaches a box that scrolls") and
  W3C (2023) 2.1.1. At 375 px, four boxes in the lagrange lab scroll and none can take focus. Suggested fix:
  `tabindex="0"`, a `role="region"` and an `aria-label` on `.math-display`, or only when it overflows.

## Browser check

All 33 labs were checked in the browser pane, at desktop width and at 375 px, in light and dark. Every law and
equation typesets, with no parse error and no sideways page scroll. The console showed no errors. The renamed
labels (τ, η, α/β, I) show on the page.
