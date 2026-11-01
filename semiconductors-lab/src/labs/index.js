// The labs; data/labs.json puts them in order under their parts. Adding a lab: write its module, add it here and its
// words to data/labs.json.
import bands from "./bands.js";
import fermi from "./fermi.js";
import carriers from "./carriers.js";
import drift from "./drift.js";
import recombination from "./recombination.js";
import absorption from "./absorption.js";
import junction from "./junction.js";
import capacitance from "./capacitance.js";
import diode from "./diode.js";
import bjt from "./bjt.js";
import mosfet from "./mosfet.js";
import cestage from "./cestage.js";
import currentsource from "./currentsource.js";
import poweramp from "./poweramp.js";
import opamploop from "./opamploop.js";
import slewrate from "./slewrate.js";
import noise from "./noise.js";

export const labs = [bands, fermi, carriers, drift, recombination, absorption, junction, capacitance, diode, bjt, mosfet,
  cestage, currentsource, poweramp, opamploop, slewrate, noise];
