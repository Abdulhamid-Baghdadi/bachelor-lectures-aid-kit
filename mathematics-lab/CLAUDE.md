# Mathematics Lab

Interactive labs for TU Wien's Mathematik 1 and 2 for electrical engineering (Taschner), one lab per idea, from the
Babylonian square root to Cauchy's integral theorem. Layers and rules: ARCHITECTURE.md. Tests:
`node --test "tests/unit/*.test.js"`.
Source of every equation: Taschner (2013), `H:\My Drive\02_Personal\02_Education\TU\01_TU_Bachelor\Mathematik 3\Taschner_Skr_mathe1-2.pdf`
(505 pages, undated; 2013 is the PDF's creation date). Its text layer is scrambled (body text decodes by adding 50 to
each character code, formulas not at all): render the pages (`pdftoppm -r 62`) and read them. Cite by printed page:
printed = PDF page up to about p. 360, PDF page − 12 near the end (p. 400 is PDF 412, p. 493 is PDF 505). There are no
exercises: practice is the script's own worked values or worked by hand, and says which. Laplace and linear ODEs stay
in the Automation Lab, Fourier series in the Signals and Systems Lab, vector analysis in the Vector Calculus Lab.
Part of `../PLAN.md`.
