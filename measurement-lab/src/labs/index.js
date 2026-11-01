// The labs; data/labs.json puts them in order under their parts. Adding a lab: write its module, add it here and its
// words to data/labs.json.
import scatter from "./scatter.js";
import propagation from "./propagation.js";
import loading from "./loading.js";
import resistance from "./resistance.js";
import rms from "./rms.js";
import probe from "./probe.js";
import bridge from "./bridge.js";
import power from "./power.js";
import seismic from "./seismic.js";
import counter from "./counter.js";
import adc from "./adc.js";
import quantisation from "./quantisation.js";

export const labs = [scatter, propagation, loading, resistance, rms, probe, bridge, power, seismic, counter, adc, quantisation];
