// The labs; data/labs.json puts them in order under their parts. Adding a lab: write its module, add it here and its
// words to data/labs.json.
import timeaxis from "./timeaxis.js";
import lti from "./lti.js";
import convolution from "./convolution.js";
import random from "./random.js";
import series from "./series.js";
import transform from "./transform.js";
import harmonics from "./harmonics.js";
import dft from "./dft.js";
import sampling from "./sampling.js";
import filters from "./filters.js";
import multirate from "./multirate.js";
import humfilter from "./humfilter.js";

export const labs = [timeaxis, lti, convolution, random, series, transform, harmonics, dft, sampling, filters, multirate, humfilter];
