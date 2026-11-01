// Measuring current, voltage and resistance with real instruments (Schrüfer et al. 2012, sections 2.1, 2.2.2 and 3.1):
// the meter's own resistance loads the circuit, a shunt or a series resistor extends its range, a rectifier meter
// reads the rectified mean scaled for a sine, and a probe divides by ten only when it is compensated.

const par = (a, b) => (a * b) / (a + b);
export { par as parallel };

/** A source Uq with internal resistance Ri read by a voltmeter of resistance RV: the meter sees a divider. */
export const voltmeterReading = (Uq, Ri, RV) => Uq * RV / (Ri + RV);

/** A source Uq driving a load R read by an ammeter of resistance RA in series. */
export const ammeterReading = (Uq, R, RA) => Uq / (R + RA);

/** The relative loading error, reading over the undisturbed value minus one; negative means it reads low. */
export const loadingError = (reading, truth) => reading / truth - 1;

/** The shunt that lets a movement of resistance RM and full scale IM read I (eq. 2.31). */
export const shunt = (RM, IM, I) => RM * IM / (I - IM);

/** The series resistor for a voltage range U at the meter's current I, its shunted movement Rp ‖ RM (eq. 2.34). */
export const seriesResistor = (U, I, Rpar) => U / I - Rpar;

/** Resistance from U and I, current-correct (Bild 3.1 a): the voltmeter also sees the ammeter's drop. Returns the raw
 *  quotient U/I and the corrected value (eq. 3.1). */
export function currentCorrect(Rx, RA, RV, U0 = 1) {
  const I = U0 / (Rx + RA), U = U0; // the voltmeter across the source, which drives Rx and RA in series
  return { U, I, raw: U / I, corrected: U / I - RA };
}

/** Resistance from U and I, voltage-correct (Bild 3.1 b): the ammeter also carries the voltmeter's current (eq. 3.2). */
export function voltageCorrect(Rx, RA, RV, U0 = 1) {
  const U = U0, I = U0 / Rx + U0 / RV; // the source across Rx with the voltmeter beside it; RA only drops voltage
  return { U, I, raw: U / I, corrected: U / (I - U / RV) };
}

/** Where both methods are equally wrong: the raw errors RA/Rx and Rx/RV meet at Rx = √(RA·RV) (derived here from
 *  eqs. 3.1 and 3.2, to first order). */
export const crossover = (RA, RV) => Math.sqrt(RA * RV);

/** Periodic waveforms of unit peak, as functions of the phase x = t/T in [0, 1). */
export const WAVES = {
  sine: { name: "Sine", f: x => Math.sin(2 * Math.PI * x) },
  triangle: { name: "Triangle", f: x => (x < 0.25 ? 4 * x : x < 0.75 ? 2 - 4 * x : 4 * x - 4) },
  square: { name: "Square", f: x => (x < 0.5 ? 1 : -1) },
  halfwave: { name: "Half-wave rectified sine", f: x => Math.max(0, Math.sin(2 * Math.PI * x)) },
  pulse: { name: "Pulse, 10 % duty", f: x => (x < 0.1 ? 1 : 0) },
};

/** A waveform with a share h of its third harmonic, scaled back to unit peak (a distorted sine). */
export const distorted = (h, phase = 0) => {
  const raw = x => Math.sin(2 * Math.PI * x) + h * Math.sin(6 * Math.PI * x + phase);
  let peak = 0;
  for (let k = 0; k < 2000; k++) peak = Math.max(peak, Math.abs(raw(k / 2000)));
  return x => raw(x) / peak;
};

/** The linear mean (eq. 2.36), the rectified mean (2.37) and the RMS value (2.38–2.39) over one period, sampled. */
export function averages(f, n = 20000) {
  let lin = 0, abs = 0, sq = 0, peak = 0;
  for (let k = 0; k < n; k++) {
    const v = f((k + 0.5) / n);
    lin += v; abs += Math.abs(v); sq += v * v; peak = Math.max(peak, Math.abs(v));
  }
  const rms = Math.sqrt(sq / n);
  return { mean: lin / n, rectified: abs / n, rms, peak, crest: peak / rms, form: rms / (abs / n) };
}

/** A sine's form factor, RMS over rectified mean: (û/√2)/(2û/π) = π/(2√2) ≈ 1.11 (eq. 2.44). */
export const FORM_SINE = Math.PI / (2 * Math.SQRT2);

/** What three meters show for a waveform (Schrüfer et al. 2012, pp. 97–99): a moving-coil meter the linear mean, a
 *  rectifier meter the rectified mean times the sine's form factor, a true-RMS meter the RMS value. */
export function meterReadings(f) {
  const a = averages(f);
  return { ...a, movingCoil: a.mean, rectifier: FORM_SINE * a.rectified, trueRms: a.rms, rectifierError: FORM_SINE * a.rectified / a.rms - 1 };
}

/** A probe RT ‖ CT ahead of the scope's input RE ‖ CE* (eqs. 2.96–2.102), answering a unit step: at the edge the
 *  capacitors divide, CT/(CT + CE*); at the end the resistors, RE/(RT + RE); between, an exponential with the time
 *  constant (RT ‖ RE)(CT + CE*), derived here from the node equation. */
export function probeStep({ RT, CT, RE, CE }, t) {
  const start = CT / (CT + CE), end = RE / (RT + RE), tau = par(RT, RE) * (CT + CE);
  return t < 0 ? 0 : end + (start - end) * Math.exp(-t / tau);
}

/** The probe's divider ratio U1/U2 at angular frequency w, complex, as |ratio| (eq. 2.96 with Z1 = RT ‖ CT,
 *  Z2 = RE ‖ CE*). Frequency-independent when RT·CT = RE·CE* (eq. 2.100). */
export function probeRatio({ RT, CT, RE, CE }, w) {
  // 1 + (RT/RE)(1 + jwRE·CE)/(1 + jwRT·CT)
  const a = RE * CE * w, b = RT * CT * w, k = RT / RE;
  const den = 1 + b * b, re = 1 + k * (1 + a * b) / den, im = k * (a - b) / den;
  return Math.hypot(re, im);
}

/** The compensating capacitance: RT·CT = RE·CE* (eq. 2.100). */
export const compensatingCT = ({ RT, RE, CE }) => RE * CE / RT;

/** The second route to the step answer: the node equation (CT + CE*)·u2' = CT·ue' + (ue − u2)/RT − u2/RE integrated
 *  by Runge–Kutta for an input that rises linearly over rise seconds. Returns u2 at the times asked. */
export function probeStepNumeric({ RT, CT, RE, CE }, times, rise = 1e-9) {
  const ue = t => (t <= 0 ? 0 : t >= rise ? 1 : t / rise), due = t => (t > 0 && t < rise ? 1 / rise : 0);
  const d = (t, u) => (CT * due(t) + (ue(t) - u) / RT - u / RE) / (CT + CE);
  // Fine steps while the input rises, then steps of a 400th of the time constant.
  const slow = par(RT, RE) * (CT + CE) / 400, out = [];
  let t = 0, u = 0;
  for (const target of times) {
    while (t < target - 1e-18) {
      const h = Math.min(t < rise ? Math.min(rise / 200, rise - t) : slow, target - t);
      const k1 = d(t, u), k2 = d(t + h / 2, u + h / 2 * k1), k3 = d(t + h / 2, u + h / 2 * k2), k4 = d(t + h, u + h * k3);
      u += h / 6 * (k1 + 2 * k2 + 2 * k3 + k4); t += h;
    }
    out.push(u);
  }
  return out;
}
