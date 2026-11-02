// The labs; data/labs.json puts them in the order of Taschner's script for Mathematik 1 and 2. Adding a lab: write
// its module, add it here and its words to data/labs.json. plane.js is the drawing several share, not a lab.
import babylon from "./babylon.js";
import complex from "./complex.js";
import series from "./series.js";
import riemann from "./riemann.js";
import tangent from "./tangent.js";
import newton from "./newton.js";
import bumps from "./bumps.js";
import lines from "./lines.js";
import eigen from "./eigen.js";
import cauchy from "./cauchy.js";

export const labs = [babylon, complex, series, riemann, tangent, newton, bumps, lines, eigen, cauchy];
