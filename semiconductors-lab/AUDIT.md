# Scientific audit of the Semiconductors Lab

Done on 1 November 2026, against the primary texts, never from memory:

- **HL**: Strasser (2015), *Skriptum Halbleiterphysik*, `HL_skript_2015_2.pdf`. Printed page = PDF page.
- **EB**: Hobler (2009), *Elektronische Bauelemente: Beispielsammlung*, `bee2009.pdf` (printed pages), with its solutions
  at the end of each part; worked solutions `ElektronischeBauelementeVU_Lösungswege.pdf` (a scan).
- **ST**: Zimmermann (2010), *Schaltungstechnik*, `Skriptum.pdf`. Printed page = PDF page − 6.
- **RB**: Schneider & Zimmermann (2005), *Rechenbeispiele*, `Rechenbeispiele_Schaltungstechnik.pdf`.
- Halbleiterphysik exercise sheet 10 (WS 2015/16), problems 37–39.

How: the text of each PDF was extracted (`pdftotext -layout`) to locate every equation number and page. The symbol font
drops out of the extracted text, so every page the lab cites was then **viewed rendered** (HL pp. 56, 57, 73, 79, 82–84,
96, 97, 103–105, 107, 114, 115, 129, 131, 132, 134, 136, 137, 139, 140, 161, 162, 164, 174, 183–185, 187, 188; ST pp. 1,
2, 5, 7, 22–24, 69–72, 76, 85, 86, 128, 130, 132, 133; Lösungswege p. 47). HL p. 43 and p. 58, ST p. 75, the EB
exercises and solutions, RB and sheet 10 were read in extracted text. Page numbers below are printed ones.

Regression tests: `tests/unit/audit.test.js`. All 7 failed before the fixes and pass after; the lab's 68 tests and the
kit's 20 pass. Every equation and law now has its `tex` and `lawTex` (`tests/unit/labs-math.test.js`); all 115 typeset
without error in the browser pane, light and dark, at 375 px with no sideways page scroll.

## One row per lab

