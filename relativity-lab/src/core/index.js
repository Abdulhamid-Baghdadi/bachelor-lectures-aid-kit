// The core's front door: the laws, the units and the practice checker. Pure: no page, no clock, no randomness.
export { C0, MU0, EPS0, lorentzFactor, boost, interval, clockTime, rodLength, addVelocities, boostFields, movingCharge } from "./relativity.js";
export { si, parseSi, isRight } from "../../../kit/core/index.js";
export { solve } from "./practice.js";
