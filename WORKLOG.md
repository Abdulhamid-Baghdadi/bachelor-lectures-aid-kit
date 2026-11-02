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
