# Scientific audit, 1 Nov 2026

What was checked: every equation, constant, readout text, hint text, chart label and practice answer of the ten labs.
Sources: Goiser (2016), lecture slides, read in the PDFs' text layer (`pdftotext -layout`). Slides whose formulas
were garbled in the text were rendered as images and read there: set 8, slides 24 and 37; set 4, slide 24;
Synchronisation, slide 9. Also the course formulary of 2017-03-07. Slide numbers are the printed ones, which equal the
PDF pages. Each correction has its test in `tests/unit/audit.test.js`, which failed before the fix. Every equation now
has its LaTeX (`tex`, `lawTex`). They typeset without error (`kit/tests`), and `tests/unit/labs-math.test.js` checks
that none is missing.

## One row per lab

| Lab | Checked against | Wrong, and the fix | Not verified |
|---|---|---|---|
| Quantisation and PCM | set 2, slides 35, 37, 39, 46, 47, 49, 50, 60, 63 | Nothing. Every formula and the three practice answers agree, including 4.8 + 6n − α_dB and SNR_out = SNQR/(1 + 4·SNQR·Pe). | — |
| Entropy and Huffman | set 5, slides 30, 32, 34, 35, 40, 41, 50, 52, 56, 57, 62 | The hint gave slide 41 for H = 2.55, L = 2.61 and η = 97.7 %. Slide 41 only poses the problem; the numbers are on slide 56. Now reads "slides 41 and 56". | — |
| Line codes | set 3, slides 47, 51, 52, 54–59 | Nothing. The PSD formula of slide 47 writes the lines at n·f0, and the LaTeX now does too, with f0 = 1/T0. | — |
| Raised cosine and eye | set 4, slides 8, 14, 16, 23–26; set 3, slides 66–68 | (1) The eye note said "ISI and jitter close it from the sides". Slide 66 says noise lowers A_V, ISI spreads the amplitudes at the decision instant, and jitter moves the zero crossings. Note corrected. (2) The slide names the corner frequency f_χ (slide 24, rendered), not f_N. The text, LaTeX and code comment now use f_χ. | The h(t) integral is the lab's own numerical route, not a slide formula. It is labelled "derived from set 4, slide 24". |
| Matched filter | set 4, slides 53, 55, 56, 58, 59, 80; set 3, slide 33; formulary eq. (5), (6), Table 2 | Nothing. The LaTeX follows the slide's notation: e^(−jωT0) and v*(T0 − t). | — |
| Repetition | set 6, slides 38, 40, 42, 59, 60, 63 | The ref for P(m) pointed at slide 59, which only names it. The formula is on slide 60. | — |
| Hamming | set 6, slides 37, 73, 81, 82, 85–89, 92, 98, 99 | Nothing. G, H, the parity equations and the worked syndrome (r = 1001101 → bit 5) agree. | — |
| PSK and QAM | set 7, slide 50; set 8, slides 3, 6, 18, 23, 24, 37, 40 | (1) **M-PSK**: slide 24 prints Pe ≈ Q(√(sin²(π/M)·2Es/N0)), with no factor 2. That is half of what its own assumption gives: confusion with the two neighbours s2 and s8. The lab keeps 2 Q(·), which a seeded count of 8-PSK at 14 dB backs (within 10 %; the printed form is half the count). The note used to call the formula "garbled in the text layer". It now says what the slide prints and why the lab departs from it. (2) The hint said 64-QAM needs "about 12 dB more than QPSK", which no slide says. The slides' own formulas (slides 18 and 37) give 13.5 dB at Pe = 10⁻⁵. Hint corrected. | Slide 24's Pb formula has the same missing factor. The lab uses Pb ≈ Pe/ld M with its own 2 Q(·). |
| Phase and timing errors | Synchronisation, slides 9, 11–14, 17, 18, 24, 26, 27, 30–32 | Nothing in the physics. | The slides name the phase error α (slide 9, rendered). The lab keeps φ, because set 4 uses α for the roll-off and both labs appear on one page. The LaTeX departs from the source here, on purpose. |
| Noise figure | Rauschen und Link-Budget, slides 11, 15, 30, 32–38, 40, 41, 43, 49–57, 59–65 | Nothing. Friis, Te, the −6 dB mixer (f = 4), −174 dBm/Hz, −89.2 dBm, f = 2.25, −49 dBm and the "roughly triples" of slides 49–50 all agree. | The slides disagree with each other: slide 59 gives the source temperature as 1000 K, slides 43, 61 and 65 as 100 K; slide 62 gives the LNA's F as 0.7 dB, slide 63 as 0.6 dB. The lab follows the worked solution: 100 K, and 0.7 dB = 10 log 1.17. |

## Limits

- The text layer drops Greek letters and symbols. Every formula was read against its rendered slide or recomputed. Only
  the four slides named above were inspected as images; the others were read in text where the formula survived.
- No exercises or exams with worked solutions were available. Practice answers marked "worked by hand" rest on the
  slides' formulas, recomputed by the core (`tests/unit/labs-data.test.js`).

## For `kit/` (not changed here)

- An equation box that scrolls at 375 px (`div.math.math-display`, from `kit/ui/math.js`) has no `tabindex`, so a
  keyboard user cannot scroll it. kit/MATH.md asks for "Tab reaches a box that scrolls". This affects every lab, the
  Signals pilot included: it needs `tabindex="0"` and a label when the box overflows.
