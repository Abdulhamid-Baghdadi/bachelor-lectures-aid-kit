# Scientific audit, 1 Nov 2026

Every equation, constant, readout, hint and practice answer of the 28 labs, checked against the primary sources by
reading the page image (not memory, not the garbled text layer):

- Prechtl (2010), *Vorlesungen über Elektrodynamik*, TU Wien: printed page = PDF page − 5.
- Lasser (2012), *Wellenausbreitung*, 10th ed.: printed page = PDF page − 8 to − 10 (the scan has inserted handwritten
  pages, e.g. after p. 45).
- Wave propagation exercise collection (Übungsteil, 2011), PDF p. 48, for the ISI rule.

Result: **no physics error** (no wrong sign, factor, unit or out-of-range approximation). The errors were in the
citations and one symbol; they are fixed and held by `tests/unit/labs-sources.test.js`, which failed on all six before
the fix. All equations now carry `tex` and every lab `lawTex` (kit/MATH.md), held by `tests/unit/labs-math.test.js`;
`kit/tests/math.test.js` typesets them all without error.

Notation in the LaTeX follows the notes: vectors with arrows (both notes), regions 𝒜, 𝒱 in script, jumps ⟦·⟧,
∂_t, γ conductivity, ϱ, φ; Prechtl's underlined complex amplitudes in the line chapter (U̲, Z̲_W, γ̲); Lasser's
subscripts (λ_G cutoff, λ_H guide wavelength, f_G, P_e/P_s, Θ, Γ, σ_o).

## Per lab

| Lab | Checked against | Found and fixed | Not verified |
|---|---|---|---|
| gauss | Prechtl Tab. 2.1 row 4 (p. 30); (2.21), (2.23) p. 29 | – | |
| monopole | Tab. 2.1 row 2 (p. 30); (5.5) p. 117 | – | |
| faraday | Tab. 2.1 row 1 (p. 30) | – | Û = NAB̂ω is derived, not printed |
| ampere | Tab. 2.1 row 3; (2.22) p. 29 | – | H = I/(2πr) derived |
| continuity | Tab. 2.1 row 5; (2.15) p. 29 | Local form cited only Tab. 2.1; now (2.15), Tab. 2.1 | |
| materials | (2.29), (2.34), (2.36)–(2.38) pp. 35–36; (2.44) p. 37; (3.3) p. 59 | – | Material values in the hint are typical figures, labelled so |
| poynting | (2.107)–(2.109) p. 52 | – | w = ½E·D + ½H·B and the wire example derived |
| lorentz | (2.100) p. 52 | – | Point-charge form, gyro radius, drift derived |
| coulomb | (3.4), (3.11), (3.13), (3.14) pp. 60–61 | – | |
| laplace | (3.7)–(3.9) p. 61 | – | Five-point scheme is numerics, not in the notes |
| dipole | (5.35) p. 123; (5.42) p. 124 | – | Spherical components derived |
| relaxation | (3.102), (3.103), (3.105) pp. 85–86 | Reynolds number written "Re"; the notes print R_e | Material times in the hint are typical |
| biotsavart | (3.144)–(3.146) p. 95 | – | On-axis loop formula derived |
| skin | (4.28), (4.31), (4.32) pp. 111–112; (4.27) p. 111 | δ = √(2/(μωγ)) cited (4.31); the notes define it in (4.27), (4.31) is the loss. Code comment in `src/core/fields.js` also corrected | |
| speed | (2.25) p. 31; (5.13), (5.14), (5.19), (5.21) pp. 119–120 | – | μ0 = 4π × 10⁻⁷ H/m exactly, as the 2010 notes fix it (p. 31); since the 2019 SI it is measured, differing by ~10⁻¹⁰ relative |
| planewave | (5.64)–(5.72) p. 133 | – | |
| hertz | (5.32), (5.36) p. 123; (5.49)–(5.53) p. 127; Abb. 5.3b (sin²θ) | – | |
| line | (5.106)–(5.125) pp. 140–144 | – | |
| polarisation | Lasser pp. 33–35, Abb. 3.4–3.6 | – | |
| lossy | (3.17)–(3.20), (3.26) p. 38; (3.27) p. 39 | γ = jω√(μδ) marked "derived"; it is (3.27), p. 39 | Good-conductor limit derived |
| fresnel | pp. 45–46 | – | Critical angle derived (Snell with Θ2 = 90°) |
| waveguide | (6.5)–(6.9) p. 64; κ² p. 65; λ_G, λ_H, Z_W,TE p. 66; Abb. 6.2 | Cutoff frequency marked "derived": it is (6.9), p. 64; renamed f_c → f_G as the notes write it (also in the readouts); λ_H now cites (6.8); κ² cites p. 65 (was p. 66) | WR-90 dimensions in the hint are the standard's, not the notes' |
| microstrip | p. 96 (also the "Hammerstaad" remark) | – | |
| fresnelzone | p. 107 (incl. the 50 km / 5 cm exercise) | – | 60 % clearance rule: not in the notes, labelled so |
| friis | (11.49) p. 119; (12.6)–(12.11) p. 140 | – | |
| radar | (12.16)–(12.19) p. 143 | – | Stealth remark is general knowledge, no source |
| fading | (13.9)–(13.12) p. 150; fade rate p. 151 | – | λ_S and fade depth derived; exercise 24 answers taken from the earlier check, not re-read |
| delayspread | (13.1)–(13.4) p. 146; Übungsteil PDF p. 48 (ISI rule) | – | "Narrowband = a third of the notch spacing" is a rule of thumb, labelled so |

## Practice answers

All are recomputed by the core in `tests/unit/labs-data.test.js` (green). The values taken from the 2010
Aufgabensammlung worked solutions (skin A4.2.8, line A5.3.1 b and others) and from the Übungsteil exercises 24, 25 were
**not re-read** against the scans in this audit; they rest on the check noted in labs.json's `about`.

## Not done

- **Browser check** (light, dark, keyboard, 375 px): not done. The browser pane refused to navigate to the local
  server in this session. Rendering is checked only by `kit/tests/math.test.js` (Temml parses every `tex`).
- The hint texts' illustrative numbers were recomputed by hand, not by test.

## For kit/ (not changed here)

- None needed. `[\![ … ]\!]` is used for Prechtl's jump brackets ⟦·⟧ instead of `\llbracket`, to stay within what
  Temml is sure to parse; a kit-wide choice could be added to kit/MATH.md.
