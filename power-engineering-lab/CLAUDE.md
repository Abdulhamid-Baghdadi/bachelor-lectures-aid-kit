# Power engineering

Interactive labs for TU Wien's Energieversorgung (370.002) and Maschinen und Antriebe (370.015): one lab per idea, from
star and delta to the permanent-magnet synchronous machine. Layers and rules: ARCHITECTURE.md. Tests:
`node --test "tests/unit/*.test.js"`.
Sources, in `H:\My Drive\02_Personal\02_Education\TU\01_TU_Bachelor\`:
- `Energieversorgung\EV 2014W V007.pdf`: Gawlik's lecture notes (Skriptum, version of 4 Oct 2015) with a text layer;
  printed page = PDF page − 8. Formulas are scrambled in the text layer: match them by equation number and render the
  page when in doubt. Cite by equation number and printed page. The slide sets `EV-V01+02` … `EV-V21-22` (2015/16)
  follow the notes; their title slides name no author or year.
- `Maschienen und Antriebe\Schroedl_maschinen_2012.pdf`: a scan whose OCR layer drops the equations. Render the pages
  (`pdftoppm -r 80 -f N -l N`) and read the images; cite by equation number (G.…, A.…, M.…, P.…) and printed page.
- Practice from the exams with worked solutions in `VO-370.015-Maschinen-und-Antriebe-exm-bsp-hyb-pge.pdf` (students'
  collection, 2017); recompute every answer, the solutions have slips.
Neither source treats the induction machine's equivalent circuit or Kloss's formula, nor the wound-rotor synchronous
machine's V-curves: no lab for them until a source does. Phasor maths, Bode and control belong to the Automation lab;
harmonics and distortion power to the Signals and Systems lab; waves on lines to the Electrodynamics lab. Part of
`../PLAN.md`; not published yet.