| Lab | Checked against | What was wrong | Fix |
|---|---|---|---|
| Energy bands | HL (2.1.2) p. 43; (2.2.10), (2.2.12) p. 56; (2.2.13), P = ma V0 b/ħ², p. 57; p. 58; sheet 10, 38 a | **"ψ″ jumps by 2P/a · ψ"**: at a thin barrier it is the slope ψ′ that jumps (integrate the Schrödinger equation across V0 b δ(x)). The core already used ψ′. | Text corrected; derivation noted; test with the transfer matrix against (2.2.13). Practice 56 meV rechecked. |
| Fermi–Dirac | HL (3.1.4) p. 79, f(E) p. 79, (3.1.16) p. 82 | Nothing. | Practice 0.0205 rechecked. |
| Carrier density | HL (3.1.17) p. 82, (3.1.20) p. 83, (3.1.21)–(3.1.24) p. 84, table p. 73 | Nothing. The table on p. 73 (ni = 1.45·10¹⁰) and Tabelle 3.1 on p. 83 (1.5·10¹⁰) differ; the lab uses p. 73. | Core comment: Eg(T) is figure 3.2.2, p. 90, not p. 89. |
| Drift and diffusion | HL (3.4.13)–(3.4.16) pp. 96–97, Einstein p. 103, (3.4.27) p. 103, (3.4.42), (3.4.43) p. 107; sheet 10, 37 a | The lab is right; **the script misprints (3.4.43)**: both exponents without minus signs, though its text says the area decays as exp(−t/τL). The script writes q in (3.4.13), e elsewhere. | Noted beside the equation; test that the pulse's area decays as e^(−t/τ). |
| Recombination | HL (3.4.29) p. 103, (3.4.34), (3.4.35) p. 104, (3.4.37), (3.4.38) p. 105; sheet 10, 37 b | The readout cited (3.4.38) but the lab did not list it. | (3.4.38) added. Practice 382 Ω and 108 µm rechecked. |
| Optical absorption | HL (4.2.2)–(4.2.10) pp. 114–115, table p. 73; sheet 10, 39 | The lab is right; **the script misprints E2 = EC − (mr/mn*)(ħω − EG)** on p. 114: only + gives E2 − E1 = ħω (4.2.2). Core comments cited (4.2.3), which is dE1. | Noted; comments corrected; test. Zj with ħ² (per dω) agrees with (4.2.4). |
| pn junction | HL (5.2.2)–(5.2.6) p. 129, (5.2.7)–(5.2.13) p. 131, (5.3.19) p. 139 | Nothing; (5.2.4) carries a minus sign the script drops from p. 131 (footnote 5). The lab gives the magnitude. | Noted. Practice 0.961 µm rechecked. |
| Junction capacitance | HL (5.2.14), (5.2.15) p. 132, (5.3.22) p. 140 | Nothing. 1/Cs² is the lab's rearrangement of (5.2.15); the script's CV method is on p. 132. | Practice 1.20 pF rechecked. |
| Diode | HL (5.3.4) p. 134, (5.3.10)–(5.3.12) p. 136, p. 137, (5.3.16)–(5.3.19) p. 139; EB p. 3, 1.6 p. 6, solution p. 8 | **The hint said 10 K raise the current "by about half"** at fixed voltage. (5.3.17): 0.05 /K at 0.7 V, so ×1.65; with the T³ of ni² the lab's model gives ×1.89. | Hint now "nearly doubles"; (5.3.17) added; test. Practice 1.6 c agrees with the collection's 665 nA (p. 8). |
| Bipolar transistor | HL (6.1.1) p. 161, (6.1.2), (6.1.3) p. 162, (6.1.4) p. 164; EB 2.1 p. 17, solutions p. 30; Lösungswege p. 12 | Nothing. | RC = 200 Ω and vu = −80 agree with p. 30. |
| MOSFET | HL p. 174, pp. 183–185, (6.2.19), (6.2.22) pp. 185, 187, p. 188; EB 3.3 p. 48, solution p. 56; Lösungswege p. 47 (viewed) | The lab is right; **the script misprints ΦF = kBT/(q ln(NA/ni))** (p. 174) and prints QB without its sign on p. 184 (p. 183: QB < 0). β = µCoxW/L is (6.2.19), not cited. | Noted; ref added. The core reproduces the script's example −QB/Cox = 0.84 V √(2ΦF + USB) (existing test). 3.3 agrees with 1 kΩ (p. 56); 5.1 with 2.11 V (Lösungswege p. 47). |
| Common-emitter stage | ST (1.1) p. 1, (1.4) p. 2, p. 7 | **S = IC/UT cited (1.18)**, which is rBE = β/S; S = Ia/UT stands unnumbered below (1.19). | Ref corrected; test. |
| Current source | ST (1.13) p. 5, (1.18), (1.19), p. 7 (β UT ≈ 2.6 V) | Nothing. The lab's ra = rCE(1 + βRE/(RE + rBE)) is its own; both limits are (1.19), checked. | Ref for S added. |
| Push-pull stages | ST (2.16) p. 22, (2.17), (2.18) p. 23, (2.19)–(2.24) p. 24; RB B1/1, B1/3 | **The supplied power was named PS**; the script writes PB. The per-transistor loss cited only RB; the script has it as (2.24). | PB in data, core and tests; (2.24) cited; test. UB²/(π²RL) is (2.21) at Ûa = 2UB/π, halved. 20 V and 6.13 W agree with RB (≈ 6 W). |
| Op-amp loop | ST (4.1) p. 69, (4.4) p. 70, (4.6) p. 71, (4.11) p. 72, rule p. 75, 45° p. 76; RB B6/4 | The two-pole loop had no equation. | Written as vs = βvg0/((1 + jω/ω1)(1 + jω/ω2)), the RB 6 form. 10 530 s⁻¹ and 6° agree with B6/4. |
| Slew rate | ST §4.4 pp. 85–86 | Nothing. | 9.5 kHz and 0.95 V agree with the example on p. 86 (rounded there to 10 kHz, 1 V). |
| Noise | ST (6.1), (6.2) p. 128, p. 130, (6.11) p. 132, (6.12) and example p. 133 | Nothing. The lab's equality IR = 2kT/q matches the script's own remark (p. 130): 1 kΩ at 300 K equals the shot noise of 50 µA. | Cited. 1.8·10⁻⁸ A agrees with p. 133. |

## Notation

`kit/MATH.md`: the source's symbols win. Followed: E_G and U_G for the gap (HL pp. 114, 139), PB, vg, vr, vs, ωg and ωG
as each equation prints them, Q_B, Φ_F, U_t. Kept from the lab, deliberately: e for the elementary charge in (3.4.13),
where the script writes q, and I for any current crossing a barrier in the shot-noise law, where the script writes I_D
for a diode.

## What could not be verified

- **Halbleiterphysik exercise solutions** (`Lösungen gute.pdf`) are scans; the sheet-10 answers are worked by hand.
- **Lösungswege p. 12** (exercise 2.1) was not viewed again; the collection's printed answers (p. 30) agree instead.
- **Extracted text only**: HL p. 43 and p. 58, ST p. 75, RB. Their numbers and structure are clear; Greek letters were
  reconstructed from context.
- **Not modelled**, stated in the hints: Early effect, channel-length modulation, freeze-out, Eg(T), indirect
  absorption, 1/f noise.

## For the kit (not changed here)

A long equation scrolls inside its own box, but the box has no `tabindex`, so the keyboard cannot reach it
(`kit/MATH.md` asks that Tab does). It affects every lab; the fix belongs in the kit's math renderer.
