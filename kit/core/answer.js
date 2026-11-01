// Checking a student's answer, the same in every lab.

/** Is an answer right? Within a relative tolerance (2 % by default, for answers rounded by hand). */
export const isRight = (given, answer, tolerance = 0.02) =>
  tolerance === 0 ? given === answer : Math.abs(given - answer) <= tolerance * Math.abs(answer);
