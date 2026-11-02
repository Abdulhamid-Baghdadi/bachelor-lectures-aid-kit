// A practice question's answer, worked from its data with the laws, so the answer in labs.json is checked, never
// trusted. Each part of the core keeps its own table of laws; their names must not clash.
import { LAWS as SYSTEMS } from "./systems.js";
import { LAWS as LOOPS } from "./loops.js";
import { LAWS as MECHANICS } from "./mechanics.js";
import { LAWS as HEAT } from "./heat.js";
import { LAWS as DRIVE } from "./drive.js";
import { LAWS as SINK } from "./sink.js";

const LAWS = { ...SYSTEMS, ...LOOPS, ...MECHANICS, ...HEAT, ...DRIVE, ...SINK };

/** The answer to a question's "compute" block; an unknown law is an error naming the ones there are. */
export function solve(compute) {
  const law = LAWS[compute.law];
  if (!law) throw new Error(`No law "${compute.law}" in the core's LAWS tables; there are ${Object.keys(LAWS).join(", ")}.`);
  return law(compute);
}

