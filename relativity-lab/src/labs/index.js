// The labs; data/labs.json puts them in the order of Einstein (1905) under its sections. Adding a lab: write its
// module, add it here and its words to data/labs.json.
import minkowski from "./minkowski.js";
import dilation from "./dilation.js";
import velocity from "./velocity.js";
import movingcharge from "./movingcharge.js";
import freefall from "./freefall.js";
import tides from "./tides.js";

export const labs = [minkowski, dilation, velocity, movingcharge, freefall, tides];
