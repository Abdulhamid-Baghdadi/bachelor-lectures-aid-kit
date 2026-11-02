// The worked example: one telephone channel through the whole course, after Goiser (2016). PCM at 8 kHz and 8 bit
// (set 2, slide 60), a Hamming (7,4) code (set 6), QPSK (set 8) on raised-cosine pulses (set 4, slide 26), the slides'
// superheterodyne receiver (Rauschen, slides 59–65), and back to the voice's SNR (set 2, slide 50).
import { voiceLink, powerFor, RECEIVER, raisedCosineSpectrum, dB, sci } from "../core/index.js";
import { h, slider, choice, readout, tabs } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const k = v => `${(v / 1000).toFixed(1)} k`;

export default {
  id: "voicelink",
  art: () => a.picture("A microphone, a stream of bits and a receiving antenna",
    a.rect(20, 55, 20, 35, a.ACC, 10) + [0, 1, 2, 3, 4].map(j => a.rect(55 + j * 18, 65 + (j % 2) * 10, 12, 12, a.INK, 2)).join("") +
      a.path("M160 110 L160 60 M145 45 L160 60 L175 45", a.INK, 3)),
  mount(root) {
    const st = { n: 8, code: true, alpha: 0.5, Ts: 100, S: -114 };
    const q = () => ({ n: st.n, code: st.code, alpha: st.alpha, Ts: st.Ts, S: 10 ** (st.S / 10) * 1e-3 });

    // Step 1: from the voice to the band.
    const c1 = h("div", { class: "plot" }), rR = readout("Bit rate Rb = fs·n (set 2, slide 60)"), rC = readout("Channel bit rate Rb·n/k (set 6, slide 38)"),
      rS = readout("Symbol rate, 2 bit per QPSK symbol (set 8, slide 6)"), rB = readout("Bandwidth (1 + α)Rs/2 (set 4, slide 26)");
    const rates = () => {
      const L = voiceLink(q()), fs = Array.from({ length: 121 }, (_, j) => j * 1.2 / 120);
      c1.replaceChildren(lineChart({ lines: [{ x: fs.map(f => f * L.Rs / 1000), y: fs.map(f => raisedCosineSpectrum(f, st.alpha)), name: "raised-cosine spectrum" }],
        marks: [{ x: L.B / 1000, y: 0, shape: "dot" }], xMin: 0, xMax: 1.2 * L.Rs / 1000, yMin: 0, yMax: 1.1,
        xLabel: "Frequency [kHz]", yLabel: "|H(f)| [1]", label: "The pulses' spectrum, ending at the bandwidth B" }));
      rR.set(`${k(L.Rb)}bit/s`, "", `8 kHz · ${st.n} bit; SNQR of a full-scale sine ${dB(L.snqr).toFixed(1)} dB (set 2, slide 47)`);
      rC.set(`${k(L.Rc)}bit/s`, "", st.code ? "the (7,4) code adds 3 parity bits to every 4" : "no code");
      rS.set(`${k(L.Rs)}Bd`, "", "QPSK carries ld 4 = 2 bit per symbol");
      rB.set(`${k(L.B)}Hz`, "", `α = ${st.alpha}; the slides' telephone channel has only 4 kHz: digital costs bandwidth`);
    };
    const s1 = h("div", { class: "stage" }, c1, h("div", { class: "controls" },
      slider({ label: "Bits per sample n", unit: "bit", min: 4, max: 12, value: st.n, step: 1, format: v => `${v} bit`, onInput: v => { st.n = v; all(); } }),
      choice("Channel code", [["yes", "Hamming (7,4)"], ["no", "None"]], "yes", v => { st.code = v === "yes"; all(); }),
      slider({ label: "Roll-off α", unit: "1", min: 0, max: 1, value: st.alpha, step: 0.05, format: v => v.toFixed(2), onInput: v => { st.alpha = v; all(); } }),
      rR.el, rC.el, rS.el, rB.el,
      h("p", { class: "hint" }, "Each step multiplies the rate: n bits per sample, 7/4 for the code, ½ for QPSK, (1 + α)/2 for the pulses. 64 kbit/s is the slides' companded PCM (set 2, slide 60).")));

    // Step 2: the receiver's noise.
    const c2 = h("div", { class: "plot" }), rF = readout("Noise figure of the receiver, by Friis"), rT = readout("System temperature Ts + Te"), rN = readout("Noise density N0 = k Tsys");
    const noise = () => {
      const L = voiceLink(q());
      let g = 1;
      const adds = RECEIVER.map(s => { const t = (s.f - 1) * 290 / g; g *= s.G; return t; });
      c2.replaceChildren(lineChart({ lines: [{ x: [1, 2, 3, 4, 5], y: [st.Ts, ...adds], name: "noise temperature", stem: true }], xMin: 0.5, xMax: 5.5, yMin: 0,
        xFormat: v => ["", "antenna", "LNA", "mixer", "amp. 1", "amp. 2"][Math.round(v)] ?? "", xLabel: "Source of the noise, referred to the input", yLabel: "Noise temperature [K]",
        label: "What the antenna and each stage add to the system temperature" }));
      rF.set(`${L.F.toFixed(2)} dB`, "", `f = ${L.f.toFixed(3)}; the slides round to 2.25 and 3.5 dB (slide 64)`);
      rT.set(`${L.Tsys.toFixed(0)} K`, "", "the slides: 462 K, from f rounded to 2.25 (slide 65)");
      rN.set(`${dB(L.N0 / 1e-3).toFixed(1)} dBm/Hz`, "", "kT0 = −174 dBm/Hz at 290 K (slide 30)");
    };
    const s2 = h("div", { class: "stage" }, c2, h("div", { class: "controls" },
      slider({ label: "Antenna temperature Ts", unit: "K", min: 10, max: 1000, value: st.Ts, step: 10, format: v => `${v} K`, onInput: v => { st.Ts = v; all(); } }),
      rF.el, rT.el, rN.el,
      h("p", { class: "hint" }, "The slides' receiver: LNA 12 dB and 50 K, mixer −6 dB and 870 K, amplifiers 20 and 30 dB at 1000 K each (slides 59–63). The LNA's gain hides what follows; the antenna's 100 K count in full. The noise-figure lab lets you reorder the stages.")));

    // Step 3: received power, errors and the voice.
    const c3 = h("div", { class: "plot" }), rE = readout("Eb/N0 = S/(N0 Rb)"), rP = readout("Channel bit error Q(√(2Ec/N0)) (set 8, slide 18)"),
      rW = readout("Data bit error after decoding, at most"), rO = readout("Voice SNR SNQR/(1 + 4(M² − 1)Pe) (set 2, slide 50)"), rQ = readout("Power for Pe = 10⁻⁶");
    const errors = () => {
      const L = voiceLink(q()), xs = Array.from({ length: 81 }, (_, j) => -125 + j * 0.25);
      const at = (S, code) => Math.max(1e-12, voiceLink({ ...q(), code, S: 10 ** (S / 10) * 1e-3 }).Pe);
      c3.replaceChildren(lineChart({ lines: [{ x: xs, y: xs.map(S => Math.log10(at(S, true))), name: "Hamming (7,4)" }, { x: xs, y: xs.map(S => Math.log10(at(S, false))), name: "uncoded", cls: "second" }],
        marks: [{ x: st.S, y: Math.log10(Math.max(1e-12, L.Pe)), shape: "dot" }], xMin: -125, xMax: -105, yMin: -12, yMax: 0,
        xLabel: "Received power S [dBm]", yLabel: "log₁₀ of the data bit error [1]", label: "Bit error after decoding against received power, with and without the code" }));
      rE.set(`${dB(L.EbN0).toFixed(1)} dB`, "", `Ec/N0 = ${dB(L.EcN0).toFixed(1)} dB per channel bit: the code spreads each bit's energy over 7/4 bits`);
      rP.set(sci(L.p), "", "QPSK's bit error is BPSK's");
      rW.set(sci(L.Pe), L.Pe > 1e-3 ? "danger" : "", st.code ? "the word error, two or more bits of 7 wrong (set 6, slide 60): this lab's upper bound" : "uncoded: the channel bit error");
      rO.set(`${dB(L.snrOut).toFixed(1)} dB`, L.snrOut < L.snqr / 2 ? "warn" : "", `quantisation alone gives ${dB(L.snqr).toFixed(1)} dB`);
      rQ.set(`${powerFor(1e-6, q()).toFixed(1)} dBm`, "", `uncoded ${powerFor(1e-6, { ...q(), code: false }).toFixed(1)} dBm`);
    };
    const s3 = h("div", { class: "stage" }, c3, h("div", { class: "controls" },
      slider({ label: "Received power S", unit: "dBm", min: -125, max: -105, value: st.S, step: 0.25, format: v => `${v.toFixed(2)} dBm`, onInput: v => { st.S = v; errors(); } }),
      rE.el, rP.el, rW.el, rO.el, rQ.el,
      h("p", { class: "hint" }, "Bit errors stay rare until a few decibels before the edge, then the voice breaks up within a dB or two: 4(M² − 1)Pe outgrows 1 once Pe passes about 1/(4M²)."),
      h("p", { class: "hint" }, "Decided bit by bit, the (7,4) code wins only a fraction of a decibel here: the energy it spends on parity nearly eats what it corrects. That is this lab's result from the slides' formulas, with the word error as an upper bound on the data bits' error.")));

    const all = () => { rates(); noise(); errors(); };
    root.append(tabs("Steps of the worked example", [["1 · Rates and band", s1], ["2 · Receiver noise", s2], ["3 · Errors and voice", s3]]));
    all();
  },
};
