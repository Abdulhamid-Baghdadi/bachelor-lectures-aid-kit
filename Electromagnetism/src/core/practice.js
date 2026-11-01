// A practice question's answer, worked from its data with the laws, so the answer in labs.json is checked, never
// trusted.
import * as F from "./fields.js";
import * as P from "./propagation.js";
import * as R from "./relativity.js";

const LAWS = {
  pointField: q => q.Q / (4 * Math.PI * F.EPS0 * q.r ** 2),
  flux: q => q.Q.reduce((a, b) => a + b, 0),
  wireH: q => F.wireH(q.I, q.r),
  inductionPeak: q => q.N * q.A * q.B * 2 * Math.PI * q.f,
  monopole: () => 0,
  chargeTime: q => q.Q / q.I,
  permittivity: q => F.material({ E: q.E, chi: q.chi }).D,
  speed: q => F.waveSpeed(q.epsr, q.mur ?? 1),
  poynting: q => F.wirePoynting(q.U, q.I, q.a, q.l).S,
  gyro: q => F.gyroRadius(q.q, q.m, q.v, q.B),
  laplaceMid: q => (q.U1 + q.U2) / 2,
  dipole: q => F.dipolePotential(q.p, q.r, q.theta),
  relaxation: q => F.relaxationTime(q.epsr, q.gamma),
  loopCentre: q => F.loopAxisB(q.I, q.a, 0),
  skin: q => F.skinDepth(q.f, q.gamma, q.mur ?? 1),
  waveH: q => F.planeWave(q.E).H,
  radiation: q => F.radiationResistance(q.l, q.lambda),
  lineZ: q => F.losslessLine(q.L, q.Cp).ZW,
  // The course's exercise collection: the same laws, in the forms its worked solutions use.
  skinLoss: q => (q.N * q.I) ** 2 / (q.gamma * F.skinDepth(q.f, q.gamma)),
  // E = (U/r) sin θ: ⟨S⟩ = U² sin²θ /(2 Z0 r²), over a sphere P = 4π U² /(3 Z0).
  antennaPower: q => 4 * Math.PI * q.U ** 2 / (3 * F.Z0),
  // ⟨S⟩ = Ê²/(2 Z0) for linear polarisation, Ê²/Z0 for circular; H = E/Z0.
  waveAmplitude: q => Math.sqrt((q.polarisation === "linear" ? 2 : 1) * F.Z0 * q.S) / (q.find === "H" ? F.Z0 : 1),
  isotropic: q => Math.sqrt(q.P * F.Z0 / (4 * Math.PI * q.r ** 2)),
  coax: q => F.Z0 * Math.log(q.ratio) / (2 * Math.PI),
  twoWire: q => F.Z0 * Math.log(2 * q.ratio) / Math.PI,
  strip: q => F.Z0 * q.ratio,
  // Wave propagation, Lasser (2012).
  brewster: q => P.brewsterAngle(q.n1, q.n2) * 180 / Math.PI,
  ellipticity: q => P.polarisation(q.E1, q.E2, q.psi * Math.PI / 180).dB,
  lossyDepth: q => P.lossyWave(q.f, q.epsr, q.sigma).depth,
  te10Cutoff: q => P.te10(q.a, 1e12).cutoff,
  effPermittivity: q => P.microstrip(q.epsr, q.q, 1, 1e9).eff,
  fresnelDiameter: q => 2 * P.fresnelRadius(q.lambda, q.d / 2, q.d / 2),
  pathLoss: q => P.link(1, 1, 1, q.f, q.d).Liso,
  sphere: q => P.sphereRCS(q.r),
  // Wave propagation exercises (Übungsteil), in the forms their worked solutions use.
  microstripLambda: q => F.C0 / q.f / Math.sqrt(q.eff),
  fillingFactor: q => (q.eff - 1) / (q.epsr - 1),
  // σ = A_w G = 4π A_w²/λ² (12.18) with the plate's effective area A_w = A w.
  retroRCS: q => P.plateRCS(q.A * q.w, F.C0 / q.f),
  // Moon as a reflector: P_E = SNR k T B; whole Moon lit: σ = π D_M²/4 · r, EIRP = P_E (4πd²)² / (σ A_e),
  // P_s = EIRP / G_s with G_s = 4π A_e/λ². Beam narrower than the Moon: P_E = P_s r A_e / (4πd²).
  moonPower: q => {
    const PE = q.snr * K_B * q.T * q.B, Ae = Math.PI * q.D ** 2 / 4 * q.w, lambda = F.C0 / q.f;
    if (q.beam === "narrow") return PE * 4 * Math.PI * q.d ** 2 / (q.r * Ae);
    const sigma = Math.PI * q.DM ** 2 / 4 * q.r;
    return PE * (4 * Math.PI * q.d ** 2) ** 2 / (sigma * Ae) / (4 * Math.PI * Ae / lambda ** 2);
  },
  // One-way link (12.9) against the noise k T B: P_s = SNR + k T B − G_s − G_e + L_ISO, all in dB; returned in W.
  linkPower: q => P.fromdB(P.dB(q.snr * q.k * q.T * q.B) - q.Gs - q.Ge + P.link(1, 1, 1, q.f, q.d).Liso),
  // Multipath, Lasser (2012) chapter 13.
  fadeSpacing: q => P.fadeSpacing(F.C0 / q.f, q.phi * Math.PI / 180),
  fadeRate: q => q.v / P.fadeSpacing(F.C0 / q.f, q.phi * Math.PI / 180),
  fadeDepthdB: q => 20 * Math.log10(P.fadeDepth(1, 10 ** (-q.ddB / 20))),
  dopplerShift: q => Math.abs(P.doppler(q.f, q.v, 0)),
  notchSpacing: q => 1 / q.dtau,
  isiRate: q => 1 / (2 * q.dtau),
  // Monostatic range from (12.17) where the echo meets SNR k T B.
  radarRange: q => {
    const Pmin = q.snr * q.k * q.T * q.B, Ps = P.fromdB(q.PsdBW), G = P.fromdB(q.GdBi);
    return 1e3 * (P.radar(Ps, G, q.sigma, q.f, 1e3) / Pmin) ** 0.25;
  },
  // Special relativity, Einstein (1905); speeds given as fractions of c0 (beta).
  lorentzFactor: q => R.lorentzFactor(q.beta * F.C0),
  clockTime: q => R.clockTime(q.t, q.beta * F.C0),
  rodLength: q => R.rodLength(q.L, q.beta * F.C0),
  addVelocities: q => R.addVelocities(q.v * F.C0, q.w * F.C0),
  // |E'| seen from a frame moving at v across a pure magnetic field B along z.
  boostedE: q => Math.hypot(...R.boostFields({ E: [0, 0, 0], B: [0, 0, q.B] }, q.v).E),
};

/** Boltzmann's constant, as the collection rounds it (1.38 × 10⁻²³ Ws/K); an exercise may give its own. */
const K_B = 1.38e-23;

/** The answer to a question's "compute" block; an unknown law is an error naming the ones there are. */
export function solve(compute) {
  const law = LAWS[compute.law];
  if (!law) throw new Error(`No law "${compute.law}" in src/core/practice.js; there are ${Object.keys(LAWS).join(", ")}.`);
  return law(compute);
}

