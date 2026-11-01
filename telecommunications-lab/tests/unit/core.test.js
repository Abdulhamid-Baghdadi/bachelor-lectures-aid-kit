// The telecommunication core against a second route: a numerical integral, a seeded count, a sum term by term, the
// encoder's parity equations, or a number printed on the slides of Goiser (2016) or in the course's formulary.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "../../src/core/index.js";

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} against ${b}`);
const rel = (a, b, tol, what) => near(a / b, 1, tol, what);

test("erfc against the Gaussian tail integrated by Simpson's rule, and Q(x) = 1 − Q(−x) (formulary, eq. 3)", () => {
  for (const x of [0, 0.3, 1, 2.2, 2.6, 4, 6]) {
    const n = 20000, top = x + 12, h = (top - x) / n;
    let s = 0;
    for (let k = 0; k <= n; k++) s += (k === 0 || k === n ? 1 : k % 2 ? 4 : 2) * Math.exp(-((x + k * h) ** 2));
    rel(T.erfc(x), 2 / Math.sqrt(Math.PI) * s * h / 3, 1e-9, `erfc(${x})`);
    near(T.Q(x) + T.Q(-x), 1, 1e-14, "symmetry");
  }
});

test("seeded noise is the same at every run, and has unit variance", () => {
  assert.deepEqual(T.gaussian(5, 9), T.gaussian(5, 9));
  const g = T.gaussian(11, 200000);
  near(g.reduce((s, x) => s + x * x, 0) / g.length, 1, 0.01, "variance");
});

test("PCM: the SNQR of a full-scale sine, measured, is 3·2^(2n)/2, i.e. 1.8 + 6n dB (set 2, slides 46–47)", () => {
  // The rule assumes the error uniform over a step; a sine through few, wide steps is not, and measures up to 0.5 dB
  // off for n ≤ 6. From n = 8 it holds within 0.4 dB.
  for (const n of [8, 10, 12]) {
    near(T.dB(T.snqrMeasured(n, 100000)), T.dB(T.snqr(n, 2)), 0.4, `n = ${n}`);
    near(T.dB(T.snqr(n, 2)), 4.77 + 6.02 * n - 3.01, 0.01, "4.8 + 6n − α_dB");
  }
});

test("PCM with bit errors: the closed form of slide 50 against the error powers summed bit by bit (slide 49)", () => {
  for (const n of [3, 8]) for (const Pe of [0, 1e-6, 1e-3]) rel(T.pcmOutput(n, Pe), T.pcmOutputBySum(n, Pe), 1e-12, `n ${n}, Pe ${Pe}`);
});

test("line codes: the slide-47 formula against the averaged periodogram of seeded bits; Manchester and AMI have no DC", () => {
  const b = T.bits(3, 4096), hold = 4, block = 256; // 8 samples per bit, so f = bin/block · 8 in units of the bit rate
  for (const code of ["nrz-polar", "rz-polar", "manchester"]) {
    const est = T.psdEstimate(T.lineCode(b, code), hold, block);
    for (const bin of [8, 24, 40]) {
      const f = bin / block * 8, want = T.psdContinuous(code, f) * 8; // density per bit-rate unit to per-sample
      near(est[bin], want, 0.25 * Math.max(want, 0.2), `${code} at f = ${f}`);
    }
  }
  const dc = code => T.psdEstimate(T.lineCode(b, code), hold, block)[0];
  for (const code of ["manchester", "ami"]) assert.ok(dc(code) < 0.1 * dc("nrz-unipolar"), `${code} DC`);
  near(T.meanPower("nrz-unipolar") / T.meanPower("nrz-polar"), 0.5, 1e-12, "unipolar has half the mean power at the same peak");
});

test("detection: the formulary's polar BER against seeded bits counted; unipolar needs 3 dB more (set 3, slide 55)", () => {
  const noise = T.gaussian(42, 400000);
  for (const dBv of [2, 6]) { const e = T.fromDB(dBv); rel(T.berCounted(e, noise), T.BER.polar(e), 0.05, `${dBv} dB`); }
  near(T.BER.unipolar(2 * T.fromDB(9.6)) / T.BER.polar(T.fromDB(9.6)), 1, 1e-12, "3 dB");
  near(T.binaryError(2, 1), T.Q(1), 0, "Q(V/2σ)");
});

test("raised cosine: zeros at every other symbol instant whatever α (set 4, slide 23); α = 0 is the sinc (slide 16)", () => {
  for (const a of [0.01, 0.35, 1]) {
    near(T.raisedCosinePulse(0, a), 1, 1e-6, "h(0)");
    for (const k of [1, 2, 3, 5]) near(T.raisedCosinePulse(k, a), 0, 1e-4, `α ${a}, t = ${k} T0`);
  }
  for (const t of [0.3, 1.5, 2.7]) near(T.raisedCosinePulse(t, 0.001, 4000), Math.sin(Math.PI * t) / (Math.PI * t), 2e-3, `sinc at ${t}`);
  near(T.raisedCosineSpectrum(0.5, 0.4), 0.5, 1e-12, "half at the corner frequency");
  near(T.rcBandwidth(1, 0.5), 0.75, 0, "B = (1 + α)/(2T0)"); near(T.rcEfficiency(1), 1, 0, "ηs = 2/(1 + α)");
});

test("the eye: open and ISI-free at the decision instant without noise; it closes as noise grows", () => {
  const b = T.bits(9, 80), quiet = T.eyeTraces(0.5, b, [0], 0, 16);
  near(T.eyeOpening(quiet, 16), 2, 1e-3, "full opening ±1");
  assert.ok(T.eyeOpening(T.eyeTraces(0.5, b, T.gaussian(1, 5000), 0.3, 16), 16) < 1.6);
});

test("matched filter: 2E/N0 at its output (set 4, slide 80), counted with seeded noise for two pulse shapes", () => {
  const noise = T.gaussian(7, 400000), dt = 0.02;
  const rect = Array(50).fill(1), tri = Array.from({ length: 50 }, (_, k) => 1 - Math.abs(k - 24.5) / 25);
  for (const pulse of [rect, tri]) {
    const r = T.matchedSNRCounted(pulse, dt, 0.5, noise, 4000);
    rel(r.snr, T.matchedSNR(r.E, 0.5), 0.06, "SNR");
  }
});

test("entropy and Huffman: the slides' 8-symbol example, H = 2.55, L = 2.61, η = 97.7 % (set 5, slides 42–57)", () => {
  const ps = [0.10, 0.18, 0.40, 0.05, 0.06, 0.10, 0.07, 0.04], codes = T.huffman(ps);
  near(T.entropy(ps), 2.55, 0.005, "H"); near(T.meanLength(ps, codes), 2.61, 1e-9, "L"); near(T.efficiency(ps, codes), 0.977, 0.001, "η");
  assert.deepEqual(codes.map(c => c.length), [3, 3, 1, 5, 4, 4, 4, 5], "lengths as on slide 55");
  assert.ok(T.prefixFree(codes));
  assert.deepEqual(T.decode(codes.join(""), codes), ps.map((_, i) => i));
  near(T.entropy([0.25, 0.25, 0.125, 0.125, 0.0625, 0.0625, 0.0625, 0.0625]), 2.75, 1e-12, "the ball-urn source, slide 23");
  near(T.meanLength([0.25, 0.25, 0.125, 0.125, 0.0625, 0.0625, 0.0625, 0.0625], T.huffman([0.25, 0.25, 0.125, 0.125, 0.0625, 0.0625, 0.0625, 0.0625])), 2.75, 1e-12, "dyadic: L = H");
});

test("repetition: n = 3, p = 0.001 gives about 3·10⁻⁶ (set 6, slide 42), and a seeded count agrees", () => {
  rel(T.repetitionError(3, 0.001), 2.998e-6, 1e-3, "slide 42");
  rel(T.repetitionCounted(5, 0.1, T.uniform(4), 400000), T.repetitionError(5, 0.1), 0.05, "count");
  // The slide subtracts its rounded P(0), P(1), P(2) from 1, so its 0.000116 is the exact 0.000114 rounded.
  near(T.wordError(10, 2, 0.01), 0.000116, 0.000003, "n = 10, Pb = 1 %, slide 63");
});

test("Hamming [7,4]: G against the parity equations, G Hᵀ = 0, dmin = 3, and the slides' worked examples", () => {
  for (let m = 0; m < 16; m++) {
    const d = [3, 2, 1, 0].map(k => (m >> k) & 1);
    assert.deepEqual(T.encode(d), T.encodeByParity(d));
    assert.deepEqual(T.syndrome(T.encode(d)), [0, 0, 0]);
    for (let e = 0; e < 7; e++) { const r = T.encode(d); r[e] ^= 1; assert.deepEqual(T.decodeHamming(r).d, d, `m ${m}, error at ${e + 1}`); }
  }
  assert.equal(T.minimumDistance(), 3);
  assert.deepEqual(T.encode([1, 0, 1, 1]), [1, 0, 1, 1, 1, 0, 0], "slide 87");
  const r = T.decodeHamming([1, 0, 0, 1, 1, 0, 1]);
  assert.deepEqual([r.s, r.pos, r.c], [[1, 0, 0], 5, [1, 0, 0, 1, 0, 0, 1]], "slides 98–99");
});

test("constellations: unit mean energy, Gray neighbours; the symbol error formulas against seeded counts", () => {
  for (const [kind, M] of [["psk", 2], ["psk", 4], ["psk", 8], ["qam", 16], ["qam", 64]]) {
    const pts = T.constellation(kind, M);
    near(pts.reduce((s, p) => s + p.i * p.i + p.q * p.q, 0) / M, 1, 1e-12, `${kind}${M} energy`);
    const EsN0 = T.fromDB(kind === "qam" ? (M === 16 ? 16 : 22) : 6 + 3 * Math.log2(M));
    const { ser } = T.receive(pts, EsN0, T.uniform(M), T.gaussian(M + 1, 400000), 200000);
    rel(ser, T.symbolError(kind, M, EsN0), 0.1, `${kind}${M}`);
  }
  const p8 = T.constellation("psk", 8);
  p8.forEach((p, k) => { const n = p8[(k + 1) % 8]; assert.equal([...p.bits].filter((b, j) => b !== n.bits[j]).length, 1, "Gray"); });
});

test("synchronisation: the phase-error formulas against rotated seeded symbols; timing error counted (slides 9–14)", () => {
  const noise = T.gaussian(21, 400000), EbN0 = T.fromDB(6);
  const bpsk = T.constellation("psk", 2);
  rel(T.receive(bpsk, EbN0, T.uniform(1), noise, 200000, 0.5).ser, T.bpskPhaseError(EbN0, 0.5), 0.06, "BPSK at 0.5 rad");
  // QPSK bit errors: Es = 2 Eb; per axis the error probability is what slide 11 averages.
  const q = T.receive(T.constellation("psk", 4), 2 * EbN0, T.uniform(2), noise, 200000, 0.3);
  const bitErr = q.out.reduce((s, o) => s + [...T.constellation("psk", 4)[o.sent].bits].filter((b, j) => b !== T.constellation("psk", 4)[o.decided].bits[j]).length, 0) / (2 * q.out.length);
  rel(bitErr, T.qpskPhaseError(EbN0, 0.3), 0.06, "QPSK at 0.3 rad");
  rel(T.timingErrorCounted(EbN0, 0.2, T.uniform(3), noise, 300000), T.timingError(EbN0, 0.2), 0.05, "ε = 0.2");
  near(T.bpskPhaseError(EbN0, 0), T.BER.polar(EbN0), 1e-15, "no phase error is polar detection");
});

test("noise: kT0 = 4·10⁻²¹ W/Hz, −174 dBm/Hz (Rauschen, slide 30); Friis against the temperature cascade", () => {
  near(T.thermalNoise(290, 1), 4.0e-21, 0.01e-21, "kT0");
  near(T.dB(T.thermalNoise(290, 1) / 1e-3), -174, 0.1, "dBm/Hz");
  const chain = [{ G: T.fromDB(12), f: 1.17 }, { G: 0.25, f: 4 }, { G: 100, f: 4.47 }, { G: 1000, f: 4.47 }];
  rel((T.friis(chain) - 1) * 290, T.cascadeTemperature(chain), 1e-12, "two routes");
  near(T.friis(chain), 2.25, 0.01, "slide 64"); near(T.cascadeTemperature(chain) + 100, 462, 2, "Tsys(in), slide 64, which rounds f to 2.25");
  near(T.dB(T.outputNoise(chain, 100, 5e6) / 1e-3), -49, 0.1, "−49 dBm, slide 65");
  near(T.lossFactor(0.25), 4, 0, "mixer −6 dB: f = 4, slide 57");
});

test("probabilities print as the slides write them", () => {
  assert.equal(T.sci(7.164e-3), "7.2·10⁻³"); assert.equal(T.sci(1e-8, 1), "1·10⁻⁸"); assert.equal(T.sci(0), "0"); assert.equal(T.sci(0.5), "5.0·10⁻¹");
});
