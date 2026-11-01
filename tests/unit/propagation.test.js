// The laws of Lasser (2012) against a right answer each: a limit the notes state, a cross-check with Prechtl (2010),
// an exercise of the notes, or a hand calculation.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as F from "../../src/core/index.js";

const near = (a, b, rel = 1e-3) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${a} is not ${b}`);
const deg = Math.PI / 180;

test("Fresnel: air to glass at normal incidence reflects ((n−1)/(n+1))² = 4 % in both cases (hand-checked)", () => {
  const r = F.fresnel(1, 1.5, 0);
  near(r.RTE, 0.04); near(r.RTM, 0.04);
});

test("Fresnel: at the Brewster angle tan Θ_B = n the TM reflection vanishes, the TE does not (p. 46)", () => {
  const tb = F.brewsterAngle(1, 1.5);
  near(tb / deg, 56.31, 1e-4);
  assert.ok(F.fresnel(1, 1.5, tb).RTM < 1e-20);
  assert.ok(F.fresnel(1, 1.5, tb).RTE > 0.1);
});

test("Fresnel: from glass to air, everything is reflected past the critical angle (Fig. 4.3, n = 0.67)", () => {
  const tc = F.criticalAngle(1.5, 1);
  near(tc / deg, 41.81, 1e-4);
  assert.equal(F.fresnel(1.5, 1, tc + 0.01).RTE, 1);
  assert.ok(F.fresnel(1.5, 1, tc - 0.05).RTE < 1);
});

test("Snell: sin Θ1 / sin Θ2 = n2 / n1 (p. 45)", () => {
  const r = F.fresnel(1, 1.5, 40 * deg);
  near(Math.sin(40 * deg) / Math.sin(r.theta2), 1.5, 1e-12);
});

test("polarisation: E1 = E2, ψ = −90° is right-hand circular, 0 dB; ψ = 0 is linear (pp. 34–35)", () => {
  const c = F.polarisation(1, 1, -90 * deg);
  near(c.ratio, 1, 1e-6); assert.equal(c.sense, "right-hand");
  assert.equal(F.polarisation(1, 1, 90 * deg).sense, "left-hand");
  assert.equal(F.polarisation(1, 2, 0).sense, "linear");
  // ψ = 90°, E1 = 2, E2 = 1: an upright ellipse with half axes 2 and 1 (by definition).
  near(F.polarisation(2, 1, 90 * deg).ratio, 2, 1e-6);
});

test("lossy medium: with σ = 0 there is no damping and β = ω√(με) (p. 38)", () => {
  const w = F.lossyWave(1e9, 4, 0);
  assert.equal(w.alpha, 0);
  near(w.beta, 2 * Math.PI * 1e9 * Math.sqrt(F.MU0 * F.EPS0 * 4), 1e-12);
});

test("lossy medium: in a good conductor 1/α is Prechtl's skin depth √(2/(μωγ)) (cross-check of the two notes)", () => {
  near(F.lossyWave(50, 1, 5.8e7).depth, F.skinDepth(50, 5.8e7), 1e-6);
  near(F.lossyWave(1e6, 80, 4).depth, F.skinDepth(1e6, 4), 2e-2);
});

test("waveguide: WR-90 (22.86 × 10.16 mm) has TE10 cutoff c/(2a) = 6.557 GHz and TE20 next at 13.1 GHz (hand-checked)", () => {
  const modes = F.waveguideModes(0.02286, 0.01016, 10e9);
  assert.equal(modes[0].type + modes[0].m + modes[0].n, "TE10");
  near(modes[0].fc, 6.557e9, 1e-3);
  near(modes[1].fc, 13.11e9, 1e-3);
  assert.deepEqual(modes.filter(m => m.carries).map(m => m.type + m.m + m.n), ["TE10"]);
});

test("TE10: Z_W,TE and λ_H grow without bound towards cutoff, and v_phase v_group = c² (p. 66)", () => {
  const t = F.te10(0.02286, 10e9);
  near(t.phaseSpeed * t.groupSpeed, F.C0 ** 2, 1e-12);
  near(t.Z, 376.73 / Math.sqrt(1 - (F.C0 / 10e9 / 0.04572) ** 2), 1e-4);
  assert.equal(F.te10(0.02286, 6e9).carries, false);
});

test("microstrip: q = 1 gives ε_eff = ε_r, q = 0.5 gives (ε_r + 1)/2 (p. 96)", () => {
  assert.equal(F.microstrip(4.4, 1, 100, 1e9).eff, 4.4);
  assert.equal(F.microstrip(4.4, 0.5, 100, 1e9).eff, 2.7);
});

test("Fresnel zone: 50 km at λ = 5 cm is 50 m across at mid-path (the notes' exercise, p. 107)", () => {
  near(2 * F.fresnelRadius(0.05, 25e3, 25e3), 50, 1e-9);
  // The detour at that radius is λ/2, to the order the approximation keeps.
  near(F.detour(25e3, 25e3, 25), 0.025, 1e-4);
});

test("link: L_ISO at 1 GHz over 1 km is 92.4 dB (12.10, hand-checked)", () => {
  near(F.link(1, 1, 1, 1e9, 1e3).Liso, 92.44, 1e-4);
  const l = F.link(10, F.fromdB(30), F.fromdB(30), 10e9, 50e3);
  near(F.dB(l.Pe), F.dB(10) + 30 + 30 - l.Liso, 1e-12);
});

test("two-path channel: notches every 1/Δτ, depth (A1 − A2)/(A1 + A2) (13.4)", () => {
  const dtau = 20e-9;
  near(F.twoPath(1, 0.7943, 1 / (2 * dtau), dtau), 1 - 0.7943, 1e-9);
  near(F.twoPath(1, 0.7943, 1 / dtau, dtau), 1 + 0.7943, 1e-9);
  near(20 * Math.log10(F.fadeDepth(1, 10 ** (-2 / 20))), -18.82, 1e-3);
});

test("Doppler: 900 MHz at 60 km/h shifts by 50 Hz, the notes' exercise (13.11, p. 150)", () => {
  near(Math.abs(F.doppler(900e6, 60 / 3.6, 0)), 50.03, 1e-3);
  assert.ok(Math.abs(F.doppler(900e6, 60 / 3.6, Math.PI / 2)) < 1e-12);
});

test("fading in space: the pattern's fades lie λ/(2 sin(φ/2)) apart, as its field says (p. 151)", () => {
  const lam = F.C0 / 900e6, phi = 45 * deg, s = F.fadeSpacing(lam, phi);
  near(s, 0.4352, 1e-3);
  // Moving along the bisector's normal, the field repeats with that spacing: find two minima numerically.
  const ux = -Math.sin(phi / 2), uy = Math.cos(phi / 2);
  const along = t => F.twoWaveField(1, 0.8, lam, phi, t * ux, t * uy);
  const mins = [];
  for (let k = 1; k < 3000; k++) { const t = k * 1e-3; if (along(t) < along(t - 1e-3) && along(t) < along(t + 1e-3)) mins.push(t); }
  near(mins[1] - mins[0], s, 5e-3);
});

test("radar: (12.16) with G_s = G_e is (12.17), and doubling d costs 12 dB (p. 143)", () => {
  const Ps = 1e3, G = 1000, s = 1, f = 3e9, d = 1e4, lam = F.C0 / f;
  const via16 = Ps * G * s / (4 * Math.PI * d * d) ** 2 * lam * lam / (4 * Math.PI) * G;
  near(F.radar(Ps, G, s, f, d), via16, 1e-12);
  near(F.dB(F.radar(Ps, G, s, f, d) / F.radar(Ps, G, s, f, 2 * d)), 12.04, 1e-3);
  near(F.plateRCS(lam * lam, lam) / (lam * lam), 4 * Math.PI, 1e-12);
});
