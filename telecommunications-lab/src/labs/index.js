// The labs; data/labs.json puts them in order under their parts. Adding a lab: write its module, add it here and its
// words to data/labs.json.
import pcm from "./pcm.js";
import huffman from "./huffman.js";
import linecodes from "./linecodes.js";
import nyquist from "./nyquist.js";
import matched from "./matched.js";
import repetition from "./repetition.js";
import hamming from "./hamming.js";
import constellation from "./constellation.js";
import sync from "./sync.js";
import noisefigure from "./noisefigure.js";

export const labs = [pcm, huffman, linecodes, nyquist, matched, repetition, hamming, constellation, sync, noisefigure];
