// The core's front door: the laws, the units and the practice checker. Pure: no page, no clock, no randomness
// beyond the seeded generator.
export { sinc, range, SHAPES, convolve, SYSTEMS, convolveSum, SEQUENCES, DSYSTEMS, dtft, pulseDtft, linearityError, shiftError, uniform, noise, smooth, smoothVariance,
  mean, correlate, fourier, pulseSpectrum, WAVES, partialSum, harmonics, reindex, alias, reconstruct, WINDOWS, windowOf,
  firLowpass, response, dB, butterworth, dft, fftStages, downsample, upsample, fir } from "./signals.js";
export { cAbs } from "../../../kit/core/index.js";
export { si, parseSi, isRight } from "../../../kit/core/index.js";
export { solve } from "./practice.js";
