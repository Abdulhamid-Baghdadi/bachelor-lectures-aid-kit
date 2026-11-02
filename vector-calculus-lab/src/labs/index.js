// The labs; data/labs.json puts them in the order of Fritzsche (2003), chapters 9 and 10. Adding a lab: write its
// module, add it here and its words to data/labs.json. plane.js is the drawing they share, not a lab.
import paths from "./paths.js";
import stokes from "./stokes.js";
import gauss from "./gauss.js";

export const labs = [paths, stokes, gauss];
