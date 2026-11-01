// Digital carrier modulation, its synchronisation, and the receiver's noise, after Goiser (2016), sets 7–8 (carrier
// modulation I and II), "Synchronisation" and "Rauschen und Link-Budget". Slide numbers are the printed ones.
import { Q } from "./maths.js";

/** The points of M-PSK (set 8, slide 23: φn = (π/M)(2n − 1)) or square M-QAM (slides 29–31: levels ±1, ±3, … on I and Q),
 *  scaled to a mean symbol energy of 1, each with its Gray label (slide 6: neighbours differ in one bit). */
export function constellation(kind, M) {
  const k = Math.log2(M), gray = n => n ^ (n >> 1), label = (n, bits) => n.toString(2).padStart(bits, "0");
  if (kind === "psk") {
    return Array.from({ length: M }, (_, n) => {
      const a = Math.PI / M * (2 * n + 1);
      return { i: Math.cos(a), q: Math.sin(a), bits: label(gray(n), k) };
    });
  }
  const side = Math.sqrt(M), half = k / 2, scale = Math.sqrt(2 * (M - 1) / 3);
  const pts = [];
  for (let a = 0; a < side; a++) for (let b = 0; b < side; b++)
    pts.push({ i: (2 * a - side + 1) / scale, q: (2 * b - side + 1) / scale, bits: label(gray(a), half) + label(gray(b), half) });
  return pts;
}

/** Symbol error probability against Es/N0 (set 8): BPSK Q(√(2Es/N0)) (set 7, slide 50); QPSK 2Pb − Pb² with
 *  Pb = Q(√(2Eb/N0)) (slide 18); M-PSK, M > 4, about 2 Q(√(2Es/N0) sin(π/M)) (slide 24); square M-QAM about
 *  4 (√M − 1)/√M · Q(√(3Es/((M − 1)N0))) (slide 37). */
export function symbolError(kind, M, EsN0) {
  if (kind === "qam") return 4 * (Math.sqrt(M) - 1) / Math.sqrt(M) * Q(Math.sqrt(3 * EsN0 / (M - 1)));
  if (M === 2) return Q(Math.sqrt(2 * EsN0));
  if (M === 4) { const pb = Q(Math.sqrt(EsN0)); return 2 * pb - pb * pb; }
  return 2 * Q(Math.sqrt(2 * EsN0) * Math.sin(Math.PI / M));
}

/** Received points: each symbol (chosen by seeded uniform draws) plus Gaussian noise of variance N0/2 per axis, Es = 1,
 *  rotated by a carrier phase error φ. Returns the points and the decisions by nearest neighbour. */
export function receive(points, EsN0, u, noise, count, phi = 0) {
  const sigma = Math.sqrt(1 / (2 * EsN0)), c = Math.cos(phi), s = Math.sin(phi), out = [];
  let errors = 0;
  for (let n = 0; n < count; n++) {
    const sent = Math.min(points.length - 1, Math.floor(u() * points.length)), p = points[sent];
    const i = p.i * c - p.q * s + sigma * noise[(2 * n) % noise.length], q = p.i * s + p.q * c + sigma * noise[(2 * n + 1) % noise.length];
    let best = 0, dmin = Infinity;
    points.forEach((r, k) => { const d = (r.i - i) ** 2 + (r.q - q) ** 2; if (d < dmin) { dmin = d; best = k; } });
    if (best !== sent) errors++;
    out.push({ i, q, sent, decided: best });
  }
  return { out, ser: errors / count };
}

/** BPSK with a carrier phase error φ (Synchronisation, slide 9): the decision distance shrinks by cos φ,
 *  Pe = Q(√(2Eb/N0) cos φ). */
export const bpskPhaseError = (EbN0, phi) => Q(Math.sqrt(2 * EbN0) * Math.cos(phi));

/** QPSK with a carrier phase error φ (slide 11): ½ Q(√(2Eb/N0)(cos φ − sin φ)) + ½ Q(√(2Eb/N0)(cos φ + sin φ)). */
export const qpskPhaseError = (EbN0, phi) => {
  const a = Math.sqrt(2 * EbN0);
  return Q(a * (Math.cos(phi) - Math.sin(phi))) / 2 + Q(a * (Math.cos(phi) + Math.sin(phi))) / 2;
};

/** BPSK with a static timing error ε, a fraction of the bit (slides 13–14): half the bits, those after a change of
 *  sign, lose 2ε of their integral: ½ Q(√(2Eb/N0)) + ½ Q(√(2Eb/N0)(1 − 2ε)). */
export const timingError = (EbN0, eps) => { const a = Math.sqrt(2 * EbN0); return Q(a) / 2 + Q(a * (1 - 2 * eps)) / 2; };

/** The same counted: seeded polar bits, rectangular pulses, an integrate-and-dump over the bit shifted by ε. The
 *  second route to timingError. */
export function timingErrorCounted(EbN0, eps, u, noise, count) {
  const sigma = Math.sqrt(1 / (2 * EbN0));
  let prev = u() < 0.5 ? -1 : 1, errors = 0;
  for (let n = 0; n < count; n++) {
    const now = u() < 0.5 ? -1 : 1;
    // The window covers (1 − ε) of this bit and ε of the one before.
    const z = now * (1 - eps) + prev * eps + sigma * noise[n % noise.length];
    if ((z > 0 ? 1 : -1) !== now) errors++;
    prev = now;
  }
  return errors / count;
}

export const K_BOLTZMANN = 1.38e-23, T0 = 290; // as printed, Rauschen, slides 11 and 33

/** Thermal noise power kTB (Rauschen, slide 15), in W. */
export const thermalNoise = (T, B) => K_BOLTZMANN * T * B;

/** Noise factor of a cascade by Friis (slide 53): f = f1 + (f2 − 1)/G1 + (f3 − 1)/(G1 G2) + …, stages { G, f }, linear. */
export function friis(stages) {
  let f = 0, g = 1;
  stages.forEach((st, k) => { f += k === 0 ? st.f : (st.f - 1) / g; g *= st.G; });
  return f;
}

/** Noise temperature of a cascade (slides 40–41): Te = Te1 + Te2/G1 + Te3/(G1 G2) + …, with Te = (f − 1) T0
 *  (slide 52). The second route to friis. */
export function cascadeTemperature(stages) {
  let T = 0, g = 1;
  for (const st of stages) { T += (st.f - 1) * T0 / g; g *= st.G; }
  return T;
}

/** A lossy element of gain G < 1 at T0 has the noise factor 1/G (slides 53–57). */
export const lossFactor = G => 1 / G;

/** Output noise power of the chain (slides 32, 63): G k B (Ts + Te). */
export const outputNoise = (stages, Ts, B) => stages.reduce((g, st) => g * st.G, 1) * thermalNoise(Ts + cascadeTemperature(stages), B);
