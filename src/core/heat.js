// Heat transfer, after Kugi et al. (2015), Modellbildung, TU Wien, chapter 3: plane and cylindrical walls with
// convection on both sides, fins, radiation between grey diffuse surfaces, a heated water tank, and the explicit
// finite-difference scheme for 1D conduction. Equation numbers are the notes'; "derived" marks steps worked by hand
// from them. Temperatures in kelvin wherever radiation enters; elsewhere only differences matter, so °C works too.

/** Stefan–Boltzmann constant σ [W/(m² K⁴)], as given under (3.35). */
export const SIGMA = 5.6704e-8;

/** Heat transfer coefficient k of a layered plane wall with films on both sides, 1/k = 1/α0 + Σ Li/λi + 1/αL (3.84).
 *  layers: [{ L, lambda }]. */
export const heatWallK = (alpha0, layers, alphaL) =>
  1 / (1 / alpha0 + layers.reduce((s, l) => s + l.L / l.lambda, 0) + 1 / alphaL);

/** Heat flux and the temperature at each face of a layered wall (3.82): the drop over each resistance is q times it.
 *  Returns { q, k, x: faces from 0, T: face temperatures }. */
export function heatWallProfile(Tinf0, TinfL, alpha0, layers, alphaL) {
  const k = heatWallK(alpha0, layers, alphaL), q = k * (Tinf0 - TinfL);
  const x = [0], T = [Tinf0 - q / alpha0];
  for (const l of layers) { x.push(x.at(-1) + l.L); T.push(T.at(-1) - q * l.L / l.lambda); }
  return { q, k, x, T };
}

/** Heat flow per unit length out of a layered pipe, q′ = 2π(TF − T∞) / (1/(r0α0) + Σ ln(ri/ri−1)/λi + 1/(rNαN)) (3.93).
 *  radii: [r0 … rN], lambdas: [λ1 … λN]. */
export function heatPipeLoss(TF, Tinf, radii, lambdas, alpha0, alphaN) {
  let R = 1 / (radii[0] * alpha0) + 1 / (radii.at(-1) * alphaN);
  lambdas.forEach((l, i) => { R += Math.log(radii[i + 1] / radii[i]) / l; });
  return 2 * Math.PI * (TF - Tinf) / R;
}

/** Temperature at radius r in a layered pipe: the logarithmic profile (3.90) in the layer holding r, its face
 *  temperatures from the drops q′/(2π) × each resistance. */
export function heatPipeTemperature(r, TF, Tinf, radii, lambdas, alpha0, alphaN) {
  const qp = heatPipeLoss(TF, Tinf, radii, lambdas, alpha0, alphaN) / (2 * Math.PI);
  let T = TF - qp / (radii[0] * alpha0);
  for (let i = 0; i < lambdas.length; i++) {
    const Tn = T - qp * Math.log(radii[i + 1] / radii[i]) / lambdas[i];
    if (r <= radii[i + 1]) return T + (Tn - T) * Math.log(r / radii[i]) / Math.log(radii[i + 1] / radii[i]);
    T = Tn;
  }
  return T;
}

/** Critical insulation radius rc = λ/α: d q′/d rN = 0 in (3.93) for the outer layer (derived). Below it, more
 *  insulation loses more heat. */
export const heatCriticalRadius = (lambda, alpha) => lambda / alpha;

// A straight fin of length L, cross-section A, perimeter P, base temperature T0, tip cooled with αL; the fin
// equation λA T″ = αP (T − T∞) worked by hand: θ = T − T∞, m² = αP/(λA), β = αL/(λm).
const finParts = f => { const m = Math.sqrt(f.alpha * f.P / (f.lambda * f.A)); return { m, beta: f.alphaL / (f.lambda * m) }; };

/** Temperature along a fin, θ(x)/θ0 = (cosh m(L−x) + β sinh m(L−x)) / (cosh mL + β sinh mL) (derived). */
export function finTemperature(x, f) {
  const { m, beta } = finParts(f), u = m * (f.L - x);
  return f.Tinf + (f.T0 - f.Tinf) * (Math.cosh(u) + beta * Math.sinh(u)) / (Math.cosh(m * f.L) + beta * Math.sinh(m * f.L));
}

/** Heat flow into the fin at its base, Q(0) = λAmθ0 (sinh mL + β cosh mL)/(cosh mL + β sinh mL) (derived). */
export function finHeat(f) {
  const { m, beta } = finParts(f), mL = m * f.L;
  return f.lambda * f.A * m * (f.T0 - f.Tinf) * (Math.sinh(mL) + beta * Math.cosh(mL)) / (Math.cosh(mL) + beta * Math.sinh(mL));
}

/** Fin efficiency ηf = Q(0)/Qmax (3.94), Qmax with the whole surface (sides and tip) at T0. */
export const finEfficiency = f => finHeat(f) / ((f.alpha * f.P * f.L + f.alphaL * f.A) * (f.T0 - f.Tinf));

/** Net radiant flux out of an inner tube (diameter d) inside an outer one (D), grey diffuse, per area of the inner
 *  tube: q1 = σ(T1⁴ − T2⁴)/(1/ε1 + (d/D)(1/ε2 − 1)), (3.63) rearranged. */
export const heatTubeNet = (T1, T2, eps1, eps2, dOverD) => SIGMA * (T1 ** 4 - T2 ** 4) / (1 / eps1 + dOverD * (1 / eps2 - 1));

