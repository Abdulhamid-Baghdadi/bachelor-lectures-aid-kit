# Work log

## 2 Nov 2026, while you were away

You asked for: a Mathematics 1–2 lab from Taschner's script; then Programming 1–2 (C), especially memory allocation
and searching, and a comparison of memory allocation in C, C++, Java, Python and JavaScript, with the sources found
by me.

### Done

- **Mathematics Lab** (`mathematics-lab/`, 10 labs): the Babylonian root, complex numbers, the geometric series,
  lower and upper sums, secant to tangent, Newton's method, pointwise against uniform convergence, two lines and
  Cramer's rule, eigenvectors, Cauchy's integral theorem.
  - Source: Taschner (2013), the script in your Mathematik 3 folder. Its text layer is scrambled, so every formula
    was read from the rendered pages and is cited by printed page.
  - The tests reproduce the script's own worked values: 721/228 (p. 2), 91/72 (p. 308) and the bump heights 0.828,
    2.605 and 9.424 (p. 286).
  - The script is undated; 2013 is the PDF's creation date, and the bibliography says so.
- **Programming Lab** (`programming-lab/`, 7 labs): sequential and binary search, bubble sort and quicksort, the heap,
  pointers, the program stack, malloc/realloc/free with the book's typical errors, and "Who gives memory back"
  comparing C, C++, Java, Python and JavaScript.
  - Your course material was in the Drive: the book Klima and Selberherr (2010) and the slides of Ceric et al.
    (2015) for Programmieren 1 and 2.
  - Tests reproduce the book's worked examples: quicksort's first pass (p. 262) and bubble sort's first pass (p. 172).
  - The comparison quotes each language's own documentation, read on 2 Nov 2026 and listed with links in
    `programming-lab/README.md`: cppreference (`free`, `unique_ptr`), the JVM Specification SE 21 § 2.5.3, the
    Python Language Reference § 3.1, and MDN.
- Both labs use the tabbed layout. Both are linked from the home page and the root README, with README pictures
  and an animation each.
- All test suites pass: the kit and the 11 labs.
- Checked in the browser:
  - every lab of both new labs loads in dark mode;
  - the malloc errors, heap, stack, pointers and search readouts were driven by script;
  - the heap lab was checked at phone width in light mode, with no sideways scroll;
  - two drawing bugs were found and fixed, each with a test.

### Not done

- **Nothing is committed or pushed.** You haven't said to push; when you do, both labs and the home page cards go
  together.
- The root README's start-page screenshots were not retaken. The new cards are below the first screen, so the
  pictures still look the same.
- Downloaded on 2 Nov, with your go-ahead for Fritzsche: `metkap9.pdf` and `metkap10.pdf` into
  `Mathematik 3\Fritzsche\`. Nothing else was downloaded; the language documentation was only read online.
- Left out of the Programming Lab:
  - Lists, binary search trees and hash tables are in the book but have no lab yet.
  - C++ `shared_ptr` and generational collectors are not covered, because none of the sources read covers them.

## 11 Nov 2026: what each symbol means

You asked for a list under every equation saying what each symbol means, the symbol typeset as in the equation (in
the library labs and both lecture kits). `kit/ui/math.js` gained `symbolList` (the same file as the library's and the
Master kit's); `kit/style.css` styles `.where`. In each lab: `where` on every equation, `lawWhere` where no equation
repeats the main law, shown under the law, the Explore equations and in the Equations tab; one test per lab checks
every entry has a meaning and typesets. Definitions from the lecture notes with pages; symbols they never define say
"(not defined in the source)"; equations made only of words or numbers have no list.

- All eleven labs done (Automation 222 equations, Electromagnetism 164, Semiconductors 98, Power 77, Telecommunications
  68, Measurement 60, Signals 53, Relativity 26, Mathematics 23, Programming 14, Vector calculus 11). Every suite
  passes; every lab checked in the browser (lists shown, nothing fails to typeset).
- Fixed on the way, each checked against the page: monopole ref p. 124 (was p. 127); line lab's reflection factor now
  "derived here from (5.120), p. 143"; delay-spread ref names the Übungsteil (exercise 25, p. 48); strain gauge eq.
  3.74 p. 236 added; random lab (1.39) p. 18 (was p. 15); drive (6.90) uses the notes' q; telecommunications
  CLAUDE.md gives the formulary's full path. Schrödl's page offset was already right.
- New `SOURCE-ERRORS.md` at the kit root: 17 confirmed slips in the notes, 5 notation differences, one reported slip
  (Gawlik p. 111) not confirmed.
- Open: the heap lab counts from 0 and the factorial lab stops at 1! (the book: from 1, and at 0! = 1, pp. 288, 257).
  Nothing committed.

## 12 Nov 2026: heap and factorial as the book has them

You chose to close the two open items. Read again in Klima and Selberherr (2010): positions from 1, children 2i and
2i + 1, parent i/2 (p. 288); the recursion ends at N = 0 with 0! = 1 ((18.2), p. 257; code p. 258), so 5! stacks six
levels (Fig. 18.2, p. 260).
- Heap: the arithmetic now runs on the book's positions; the readout, law and equation say so (ref p. 288, no longer
  "derived"). Its behaviour was already right. New tests from the book's own figures: inserting P into Fig. 19.26
  gives the array of Fig. 19.25; removing S gives Fig. 19.29(b), the left child taken on a tie as the book chose.
- Stack: factorial ends at 0; the practice answer is now 6 frames (was 5), from Fig. 18.2.
- 29 Programming tests pass; both labs checked in the browser. Nothing committed.

## 12 Nov 2026: lists, search trees and hashes

You asked for three labs from ch. 19 of Klima and Selberherr (2010), read again from the text layer: lists § 19.2
(pp. 266–274), trees § 19.4 (pp. 276–286), hashes § 19.6 (pp. 293–300). The book covers hashes, so all three are built.
- New core file `programming-lab/src/core/structures.js` (the list in an array as in Fig. 19.4, the binary search tree
  with equal keys to the left, the hash function of p. 297 with separate chaining) and labs `list`, `tree`, `hash`,
  under a new chapter 19 section. Words, equations with pages and symbol lists, and five practice questions in
  `data/labs.json`; README, ARCHITECTURE.md, CLAUDE.md and the bibliography say what is new.
- Tests from the book's own examples (`tests/unit/structures.test.js`): Fig. 19.3, 19.4, 19.6, 19.7 and the call
  ListeEinfuegen(feld, &kopf, 5, 3); the three orders of Fig. 19.14; Fig. 19.21 building Fig. 19.18; the search for N;
  deleting M (Fig. 19.22 to 19.23); the height of Fig. 19.16; Table 19.2 (5, 2, 5, 8, 5) and the means 0.45 and 1.6.
  46 Programming tests pass (29 before).
- SOURCE-ERRORS.md: one slip (p. 282, a sentence calls level order "preorder") and one notation note (p. 278, "genau
  zwei Nachfolger").
- The chapter label now says "Chapter 19" for a single chapter. Checked in the browser: light and dark, 375 px with no
  sideways scroll, keyboard (Enter in the text boxes inserts). Nothing committed.
