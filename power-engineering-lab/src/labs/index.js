// The labs; data/labs.json puts them in order under their parts. Adding a lab: write its module, add it here and its
// words to data/labs.json. plane.js is the drawing several labs share, not a lab.
import threephase from "./threephase.js";
import power from "./power.js";
import transformer from "./transformer.js";
import line from "./line.js";
import transfer from "./transfer.js";
import perunit from "./perunit.js";
import shortcircuit from "./shortcircuit.js";
import stability from "./stability.js";
import rotatingfield from "./rotatingfield.js";
import dcmachine from "./dcmachine.js";
import pmsm from "./pmsm.js";
import feeder from "./feeder.js";

export const labs = [threephase, power, transformer, line, transfer, perunit, shortcircuit, stability, rotatingfield, dcmachine, pmsm, feeder];
