// The worked example: one digital voice channel through the whole course. PCM at 8 kHz and 8 bit (set 2, slide 60),
// a Hamming (7,4) code (set 6), QPSK on raised-cosine pulses (set 8, set 4) and the slides' superheterodyne receiver
// (Rauschen, slides 59–65). Each step's rate feeds the next; the receiver's noise decides the bit errors, and those
// the voice's SNR at the end (set 2, slide 50).
import { Q, dB } from "./maths.js";
import { snqr, pcmOutput, rcBandwidth } from "./baseband.js";
import { wordError } from "./coding.js";
import { K_BOLTZMANN, friis, T0 } from "./carrier.js";

/** The slides' receiver (Rauschen, slides 59–65): LNA, mixer, two amplifiers, as { name, G, f } with linear values. */
export const RECEIVER = [
  { name: "LNA", G: 10 ** 1.2, f: 1 + 50 / T0 },
  { name: "mixer", G: 0.25, f: 4 },
  { name: "amplifier 1", G: 100, f: 1 + 1000 / T0 },
  { name: "amplifier 2", G: 1000, f: 1 + 1000 / T0 },
];

/** The link's numbers from its settings: fs [Hz], n bits, the code (k, n) or none, roll-off α, antenna Ts [K] and the
 *  received power S [W]. Eb is the energy per information bit, Ec per channel bit: S = Eb Rb = Ec Rc. */
export function voiceLink({ fs = 8000, n = 8, code = true, alpha = 0.5, Ts = 100, S }) {
  const Rb = fs * n, rate = code ? 4 / 7 : 1, Rc = Rb / rate, Rs = Rc / 2, B = rcBandwidth(Rs, alpha);
  const f = friis(RECEIVER), Tsys = Ts + (f - 1) * T0, N0 = K_BOLTZMANN * Tsys;
  const EbN0 = S / (N0 * Rb), EcN0 = rate * EbN0;
  // QPSK's bit error is BPSK's, Q(√(2Eb/N0)), per channel bit (set 8, slide 18).
  const p = Q(Math.sqrt(2 * EcN0));
  // A (7,4) word fails when two or more of its bits do (set 6, slide 60). Each failed word spoils at most its four data
  // bits, so the word error bounds the data bits' error from above: this lab's bound, not the slides'.
  const Pe = code ? wordError(7, 1, p) : p;
  return { Rb, Rc, Rs, B, f, F: dB(f), Tsys, N0, EbN0, EcN0, p, Pe, snqr: snqr(n, 2), snrOut: pcmOutput(n, Pe, snqr(n, 2)) };
}

/** The received power that gives a bit error Pe after decoding, by bisection in dB. */
export function powerFor(target, q) {
  let lo = -200, hi = 0;
  for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (voiceLink({ ...q, S: 10 ** (m / 10) * 1e-3 }).Pe > target) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
