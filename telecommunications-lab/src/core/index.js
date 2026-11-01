// The core's front door: the laws, the units and the practice checker. Pure: no page, no clock, no randomness beyond the
// seeded generators.
export { uniform, gaussian, bits, erfc, Q, dftMagnitude, dB, fromDB, log2, sci } from "./maths.js";
export { quantise, snqr, snqrMeasured, pcmOutput, pcmOutputBySum, LINE_CODES, lineCode, psdEstimate, psdContinuous,
  meanPower, binaryError, BER, berCounted, raisedCosineSpectrum, raisedCosinePulse, rcBandwidth, rcEfficiency, eyeTraces,
  eyeOpening, matchedSNR, matchedSNRCounted } from "./baseband.js";
export { information, entropy, huffman, meanLength, efficiency, prefixFree, decode, errorsExactly, wordError,
  repetitionError, repetitionCounted, G, H, encode, encodeByParity, syndrome, decodeHamming, minimumDistance } from "./coding.js";
export { constellation, symbolError, receive, bpskPhaseError, qpskPhaseError, timingError, timingErrorCounted,
  K_BOLTZMANN, T0, thermalNoise, friis, cascadeTemperature, lossFactor, outputNoise } from "./carrier.js";
export { si, parseSi, isRight } from "../../../kit/core/index.js";
export { solve } from "./practice.js";