/** Heat lost per unit length by the outer tube to the air and the surroundings at T∞, by convection and radiation:
 *  q′ = πD(α(T2 − T∞) + ε2σ(T2⁴ − T∞⁴)) (3.65). Returns { conv, rad, total }. */
export function heatOuterLoss(T2, Tinf, alpha, eps2, D) {
  const conv = Math.PI * D * alpha * (T2 - Tinf), rad = Math.PI * D * eps2 * SIGMA * (T2 ** 4 - Tinf ** 4);
  return { conv, rad, total: conv + rad };
}

/** Inner tube temperature that carries q′ through the vacuum gap, T1 = (T2⁴ + (1/ε1 + (d/D)(1/ε2 − 1)) q′/(πdσ))^¼
 *  (3.67). */
export const heatInnerTemp = (qp, T2, eps1, eps2, d, D) =>
  (T2 ** 4 + (1 / eps1 + d / D * (1 / eps2 - 1)) * qp / (Math.PI * d * SIGMA)) ** 0.25;

/** Linearised radiation coefficient αrad = εσ(T2² + T∞²)(T2 + T∞), so εσ(T2⁴ − T∞⁴) = αrad(T2 − T∞) (derived). */
export const heatRadAlpha = (T2, Tinf, eps) => eps * SIGMA * (T2 ** 2 + Tinf ** 2) * (T2 + Tinf);

/** The immersion heater (Beispiel 3.3): water temperature T(t) = T∞ + P/(kA)(1 − e^(−kA t/(m0 cp))) (3.99),
 *  held at Ts once it boils. */
export const heatTankTemp = (t, { P, kA, m0, cp, Tinf, Ts = Infinity }) =>
  Math.min(Ts, Tinf + P / kA * (1 - Math.exp(-kA * t / (m0 * cp))));

/** Heater power that brings the water to the boil at ts, P = kA(Ts − T∞)/(1 − e^(−kA ts/(m0 cp))) (3.100). */
export const heatTankPower = (ts, { kA, m0, cp, Tinf, Ts }) => kA * (Ts - Tinf) / (1 - Math.exp(-kA * ts / (m0 * cp)));

/** Time to the boil, ts = −(m0 cp/kA) ln(1 − kA(Ts − T∞)/P), (3.99) solved for T(ts) = Ts; Infinity if P never
 *  gets there (derived). */
export function heatTankBoilTime({ P, kA, m0, cp, Tinf, Ts }) {
  const s = 1 - kA * (Ts - Tinf) / P;
  return s > 0 ? -m0 * cp / kA * Math.log(s) : Infinity;
}

/** Time when all the water has boiled away, t = ts + (hv m0/(kA(Ts − T∞))) ln(P/(P − kA(Ts − T∞))) (3.104). */
export const heatTankDryTime = (ts, { P, kA, m0, hv, Tinf, Ts }) => {
  const Q = kA * (Ts - Tinf);
  return ts + hv * m0 / Q * Math.log(P / (P - Q));
};

/** One explicit Euler step (3.110) of the rod with an insulated end at x = 0 and T(L) = TL: r = aΔt/Δx². T holds
 *  T0 … TN; returns a new array. */
export function heatFdmStep(T, r, TL) {
  const N = T.length - 1, next = T.slice();
  next[0] = T[0] + 2 * r * (T[1] - T[0]);
  for (let i = 1; i < N; i++) next[i] = T[i] + r * (T[i - 1] - 2 * T[i] + T[i + 1]);
  next[N] = TL;
  return next;
}

/** Largest stable time step of the explicit scheme, Δt = Δx²/(2a) from (3.111). */
export const heatFdmMaxStep = (a, dx) => dx * dx / (2 * a);

/** The same rod solved by separation of variables, starting uniform at TA (derived, for checking the grid):
 *  T = TL + (TA − TL) Σ 4(−1)ⁿ/((2n+1)π) cos(knx) e^(−a kn² t), kn = (2n+1)π/(2L). */
export function heatRodSeries(x, t, { a, L, TA, TL }, terms = 200) {
  let s = 0;
  for (let n = 0; n < terms; n++) {
    const k = (2 * n + 1) * Math.PI / (2 * L);
    s += 4 * (-1) ** n / ((2 * n + 1) * Math.PI) * Math.cos(k * x) * Math.exp(-a * k * k * t);
  }
  return TL + (TA - TL) * s;
}

/** Laws for the practice questions; every key starts with "heat". */
export const LAWS = {
  heatWallK: q => heatWallK(q.alpha0, q.layers, q.alphaL),
  heatGlazingRatio: q => heatWallK(q.alphaI, [q.glass], q.alphaA) / heatWallK(q.alphaI, [q.glass, q.gap, q.glass], q.alphaA),
  heatPipeLoss: q => heatPipeLoss(q.TF, q.Tinf, q.radii, q.lambdas, q.alpha0, q.alphaN),
  heatCriticalRadius: q => heatCriticalRadius(q.lambda, q.alpha),
  heatFinEfficiency: q => finEfficiency(q),
  heatFinHeat: q => finHeat(q),
  heatOuterLoss: q => heatOuterLoss(q.T2, q.Tinf, q.alpha, q.eps2, q.D).total,
  heatTankPower: q => heatTankPower(q.ts, { ...q, kA: q.A * heatWallK(q.alphaI, [{ L: q.Lw, lambda: q.lambda }], q.alphaA) }),
  heatFdmMaxStep: q => heatFdmMaxStep(q.lambda / (q.rho * q.cp), q.L / q.N),
};
