// The core's front door: the fields, the integrals and the practice checker. Pure: no page, no clock, no randomness.
export { FIELDS, lineIntegral, segment, arc, circle, curlZ, divergence, curlOverDisc, fluxThroughSphere, divergenceOverBall } from "./vector.js";
export { si, parseSi, isRight } from "../../../kit/core/index.js";
export { solve } from "./practice.js";
